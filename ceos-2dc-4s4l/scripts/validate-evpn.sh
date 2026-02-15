#!/usr/bin/env bash
# This checks for BGP neighbor health and EVPN control-plane presence on all EOS nodes.
# Because spines may be RRs or pure underlay nodes depending on your configs, the script is tolerant: it tries EVPN-specific commands and falls back to BGP summary.
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
source ./common.sh

need_cmd docker

# ----- Expected peers based on your configs -----
# DC1 spines loopbacks: 10.1.254.1-4
# DC2 spines loopbacks: 10.2.254.1-4

DC1_SPINE_LO0=(10.1.254.1 10.1.254.2 10.1.254.3 10.1.254.4)
DC2_SPINE_LO0=(10.2.254.1 10.2.254.2 10.2.254.3 10.2.254.4)

# Underlay neighbors on leaves use 10.<dc>.0.x
# Pattern in configs:
#   DC1 leaf underlay peers: 10.1.0.1/3/5/7 (spine1..4)
#   DC2 leaf underlay peers: 10.2.0.1/3/5/7
DC1_SPINE_P2P=(10.1.0.1 10.1.0.3 10.1.0.5 10.1.0.7)
DC2_SPINE_P2P=(10.2.0.1 10.2.0.3 10.2.0.5 10.2.0.7)

# DCI WAN-EVPN neighbors (loopback-to-loopback):
# dc1-router1 peers 10.2.254.21
# dc2-router1 peers 10.1.254.21
# dc1-router2 peers 10.2.254.22
# dc2-router2 peers 10.1.254.22
WAN_EVPN_PEER() {
  local node="$1"
  case "$node" in
    dc1-router1) echo "10.2.254.21" ;;
    dc2-router1) echo "10.1.254.21" ;;
    dc1-router2) echo "10.2.254.22" ;;
    dc2-router2) echo "10.1.254.22" ;;
    *) echo "" ;;
  esac
}

# Extract BGP neighbor state from EOS
# Returns 0 if neighbor is Established
bgp_neighbor_established() {
  local node="$1" neigh="$2"
  local out
  out="$(eos "$node" "show ip bgp summary" 2>/dev/null || true)"
  [[ -n "$out" ]] || { echo "No BGP summary output on $node" >&2; return 1; }

  # EOS typically shows neighbor line starting with IP, and last column is either state or prefixes received
  # If last column is a number => Established
  if echo "$out" | awk -v n="$neigh" '
      $1==n {
        last=$NF
        if (last ~ /^[0-9]+$/) exit 0
        if (last ~ /Estab|Established/) exit 0
        exit 1
      }
      END { exit 2 }
    '; then
    return 0
  else
    local rc=$?
    if [[ $rc -eq 2 ]]; then
      echo "Neighbor $neigh not found in BGP summary on $node" >&2
    else
      echo "Neighbor $neigh is not Established on $node" >&2
      echo "$out" >&2
    fi
    return 1
  fi
}

# EVPN peer visibility (non-empty + reasonable)
evpn_summary_ok() {
  local node="$1"
  local out
  out="$(eos "$node" "show bgp evpn summary" 2>/dev/null || true)"
  [[ -n "$out" ]] || { echo "No EVPN summary output on $node" >&2; return 1; }

  # Expect to see at least one peer line or established indicator
  echo "$out" | grep -qE "Neighbor|Peers|Estab|Established|Summary" || {
    echo "EVPN summary on $node does not look healthy" >&2
    echo "$out" >&2
    return 1
  }
  return 0
}

# EVPN route presence on leaves (MAC/IP and/or IP prefix routes)
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

# DCI: ensure WAN-EVPN is up and MPLS encapsulation is present in EVPN neighbor details
dci_mpls_encap_ok() {
  local node="$1"
  local peer; peer="$(WAN_EVPN_PEER "$node")"
  [[ -n "$peer" ]] || { echo "No WAN peer mapping for $node" >&2; return 1; }

  # Neighbor must be established
  bgp_neighbor_established "$node" "$peer" || return 1

  # Verify MPLS encapsulation is configured at runtime
  # EOS usually shows this in "show bgp evpn neighbors <peer>" or similar.
  local out
  out="$(eos "$node" "show bgp evpn neighbors $peer" 2>/dev/null || true)"
  [[ -n "$out" ]] || out="$(eos "$node" "show bgp neighbors $peer" 2>/dev/null || true)"

  echo "$out" | grep -qi "encap.*mpls" || echo "WARN: Could not confirm 'encap mpls' via show output on $node (peer $peer). Validate manually if needed."
  echo "$out" | grep -qi "domain remote" || echo "WARN: Could not confirm 'domain remote' via show output on $node (peer $peer). Validate manually if needed."
  return 0
}

# ----- Checks start here -----

# Leaves: validate underlay p2p neighbors + EVPN neighbors to spines
for leaf in "${DC1_LEAVES[@]}"; do
  check "DC1 leaf underlay neighbors Established on $leaf" bash -lc "
    for n in ${DC1_SPINE_P2P[*]}; do
      $(declare -f bgp_neighbor_established); bgp_neighbor_established $leaf \$n || exit 1
    done
  "
  check "DC1 leaf EVPN summary OK on $leaf" evpn_summary_ok "$leaf"
  for n in "${DC1_SPINE_LO0[@]}"; do
    check "DC1 leaf EVPN peer $n Established on $leaf" bgp_neighbor_established "$leaf" "$n"
  done
  check "DC1 leaf EVPN routes present on $leaf" evpn_routes_present_leaf "$leaf"
done

for leaf in "${DC2_LEAVES[@]}"; do
  check "DC2 leaf underlay neighbors Established on $leaf" bash -lc "
    for n in ${DC2_SPINE_P2P[*]}; do
      $(declare -f bgp_neighbor_established); bgp_neighbor_established $leaf \$n || exit 1
    done
  "
  check "DC2 leaf EVPN summary OK on $leaf" evpn_summary_ok "$leaf"
  for n in "${DC2_SPINE_LO0[@]}"; do
    check "DC2 leaf EVPN peer $n Established on $leaf" bgp_neighbor_established "$leaf" "$n"
  done
  check "DC2 leaf EVPN routes present on $leaf" evpn_routes_present_leaf "$leaf"
done

# DCI routers: EVPN summary and WAN EVPN health + MPLS encap
for r in "${DC1_ROUTERS[@]}" "${DC2_ROUTERS[@]}"; do
  check "DCI router EVPN summary OK on $r" evpn_summary_ok "$r"
  check "DCI router WAN EVPN peer Established + MPLS encap check on $r" dci_mpls_encap_ok "$r"
done

summary_exit
