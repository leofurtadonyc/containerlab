from netlab.core.model import CheckResult, ValidationContext
from netlab.evidence.collectors.linux.host_net import neigh_show, ping
from netlab.validators.base import make_result


def validate(ctx: ValidationContext) -> list[CheckResult]:
    if "2dc" in ctx.lab:
        return [make_result("dataplane", "l2 isolation", True, "Skipped in 2dc mode (dc-specific host subnets differ)")]

    a_hosts = ctx.intent.hosts.get("rackA", [])
    b_hosts = ctx.intent.hosts.get("rackB", [])
    if not a_hosts or not b_hosts:
        return [make_result("dataplane", "l2 isolation", True, "No rackA/rackB map for this lab")]

    out: list[CheckResult] = []
    ia = ctx.intent.tenant1.isolation_interface
    remote_b = ctx.intent.tenant1.rack_b.subnet.replace("0/24", "13")
    ping(ctx.adapter, a_hosts[0], remote_b, interface=ia)
    n1 = neigh_show(ctx.adapter, a_hosts[0], ia)
    out.append(make_result("dataplane", "rackA no remote ARP", remote_b not in n1["out"], "No remote rack neighbor on bond0.20"))

    remote_a = ctx.intent.tenant1.rack_a.subnet.replace("0/24", "11")
    ping(ctx.adapter, b_hosts[0], remote_a, interface=ia)
    n2 = neigh_show(ctx.adapter, b_hosts[0], ia)
    out.append(make_result("dataplane", "rackB no remote ARP", remote_a not in n2["out"], "No remote rack neighbor on bond0.20"))
    return out
