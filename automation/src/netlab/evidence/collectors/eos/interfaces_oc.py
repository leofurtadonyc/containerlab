from netlab.evidence.client import EvidenceClient


def collect_interfaces(client: EvidenceClient, node: str) -> dict:
    def _cli() -> dict:
        r = client.cli.eos(node, "show interfaces description")
        up_count = sum(1 for line in r.stdout.splitlines() if " up " in line)
        down_count = sum(1 for line in r.stdout.splitlines() if " down " in line)
        return {"rc": r.rc, "up": up_count, "down": down_count, "raw": r.stdout, "err": r.stderr}

    return client.collect(
        cache_key=f"interfaces:{node}",
        gnmi_path="/interfaces/interface/state",
        node=node,
        cli_fetcher=_cli,
    )
