# Direct backend API. If you prefer the WebUI proxy, use:
# API_BASE=http://127.0.0.1:8088
API_BASE=http://127.0.0.1:8000

# Basic reachability and overall read-path posture
curl -fsS "$API_BASE/api/v1/health" | jq .
curl -fsS "$API_BASE/api/v1/platform/status" | jq .

# Full inventory/device surface
curl -fsS "$API_BASE/api/v1/devices" | jq .
curl -fsS "$API_BASE/api/v1/devices" | jq '.items[]'

# Inventory metadata only: serving mode, evidence posture, persisted comparison
curl -fsS "$API_BASE/api/v1/devices" | jq '{
  data_status,
  serving_mode,
  evidence_confidence,
  summary,
  served_persisted_at,
  comparison_to_latest_persisted,
  count
}'

# Full topology surface
curl -fsS "$API_BASE/api/v1/topology" | jq .
curl -fsS "$API_BASE/api/v1/topology" | jq '.topology.nodes[]'
curl -fsS "$API_BASE/api/v1/topology" | jq '.topology.links[]'

# Topology trust/coverage metadata
curl -fsS "$API_BASE/api/v1/topology" | jq '{
  data_status,
  serving_mode,
  evidence_confidence,
  coverage_summary,
  comparison_to_latest_persisted,
  topology_meta: {
    topology_id: .topology.topology_id,
    topology_name: .topology.topology_name,
    sync_source: .topology.sync_source,
    sync_status: .topology.sync_status,
    completeness: .topology.completeness,
    observed_at: .topology.observed_at,
    notes: .topology.notes
  }
}'

# Full policies surface
curl -fsS "$API_BASE/api/v1/policies" | jq .
curl -fsS "$API_BASE/api/v1/policies" | jq '.items[]'
curl -fsS "$API_BASE/api/v1/policies" | jq '.target_footprints[]'

# Policy posture, history, and persisted-comparison context
curl -fsS "$API_BASE/api/v1/policies" | jq '{
  data_status,
  serving_mode,
  evidence_confidence,
  summary,
  sync_source,
  sync_status,
  completeness,
  detail_mode,
  empty_reason,
  observed_at,
  observed_target_count,
  policy_capable_target_count,
  observed_policy_count,
  active_policy_count,
  static_policy_count,
  static_local_policy_count,
  static_non_local_policy_count,
  bgp_policy_count,
  ttm_preference_count,
  binding_sid_count,
  srv6_binding_sid_count,
  comparison_to_latest_persisted,
  history,
  notes
}'