from netlab.core.model import CheckResult, ValidationContext
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    out: list[CheckResult] = []
    leaves = [x for g in ctx.intent.leaves.values() for x in g]
    for leaf in leaves:
        r = ctx.adapter.eos_cli(leaf, "show bgp evpn")
        ok = r.rc == 0 and ("mac-ip" in r.stdout or "ip-prefix" in r.stdout)
        out.append(make_result("control-plane", f"{leaf} evpn routes", ok, "EVPN route entries present", {"rc": r.rc}))
    return out
