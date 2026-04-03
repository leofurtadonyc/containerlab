#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ODL_URL="${ODL_URL:-http://127.0.0.1:8181}"
ODL_USERNAME="${ODL_USERNAME:-admin}"
ODL_PASSWORD="${ODL_PASSWORD:-change_me}"
APP_API_URL="${APP_API_URL:-http://127.0.0.1:8000}"
SOUTHBOUND_INVENTORY_PATH="${SOUTHBOUND_INVENTORY_PATH:-$SCRIPT_DIR/../odl/config/generated/southbound-inventory.json}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

require_command curl
require_command python3

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

curl -fsS -u "$ODL_USERNAME:$ODL_PASSWORD" \
  "$ODL_URL/rests/data/network-topology:network-topology/topology=topology-netconf" \
  > "$tmpdir/topology-netconf.json"

curl -fsS "$APP_API_URL/api/v1/controller/evidence" > "$tmpdir/controller-evidence.json"

python3 - "$SOUTHBOUND_INVENTORY_PATH" "$tmpdir/topology-netconf.json" "$tmpdir/controller-evidence.json" <<'PY'
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path


def fail(message: str) -> None:
    raise SystemExit(message)


inventory_path = Path(sys.argv[1])
topology_path = Path(sys.argv[2])
controller_path = Path(sys.argv[3])

expected_netconf_targets: int | None = None
if inventory_path.exists():
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    expected_netconf_targets = int((inventory.get("counts") or {}).get("netconf_targets") or 0)

topology_payload = json.loads(topology_path.read_text(encoding="utf-8"))
controller = json.loads(controller_path.read_text(encoding="utf-8"))

topologies = topology_payload.get("network-topology:topology") or []
if isinstance(topologies, dict):
    topologies = [topologies]
if not isinstance(topologies, list):
    fail("ODL southbound verification failed: topology-netconf payload did not contain a topology list")

topology = next((item for item in topologies if isinstance(item, dict) and item.get("topology-id") == "topology-netconf"), None)
if topology is None:
    fail("ODL southbound verification failed: topology-netconf was not present in the direct ODL payload")

nodes = [item for item in (topology.get("node") or []) if isinstance(item, dict)]
status_counts = Counter(
    str(item.get("netconf-node-topology:connection-status") or "unknown")
    for item in nodes
)
connected_count = sum(
    count for status, count in status_counts.items() if status.lower() in {"connected", "up"}
)

if expected_netconf_targets is not None and len(nodes) != expected_netconf_targets:
    fail(
        "ODL southbound verification failed: topology-netconf node count "
        f"{len(nodes)} does not match generated inventory target count {expected_netconf_targets}"
    )

bgp = controller.get("bgp_ls") or {}
pcep = controller.get("pcep") or {}
netconf = controller.get("netconf") or {}

if controller.get("contract_id") != "controller_southbound_session_truth_v2":
    fail("ODL southbound verification failed: controller evidence contract_id is not controller_southbound_session_truth_v2")

if int(netconf.get("node_count") or 0) != len(nodes):
    fail(
        "ODL southbound verification failed: app-api netconf node_count "
        f"{netconf.get('node_count')} does not match direct ODL topology-netconf node count {len(nodes)}"
    )

if "topology-netconf" in set(bgp.get("topology_ids") or []):
    fail("ODL southbound verification failed: bgp_ls topology_ids incorrectly include topology-netconf")

placeholder_bgp_ids = {"example-linkstate-topology", "example-ipv4-topology", "example-ipv6-topology"}
bgp_ids = set(bgp.get("topology_ids") or [])
if ((not bgp_ids or bgp_ids.issubset(placeholder_bgp_ids))
        and int(bgp.get("node_count") or 0) == 0
        and int(bgp.get("link_count") or 0) == 0):
    if bgp.get("session_posture") == "established":
        fail("ODL southbound verification failed: bgp_ls lane claims established session posture without live BGP-LS objects")
    if bgp.get("evidence_strength") == "session_backed":
        fail("ODL southbound verification failed: bgp_ls lane claims session_backed evidence without live BGP-LS objects")

if (set(pcep.get("topology_ids") or []).issubset({"pcep-topology"})
        and int(pcep.get("node_count") or 0) == 0
        and int(pcep.get("link_count") or 0) == 0):
    if pcep.get("session_posture") == "established":
        fail("ODL southbound verification failed: pcep lane claims established session posture with config-only scope")
    if pcep.get("evidence_strength") == "session_backed":
        fail("ODL southbound verification failed: pcep lane claims session_backed evidence with config-only scope")

if connected_count == 0:
    if netconf.get("session_posture") == "established":
        fail("ODL southbound verification failed: netconf lane claims established session posture but no direct ODL NETCONF node is connected")
    if netconf.get("evidence_strength") == "session_backed":
        fail("ODL southbound verification failed: netconf lane claims session_backed evidence but no direct ODL NETCONF node is connected")

print(f"ODL southbound verification passed: topology-netconf nodes={len(nodes)}")
print(
    "NETCONF connection statuses: "
    + ", ".join(f"{status}={count}" for status, count in sorted(status_counts.items()))
)
print(
    "Controller evidence lanes: "
    f"bgp_ls(node_count={bgp.get('node_count')}, session_posture={bgp.get('session_posture')}, evidence_strength={bgp.get('evidence_strength')}), "
    f"pcep(node_count={pcep.get('node_count')}, session_posture={pcep.get('session_posture')}, evidence_strength={pcep.get('evidence_strength')}), "
    f"netconf(node_count={netconf.get('node_count')}, session_posture={netconf.get('session_posture')}, evidence_strength={netconf.get('evidence_strength')})"
)
if connected_count == 0:
    print(
        "Notice: repo-owned NETCONF onboarding created controller-visible node objects, "
        "but device-side NETCONF sessions are not established yet."
    )
PY