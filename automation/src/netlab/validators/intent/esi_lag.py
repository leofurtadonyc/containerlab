from pathlib import Path

from netlab.core.model import CheckResult, ValidationContext
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    results: list[CheckResult] = []
    leaves = [x for group in ctx.intent.leaves.values() for x in group]
    for leaf in leaves:
        text = (Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{leaf}.cfg").read_text(encoding="utf-8")
        ok = "ethernet-segment" in text or "port-channel" in text.lower()
        results.append(make_result("intent", f"{leaf} esi lag", ok, "ESI-LAG shape present"))
    return results
