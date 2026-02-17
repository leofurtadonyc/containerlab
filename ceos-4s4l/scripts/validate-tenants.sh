#!/usr/bin/env bash
# Tenant dataplane validation (host perspective):
# - All hosts can reach VLAN10 anycast gateway 192.168.10.1
# - VLAN10 full mesh across all hosts
# - Rack A "VLAN20" subnet 192.168.20.0/24 works between l4h1<->l4h2 and gateway 192.168.20.1
# - Rack B "VLAN20" subnet 192.168.30.0/24 works between l4h3<->l4h4 and gateway 192.168.30.1
# - L2 Isolation intent: Rack A VLAN20 VNI MUST NOT extend to Rack B VLAN20 VNI (and vice-versa).
#   We validate this at L2 by ensuring hosts do NOT learn ARP/neighbor entries on bond0.20
#   for remote-rack VLAN20 IPs (even if L3 routing might exist via VLAN10/VRF).

set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

GW_V10="192.168.10.1"
GW_RACKA="192.168.20.1"
GW_RACKB="192.168.30.1"

ping_ok() {
  local host="$1" dst="$2"
  lnx "$host" "ping -c 2 -W 1 $dst >/dev/null"
}

check_gw_reachable() {
  local host="$1" gw="$2"
  # prime ARP
  lnx "$host" "ping -c 1 -W 1 $gw >/dev/null 2>&1 || true"
  lnx "$host" "ip neigh show | grep -E \"\\b$gw\\b\" >/dev/null" || {
    echo "Host $host has no neighbor entry for gateway $gw" >&2
    return 1
  }
  ping_ok "$host" "$gw" || { echo "Host $host cannot ping gateway $gw" >&2; return 1; }
  return 0
}

check_mesh_from() {
  local src="$1"; shift
  local dst
  for dst in "$@"; do
    ping_ok "$src" "$dst" || { echo "Host $src cannot ping $dst" >&2; return 1; }
  done
  return 0
}

check_rackA_host_to_host() {
  ping_ok l4h1 192.168.20.12 || return 1
  ping_ok l4h2 192.168.20.11 || return 1
  return 0
}

check_rackB_host_to_host() {
  ping_ok l4h3 192.168.30.14 || return 1
  ping_ok l4h4 192.168.30.13 || return 1
  return 0
}

# ---- L2 isolation checks (Option A) ----

host_has_arping() {
  local host="$1"
  lnx "$host" "command -v arping >/dev/null 2>&1"
}

# Try to force L2 resolution on VLAN20 (bond0.20) and confirm we do NOT learn a neighbor entry.
# Important: We DO NOT use ping here, because ping can succeed via L3 routing (default via VLAN10).
l2_neighbor_absent_on_vlan20() {
  local host="$1" dst="$2"

  # Flush any stale neighbor entry
  lnx "$host" "ip neigh del $dst dev bond0.20 2>/dev/null || true"

  if host_has_arping "$host"; then
    # ARP who-has on the VLAN20 sub-interface
    lnx "$host" "arping -c 2 -w 2 -I bond0.20 $dst >/dev/null 2>&1 || true"
  else
    # Fallback: attempt to provoke ARP by sending an ICMP echo *bound to bond0.20*.
    # Even if routing occurs, the neighbor entry on bond0.20 should NOT become learned if L2 is isolated.
    lnx "$host" "ping -c 1 -W 1 -I bond0.20 $dst >/dev/null 2>&1 || true"
  fi

  # If L2 domain is isolated, we must NOT learn an entry for dst on bond0.20.
  if lnx "$host" "ip neigh show dev bond0.20 | grep -E \"^$dst \" >/dev/null"; then
    echo "Host $host unexpectedly learned L2 neighbor for $dst on bond0.20 (VLAN20 should be rack-local)" >&2
    lnx "$host" "ip neigh show dev bond0.20 | grep -E \"^$dst \" || true" >&2
    return 1
  fi

  return 0
}

check_l2_isolation_rackA_to_rackB_vlan20() {
  l2_neighbor_absent_on_vlan20 l4h1 192.168.30.13 || return 1
  l2_neighbor_absent_on_vlan20 l4h1 192.168.30.14 || return 1
  l2_neighbor_absent_on_vlan20 l4h2 192.168.30.13 || return 1
  l2_neighbor_absent_on_vlan20 l4h2 192.168.30.14 || return 1
  return 0
}

check_l2_isolation_rackB_to_rackA_vlan20() {
  l2_neighbor_absent_on_vlan20 l4h3 192.168.20.11 || return 1
  l2_neighbor_absent_on_vlan20 l4h3 192.168.20.12 || return 1
  l2_neighbor_absent_on_vlan20 l4h4 192.168.20.11 || return 1
  l2_neighbor_absent_on_vlan20 l4h4 192.168.20.12 || return 1
  return 0
}

# VLAN10 gateway reachability
for h in "${HOSTS[@]}"; do
  check "Host VLAN10 anycast GW reachable from $h" check_gw_reachable "$h" "$GW_V10"
done

# VLAN10 mesh sanity
check "VLAN10 mesh from l4h1" check_mesh_from "l4h1" 192.168.10.12 192.168.10.13 192.168.10.14
check "VLAN10 mesh from l4h3" check_mesh_from "l4h3" 192.168.10.11 192.168.10.12 192.168.10.14

# Rack A (192.168.20/24)
check "Rack A GW 192.168.20.1 reachable from l4h1" check_gw_reachable "l4h1" "$GW_RACKA"
check "Rack A GW 192.168.20.1 reachable from l4h2" check_gw_reachable "l4h2" "$GW_RACKA"
check "Rack A host-to-host (20.11 <-> 20.12)" check_rackA_host_to_host

# Rack B (192.168.30/24)
check "Rack B GW 192.168.30.1 reachable from l4h3" check_gw_reachable "l4h3" "$GW_RACKB"
check "Rack B GW 192.168.30.1 reachable from l4h4" check_gw_reachable "l4h4" "$GW_RACKB"
check "Rack B host-to-host (30.13 <-> 30.14)" check_rackB_host_to_host

# L2 Isolation (Rack-local VNIs must not extend across racks)
check "L2 Isolation: Rack A VLAN20 does not extend to Rack B VLAN20" check_l2_isolation_rackA_to_rackB_vlan20
check "L2 Isolation: Rack B VLAN20 does not extend to Rack A VLAN20" check_l2_isolation_rackB_to_rackA_vlan20

summary_exit
