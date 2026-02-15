#!/usr/bin/env bash
# This checks for BGP neighbor health and EVPN control-plane presence on all EOS nodes.
# Because spines may be RRs or pure underlay nodes depending on your configs, the script is tolerant: it tries EVPN-specific commands and falls back to BGP summary.

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

need_cmd docker

cfg_text() {
  local node="$1"
  dexec "$node" bash -lc "cat /mnt/flash/startup-config 2>/dev/null || true"
}

show_bgp_summary() {
  local node="$1"
  eos "$node" "show bgp summary" 2>/dev/null || true
}

# Check that neighbor line exists with Established + AFI/SAFI token
neighbor_afi_established() {
  local node="$1" neigh="$2" afi_pat="$3"
  local out
  out="$(show_bgp_summary "$node")"
  [[ -n "$out" ]] || { echo "No BGP summary output on $node" >&2; return 1; }

  if echo "$out" | awk -v n="$neigh" -v afi="$afi_pat" '
      $1==n {
        line=$0
        if (line ~ /Established/ && line ~ afi) {found=1}
      }
      END {exit(found?0:1)}
    '; then
    return 0
  fi

  echo "Neighbor $neigh not Established for [$afi_pat] on $node" >&2
  echo "$out" | awk -v n="$neigh" '$1==n {print}' >&2 || true
  return 1
}

# Extract all "neighbor <ip> peer group <pg>" tuples from config
# Output format: "<ip> <pg>"
neighbors_and_pgs_from_config() {
  local node="$1"
  local cfg
  cfg="$(cfg_text "$node")"
  [[ -n "$cfg" ]] || { echo "Empty startup-config for $node" >&2; return 1; }

  echo "$cfg" | awk '
    $1=="neighbor" && $3=="peer" && $4=="group" {
      # neighbor <ip> peer group <pg>
      print $2, $5
    }
  ' | sort -u
}

# Determine which peer-groups are activated for ipv4 and evpn address families.
# Output: lines "ipv4 <pg>" and "evpn <pg>"
pgs_activated_by_afi() {
  local node="$1"
  local cfg
  cfg="$(cfg_text "$node")"
  [[ -n "$cfg" ]] || { echo "Empty startup-config for $node" >&2; return 1; }

  # We parse the router bgp section in a simple state machine.
  # We look for:
  #   address-family ipv4
  #      neighbor <PG> activate
  #   address-family evpn
  #      neighbor <PG> activate
  echo "$cfg" | awk '
    BEGIN { in_bgp=0; afi="" }
    $1=="router" && $2=="bgp" { in_bgp=1 }
    in_bgp && $1=="address-family" { afi=$2 }
    in_bgp && $1=="neighbor" && $3=="activate" && (afi=="ipv4" || afi=="evpn") {
      print afi, $2
    }
    # stop when leaving router bgp section (rough heuristic)
    in_bgp && $1=="!" { afi="" }
  ' | sort -u
}

# EVPN route presence on leaves only (high signal)
evpn_routes_present_leaf() {
  local node="$1"
  local out
  out="$(eos "$node" "show bgp evpn route-type mac-ip" 2>/dev/null || true)"
  if [[ -z "$out" ]]; then
    out="$(eos "$node" "show bgp evpn route" 2>/dev/null || true)"
  fi
  [[ -n "$out" ]] || { echo "No EVPN route output on $node" >&2; return 1; }

  echo "$out" | grep -qE "RD|Route|VNI|MAC|IP" || {
    echo "EVPN route output exists but lacks expected headers/fields on $node" >&2
    echo "$out" >&2
    return 1
  }
  return 0
}

# Main validation for a node: for each neighbor configured via peer-group,
# validate Established for the AFIs that peer-group is activated for.
validate_node_bgp_from_config() {
  local node="$1"

  local tuples
  tuples="$(neighbors_and_pgs_from_config "$node" || true)"
  [[ -n "$tuples" ]] || { echo "No neighbor/peer-group tuples found in config for $node" >&2; return 1; }

  local afi_pg
  afi_pg="$(pgs_activated_by_afi "$node" || true)"
  [[ -n "$afi_pg" ]] || { echo "No address-family activations found in config for $node" >&2; return 1; }

  # Build lookup sets for activated PGs
  # Using grep -qx on prepared strings is fine at this scale.
  local ip pg
  while read -r ip pg; do
    [[ -n "$ip" && -n "$pg" ]] || continue

    # If PG is activated in ipv4, check IPv4 Unicast Established
    if echo "$afi_pg" | awk -v pg="$pg" '$1=="ipv4" && $2==pg {found=1} END{exit(found?0:1)}'; then
      neighbor_afi_established "$node" "$ip" "IPv4 Unicast" || return 1
    fi

    # If PG is activated in evpn, check L2VPN EVPN Established
    if echo "$afi_pg" | awk -v pg="$pg" '$1=="evpn" && $2==pg {found=1} END{exit(found?0:1)}'; then
      neighbor_afi_established "$node" "$ip" "L2VPN EVPN" || return 1
    fi

  done <<<"$tuples"

  return 0
}

# ---- Run checks ----

# Validate all EOS nodes using config-driven expectations
for n in "${ALL_EOS[@]}"; do
  check "Config-driven BGP sessions Established on $n" validate_node_bgp_from_config "$n"
done

# Extra EVPN dataplane control-plane sanity on leaves
for leaf in "${DC1_LEAVES[@]}" "${DC2_LEAVES[@]}"; do
  check "EVPN routes present on $leaf" evpn_routes_present_leaf "$leaf"
done

summary_exit
