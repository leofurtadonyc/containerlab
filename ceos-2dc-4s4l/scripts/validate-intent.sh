#!/usr/bin/env bash
# Because you mount configs, it’s valuable to validate the repo itself (not just runtime state): confirm the design intent exists everywhere.
# This script reads the mounted configs from inside the containers and checks for key lines:
# - Leaves: vxlan source-interface Loopback1, VNI mappings, ip address virtual 192.168.10.1/24
# - DCI routers: neighbor WAN-EVPN encapsulation mpls and neighbor WAN-EVPN domain remote
# - VLAN10 remote-domain RT import/export present on routers

set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

need_cmd docker

# Read startup-config from inside EOS container
cfg_text() {
  local node="$1"
  # Startup config is mounted to /mnt/flash/startup-config per topology
  dexec "$node" bash -lc "cat /mnt/flash/startup-config 2>/dev/null || cat /mnt/flash/startup-config.txt 2>/dev/null || true"
}

must_contain() {
  local node="$1" pat="$2"
  local text
  text="$(cfg_text "$node")"
  echo "$text" | grep -qE "$pat" || {
    echo "Config intent missing on $node: expected pattern: $pat" >&2
    return 1
  }
  return 0
}

# Leaves: VXLAN + Anycast GW + VNI map
for leaf in "${DC1_LEAVES[@]}" "${DC2_LEAVES[@]}"; do
  check "Intent: $leaf has Vxlan1 + Loopback1 source" must_contain "$leaf" "interface Vxlan1|vxlan source-interface Loopback1"
  check "Intent: $leaf VLAN10 VNI 10100" must_contain "$leaf" "vxlan vlan 10 vni 10100"
  check "Intent: $leaf VRF TENANT1 VNI 10000" must_contain "$leaf" "vxlan vrf TENANT1 vni 10000"
  check "Intent: $leaf Anycast GW 192.168.10.1/24" must_contain "$leaf" "ip address virtual 192\\.168\\.10\\.1/24"
done

# DCI routers: EVPN MPLS encapsulation + domain remote + VLAN10 remote-domain RT
for r in "${DC1_ROUTERS[@]}" "${DC2_ROUTERS[@]}"; do
  check "Intent: $r has WAN-EVPN MPLS encapsulation" must_contain "$r" "neighbor WAN-EVPN encapsulation mpls"
  check "Intent: $r has WAN-EVPN domain remote" must_contain "$r" "neighbor WAN-EVPN domain remote"
  check "Intent: $r exports/imports VLAN10 across domain remote" must_contain "$r" "route-target import export evpn domain remote 65000:10100"
  check "Intent: $r exports/imports VRF TENANT1 across domain remote" must_contain "$r" "route-target (import|export) evpn domain remote 65000:10000"
done

summary_exit
