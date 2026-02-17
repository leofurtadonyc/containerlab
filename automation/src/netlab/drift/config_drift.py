from pathlib import Path

from netlab.evidence.collectors.eos.running_config_cli import collect_running_config
from netlab.utils.hashing import sha256_text


def _is_valid_running_config(raw: str) -> bool:
    text = raw.strip()
    if not text:
        return False
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) < 5:
        return False
    if any(token in text.lower() for token in ["invalid input", "error:", "% invalid", "command not found"]):
        return False
    return True


def compute_config_drift(ctx) -> list[dict]:
    drifts = []
    for node in ctx.adapter.list_nodes():
        if ctx.adapter.node_kind(node) == "linux":
            continue
        desired_path = Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{node}.cfg"
        if not desired_path.exists():
            continue
        desired = desired_path.read_text(encoding="utf-8")
        running_payload = collect_running_config(ctx.evidence_client, node)
        running = running_payload.get("raw", "")
        running_rc = int(running_payload.get("rc", 1))

        if running_rc != 0 or not _is_valid_running_config(running):
            drifts.append(
                {
                    "node": node,
                    "type": "collection_error",
                    "message": "Unable to retrieve valid running-config output",
                    "rc": running_rc,
                    "stderr": running_payload.get("err", ""),
                    "running_preview": "\n".join(running.splitlines()[:5]),
                }
            )
            continue

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
