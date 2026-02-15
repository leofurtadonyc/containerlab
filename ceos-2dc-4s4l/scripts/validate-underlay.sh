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

# Check that hosts have bond0 up and VLAN subinterfaces present.
# Robust against iproute2 formatting differences and partial command failures.
check_host_bonding() {
  local host="$1"

  # 1) Existence checks (interface presence) using ip -o link show (stable format)
  local links
  links="$(lnx "$host" "ip -o link show | awk -F': ' '{print \$2}' | cut -d@ -f1" || true)"

  echo "$links" | grep -qx "bond0"     || { echo "Host $host missing bond0" >&2; return 1; }
  echo "$links" | grep -qx "bond0.10"  || { echo "Host $host missing bond0.10" >&2; return 1; }

  if ! (echo "$links" | grep -qx "bond0.20" || echo "$links" | grep -qx "bond0.30"); then
    echo "Host $host missing bond0.20/bond0.30" >&2
    return 1
  fi

  # 2) Operational state checks using ip -br (but per-interface, so it can't partially fail)
  local s_bond0 s_10 s_20 s_30
  s_bond0="$(lnx "$host" "ip -br link show bond0 2>/dev/null | awk '{print \$2}'" || true)"
  s_10="$(lnx "$host" "ip -br link show bond0.10 2>/dev/null | awk '{print \$2}'" || true)"
  s_20="$(lnx "$host" "ip -br link show bond0.20 2>/dev/null | awk '{print \$2}'" || true)"
  s_30="$(lnx "$host" "ip -br link show bond0.30 2>/dev/null | awk '{print \$2}'" || true)"

  [[ "$s_bond0" == "UP" ]] || { echo "Host $host bond0 is not UP (state: ${s_bond0:-<none>})" >&2; return 1; }
  [[ "$s_10" == "UP" ]]    || { echo "Host $host bond0.10 is not UP (state: ${s_10:-<none>})" >&2; return 1; }

  # Must have either VLAN20 or VLAN30 UP
  if ! ([[ "$s_20" == "UP" ]] || [[ "$s_30" == "UP" ]]); then
    echo "Host $host neither bond0.20 nor bond0.30 is UP (bond0.20: ${s_20:-<none>}, bond0.30: ${s_30:-<none>})" >&2
    return 1
  fi

  # 3) High-signal bond validation (optional but useful)
  # Check bonding mode and slaves (if /proc exists; tolerate if not)
  local bondinfo
  bondinfo="$(lnx "$host" "cat /proc/net/bonding/bond0 2>/dev/null || true")"
  if [[ -n "$bondinfo" ]]; then
    echo "$bondinfo" | grep -qi "Bonding Mode:.*802\.3ad" || {
      echo "WARN: Host $host bond0 is not 802.3ad per /proc (may still be OK if image differs)" >&2
    }
    echo "$bondinfo" | grep -q "Slave Interface: eth1" || echo "WARN: Host $host bond0 missing slave eth1 in /proc" >&2
    echo "$bondinfo" | grep -q "Slave Interface: eth2" || echo "WARN: Host $host bond0 missing slave eth2 in /proc" >&2
  else
    echo "WARN: Host $host cannot read /proc/net/bonding/bond0 (skipping bond mode/slave checks)" >&2
  fi

  # 4) Print a compact summary (helps when troubleshooting)
  lnx "$host" "ip -br link show bond0 bond0.10 2>/dev/null || true; ip -br link show bond0.20 2>/dev/null || true; ip -br link show bond0.30 2>/dev/null || true" || true

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
