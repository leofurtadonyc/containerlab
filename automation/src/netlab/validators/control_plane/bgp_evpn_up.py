from netlab.core.model import CheckResult, ValidationContext
from netlab.evidence.collectors.eos.evpn_cli import collect_evpn_summary
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    out: list[CheckResult] = []
    leaves = [x for g in ctx.intent.leaves.values() for x in g]
    for leaf in leaves:
        summary = collect_evpn_summary(ctx.evidence_client, leaf).get("summary", {})
        ok = summary.get("neighbors", 0) > 0 and summary.get("established", 0) > 0
        out.append(make_result("control-plane", f"{leaf} evpn neighbors", ok, "EVPN session check", summary))
    return out
