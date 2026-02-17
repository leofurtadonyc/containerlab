from pathlib import Path

from netlab.evidence.collectors.eos.running_config_cli import collect_running_config
from netlab.utils.hashing import sha256_text


def compute_config_drift(ctx) -> list[dict]:
    nodes = list(ctx.intent.spines) + [x for g in ctx.intent.leaves.values() for x in g]
    if ctx.intent.dci:
        nodes.extend(ctx.intent.dci.routers_dc1)
        nodes.extend(ctx.intent.dci.routers_dc2)

    drifts = []
    for node in nodes:
        desired_path = Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{node}.cfg"
        desired = desired_path.read_text(encoding="utf-8") if desired_path.exists() else ""
        running = collect_running_config(ctx.evidence_client, node).get("raw", "")
        desired_hash = sha256_text(desired)
        running_hash = sha256_text(running)
        if desired_hash != running_hash:
            drifts.append({
                "node": node,
                "desired_hash": desired_hash,
                "running_hash": running_hash,
                "desired_lines": len(desired.splitlines()),
                "running_lines": len(running.splitlines()),
            })
    return drifts
