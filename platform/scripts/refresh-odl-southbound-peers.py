#!/usr/bin/env python3
"""Explicit recovery helper for stale SR OS southbound ARP after ODL redeploys."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from ipaddress import ip_interface
import json
from pathlib import Path
import re
import sys
import time

try:
    import paramiko
except ModuleNotFoundError as exc:  # pragma: no cover - import guard for operator use
    raise SystemExit(
        "Missing dependency: paramiko. Install app-api dependencies first, for example: "
        "cd platform/app-api && python3 -m pip install -c requirements.lock.txt ."
    ) from exc


DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "NokiaSros1!"


@dataclass(frozen=True)
class PeerTarget:
    node_name: str
    management_ipv4: str


def parse_args() -> argparse.Namespace:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--inventory",
        default=str(script_dir.parent / "odl" / "config" / "generated" / "southbound-inventory.json"),
        help="Path to generated southbound-inventory.json.",
    )
    parser.add_argument(
        "--username",
        default=DEFAULT_USERNAME,
        help=f"SR OS username (default: {DEFAULT_USERNAME}).",
    )
    parser.add_argument(
        "--password",
        default=DEFAULT_PASSWORD,
        help="SR OS password for the target routers.",
    )
    parser.add_argument(
        "--node",
        action="append",
        dest="nodes",
        default=[],
        help="Optional node name filter; may be passed multiple times.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the targets and commands without opening SSH sessions.",
    )
    parser.add_argument(
        "--connect-timeout",
        type=float,
        default=20.0,
        help="SSH connect timeout in seconds (default: 20).",
    )
    parser.add_argument(
        "--settle-seconds",
        type=float,
        default=2.0,
        help="Seconds to wait between interactive CLI commands (default: 2).",
    )
    return parser.parse_args()


def load_peer_targets(inventory_path: Path, requested_nodes: set[str]) -> tuple[str, list[PeerTarget]]:
    payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    controller_ip = str(ip_interface(payload["controller_southbound_address"]).ip)
    targets = [
        PeerTarget(node_name=target["node_name"], management_ipv4=target["management_ipv4"])
        for target in payload.get("targets", [])
        if target.get("role") == "pe"
    ]
    if requested_nodes:
        targets = [target for target in targets if target.node_name in requested_nodes]
    return controller_ip, sorted(targets, key=lambda item: item.node_name)


def _drain_channel(channel: paramiko.Channel, settle_seconds: float) -> str:
    deadline = time.time() + settle_seconds
    chunks: list[str] = []
    while True:
        if channel.recv_ready():
            chunks.append(channel.recv(65535).decode(errors="ignore"))
            deadline = time.time() + 0.3
            continue
        if time.time() >= deadline:
            break
        time.sleep(0.1)
    return "".join(chunks)


def _run_shell_commands(
    host: str,
    *,
    username: str,
    password: str,
    commands: list[str],
    connect_timeout: float,
    settle_seconds: float,
) -> list[str]:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=host,
        username=username,
        password=password,
        look_for_keys=False,
        allow_agent=False,
        timeout=connect_timeout,
    )
    try:
        channel = client.invoke_shell()
        try:
            _drain_channel(channel, settle_seconds)
            outputs: list[str] = []
            for command in commands:
                channel.send(command + "\n")
                outputs.append(_drain_channel(channel, settle_seconds))
            return outputs
        finally:
            channel.close()
    finally:
        client.close()


def _parse_arp_mac(output: str, controller_ip: str) -> str | None:
    pattern = re.compile(rf"^{re.escape(controller_ip)}\s+(?P<mac>[0-9a-f:]+)\s+", re.MULTILINE | re.IGNORECASE)
    match = pattern.search(output)
    if match is None:
        return None
    return match.group("mac")


def _parse_bgp_state(output: str) -> str | None:
    match = re.search(r"^State\s+:\s+(?P<value>\S+)", output, re.MULTILINE)
    if match is None:
        return None
    return match.group("value")


def _parse_bgp_error(output: str) -> str | None:
    match = re.search(r"^Last Error\s+:\s+(?P<value>.+)$", output, re.MULTILINE)
    if match is None:
        return None
    return match.group("value").strip()


def refresh_target(
    target: PeerTarget,
    *,
    controller_ip: str,
    username: str,
    password: str,
    connect_timeout: float,
    settle_seconds: float,
) -> dict[str, str | None]:
    commands = [
        "environment more false",
        f"clear router arp {controller_ip}",
        f"clear router bgp neighbor {controller_ip}",
        f"show router arp {controller_ip}",
        f"show router bgp neighbor {controller_ip}",
    ]
    outputs = _run_shell_commands(
        target.management_ipv4,
        username=username,
        password=password,
        commands=commands,
        connect_timeout=connect_timeout,
        settle_seconds=settle_seconds,
    )
    arp_output = outputs[-2]
    bgp_output = outputs[-1]
    return {
        "node": target.node_name,
        "management_ipv4": target.management_ipv4,
        "arp_mac": _parse_arp_mac(arp_output, controller_ip),
        "bgp_state": _parse_bgp_state(bgp_output),
        "bgp_last_error": _parse_bgp_error(bgp_output),
    }


def main() -> int:
    args = parse_args()
    inventory_path = Path(args.inventory).resolve()
    if not inventory_path.is_file():
        raise SystemExit(f"Inventory not found: {inventory_path}")

    controller_ip, targets = load_peer_targets(inventory_path, set(args.nodes))
    if not targets:
        raise SystemExit("No PE targets matched the generated inventory.")

    print(f"Controller southbound IP: {controller_ip}")
    print(f"Targets: {', '.join(target.node_name for target in targets)}")

    if args.dry_run:
        print("Dry run only. Commands per target:")
        print(f"  clear router arp {controller_ip}")
        print(f"  clear router bgp neighbor {controller_ip}")
        print(f"  show router arp {controller_ip}")
        print(f"  show router bgp neighbor {controller_ip}")
        return 0

    failures = 0
    for target in targets:
        try:
            result = refresh_target(
                target,
                controller_ip=controller_ip,
                username=args.username,
                password=args.password,
                connect_timeout=args.connect_timeout,
                settle_seconds=args.settle_seconds,
            )
        except Exception as exc:  # pragma: no cover - operator-path error handling
            failures += 1
            print(f"{target.node_name}: ERROR {exc}", file=sys.stderr)
            continue
        print(
            f"{result['node']}: arp_mac={result['arp_mac'] or 'unknown'} "
            f"bgp_state={result['bgp_state'] or 'unknown'} "
            f"last_error={result['bgp_last_error'] or 'unknown'}"
        )

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())