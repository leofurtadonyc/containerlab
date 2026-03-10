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

export interface TopologyResponse extends ApiResponseMetadata {
  data_status: "normalized_scaffold" | "live" | "degraded";
  summary: string;
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
