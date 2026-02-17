#!/usr/bin/env bash
# Validate configuration intent (the "design truth"):
# - Leaves: VXLAN present, source-interface Loopback1, VLAN10 anycast GW 192.168.10.1/24, VLAN10 VNI mapping
# - Rack-local "VLAN20" is implemented as two isolated domains:
#   Rack A (leaf1/leaf2) uses one VNI for VLAN 20
#   Rack B (leaf3/leaf4) uses a different VNI for VLAN 20
# - Gateways for rack subnets exist where expected:
#   Rack A GW 192.168.20.1/24 on leaf1/leaf2
#   Rack B GW 192.168.30.1/24 on leaf3/leaf4

#!/usr/bin/env bash
# Validate configuration intent (the "design truth"):
# - Leaves: VXLAN present, source-interface Loopback1, VLAN10 anycast GW 192.168.10.1/24, VLAN10 VNI mapping
# - Rack-local "VLAN20" is implemented as two isolated domains:
#   Rack A (leaf1/leaf2) uses one VNI for VLAN 20
#   Rack B (leaf3/leaf4) uses a different VNI for VLAN 20
# - Gateways for rack subnets exist where expected:
#   Rack A GW 192.168.20.1/24 on leaf1/leaf2
#   Rack B GW 192.168.30.1/24 on leaf3/leaf4

set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

need_cmd docker

# Return config text for a node.
# Prefer startup-config (repo truth), but if it is missing/empty, fall back to running-config (device truth).
cfg_text() {
  local node="$1"
  local txt=""

  # 1) startup-config (what you mounted)
  txt="$(dexec "$node" bash -lc "cat /mnt/flash/startup-config 2>/dev/null || true" || true)"
  if [[ -n "${txt//[[:space:]]/}" ]]; then
    echo "$txt"
    return 0
  fi

  # 2) fallback: running-config (what EOS is actually using)
  txt="$(eos "$node" "show running-config" 2>/dev/null || true)"
  if [[ -n "${txt//[[:space:]]/}" ]]; then
    echo "$txt"
    return 0
  fi

  echo ""  # keep deterministic output
  return 0
}

must_contain() {
  local node="$1" pat="$2"
  local text
  text="$(cfg_text "$node")"
  [[ -n "${text//[[:space:]]/}" ]] || {
    echo "Config intent read failed on $node: startup-config empty and running-config empty" >&2
    return 1
  }

  echo "$text" | grep -qE "$pat" || {
    echo "Config intent missing on $node: expected pattern: $pat" >&2
    return 1
  }
  return 0
}

# Extract VNI for "vxlan vlan <VID> vni <VNI>"
vni_for_vlan() {
  local node="$1" vid="$2"
  cfg_text "$node" | awk -v v="$vid" '
    $1=="vxlan" && $2=="vlan" && $3==v && $4=="vni" {print $5; exit}
  '
}

# Extract a section from running/startup config between "interface X" and next "interface" or "!" or "end"
iface_block() {
  local node="$1" ifname="$2"
  cfg_text "$node" | awk -v i="$ifname" '
    BEGIN{inblk=0}
    $1=="interface" && $2==i {inblk=1}
    inblk{print}
    inblk && $1=="interface" && $2!=i {exit}
  ' | awk 'NR==1{print;next} $1=="interface"{exit} {print}'
}

# Does an interface block allow VLANs 10 and 20 in trunk allowed list?
# Accepts:
# - "switchport trunk allowed vlan 10,20"
# - "switchport trunk allowed vlan 10,20,4094"
# - "switchport trunk allowed vlan 10-20"
# - "switchport trunk allowed vlan add 10,20"
iface_allows_10_20() {
  local node="$1" ifname="$2"
  local blk
  blk="$(iface_block "$node" "$ifname")"
  [[ -n "${blk//[[:space:]]/}" ]] || {
    echo "Could not read interface block $ifname on $node" >&2
    return 1
  }

  # Normalize allowed-vlan lines and check that both 10 and 20 appear somewhere meaningfully.
  # We intentionally accept various EOS syntaxes.
  local allowed
  allowed="$(echo "$blk" | awk '
    $1=="switchport" && $2=="trunk" && $3=="allowed" && $4=="vlan" {
      for(i=5;i<=NF;i++) printf "%s", $i;
      printf "\n"
    }
  ')"

  [[ -n "${allowed//[[:space:]]/}" ]] || {
    echo "Missing 'switchport trunk allowed vlan ...' under $ifname on $node" >&2
    echo "$blk" >&2
    return 1
  }

  # Check presence of vlan 10 and 20 in the allowed expression
  echo "$allowed" | grep -Eq '(^|[^0-9])10([^0-9]|$)|10-' || {
    echo "Trunk allowed list on $node $ifname does not include VLAN10. Found: $allowed" >&2
    return 1
  }
  echo "$allowed" | grep -Eq '(^|[^0-9])20([^0-9]|$)|-20' || {
    echo "Trunk allowed list on $node $ifname does not include VLAN20. Found: $allowed" >&2
    return 1
  }

  return 0
}

check_leaf_vxlan_basics() {
  local leaf="$1"
  must_contain "$leaf" "^interface Vxlan1" || return 1
  must_contain "$leaf" "vxlan source-interface Loopback1" || return 1
  must_contain "$leaf" "vxlan vlan 10 vni 10100" || return 1
  must_contain "$leaf" "vxlan vrf TENANT1 vni 10000" || return 1
  must_contain "$leaf" "ip address virtual 192\\.168\\.10\\.1/24" || return 1
  return 0
}

check_leaf_rack_specifics() {
  local leaf="$1"
  case "$leaf" in
    leaf1|leaf2)
      must_contain "$leaf" "vxlan vlan 20 vni 10200" || return 1
      must_contain "$leaf" "ip address virtual 192\\.168\\.20\\.1/24" || return 1
      ;;
    leaf3|leaf4)
      must_contain "$leaf" "vxlan vlan 20 vni 10300" || return 1
      must_contain "$leaf" "ip address virtual 192\\.168\\.30\\.1/24" || return 1
      ;;
    *)
      echo "Unknown leaf: $leaf" >&2
      return 1
      ;;
  esac
  return 0
}

check_leaf_esi_lag() {
  local leaf="$1"
  local po_a po_b

  case "$leaf" in
    leaf1|leaf2) po_a="Port-Channel11"; po_b="Port-Channel12" ;;
    leaf3|leaf4) po_a="Port-Channel13"; po_b="Port-Channel14" ;;
    *) return 1 ;;
  esac

  # Must have the port-channels defined
  must_contain "$leaf" "^interface ${po_a}" || return 1
  must_contain "$leaf" "^interface ${po_b}" || return 1

  # Validate trunk intent inside each Port-Channel block (no multi-line grep)
  check_po_trunk_intent() {
    local node="$1" ifname="$2"
    local blk
    blk="$(iface_block "$node" "$ifname")"
    [[ -n "${blk//[[:space:]]/}" ]] || {
      echo "Could not read interface block $ifname on $node" >&2
      return 1
    }

    # Accept either explicit "switchport mode trunk" OR presence of allowed-vlan (common in templates)
    if ! echo "$blk" | grep -qE '^[[:space:]]*switchport[[:space:]]+mode[[:space:]]+trunk[[:space:]]*$'; then
      if ! echo "$blk" | grep -qE '^[[:space:]]*switchport[[:space:]]+trunk[[:space:]]+allowed[[:space:]]+vlan[[:space:]]+'; then
        echo "Missing trunk intent under $node $ifname (need 'switchport mode trunk' or 'switchport trunk allowed vlan ...')" >&2
        echo "$blk" >&2
        return 1
      fi
    fi

    # Must allow VLANs 10 and 20 somewhere in allowed list
    iface_allows_10_20 "$node" "$ifname" || return 1
    return 0
  }

  check_po_trunk_intent "$leaf" "$po_a" || return 1
  check_po_trunk_intent "$leaf" "$po_b" || return 1

  # ESI-LAG structure present (at least once; this is a lab-wide intent)
  must_contain "$leaf" "evpn ethernet-segment" || return 1
  must_contain "$leaf" "identifier [0-9a-fA-F:]{4}:[0-9a-fA-F:]{4}:[0-9a-fA-F:]{4}:[0-9a-fA-F:]{4}:[0-9a-fA-F:]{4}" || return 1
  must_contain "$leaf" "route-target import" || return 1
  must_contain "$leaf" "lacp system-id" || return 1

  return 0
}

check_spine_role() {
  local spine="$1"
  # Spine is RR-ish for EVPN and underlay: must have BGP + EVPN address-family and both peer-groups.
  must_contain "$spine" "^[[:space:]]*router bgp[[:space:]]+65000" || return 1
  must_contain "$spine" "neighbor[[:space:]]+LEAF-UNDERLAY[[:space:]]+peer group" || return 1
  must_contain "$spine" "neighbor[[:space:]]+LEAF-EVPN[[:space:]]+peer group" || return 1
  must_contain "$spine" "address-family[[:space:]]+evpn" || return 1
  return 0
}

check_vlan20_vni_diff_between_racks() {
  local v1 v2 v3 v4
  v1="$(vni_for_vlan leaf1 20 || true)"
  v2="$(vni_for_vlan leaf2 20 || true)"
  v3="$(vni_for_vlan leaf3 20 || true)"
  v4="$(vni_for_vlan leaf4 20 || true)"

  [[ -n "$v1" && -n "$v2" && -n "$v3" && -n "$v4" ]] || {
    echo "Could not extract VLAN20 VNIs: leaf1='$v1' leaf2='$v2' leaf3='$v3' leaf4='$v4'" >&2
    return 1
  }

  [[ "$v1" == "10200" && "$v2" == "10200" ]] || {
    echo "Rack A VLAN20 VNI mismatch: leaf1='$v1' leaf2='$v2' (expected both 10200)" >&2
    return 1
  }

  [[ "$v3" == "10300" && "$v4" == "10300" ]] || {
    echo "Rack B VLAN20 VNI mismatch: leaf3='$v3' leaf4='$v4' (expected both 10300)" >&2
    return 1
  }

  [[ "$v1" != "$v3" ]] || {
    echo "Rack-local isolation broken: RackA VNI '$v1' equals RackB VNI '$v3'" >&2
    return 1
  }

  return 0
}

for leaf in "${LEAVES[@]}"; do
  check "Intent: $leaf VXLAN + Anycast GW baseline" check_leaf_vxlan_basics "$leaf"
  check "Intent: $leaf rack-specific VLAN20 domain (VNI + GW)" check_leaf_rack_specifics "$leaf"
  check "Intent: $leaf uses EVPN all-active multihoming (ESI-LAG)" check_leaf_esi_lag "$leaf"
done

for spine in "${SPINES[@]}"; do
  check "Intent: $spine has spine BGP role (underlay + EVPN)" check_spine_role "$spine"
done

check "Intent: VLAN20 VNI differs between racks (10200 vs 10300)" check_vlan20_vni_diff_between_racks

summary_exit
