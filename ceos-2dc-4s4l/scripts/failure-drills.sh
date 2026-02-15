#!/usr/bin/env bash
# This script injects failures by bringing down interfaces inside containers. It’s intentionally conservative: 
# it snapshots interface status before and after, and it runs scripts/validate.sh (or targeted validations) after each drill.
# You’ll want to expand interface selections once you confirm which interfaces map to underlay/overlay roles in your configs.
set -euo pipefail
cd "$(dirname "$0")"

source ./common.sh

need_cmd docker

# Bring an EOS interface down/up
eos_if_down() { local node="$1" ifname="$2"; eos "$node" "configure terminal ; interface $ifname ; shutdown ; end ; write memory" >/dev/null; }
eos_if_up()   { local node="$1" ifname="$2"; eos "$node" "configure terminal ; interface $ifname ; no shutdown ; end ; write memory" >/dev/null; }

show_if() { local node="$1" ifname="$2"; eos "$node" "show interfaces $ifname status" || true; }

run_validate_fast() {
  # You can swap this for only underlay/evpn if you want faster.
  ./validate.sh
}

drill_leaf_uplink_flap() {
  local leaf="$1"
  local ifname="Ethernet1"  # leaf uplink to spine1 in your topology
  log "Drill: flap $leaf $ifname (single uplink failure simulation)"
  show_if "$leaf" "$ifname"
  eos_if_down "$leaf" "$ifname"
  sleep 2
  show_if "$leaf" "$ifname"

  log "Validating after failure"
  run_validate_fast || true

  log "Restoring link"
  eos_if_up "$leaf" "$ifname"
  sleep 2
  show_if "$leaf" "$ifname"

  log "Validating after restore"
  run_validate_fast
}

drill_dci_link_flap() {
  local r_local="$1"
  local ifname="Ethernet3" # router eth3 is inter-DC link per topology
  log "Drill: flap DCI on $r_local $ifname"
  show_if "$r_local" "$ifname"
  eos_if_down "$r_local" "$ifname"
  sleep 2
  show_if "$r_local" "$ifname"

  log "Validating after DCI degradation"
  run_validate_fast || true

  log "Restoring DCI"
  eos_if_up "$r_local" "$ifname"
  sleep 2
  show_if "$r_local" "$ifname"

  log "Validating after restore"
  run_validate_fast
}

drill_leaf_failure_simulation() {
  local leaf="$1"
  local c; c="$(clab_container "$leaf")"
  log "Drill: stop container $c (simulated leaf failure)"
  docker stop "$c" >/dev/null
  sleep 2

  log "Validating during failure"
  ./validate-underlay.sh || true
  ./validate-tenants.sh || true

  log "Restoring leaf container"
  docker start "$c" >/dev/null
  sleep 8  # allow EOS to boot and settle

  log "Validating after restore"
  ./validate.sh
}

usage() {
  cat <<'EOF'
Usage:
  scripts/failure-drills.sh <drill>

Drills:
  leaf-uplink     - flap a single leaf uplink (dc1-leaf1 Ethernet1)
  dci-link        - flap a single DCI link (dc1-router1 Ethernet3)
  leaf-failure    - stop/start a leaf container (dc1-leaf1)

Environment:
  LAB_NAME=<containerlab name> (default: ceos-2dc-evpn-dci)
EOF
}

main() {
  local drill="${1:-}"
  [[ -n "$drill" ]] || { usage; exit 1; }

  case "$drill" in
    leaf-uplink)
      drill_leaf_uplink_flap "dc1-leaf1"
      ;;
    dci-link)
      drill_dci_link_flap "dc1-router1"
      ;;
    leaf-failure)
      drill_leaf_failure_simulation "dc1-leaf1"
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
