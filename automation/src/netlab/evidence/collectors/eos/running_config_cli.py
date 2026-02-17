from netlab.evidence.client import EvidenceClient


def collect_running_config(client: EvidenceClient, node: str) -> dict:
    r = client.cli.eos(node, "show running-config")
    return {"rc": r.rc, "raw": r.stdout, "err": r.stderr}
