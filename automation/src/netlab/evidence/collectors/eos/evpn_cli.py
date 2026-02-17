import re

from netlab.evidence.client import EvidenceClient


def parse_evpn_summary(text: str) -> dict:
    neighbors = 0
    established = 0
    for line in text.splitlines():
        if re.match(r"^\d+\.", line.strip()):
            neighbors += 1
            if "Established" in line:
                established += 1
    return {"neighbors": neighbors, "established": established}


def collect_evpn_summary(client: EvidenceClient, node: str) -> dict:
    r = client.cli.eos(node, "show bgp summary")
    parsed = parse_evpn_summary(r.stdout)
    evpn = client.cli.eos(node, "show bgp evpn summary")
    lines = [ln for ln in evpn.stdout.splitlines() if ln.strip()]
    return {"summary": parsed, "evpn_summary_rc": evpn.rc, "evpn_summary_lines": len(lines), "raw": evpn.stdout, "err": evpn.stderr}
