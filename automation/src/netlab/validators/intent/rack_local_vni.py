from pathlib import Path

from netlab.core.model import CheckResult, ValidationContext
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    results: list[CheckResult] = []
    vni_a = str(ctx.intent.tenant1.rack_a.vni)
    vni_b = str(ctx.intent.tenant1.rack_b.vni)
    for leaf in ctx.intent.leaves.get("rackA", []):
        text = (Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{leaf}.cfg").read_text(encoding="utf-8")
        results.append(make_result("intent", f"{leaf} rackA vni", vni_a in text, f"Expected VNI {vni_a}"))
    for leaf in ctx.intent.leaves.get("rackB", []):
        text = (Path(ctx.adapter.repo_root) / ctx.lab / "configs" / f"{leaf}.cfg").read_text(encoding="utf-8")
        results.append(make_result("intent", f"{leaf} rackB vni", vni_b in text, f"Expected VNI {vni_b}"))
    results.append(make_result("intent", "rack vni mismatch", vni_a != vni_b, "Rack-specific VLAN20 VNIs differ"))
    return results
