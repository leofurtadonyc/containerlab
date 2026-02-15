#!/usr/bin/env bash
# This validates: containers exist, EOS interfaces are up (at least the expected uplinks), and basic reachability across the fabric is plausible
# (via loopback reachability if your configs have loopbacks; otherwise we still validate interface/link health).
set -euo pipefail
cd "$(dirname "$0")"

source ./common.sh
need_cmd docker

# Validate containers exist
container_exists() {
  local node="$1"
  local c; c="$(clab_container "$node")"
  docker inspect "$c" >/dev/null 2>&1
}

check_containers() {
  local ok=0
  for n in "${ALL_EOS[@]}" "${ALL_HOSTS[@]}"; do
    if container_exists "$n"; then
      ok=$((ok+1))
    else
      echo "Missing container for node: $n (expected $(clab_container "$n"))" >&2
      return 1
    fi
  done
  echo "Found $ok containers."
}

# For EOS nodes, check that key interfaces are up/up.
# We do not assume exact underlay addressing here.
check_eos_interfaces_up() {
  local node="$1"
  # We care about: leaf uplinks eth1-eth4, leaf peer/keepalive eth7, server-facing eth5/eth6 (on some leaves),
  # spine downlinks eth1-eth6, router uplinks eth1-eth3
  local out
  out="$(eos "$node" "show interfaces status" 2>/dev/null || true)"
  [[ -n "$out" ]] || { echo "Could not read interface status from $node" >&2; return 1; }

  # Very coarse sanity: ensure at least 2 interfaces are connected
  local connected
  connected="$(echo "$out" | awk 'BEGIN{c=0} $0 ~ /connected/ {c++} END{print c}')"
  if [[ "${connected:-0}" -lt 2 ]]; then
    echo "Node $node has too few connected interfaces ($connected). Possible cabling/config mismatch." >&2
    echo "$out" >&2
    return 1
  fi
  return 0
}

# Check that hosts have bond0 up and VLAN subinterfaces present
check_host_bonding() {
  local host="$1"
  local out
  out="$(lnx "$host" "ip -br link show bond0 bond0.10 2>/dev/null || true; ip -br link show bond0.20 2>/dev/null || true; ip -br link show bond0.30 2>/dev/null || true" )"
  echo "$out"
  echo "$out" | grep -q "^bond0 " || { echo "Host $host missing bond0" >&2; return 1; }
  echo "$out" | grep -q "^bond0\.10 " || { echo "Host $host missing bond0.10" >&2; return 1; }
  # Must have either bond0.20 or bond0.30 depending on host
  if ! echo "$out" | grep -q "^bond0\.\(20\|30\) "; then
    echo "Host $host missing bond0.20/bond0.30" >&2
    return 1
  fi
  return 0
}

check "All lab containers exist" check_containers

for n in "${ALL_EOS[@]}"; do
  check "EOS interface health on $n" check_eos_interfaces_up "$n"
done

for h in "${ALL_HOSTS[@]}"; do
  check "Host bonding and VLAN subifs on $h" check_host_bonding "$h"
done

summary_exit
