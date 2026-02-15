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

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

GW_V10="192.168.10.1"

ping_host() {
  local host="$1" dst="$2"
  lnx "$host" "ping -c 2 -W 1 $dst >/dev/null"
}

check_host_gateway() {
  local host="$1"
  lnx "$host" "ping -c 1 -W 1 $GW_V10 >/dev/null 2>&1 || true"
  lnx "$host" "ip neigh show | grep -E \"\\b$GW_V10\\b\" >/dev/null" || {
    echo "Host $host has no neighbor entry for gateway $GW_V10" >&2
    return 1
  }
  ping_host "$host" "$GW_V10" || { echo "Host $host cannot ping gateway $GW_V10" >&2; return 1; }
  return 0
}

# Expected: Intra-DC VLAN10 full mesh within each DC
DC1_V10_IPS=(192.168.10.11 192.168.10.12 192.168.10.13 192.168.10.14)
DC2_V10_IPS=(192.168.10.21 192.168.10.22 192.168.10.23 192.168.10.24)

check_reach_set() {
  local src_host="$1"; shift
  local -a dsts=("$@")
  for ip in "${dsts[@]}"; do
    ping_host "$src_host" "$ip" || { echo "Host $src_host cannot ping $ip" >&2; return 1; }
  done
  return 0
}

# Cross-DC requirement: VLAN10 is explicitly exported with EVPN domain remote on DCI routers.
# Therefore, this must pass.
check_cross_dc_vlan10() {
  ping_host "dc1-host1" "192.168.10.21" || { echo "dc1-host1 cannot reach dc2-host1 over VLAN10 (expected to PASS)" >&2; return 1; }
  ping_host "dc2-host1" "192.168.10.11" || { echo "dc2-host1 cannot reach dc1-host1 over VLAN10 (expected to PASS)" >&2; return 1; }
  return 0
}

# VRF TENANT1 is exported/imported across domain remote (RT 65000:10000 on DCI routers),
# so L3 reachability between DC-local subnets is expected (type-5 / connected redistribution).
# These are strong, high-signal checks.
check_cross_dc_vrf_l3() {
  # From DC1 VLAN20 host to DC2 VLAN20-subnet host (192.168.120.21 lives on dc2-host1 bond0.20)
  ping_host "dc1-host1" "192.168.120.21" || { echo "dc1-host1 cannot reach 192.168.120.21 across VRF TENANT1 (expected to PASS)" >&2; return 1; }

  # From DC2 VLAN20 host to DC1 VLAN20-subnet host (192.168.20.11 lives on dc1-host1 bond0.20)
  ping_host "dc2-host1" "192.168.20.11" || { echo "dc2-host1 cannot reach 192.168.20.11 across VRF TENANT1 (expected to PASS)" >&2; return 1; }

  return 0
}

# Baseline: all hosts can reach their anycast gateway
for h in "${ALL_HOSTS[@]}"; do
  check "Host default gateway reachable from $h" check_host_gateway "$h"
done

# Intra-DC VLAN10 checks (sampled)
check "Intra-DC VLAN10 mesh from dc1-host1" check_reach_set "dc1-host1" 192.168.10.12 192.168.10.13 192.168.10.14
check "Intra-DC VLAN10 mesh from dc2-host1" check_reach_set "dc2-host1" 192.168.10.22 192.168.10.23 192.168.10.24

# Cross-DC (MANDATORY): VLAN10 stretched
check "Cross-DC VLAN10 reachability (MANDATORY: EVPN domain remote for VLAN10)" check_cross_dc_vlan10

# Cross-DC (MANDATORY): VRF TENANT1 type-5 / connected redistribution L3
check "Cross-DC VRF TENANT1 L3 reachability (MANDATORY: RT 65000:10000 domain remote)" check_cross_dc_vrf_l3

summary_exit
