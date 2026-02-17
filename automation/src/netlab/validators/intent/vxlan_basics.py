from pathlib import Path

from netlab.core.model import CheckResult, ValidationContext
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    results: list[CheckResult] = []
    leaves = [x for group in ctx.intent.leaves.values() for x in group]
    for leaf in leaves:
        cfg = Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{leaf}.cfg"
        text = cfg.read_text(encoding="utf-8") if cfg.exists() else ""
        ok = "interface Vxlan1" in text and "interface Vlan10" in text
        results.append(make_result("intent", f"{leaf} vxlan baseline", ok, "Vxlan + VLAN10 baseline"))
    return results
