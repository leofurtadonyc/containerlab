from netlab.evidence.collectors.eos.bgp_oc import collect_bgp_summary
from netlab.evidence.collectors.eos.interfaces_oc import collect_interfaces
from netlab.utils.hashing import sha256_json
from netlab.utils.time import utc_now_iso


def collect_baseline(ctx) -> dict:
    fingerprints = {}
    for node in ctx.adapter.list_nodes():
        if "host" in node or node.startswith("l4h"):
            continue
        payload = {
            "interfaces": collect_interfaces(ctx.evidence_client, node).get("data", {}),
            "bgp": collect_bgp_summary(ctx.evidence_client, node).get("data", {}),
        }
        fingerprints[node] = {
            "hash": sha256_json(payload),
            "key_count": len(payload.keys()),
        }

    intent_payload = {
        "spines": ctx.intent.spines,
        "leaves": ctx.intent.leaves,
        "hosts": ctx.intent.hosts,
        "tenant1": {
            "vrf": ctx.intent.tenant1.vrf,
            "vlan10_vni": ctx.intent.tenant1.vlan10_vni,
            "rack_a_vni": ctx.intent.tenant1.rack_a.vni,
            "rack_b_vni": ctx.intent.tenant1.rack_b.vni,
        },
    }
    return {
        "lab": ctx.lab,
        "timestamp": utc_now_iso(),
        "intent_hash": sha256_json(intent_payload),
        "fingerprints": fingerprints,
    }
