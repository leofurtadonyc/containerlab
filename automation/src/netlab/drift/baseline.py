from netlab.evidence.collectors.eos.bgp_oc import collect_bgp_summary
from netlab.evidence.collectors.eos.interfaces_oc import collect_interfaces
from netlab.utils.hashing import sha256_json
from netlab.utils.time import utc_now_iso


def collect_baseline(ctx) -> dict:
    fingerprints = {}
    for node in ctx.adapter.list_nodes():
        if ctx.adapter.node_kind(node) == "linux":
            continue
        payload = {
            "interfaces": collect_interfaces(ctx.evidence_client, node).get("data", {}),
            "bgp": collect_bgp_summary(ctx.evidence_client, node).get("data", {}),
        }
        fingerprints[node] = {"hash": sha256_json(payload), "key_count": len(payload.keys())}

    return {
        "lab": ctx.lab,
        "timestamp": utc_now_iso(),
        "intent_hash": sha256_json(ctx.intent.raw),
        "fingerprints": fingerprints,
    }
