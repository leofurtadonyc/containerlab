#!/usr/bin/env bash
# Underlay/runtime sanity:
# - All containers exist
# - EOS interface health (basic connected count)
# - Hosts have bond0 + VLAN subinterfaces up

set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

need_cmd docker

container_exists() {
  local node="$1"
  docker inspect "$(clab_container "$node")" >/dev/null 2>&1
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
  return 0
}

check_eos_interfaces_up() {
  local node="$1"
  local out connected
  out="$(eos "$node" "show interfaces status" 2>/dev/null || true)"
  [[ -n "$out" ]] || { echo "Could not read interface status from $node" >&2; return 1; }

  connected="$(echo "$out" | awk '$0 ~ /connected/ {c++} END{print c+0}')"
  if [[ "$connected" -lt 2 ]]; then
    echo "Node $node has too few connected interfaces ($connected)." >&2
    echo "$out" >&2
    return 1
  fi
  return 0
}

is_oper_up() {
  local st="$1"
  [[ "$st" == "UP" || "$st" == "UNKNOWN" ]]
}

check_host_bonding() {
  local host="$1"

  lnx "$host" "ip link show dev bond0 >/dev/null 2>&1"    || { echo "Host $host missing bond0" >&2; return 1; }
  lnx "$host" "ip link show dev bond0.10 >/dev/null 2>&1" || { echo "Host $host missing bond0.10" >&2; return 1; }
  lnx "$host" "ip link show dev bond0.20 >/dev/null 2>&1" || { echo "Host $host missing bond0.20" >&2; return 1; }

  local s0 s10 s20
  s0="$(lnx "$host" "ip -br link show dev bond0    | awk '{print \$2}'" || true)"
  s10="$(lnx "$host" "ip -br link show dev bond0.10 | awk '{print \$2}'" || true)"
  s20="$(lnx "$host" "ip -br link show dev bond0.20 | awk '{print \$2}'" || true)"

  is_oper_up "$s0"  || { echo "Host $host bond0 not operational (state: ${s0:-<none>})" >&2; return 1; }
  is_oper_up "$s10" || { echo "Host $host bond0.10 not operational (state: ${s10:-<none>})" >&2; return 1; }
  is_oper_up "$s20" || { echo "Host $host bond0.20 not operational (state: ${s20:-<none>})" >&2; return 1; }

  # Optional /proc check (high-signal)
  local bondinfo
  bondinfo="$(lnx "$host" "cat /proc/net/bonding/bond0 2>/dev/null || true")"
  if [[ -n "$bondinfo" ]]; then
    echo "$bondinfo" | grep -qi "Bonding Mode:.*802\.3ad" || echo "WARN: $host bond0 not 802.3ad per /proc" >&2
    echo "$bondinfo" | grep -q "Slave Interface: eth1"   || echo "WARN: $host bond0 missing slave eth1 per /proc" >&2
    echo "$bondinfo" | grep -q "Slave Interface: eth2"   || echo "WARN: $host bond0 missing slave eth2 per /proc" >&2
  fi

  lnx "$host" "ip -br link show dev bond0; ip -br link show dev bond0.10; ip -br link show dev bond0.20" || true
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
