#!/usr/bin/env bash
# One-command validation entrypoint
set -euo pipefail
cd "$(dirname "$0")"

source ./common.sh
need_cmd docker

log "Validating lab: $LAB_NAME"

log "Phase 0: Intent (config truth)"
./validate-intent.sh

log "Phase 1: Underlay"
./validate-underlay.sh

log "Phase 2: EVPN control plane"
./validate-evpn.sh

log "Phase 3: Tenant dataplane / hosts"
./validate-tenants.sh

log "Done."
