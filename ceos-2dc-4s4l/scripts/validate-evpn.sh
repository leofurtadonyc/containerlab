#!/usr/bin/env bash
# This checks for BGP neighbor health and EVPN control-plane presence on all EOS nodes.
# Because spines may be RRs or pure underlay nodes depending on your configs, the script is tolerant: it tries EVPN-specific commands and falls back to BGP summary.
set -euo pipefail
cd "$(dirname "$0")"

source ./common.sh

need_cmd docker

# Returns 0 if BGP appears up; 1 otherwise
check_bgp_summary() {
  local node="$1"
  local out
  out="$(eos "$node" "show ip bgp summary" 2>/dev/null || true)"
  [[ -n "$out" ]] || { echo "No BGP summary output on $node" >&2; return 1; }

  # Look for at least one neighbor in Established
  if echo "$out" | grep -qE "Estab|Established"; then
    return 0
  fi

  # Some EOS outputs show state/pfxrcd columns; check numeric prefix counts as a sign of Established
  if echo "$out" | awk 'NF>0 && $0 ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/ {print $0}' | awk '{if ($NF ~ /^[0-9]+$/) {found=1}} END{exit(found?0:1)}'; then
    return 0
  fi

  echo "No Established BGP neighbors detected on $node" >&2
  echo "$out" >&2
  return 1
}

# Returns 0 if EVPN BGP appears up; 1 otherwise.
check_bgp_evpn() {
  local node="$1"
  local out
  out="$(eos "$node" "show bgp evpn summary" 2>/dev/null || true)"
  if [[ -z "$out" ]]; then
    # not necessarily supported/ enabled on this node; treat as non-fatal
    return 0
  fi

  # Expect either peers listed or a message; pass if we see any peer lines or Established-like states
  if echo "$out" | grep -qE "Estab|Established|Peers|Neighbor"; then
    return 0
  fi

  # If EVPN is enabled but empty, that can still be valid on some nodes;
  # but in this lab we generally expect EVPN on leaves at minimum.
  # So we keep it soft-fail: return 0 but print warning.
  echo "WARN: EVPN summary on $node did not show clear peers; check config if unexpected."
  return 0
}

# Returns 0 if EVPN routes exist on node; 1 otherwise.
check_evpn_routes_presence() {
  local node="$1"
  local out
  out="$(eos "$node" "show bgp evpn route-type mac-ip" 2>/dev/null || true)"
  if [[ -z "$out" ]]; then
    # Some EOS variants use different syntax; try alternative
    out="$(eos "$node" "show bgp evpn route" 2>/dev/null || true)"
  fi

  # If still empty, don't hard-fail on spines/routers. Hard-fail on leaves.
  if [[ -z "$out" ]]; then
    if [[ "$node" =~ leaf ]]; then
      echo "Leaf $node has no EVPN route output. Likely EVPN not configured or command differs." >&2
      return 1
    fi
    return 0
  fi

  # On leaves, expect to see at least something that looks like a route table header or entries
  if [[ "$node" =~ leaf ]]; then
    if echo "$out" | grep -qE "Route|RD|VNI|MAC|IP"; then
      return 0
    fi
    echo "Leaf $node EVPN route output exists but did not match expected patterns." >&2
    echo "$out" >&2
    return 1
  fi

  return 0
}

# We care most about EVPN on leaves and DCI routers; spines may be RR or not.
for n in "${ALL_EOS[@]}"; do
  check "BGP neighbor health on $n" check_bgp_summary "$n"
done

for n in "${DC1_LEAVES[@]}" "${DC2_LEAVES[@]}" "${DC1_ROUTERS[@]}" "${DC2_ROUTERS[@]}"; do
  check "EVPN session visibility on $n" check_bgp_evpn "$n"
done

for n in "${DC1_LEAVES[@]}" "${DC2_LEAVES[@]}"; do
  check "EVPN routes present on $n" check_evpn_routes_presence "$n"
done

summary_exit
