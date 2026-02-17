from netlab.core.model import CheckResult, ValidationContext
from netlab.evidence.collectors.linux.host_net import ping
from netlab.validators.base import make_result


def _host_num(host: str) -> int:
    digits = ''.join(c for c in host if c.isdigit())
    return int(digits[-1]) if digits else 1


def _vlan10_ip(host: str, lab: str) -> str:
    h = _host_num(host)
    if "2dc" in lab:
        if host.startswith("dc2-"):
            return f"192.168.10.2{h}"
        return f"192.168.10.1{h}"
    return f"192.168.10.1{h}"


def validate(ctx: ValidationContext) -> list[CheckResult]:
    out: list[CheckResult] = []
    hosts = [x for g in ctx.intent.hosts.values() for x in g]
    for src in hosts:
        for dst in hosts:
            if src == dst:
                continue
            target = _vlan10_ip(dst, ctx.lab)
            res = ping(ctx.adapter, src, target, interface="bond0.10")
            out.append(make_result("dataplane", f"{src}->{dst}", res["rc"] == 0, f"Ping {target} over VLAN10"))
    return out
