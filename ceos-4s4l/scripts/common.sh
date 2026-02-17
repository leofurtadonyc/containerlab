#!/usr/bin/env bash
set -euo pipefail

LAB_NAME_DEFAULT="ceos-4s4l"
LAB_NAME="${LAB_NAME:-$LAB_NAME_DEFAULT}"

clab_container() {
  local node="$1"
  printf "clab-%s-%s" "$LAB_NAME" "$node"
}

die() { echo "ERROR: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

# docker exec helper
dexec() {
  local node="$1"; shift
  local c; c="$(clab_container "$node")"
  docker exec -i "$c" "$@"
}

# EOS CLI helper
eos() {
  local node="$1"
  local cmd="$2"
  dexec "$node" Cli -p 15 -c "$cmd"
}

# Linux host helper
lnx() {
  local node="$1"
  local snippet="$2"
  dexec "$node" bash -lc "$snippet"
}

SPINES=(spine1 spine2 spine3 spine4)
LEAVES=(leaf1 leaf2 leaf3 leaf4)
HOSTS=(l4h1 l4h2 l4h3 l4h4)

ALL_EOS=("${SPINES[@]}" "${LEAVES[@]}")
ALL_HOSTS=("${HOSTS[@]}")

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
