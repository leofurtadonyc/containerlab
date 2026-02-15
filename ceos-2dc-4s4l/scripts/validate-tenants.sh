#!/usr/bin/env bash
# This validates end-to-end tenant behavior from the hosts’ perspective, while remaining honest about what we can infer from the topology alone. We know:
# All hosts have bond0.10 and default route via 192.168.10.1
# DC1 hosts have 192.168.20.0/24 or 192.168.30.0/24
# DC2 hosts have 192.168.120.0/24 or 192.168.130.0/24
# Dual-homing is via LACP bonding
# So we validate:
# - Each host can ARP/ND its default gateway (ARP presence)
# - Each host can ping its local gateway
# - Within a DC, hosts in VLAN10 can ping each other (should be true if tenant is built)
# - Across DCs, VLAN10 reachability exists only if you exported that service; this script reports it as informational, not pass/fail.

set -euo pipefail
cd "$(dirname "$0")"

source ./common.sh

# Local gateway we assume from host configs
GW_V10="192.168.10.1"

ping_host() {
  local host="$1"
  local dst="$2"
  lnx "$host" "ping -c 2 -W 1 $dst >/dev/null"
}

arp_has_gateway() {
  local host="$1"
  # Trigger ARP and check neighbor cache
  lnx "$host" "ping -c 1 -W 1 $GW_V10 >/dev/null 2>&1 || true; ip neigh show | grep -E \"\\b$GW_V10\\b\" >/dev/null"
}

check_host_gateway() {
  local host="$1"
  arp_has_gateway "$host" || { echo "Host $host has no neighbor entry for gateway $GW_V10" >&2; return 1; }
  ping_host "$host" "$GW_V10" || { echo "Host $host cannot ping gateway $GW_V10" >&2; return 1; }
  return 0
}

# Intra-DC VLAN10 reachability sets
DC1_V10_IPS=(192.168.10.11 192.168.10.12 192.168.10.13 192.168.10.14)
DC2_V10_IPS=(192.168.10.21 192.168.10.22 192.168.10.23 192.168.10.24)

check_intra_dc_v10() {
  local src_host="$1"
  shift
  local -a dst_ips=("$@")
  local ok=0
  for ip in "${dst_ips[@]}"; do
    if ping_host "$src_host" "$ip"; then
      ok=$((ok+1))
    else
      echo "Host $src_host cannot ping $ip (intra-DC VLAN10 test)" >&2
      return 1
    fi
  done
  echo "Host $src_host can reach ${ok}/${#dst_ips[@]} intra-DC VLAN10 peers."
  return 0
}

# Cross-DC test is informational: it's only expected if you exported VLAN10 service across DCI.
cross_dc_info() {
  local src_host="$1"
  local dst_ip="$2"
  if ping_host "$src_host" "$dst_ip"; then
    echo "INFO: Cross-DC ping SUCCESS from $src_host to $dst_ip. This implies VLAN10 service is exported across DCI (or routing permits it)."
  else
    echo "INFO: Cross-DC ping FAIL from $src_host to $dst_ip. This may be expected if VLAN10 is not exported across DCI."
  fi
  return 0
}

for h in "${ALL_HOSTS[@]}"; do
  check "Host default gateway reachable from $h" check_host_gateway "$h"
done

# Intra-DC checks
check "Intra-DC VLAN10 reachability from dc1-host1" check_intra_dc_v10 "dc1-host1" "${DC1_V10_IPS[@]/192.168.10.11}"
check "Intra-DC VLAN10 reachability from dc2-host1" check_intra_dc_v10 "dc2-host1" "${DC2_V10_IPS[@]/192.168.10.21}"

# Cross-DC informational probes (non-failing)
log "Cross-DC informational probes (not pass/fail):"
cross_dc_info "dc1-host1" "192.168.10.21"
cross_dc_info "dc2-host1" "192.168.10.11"
echo

summary_exit
