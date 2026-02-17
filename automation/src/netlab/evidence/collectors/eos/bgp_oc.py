import re

from netlab.evidence.client import EvidenceClient


def _parse_bgp_summary(text: str) -> dict:
    established = 0
    total = 0
    for line in text.splitlines():
        stripped = line.strip()
        if re.match(r"^\d+\.", stripped):
            total += 1
            if "Established" in stripped:
                established += 1
    return {"established": established, "total": total}


def collect_bgp_summary(client: EvidenceClient, node: str) -> dict:
    def _cli() -> dict:
        r = client.cli.eos(node, "show bgp summary")
        return {"rc": r.rc, "parsed": _parse_bgp_summary(r.stdout), "raw": r.stdout, "err": r.stderr}

    return client.collect(
        cache_key=f"bgp-summary:{node}",
        gnmi_path="/network-instances/network-instance/protocols/protocol/bgp/neighbors/neighbor/state/session-state",
        node=node,
        cli_fetcher=_cli,
    )
