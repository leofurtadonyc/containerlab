from pathlib import Path

from netlab.evidence.collectors.eos.running_config_cli import collect_running_config
from netlab.utils.hashing import sha256_text


def compute_config_drift(ctx) -> list[dict]:
    drifts = []
    for node in ctx.adapter.list_nodes():
        if ctx.adapter.node_kind(node) == "linux":
            continue
        desired_path = Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{node}.cfg"
        if not desired_path.exists():
            continue
        desired = desired_path.read_text(encoding="utf-8")
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
