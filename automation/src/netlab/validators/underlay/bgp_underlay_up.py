from netlab.core.model import CheckResult, ValidationContext
from netlab.evidence.collectors.eos.bgp_oc import collect_bgp_summary
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    out: list[CheckResult] = []
    nodes = list(ctx.intent.spines) + [x for g in ctx.intent.leaves.values() for x in g]
    if ctx.intent.dci:
        nodes.extend(ctx.intent.dci.routers_dc1)
        nodes.extend(ctx.intent.dci.routers_dc2)
    for node in nodes:
        parsed = collect_bgp_summary(ctx.evidence_client, node)["data"].get("parsed", {})
        total = parsed.get("total", 0)
        est = parsed.get("established", 0)
        out.append(make_result("underlay", f"{node} bgp", total > 0 and est == total, f"Established {est}/{total}", parsed))
    return out
