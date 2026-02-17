from __future__ import annotations

from pathlib import Path
import re
from typing import Any

from netlab.core.model import CheckResult, CheckStatus, Severity, ValidationContext
from netlab.evidence.collectors.eos.bgp_oc import collect_bgp_summary
from netlab.evidence.collectors.eos.interfaces_oc import collect_interfaces
from netlab.evidence.collectors.linux.host_net import neigh_show, ping


def _severity(value: str) -> Severity:
    if value.upper() == "WARN":
        return Severity.WARN
    if value.upper() == "INFO":
        return Severity.INFO
    return Severity.ERROR


def _mk(phase: str, name: str, ok: bool, severity: Severity, message: str, evidence: dict | None = None) -> CheckResult:
    return CheckResult(
        phase=phase,
        name=name,
        status=CheckStatus.PASS if ok else CheckStatus.FAIL,
        severity=Severity.INFO if ok else severity,
        message=message,
        evidence=evidence or {},
    )


def _resolve_nodes(ctx: ValidationContext, selector: dict[str, Any]) -> list[str]:
    inventory_nodes = ctx.intent.inventory.get("nodes", {})
    if "node" in selector:
        return [str(selector["node"])]
    if "nodes" in selector:
        return [str(x) for x in selector.get("nodes", [])]

    out: list[str] = []
    role = selector.get("role")
    group = selector.get("group")
    for node, attrs in inventory_nodes.items():
        roles = attrs.get("roles", [])
        groups = attrs.get("groups", [])
        if role and role not in roles:
            continue
        if group and group not in groups:
            continue
        out.append(node)
    return sorted(set(out))


def _resolve_path(raw: dict[str, Any], dotted: str) -> Any:
    cur: Any = raw
    for key in dotted.split("."):
        if not isinstance(cur, dict) or key not in cur:
            return None
        cur = cur[key]
    return cur


def run_checks(ctx: ValidationContext, mode: str) -> list[CheckResult]:
    checks = ctx.intent.checks
    phases = {"intent", "underlay", "control-plane", "dataplane"} if mode == "all" else {mode}
    out: list[CheckResult] = []

    for check in checks:
        if check.phase not in phases:
            continue
        sev = _severity(check.severity)
        params = check.params

        if check.kind == "config_contains":
            selector = dict(params.get("selector", {}))
            required = [str(x) for x in params.get("required", [])]
            nodes = _resolve_nodes(ctx, selector)
            for node in nodes:
                cfg = Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{node}.cfg"
                text = cfg.read_text(encoding="utf-8") if cfg.exists() else ""
                missing = [needle for needle in required if needle not in text]
                ok = len(missing) == 0
                out.append(_mk(check.phase, f"{check.name}::{node}", ok, sev, "config assertion", {"missing": missing}))
            continue

        if check.kind == "interfaces_up":
            nodes = _resolve_nodes(ctx, dict(params.get("selector", {})))
            required_interfaces = {str(x) for x in params.get("required_interfaces", [])}
            required_interface_regex = [str(x) for x in params.get("required_interface_regex", [])]
            required_description_regex = [str(x) for x in params.get("required_description_regex", [])]
            ignore_interfaces = {str(x) for x in params.get("ignore_interfaces", [])}
            ignore_interface_regex = [str(x) for x in params.get("ignore_interface_regex", [])]
            for node in nodes:
                data = collect_interfaces(ctx.evidence_client, node).get("data", {})
                parsed = data.get("parsed", [])
                selected = []
                for entry in parsed:
                    iface = entry.get("interface", "")
                    desc = entry.get("description", "")

                    if iface in ignore_interfaces:
                        continue
                    if any(re.search(rx, iface) for rx in ignore_interface_regex):
                        continue

                    selected_by_rule = False
                    if required_interfaces and iface in required_interfaces:
                        selected_by_rule = True
                    if required_interface_regex and any(re.search(rx, iface) for rx in required_interface_regex):
                        selected_by_rule = True
                    if required_description_regex and any(re.search(rx, desc) for rx in required_description_regex):
                        selected_by_rule = True

                    # If no explicit scope is provided, preserve legacy behavior.
                    if not (required_interfaces or required_interface_regex or required_description_regex):
                        selected_by_rule = True

                    if selected_by_rule:
                        selected.append(entry)

                bad = [
                    item for item in selected if not (item.get("status") == "up" and item.get("protocol") == "up")
                ]
                ok = data.get("rc", 1) == 0 and (len(selected) > 0) and (len(bad) == 0)
                evidence = {
                    "selected_count": len(selected),
                    "bad_count": len(bad),
                    "bad_interfaces": [f"{i.get('interface')}:{i.get('status')}/{i.get('protocol')}" for i in bad],
                }
                out.append(_mk(check.phase, f"{check.name}::{node}", ok, sev, "interface status", evidence))
            continue

        if check.kind == "bgp_established":
            nodes = _resolve_nodes(ctx, dict(params.get("selector", {})))
            min_total = int(params.get("min_total", 1))
            require_all = bool(params.get("require_all", True))
            for node in nodes:
                parsed = collect_bgp_summary(ctx.evidence_client, node).get("data", {}).get("parsed", {})
                total = int(parsed.get("total", 0))
                est = int(parsed.get("established", 0))
                ok = total >= min_total and ((est == total) if require_all else (est >= min_total))
                out.append(_mk(check.phase, f"{check.name}::{node}", ok, sev, f"established {est}/{total}", parsed))
            continue

        if check.kind == "evpn_routes_present":
            nodes = _resolve_nodes(ctx, dict(params.get("selector", {})))
            patterns = [str(x) for x in params.get("patterns", ["mac-ip", "ip-prefix"])]
            require = str(params.get("require", "any"))
            for node in nodes:
                r = ctx.adapter.eos_cli(node, "show bgp evpn")
                ok = False
                if r.rc == 0:
                    if require == "all":
                        ok = all(p in r.stdout for p in patterns)
                    else:
                        ok = any(p in r.stdout for p in patterns)
                out.append(_mk(check.phase, f"{check.name}::{node}", ok, sev, "evpn routes check", {"rc": r.rc, "patterns": patterns}))
            continue

        if check.kind == "ping_targets":
            interface = params.get("interface")
            probes = params.get("probes", [])
            for probe in probes:
                source = str(probe.get("source"))
                targets = [str(x) for x in probe.get("targets", [])]
                for target in targets:
                    res = ping(ctx.adapter, source, target, interface=interface)
                    out.append(_mk(check.phase, f"{check.name}::{source}->{target}", res.get("rc", 1) == 0, sev, "ping", {"rc": res.get("rc", 1)}))
            continue

        if check.kind == "l2_neighbor_absent":
            probes = params.get("probes", [])
            for probe in probes:
                source = str(probe.get("source"))
                target_ip = str(probe.get("target_ip"))
                interface = str(probe.get("interface"))
                ping(ctx.adapter, source, target_ip, interface=interface)
                neigh = neigh_show(ctx.adapter, source, interface)
                ok = target_ip not in neigh.get("out", "")
                out.append(_mk(check.phase, f"{check.name}::{source}->{target_ip}", ok, sev, "neighbor absence", {"interface": interface}))
            continue

        if check.kind == "intent_distinct":
            paths = [str(x) for x in params.get("paths", [])]
            values = [_resolve_path(ctx.intent.raw, p) for p in paths]
            comparable = [v for v in values if v is not None]
            ok = len(comparable) == len(set(str(x) for x in comparable)) and len(comparable) == len(paths)
            out.append(_mk(check.phase, check.name, ok, sev, "intent values must be distinct", {"paths": paths, "values": values}))
            continue

        out.append(_mk(check.phase, check.name, False, sev, f"Unsupported check kind: {check.kind}"))

    return out
