from netlab.core.model import CheckResult, ValidationContext
from netlab.evidence.collectors.linux.host_net import ping
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    if "2dc" in ctx.lab:
        return [make_result("dataplane", "rack subnet checks", True, "Skipped in 2dc mode (dc-local subnet map not yet expanded)")]

    out: list[CheckResult] = []
    for rack, hosts in ctx.intent.hosts.items():
        gw = ctx.intent.tenant1.rack_a.gw.split("/")[0] if "A" in rack else ctx.intent.tenant1.rack_b.gw.split("/")[0]
        for host in hosts:
            res = ping(ctx.adapter, host, gw)
            out.append(make_result("dataplane", f"{host} rack gw", res["rc"] == 0, f"Reach rack gateway {gw}"))
    return out
