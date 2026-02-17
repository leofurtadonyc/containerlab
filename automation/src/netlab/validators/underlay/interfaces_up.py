from netlab.core.model import CheckResult, ValidationContext
from netlab.evidence.collectors.eos.interfaces_oc import collect_interfaces
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    out: list[CheckResult] = []
    nodes = list(ctx.intent.spines) + [x for g in ctx.intent.leaves.values() for x in g]
    if ctx.intent.dci:
        nodes.extend(ctx.intent.dci.routers_dc1)
        nodes.extend(ctx.intent.dci.routers_dc2)
    for node in nodes:
        data = collect_interfaces(ctx.evidence_client, node)["data"]
        ok = data.get("rc", 1) == 0 and data.get("down", 0) == 0
        out.append(make_result("underlay", f"{node} interfaces", ok, "Interfaces up", data))
    return out
