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
#   DRILL_POST_DEPLOY_SLEEP_SECONDS  Optional pause after clab deploy before verifiers
#                  (default: 20). Cold redeploys often need a few seconds before app-web
#                  can stream large /assets/*.js bundles; verify-core-runtime.sh also uses
#                  longer static fetch timeouts and retries (see CURL_MAX_TIME_STATIC there).
#   CURL_HTTP_MAX_TIME  Optional cap for app-api JSON GETs (default in drill: 180).
#                  Same-workspace restarts can exceed the verifier default (90s) on first
#                  large responses (e.g. /api/v1/operator-briefing) when Postgres warms up.
#   CURL_MAX_TIME_STATIC, STATIC_FETCH_ATTEMPTS, VERIFY_*  Passed through to
#                  ./scripts/verify-core-runtime.sh if set.
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
echo "Step 2b: Post-deploy warm-up (containers report healthy before HTTP is fully warm)"
DRILL_POST_DEPLOY_SLEEP_SECONDS="${DRILL_POST_DEPLOY_SLEEP_SECONDS:-20}"
sleep "$DRILL_POST_DEPLOY_SLEEP_SECONDS"

echo ""
echo "Step 3: Run core runtime verification"
# Defaults tuned for same-workspace restart: large JS bundles may need >25s first-byte after cold start;
# large JSON assemblies (operator briefing, evidence pack, etc.) can exceed the default 90s curl cap
# on first request while app-api/Postgres finish warming (curl exits with empty body → false contract miss).
export CURL_MAX_TIME_STATIC="${CURL_MAX_TIME_STATIC:-120}"
export CURL_HTTP_MAX_TIME="${CURL_HTTP_MAX_TIME:-180}"
./scripts/verify-core-runtime.sh

echo ""
echo "Step 4: Run ODL auth verification"
./scripts/verify-odl-auth.sh

echo ""
echo "Same-workspace restart drill completed successfully."
echo "The platform was restarted without deleting postgres/data, prometheus/data, or grafana/data."
echo "This proves the bounded same-workspace recovery boundary only; it does not prove disaster recovery."
