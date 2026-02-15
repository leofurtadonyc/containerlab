#!/usr/bin/env bash
# This is the “one command” entry point. It runs all the validation steps in sequence, and tracks overall pass/fail status
set -euo pipefail
cd "$(dirname "$0")"

source ./common.sh

need_cmd docker

log "Validating lab: $LAB_NAME"
log "Phase 1: Underlay"
./validate-underlay.sh

log "Phase 2: EVPN control plane"
./validate-evpn.sh

log "Phase 3: Tenant dataplane / hosts"
./validate-tenants.sh

log "Done."
