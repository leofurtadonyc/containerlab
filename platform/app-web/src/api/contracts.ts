export interface ApiResponseMetadata {
  service: "app-api";
  version: string;
  phase: "phase_2_read_only_foundation";
  generated_at: string;
}

export interface ErrorDetail {
  field: string | null;
  issue: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details: ErrorDetail[];
  request_id: string;
}

export interface PlatformComponentStatus {
  name: string;
  role: string;
  lifecycle_state: "declared";
  observation_state: "not_checked" | "ok" | "degraded" | "unreachable" | "unknown";
  observation_source: string | null;
  observation_summary: string | null;
  observed_capabilities: string[];
  notes: string[];
}

export interface PlatformStatusResponse extends ApiResponseMetadata {
  status: "ok";
  topology_name: "platform";
  summary: string;
  components: PlatformComponentStatus[];
}

export interface DeviceRecord {
  device_id: string;
  vendor: string;
  platform: string;
  software_version: string | null;
  role: string | null;
  management_address: string;
  collector_status: "ok" | "degraded" | "unreachable" | "unknown";
  capability_summary:
    | "supported"
    | "partially_supported"
    | "unsupported"
    | "unknown"
    | "not_implemented_in_platform";
  capability_detail: string;
}

export interface DevicesListResponse extends ApiResponseMetadata {
  data_status: "placeholder" | "integration_scaffold" | "live" | "degraded";
  summary: string;
  count: number;
  items: DeviceRecord[];
}

export interface TopologyNodeRecord {
  node_id: string;
  display_name: string;
  role: string;
  state: "up" | "down" | "degraded" | "unknown";
  source: string;
  device_id: string | null;
  attributes: Record<string, string>;
}

export interface TopologyLinkRecord {
  link_id: string;
  source_node_id: string;
  target_node_id: string;
  state: "up" | "down" | "degraded" | "unknown";
  source: string;
  attributes: Record<string, string>;
}

export interface TopologyRecord {
  topology_id: string;
  topology_name: string;
  nodes: TopologyNodeRecord[];
  links: TopologyLinkRecord[];
  sync_source: string;
  sync_status: "ok" | "degraded" | "failed" | "unknown";
  completeness: "complete" | "partial" | "unknown";
  observed_at: string | null;
  notes: string[];
}

export interface TopologyComparisonSummary {
  status: "unavailable" | "live_vs_latest_persisted_ready";
  summary: string;
  comparison_persisted_at: string | null;
  current_observed_at: string | null;
  current_node_count: number;
  persisted_node_count: number;
  current_link_count: number;
  persisted_link_count: number;
  node_count_delta: number;
  link_count_delta: number;
  added_node_count: number;
  removed_node_count: number;
  changed_node_count: number;
  added_link_count: number;
  removed_link_count: number;
  changed_link_count: number;
  notes: string[];
}

export interface TopologyResponse extends ApiResponseMetadata {
  data_status: "normalized_scaffold" | "live" | "degraded";
  serving_mode: "live_collector" | "persisted_fallback" | "empty_scaffold";
  summary: string;
  served_persisted_at: string | null;
  comparison_to_latest_persisted: TopologyComparisonSummary;
  topology: TopologyRecord;
}

export interface CandidatePathRecord {
  name: string;
  path_state: "active" | "inactive" | "unknown";
  preference: number | null;
  notes: string[];
}

export interface PolicyRecord {
  policy_id: string;
  policy_name: string;
  policy_type: "static_local" | "static_non_local" | "unknown";
  headend: string;
  endpoint: string;
  color: number;
  source_target: string;
  source_target_role: string | null;
  candidate_paths: CandidatePathRecord[];
  intent_state: "declared" | "unknown";
  observed_state: "active" | "inactive" | "degraded" | "unknown";
  support_state:
    | "supported"
    | "partially_supported"
    | "unsupported"
    | "unknown"
    | "not_implemented_in_platform";
  health_state: "healthy" | "degraded" | "down" | "unknown";
  source: string;
  notes: string[];
}

export interface PolicyHistorySnapshotRecord {
  persisted_at: string;
  observed_at: string | null;
  data_status: "live" | "degraded";
  sync_source: string;
  sync_status: "ok" | "degraded" | "failed" | "unknown";
  completeness: "complete" | "partial" | "unknown";
  detail_mode: "counters_only" | "static_policies_when_present" | "mixed" | "unknown";
  empty_reason:
    | "none"
    | "no_policies_observed"
    | "per_policy_details_unavailable"
    | "collector_unavailable";
  observed_policy_count: number;
  active_policy_count: number;
  detail_record_count: number;
}

export interface PolicyHistoryComparison {
  current_persisted_at: string;
  previous_persisted_at: string;
  current_observed_policy_count: number;
  previous_observed_policy_count: number;
  current_detail_record_count: number;
  previous_detail_record_count: number;
  observed_policy_delta: number;
  detail_record_delta: number;
  added_policy_count: number;
  removed_policy_count: number;
  changed_policy_count: number;
  notes: string[];
}

export interface PolicyHistoryWindow {
  status: "unavailable" | "current_only" | "comparison_ready";
  summary: string;
  recent_snapshots: PolicyHistorySnapshotRecord[];
  comparison_to_previous: PolicyHistoryComparison | null;
}

export interface PoliciesListResponse extends ApiResponseMetadata {
  data_status: "live" | "degraded";
  summary: string;
  sync_source: string;
  sync_status: "ok" | "degraded" | "failed" | "unknown";
  completeness: "complete" | "partial" | "unknown";
  detail_mode: "counters_only" | "static_policies_when_present" | "mixed" | "unknown";
  empty_reason:
    | "none"
    | "no_policies_observed"
    | "per_policy_details_unavailable"
    | "collector_unavailable";
  observed_at: string | null;
  observed_target_count: number;
  policy_capable_target_count: number;
  observed_target_role_counts: Record<string, number>;
  policy_capable_target_role_counts: Record<string, number>;
  observed_policy_count: number;
  active_policy_count: number;
  static_policy_count: number;
  static_local_policy_count: number;
  static_non_local_policy_count: number;
  bgp_policy_count: number;
  ttm_preference_count: number;
  binding_sid_count: number;
  srv6_binding_sid_count: number;
  count: number;
  notes: string[];
  history: PolicyHistoryWindow;
  items: PolicyRecord[];
}

export interface WorkflowHistoryItem {
  workflow_id: string;
  workflow_type: "read_side_sync";
  workflow_name: string;
  scope: string;
  status: "completed" | "partial" | "failed" | "unknown";
  source_type: string;
  source_endpoint: string;
  record_count: number;
  observed_at: string | null;
  started_at: string;
  finished_at: string;
  persisted_artifacts: string[];
  policy_snapshot_summary: PolicyHistorySnapshotRecord | null;
  policy_comparison_to_previous: PolicyHistoryComparison | null;
  notes: string[];
}

export interface WorkflowHistoryResponse extends ApiResponseMetadata {
  data_status: "persisted_activity_history" | "empty";
  summary: string;
  count: number;
  items: WorkflowHistoryItem[];
}

export interface AuditHistoryItem {
  event_id: string;
  event_type: "read_side_sync_recorded";
  source: "app-api";
  actor: "platform_system";
  target_scope: string;
  result: "succeeded" | "failed" | "partial" | "unknown";
  correlation_id: string;
  occurred_at: string;
  message: string;
  policy_snapshot_summary: PolicyHistorySnapshotRecord | null;
  policy_comparison_to_previous: PolicyHistoryComparison | null;
  notes: string[];
}

export interface AuditHistoryResponse extends ApiResponseMetadata {
  data_status: "persisted_activity_history" | "empty";
  summary: string;
  count: number;
  items: AuditHistoryItem[];
}

export interface CapabilityRecord {
  vendor: string;
  platform: string;
  version_scope: string | null;
  domain:
    | "inventory"
    | "topology"
    | "policy"
    | "platform_health"
    | "workflow_history"
    | "audit_history";
  feature: string;
  support_status:
    | "supported"
    | "partially_supported"
    | "unsupported"
    | "unknown"
    | "not_implemented_in_platform";
  implementation_status: "planned" | "placeholder" | "partial" | "implemented";
  availability_scope: string;
  status_detail: string;
  caveats: string[];
  source_of_determination: string;
}

export interface CapabilitiesListResponse extends ApiResponseMetadata {
  data_status: "placeholder" | "bounded_matrix";
  summary: string;
  count: number;
  support_counts: Record<string, number>;
  implementation_counts: Record<string, number>;
  items: CapabilityRecord[];
}
