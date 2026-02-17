#!/usr/bin/env bash
# EVPN/BGP control-plane validation (config-driven):
# - Extract neighbors + peer-groups from startup-config
# - Determine which peer-groups are activated for ipv4/evpn AFI
# - Verify those sessions are Established in "show bgp summary"
# - Verify EVPN routes exist on leaves (high signal)

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

neighbors_and_pgs_from_config() {
  local node="$1"
  cfg_text "$node" | awk '
    $1=="neighbor" && $3=="peer" && $4=="group" { print $2, $5 }
  ' | sort -u
}

pgs_activated_by_afi() {
  local node="$1"
  cfg_text "$node" | awk '
    BEGIN { in_bgp=0; afi="" }
    $1=="router" && $2=="bgp" { in_bgp=1 }
    in_bgp && $1=="address-family" { afi=$2 }
    in_bgp && $1=="neighbor" && $3=="activate" && (afi=="ipv4" || afi=="evpn") {
      print afi, $2
    }
    in_bgp && $1=="end" { exit }
  ' | sort -u
}

neighbor_established_for() {
  local node="$1" neigh="$2" afi_pat="$3"
  local out
  out="$(show_bgp_summary "$node")"
  [[ -n "$out" ]] || { echo "No BGP summary output on $node" >&2; return 1; }

  echo "$out" | awk -v n="$neigh" -v afi="$afi_pat" '
    $1==n {
      if ($0 ~ /Established/ && $0 ~ afi) ok=1
    }
    END { exit(ok?0:1) }
  ' || {
    echo "Neighbor $neigh not Established for [$afi_pat] on $node" >&2
    echo "$out" | awk -v n="$neigh" '$1==n {print}' >&2 || true
    return 1
  }

  return 0
}

validate_node_sessions_from_config() {
  local node="$1"

  local tuples afi_pg
  tuples="$(neighbors_and_pgs_from_config "$node" || true)"
  [[ -n "$tuples" ]] || { echo "No neighbor/peer-group tuples found in config for $node" >&2; return 1; }

  afi_pg="$(pgs_activated_by_afi "$node" || true)"
  [[ -n "$afi_pg" ]] || { echo "No address-family activations found in config for $node" >&2; return 1; }

  local ip pg
  while read -r ip pg; do
    [[ -n "$ip" && -n "$pg" ]] || continue

    if echo "$afi_pg" | awk -v pg="$pg" '$1=="ipv4" && $2==pg {f=1} END{exit(f?0:1)}'; then
      neighbor_established_for "$node" "$ip" "IPv4 Unicast" || return 1
    fi

    if echo "$afi_pg" | awk -v pg="$pg" '$1=="evpn" && $2==pg {f=1} END{exit(f?0:1)}'; then
      neighbor_established_for "$node" "$ip" "L2VPN EVPN" || return 1
    fi
  done <<<"$tuples"

  return 0
}

evpn_routes_present_leaf() {
  local node="$1"
  local out
  out="$(eos "$node" "show bgp evpn route-type mac-ip" 2>/dev/null || true)"
  [[ -n "$out" ]] || out="$(eos "$node" "show bgp evpn route" 2>/dev/null || true)"
  [[ -n "$out" ]] || { echo "No EVPN route output on $node" >&2; return 1; }

  echo "$out" | grep -qE "Route|RD|VNI|MAC" || {
    echo "EVPN output lacks expected headers/fields on $node" >&2
    echo "$out" >&2
    return 1
  }
  return 0
}

for n in "${ALL_EOS[@]}"; do
  check "Config-driven BGP sessions Established on $n" validate_node_sessions_from_config "$n"
done

for leaf in "${LEAVES[@]}"; do
  check "EVPN routes present on $leaf" evpn_routes_present_leaf "$leaf"
done

summary_exit
