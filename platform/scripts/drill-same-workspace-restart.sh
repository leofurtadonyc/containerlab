#!/bin/sh
#
# Same-workspace restart drill for the bounded Phase 2 platform slice.
#
# This script restarts the platform topology without deleting or mutating
# host-backed data directories under the platform workspace:
#   - platform/postgres/data   (Postgres pgdata)
#   - platform/prometheus/data (Prometheus TSDB)
#   - platform/grafana/data    (Grafana local state)
# It then reruns the verification scripts to prove the same-workspace recovery
# boundary.
#
# Environment:
#   TOPOLOGY_FILE  Optional path to the Containerlab topology file
#                  (default: topology.clab.yml in the platform directory).
#
# Use this drill to validate that the platform recovers correctly after
# container replacement when persisted data survives in the same workspace.
#
# Exit status is non-zero if clab deploy or either verifier fails (set -e).
#
# This is NOT a disaster-recovery test. It does NOT prove backup, restore,
# cross-host migration, or data-directory-loss recovery.
#
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PLATFORM_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TOPOLOGY_FILE="${TOPOLOGY_FILE:-$PLATFORM_DIR/topology.clab.yml}"

require_command() {
  command_name=$1
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
}

require_command docker
require_command clab

cd "$PLATFORM_DIR"

echo "Same-workspace restart drill: platform topology"
echo "This drill will destroy and redeploy the topology without deleting host-backed data directories:"
echo "  $PLATFORM_DIR/postgres/data"
echo "  $PLATFORM_DIR/prometheus/data"
echo "  $PLATFORM_DIR/grafana/data"
echo "Topology file: $TOPOLOGY_FILE"
echo ""

if [ ! -f "$TOPOLOGY_FILE" ]; then
  echo "Topology file not found: $TOPOLOGY_FILE" >&2
  exit 1
fi

echo "Step 1: Destroy the current topology (containers only; host-backed data directories are preserved)"
clab destroy -t "$TOPOLOGY_FILE" || true

echo ""
echo "Step 2: Deploy the topology again"
clab deploy -t "$TOPOLOGY_FILE"

echo ""
echo "Step 3: Run core runtime verification"
./scripts/verify-core-runtime.sh

echo ""
echo "Step 4: Run ODL auth verification"
./scripts/verify-odl-auth.sh

echo ""
echo "Same-workspace restart drill completed successfully."
echo "The platform was restarted without deleting postgres/data, prometheus/data, or grafana/data."
echo "This proves the bounded same-workspace recovery boundary only; it does not prove disaster recovery."
