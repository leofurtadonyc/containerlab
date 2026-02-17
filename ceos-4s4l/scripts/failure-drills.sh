#!/usr/bin/env bash
# Failure drills for ceos-4s4l:
# - flap a single leaf uplink
# - stop/start a spine
# - stop/start a leaf (tests dual-homed host resilience)

set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

need_cmd docker

eos_if_down() { local node="$1" ifname="$2"; eos "$node" "configure terminal ; interface $ifname ; shutdown ; end" >/dev/null; }
eos_if_up()   { local node="$1" ifname="$2"; eos "$node" "configure terminal ; interface $ifname ; no shutdown ; end" >/dev/null; }

drill_leaf_uplink_flap() {
  local leaf="leaf1"
  local ifname="Ethernet1" # leaf1:eth1 <-> spine1:eth1
  log "Drill: flap $leaf $ifname (single uplink failure)"
  eos "$leaf" "show interfaces $ifname status" || true

  eos_if_down "$leaf" "$ifname"
  sleep 2
  eos "$leaf" "show interfaces $ifname status" || true

  log "Validate during degradation (expect reduced ECMP, not outage)"
  ./validate.sh || true

  log "Restore link"
  eos_if_up "$leaf" "$ifname"
  sleep 2
  eos "$leaf" "show interfaces $ifname status" || true

  log "Validate after restore"
  ./validate.sh
}

drill_container_failure() {
  local node="$1"
  local c; c="$(clab_container "$node")"

  log "Drill: stop container $c (node failure simulation)"
  docker stop "$c" >/dev/null
  sleep 2

  log "Validate during failure (some checks should fail depending on blast radius)"
  ./validate-underlay.sh || true
  ./validate-evpn.sh || true
  ./validate-tenants.sh || true

  log "Restore container $c"
  docker start "$c" >/dev/null

  # give EOS time to boot and establish sessions
  sleep 12

  log "Validate after restore"
  ./validate.sh
}

usage() {
  cat <<'EOF'
Usage:
  scripts/failure-drills.sh <drill>

Drills:
  leaf-uplink     - flap leaf1 Ethernet1 (loss of one uplink to a spine)
  spine-failure   - stop/start spine1 container
  leaf-failure    - stop/start leaf1 container (tests ESI-LAG dual-homing)

Environment:
  LAB_NAME=<containerlab name> (default: ceos-4s4l)
EOF
}

case "${1:-}" in
  leaf-uplink)   drill_leaf_uplink_flap ;;
  spine-failure) drill_container_failure "spine1" ;;
  leaf-failure)  drill_container_failure "leaf1" ;;
  *) usage; exit 1 ;;
esac
