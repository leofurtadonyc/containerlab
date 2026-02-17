from __future__ import annotations

from netlab.evidence.client import EvidenceClient


def _parse_interfaces_description(raw: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("Interface"):
            continue
        parts = stripped.split()
        if len(parts) < 3:
            continue
        iface = parts[0]
        status = parts[1]
        protocol = parts[2]
        description = " ".join(parts[3:]) if len(parts) > 3 else ""
        entries.append(
            {
                "interface": iface,
                "status": status.lower(),
                "protocol": protocol.lower(),
                "description": description,
            }
        )
    return entries


def collect_interfaces(client: EvidenceClient, node: str) -> dict:
    def _cli() -> dict:
        r = client.cli.eos(node, "show interfaces description")
        parsed = _parse_interfaces_description(r.stdout)
        up_count = sum(1 for item in parsed if item["status"] == "up" and item["protocol"] == "up")
        down_count = sum(1 for item in parsed if item["status"] != "up" or item["protocol"] != "up")
        return {
            "rc": r.rc,
            "up": up_count,
            "down": down_count,
            "parsed": parsed,
            "raw": r.stdout,
            "err": r.stderr,
        }

    return client.collect(
        cache_key=f"interfaces:{node}",
        gnmi_path="/interfaces/interface/state",
        node=node,
        cli_fetcher=_cli,
    )
