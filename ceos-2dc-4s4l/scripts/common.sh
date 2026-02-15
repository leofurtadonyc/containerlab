#!/usr/bin/env bash
set -euo pipefail

LAB_NAME_DEFAULT="ceos-2dc-evpn-dci"
LAB_NAME="${LAB_NAME:-$LAB_NAME_DEFAULT}"

# Containerlab typically names containers: clab-<labname>-<node>
# Example: clab-ceos-2dc-evpn-dci-dc1-leaf1
clab_container() {
  local node="$1"
  printf "clab-%s-%s" "$LAB_NAME" "$node"
}

die() { echo "ERROR: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

# Execute a command inside a container; prints stdout/stderr.
# Usage: dexec <node> <command...>
dexec() {
  local node="$1"; shift
  local c; c="$(clab_container "$node")"
  docker exec -i "$c" "$@"
}

# Execute EOS CLI command on cEOS container.
# Usage: eos <node> "show version"
eos() {
  local node="$1"
  local cmd="$2"
  dexec "$node" Cli -p 15 -c "$cmd"
}

# Execute a bash snippet on linux host containers
# Usage: lnx <node> "ip a"
lnx() {
  local node="$1"
  local snippet="$2"
  dexec "$node" bash -lc "$snippet"
}

# Standard node sets based on your topology file
DC1_SPINES=(dc1-spine1 dc1-spine2 dc1-spine3 dc1-spine4)
DC1_LEAVES=(dc1-leaf1 dc1-leaf2 dc1-leaf3 dc1-leaf4)
DC1_ROUTERS=(dc1-router1 dc1-router2)
DC1_HOSTS=(dc1-host1 dc1-host2 dc1-host3 dc1-host4)

DC2_SPINES=(dc2-spine1 dc2-spine2 dc2-spine3 dc2-spine4)
DC2_LEAVES=(dc2-leaf1 dc2-leaf2 dc2-leaf3 dc2-leaf4)
DC2_ROUTERS=(dc2-router1 dc2-router2)
DC2_HOSTS=(dc2-host1 dc2-host2 dc2-host3 dc2-host4)

ALL_EOS=("${DC1_SPINES[@]}" "${DC1_LEAVES[@]}" "${DC1_ROUTERS[@]}" "${DC2_SPINES[@]}" "${DC2_LEAVES[@]}" "${DC2_ROUTERS[@]}")
ALL_HOSTS=("${DC1_HOSTS[@]}" "${DC2_HOSTS[@]}")

# Small helper to run a check and keep going, but track failures.
FAILURES=0
check() {
  local title="$1"; shift
  log "CHECK: $title"
  if "$@"; then
    log "PASS : $title"
  else
    log "FAIL : $title"
    FAILURES=$((FAILURES+1))
  fi
  echo
}

summary_exit() {
  if [[ "$FAILURES" -eq 0 ]]; then
    log "ALL CHECKS PASSED"
    exit 0
  fi
  log "CHECKS FAILED: $FAILURES"
  exit 2
}

# Best-effort: determine EOS mgmt IP from 'show hostname' and rely on container exec for access anyway.
# These utilities validate through docker exec, so no mgmt addressing assumptions needed.
