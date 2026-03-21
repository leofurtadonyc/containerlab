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

export interface EvidenceConfidenceSummary {
  source_posture: "live_observed" | "persisted_fallback" | "empty_scaffold";
  evidence_kind:
    | "direct_observed"
    | "observed_plus_inferred"
    | "aggregate_only"
    | "aggregate_plus_bounded_records"
    | "unknown";
  confidence_posture:
    | "strong_for_current_slice"
    | "bounded_partial"
    | "degraded"
    | "blocked";
  freshness_posture: "current" | "stale" | "unknown";
  blocked_reason:
    | "none"
    | "collector_unavailable"
    | "collector_unavailable_and_no_persisted_snapshot"
    | "per_record_detail_unavailable"
    | "unknown";
  summary: string;
  notes: string[];
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

export type TopologyInferencePosture = "inferred" | "unknown";

export type TopologyCollectionPosture = "ok" | "degraded" | "blocked" | "unknown";

export type TopologyEndpointPairingPosture =
  | "paired"
  | "partially_paired"
  | "single_sided"
  | "unknown";

export type TopologyNodeParticipationPosture =
  | "fully_linked"
  | "partially_isolated"
  | "isolated_only"
  | "unknown";

export interface PlatformReadPathStatus {
  model_family: "inventory" | "topology" | "policy";
  observation_state: "ok" | "degraded" | "unreachable" | "unknown";
  configured_target_count: number;
  observed_target_count: number;
  collection_success_count: number;
  collection_partial_count: number;
  collection_failure_count: number;
  oldest_observed_at: string | null;
  newest_observed_at: string | null;
  policy_capable_target_count: number | null;
  detail_ready_target_count: number | null;
  inference_posture: TopologyInferencePosture | null;
  endpoint_pairing_posture: TopologyEndpointPairingPosture | null;
  collection_posture: TopologyCollectionPosture | null;
  node_participation_posture: TopologyNodeParticipationPosture | null;
  paired_link_count: number | null;
  single_sided_link_count: number | null;
  linked_node_count: number | null;
  isolated_node_count: number | null;
  degraded_scope_summary: string;
  summary: string;
  notes: string[];
}

export interface PlatformRecoveryPersistedArtifacts {
  inventory_snapshot: boolean;
  topology_snapshot: boolean;
  policy_snapshot: boolean;
  sync_history: boolean;
  readiness_snapshot: boolean;
}

export type PlatformRecoveryBaselinePosture =
  | "preserved_same_workspace_baseline"
  | "new_baseline";

export type PlatformRecoveryReadSidePosture =
  | "live_recollection_ready"
  | "degraded_with_persisted_baseline"
  | "degraded_without_persisted_baseline";

export interface PlatformRecoveryStatus {
  baseline_posture: PlatformRecoveryBaselinePosture;
  read_side_posture: PlatformRecoveryReadSidePosture;
  summary: string;
  persisted_artifacts: PlatformRecoveryPersistedArtifacts;
  notes: string[];
}

export interface PlatformStatusResponse extends ApiResponseMetadata {
  status: "ok";
  topology_name: "platform";
  summary: string;
  recovery: PlatformRecoveryStatus;
  components: PlatformComponentStatus[];
  read_paths?: PlatformReadPathStatus[];
}

export type CurrentRowPosture = "current" | "stale";

export interface DeviceRecord {
  device_id: string;
  vendor: string;
  platform: string;
  software_version: string | null;
  role: string | null;
  management_address: string;
  current_posture: CurrentRowPosture;
  collector_status: "ok" | "degraded" | "unreachable" | "unknown";
  last_recorded_collector_status: "ok" | "degraded" | "unreachable" | "unknown";
  capability_summary:
    | "supported"
    | "partially_supported"
    | "unsupported"
    | "unknown"
    | "not_implemented_in_platform";
  capability_detail: string;
}

export interface InventoryCurrentComparison {
  status: "unavailable" | "live_vs_latest_persisted_ready";
  summary: string;
  comparison_snapshot_id: string | null;
  comparison_persisted_at: string | null;
  current_device_count: number;
  persisted_device_count: number;
  device_count_delta: number;
  added_device_count: number;
  removed_device_count: number;
  changed_device_count: number;
  current_role_counts: Record<string, number>;
  persisted_role_counts: Record<string, number>;
  current_collector_status_counts: Record<string, number>;
  persisted_collector_status_counts: Record<string, number>;
  current_capability_summary_counts: Record<string, number>;
  persisted_capability_summary_counts: Record<string, number>;
  notes: string[];
}

export interface DevicesListResponse extends ApiResponseMetadata {
  data_status: "placeholder" | "integration_scaffold" | "live" | "degraded";
  serving_mode: "live_collector" | "persisted_fallback" | "empty_scaffold";
  evidence_confidence: EvidenceConfidenceSummary;
  summary: string;
  served_persisted_at: string | null;
  comparison_to_latest_persisted: InventoryCurrentComparison;
  history: InventoryHistoryWindow;
  count: number;
  items: DeviceRecord[];
}

export interface TopologyNodeRecord {
  node_id: string;
  display_name: string;
  role: string;
  current_posture: CurrentRowPosture;
  state: "up" | "down" | "degraded" | "unknown";
  last_recorded_state: "up" | "down" | "degraded" | "unknown";
  source: string;
  device_id: string | null;
  attributes: Record<string, string>;
}

export interface TopologyLinkRecord {
  link_id: string;
  source_node_id: string;
  target_node_id: string;
  current_posture: CurrentRowPosture;
  state: "up" | "down" | "degraded" | "unknown";
  last_recorded_state: "up" | "down" | "degraded" | "unknown";
  source: string;
  endpoint_pairing_state: "paired" | "single_sided" | "unknown";
  endpoint_evidence_count: number | null;
  attributes: Record<string, string>;
}

export interface TopologyCoverageSummaryRecord {
  inference_posture: TopologyInferencePosture;
  endpoint_pairing_posture: TopologyEndpointPairingPosture;
  collection_posture: TopologyCollectionPosture;
  node_participation_posture: TopologyNodeParticipationPosture;
  paired_link_count: number;
  single_sided_link_count: number;
  linked_node_count: number;
  isolated_node_count: number;
  summary: string;
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
  comparison_snapshot_id: string | null;
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
  evidence_confidence: EvidenceConfidenceSummary;
  summary: string;
  served_persisted_at: string | null;
  comparison_to_latest_persisted: TopologyComparisonSummary;
  history: TopologyHistoryWindow;
  coverage_summary: TopologyCoverageSummaryRecord;
  topology: TopologyRecord;
}

export interface CandidatePathRecord {
  name: string;
  current_posture: CurrentRowPosture;
  path_state: "active" | "inactive" | "unknown";
  last_recorded_path_state: "active" | "inactive" | "unknown";
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
  current_posture: CurrentRowPosture;
  intent_state: "declared" | "unknown";
  observed_state: "active" | "inactive" | "degraded" | "unknown";
  last_recorded_observed_state: "active" | "inactive" | "degraded" | "unknown";
  support_state:
    | "supported"
    | "partially_supported"
    | "unsupported"
    | "unknown"
    | "not_implemented_in_platform";
  health_state: "healthy" | "degraded" | "down" | "unknown";
  last_recorded_health_state: "healthy" | "degraded" | "down" | "unknown";
  source: string;
  notes: string[];
}

export interface PolicyTargetFootprintRecord {
  target_name: string;
  target_role: string | null;
  current_posture: CurrentRowPosture;
  collection_status: "success" | "failure" | "partial";
  last_recorded_collection_status: "success" | "failure" | "partial";
  policy_capable: boolean;
  observed_policy_count: number;
  active_policy_count: number;
  static_policy_count: number;
  static_local_policy_count: number;
  static_non_local_policy_count: number;
  bgp_policy_count: number;
  ttm_preference_count: number;
  binding_sid_count: number;
  srv6_binding_sid_count: number;
  detail_record_count: number;
  detail_blocker_reason:
    | "none"
    | "policy_capability_unavailable"
    | "no_policies_observed"
    | "per_policy_details_unavailable"
    | "partial_detail_coverage"
    | "collection_failed"
    | "collection_partial"
    | "not_recorded";
  notes: string[];
}

export type PolicyDetailSourceReadinessPosture =
  | "unknown"
  | "no_policies_observed"
  | "source_detail_unavailable"
  | "partially_ready"
  | "ready";

export interface PolicyDetailSourceReadinessRecord {
  posture: PolicyDetailSourceReadinessPosture;
  no_policies_observed_target_count: number;
  detail_unavailable_target_count: number;
  partial_detail_target_count: number;
}

export interface PolicyHistorySnapshotRecord {
  snapshot_id: string;
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
  detail_source_readiness_posture?: PolicyDetailSourceReadinessPosture;
  detail_ready_target_count?: number;
  no_policies_observed_target_count?: number;
  detail_unavailable_target_count?: number;
  partial_detail_target_count?: number;
}

export interface PolicyComparisonChangePreview {
  policy_id: string;
  policy_name: string;
  source_target: string;
  source_target_role: string | null;
  change_kind: "added" | "removed" | "changed";
  changed_fields: string[];
}

/** `/api/v1/devices` history: bounded device-level change preview between two persisted snapshots. */
export interface InventoryHistoryDeviceChangePreview {
  device_id: string;
  vendor: string;
  platform: string;
  role: string | null;
  change_kind: "added" | "removed" | "changed";
  changed_fields: string[];
}

/** Embedded inventory snapshot on workflow-history / audit-history items (aligned with devices history snapshot fields). */
export interface WorkflowInventorySnapshotSummary {
  snapshot_id: string;
  sync_run_id: string;
  persisted_at: string;
  observed_at: string | null;
  sync_source: string;
  sync_status: string;
  data_status: "live" | "degraded";
  source_endpoint: string;
  device_count: number;
  role_counts: Record<string, number>;
  collector_status_counts: Record<string, number>;
  capability_summary_counts: Record<string, number>;
}

export interface WorkflowInventorySnapshotComparison {
  current_snapshot_id: string;
  previous_snapshot_id: string;
  current_persisted_at: string;
  previous_persisted_at: string;
  current_observed_at: string | null;
  previous_observed_at: string | null;
  current_sync_status: string;
  previous_sync_status: string;
  current_data_status: "live" | "degraded";
  previous_data_status: "live" | "degraded";
  current_device_count: number;
  previous_device_count: number;
  device_count_delta: number;
  added_device_count: number;
  removed_device_count: number;
  changed_device_count: number;
  change_preview: InventoryHistoryDeviceChangePreview[];
  notes: string[];
}

export interface InventoryHistorySnapshotRecord {
  snapshot_id: string;
  sync_run_id: string;
  persisted_at: string;
  observed_at: string | null;
  sync_source: string;
  sync_status: string;
  data_status: "live" | "degraded";
  source_endpoint: string;
  device_count: number;
  role_counts: Record<string, number>;
  collector_status_counts: Record<string, number>;
  capability_summary_counts: Record<string, number>;
}

export interface InventoryHistoryComparison {
  current_snapshot_id: string;
  previous_snapshot_id: string;
  current_persisted_at: string;
  previous_persisted_at: string;
  current_observed_at: string | null;
  previous_observed_at: string | null;
  current_sync_status: string;
  previous_sync_status: string;
  current_data_status: "live" | "degraded";
  previous_data_status: "live" | "degraded";
  current_device_count: number;
  previous_device_count: number;
  device_count_delta: number;
  added_device_count: number;
  removed_device_count: number;
  changed_device_count: number;
  change_preview: InventoryHistoryDeviceChangePreview[];
  notes: string[];
}

export interface InventoryHistoryWindow {
  status: "unavailable" | "current_only" | "comparison_ready";
  summary: string;
  recent_snapshots: InventoryHistorySnapshotRecord[];
  comparison_to_previous: InventoryHistoryComparison | null;
}

export interface TopologyHistorySnapshotRecord {
  snapshot_id: string;
  persisted_at: string;
  observed_at: string | null;
  topology_name: string;
  sync_source: string;
  sync_status: "ok" | "degraded" | "failed" | "unknown";
  completeness: "complete" | "partial" | "unknown";
  node_count: number;
  link_count: number;
  node_state_counts: Record<string, number>;
  link_state_counts: Record<string, number>;
  inference_posture?: TopologyInferencePosture;
  endpoint_pairing_posture?: TopologyEndpointPairingPosture;
  collection_posture?: TopologyCollectionPosture;
  node_participation_posture?: TopologyNodeParticipationPosture;
  paired_link_count?: number;
  single_sided_link_count?: number;
  linked_node_count?: number;
  isolated_node_count?: number;
}

export interface TopologyHistoryComparison {
  current_snapshot_id: string;
  previous_snapshot_id: string;
  current_persisted_at: string;
  previous_persisted_at: string;
  current_node_count: number;
  previous_node_count: number;
  current_link_count: number;
  previous_link_count: number;
  node_count_delta: number;
  link_count_delta: number;
  added_node_count: number;
  removed_node_count: number;
  changed_node_count: number;
  added_link_count: number;
  removed_link_count: number;
  changed_link_count: number;
  notes: string[];
  current_inference_posture?: TopologyInferencePosture;
  previous_inference_posture?: TopologyInferencePosture;
  current_endpoint_pairing_posture?: TopologyEndpointPairingPosture;
  previous_endpoint_pairing_posture?: TopologyEndpointPairingPosture;
  current_collection_posture?: TopologyCollectionPosture;
  previous_collection_posture?: TopologyCollectionPosture;
  current_node_participation_posture?: TopologyNodeParticipationPosture;
  previous_node_participation_posture?: TopologyNodeParticipationPosture;
  current_paired_link_count?: number;
  previous_paired_link_count?: number;
  current_single_sided_link_count?: number;
  previous_single_sided_link_count?: number;
  current_linked_node_count?: number;
  previous_linked_node_count?: number;
  current_isolated_node_count?: number;
  previous_isolated_node_count?: number;
}

export interface TopologyHistoryWindow {
  status: "unavailable" | "current_only" | "comparison_ready";
  summary: string;
  recent_snapshots: TopologyHistorySnapshotRecord[];
  comparison_to_previous: TopologyHistoryComparison | null;
}

export interface PolicyHistoryComparison {
  current_snapshot_id: string;
  previous_snapshot_id: string;
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
  change_preview: PolicyComparisonChangePreview[];
  notes: string[];
  current_detail_source_readiness_posture?: PolicyDetailSourceReadinessPosture;
  previous_detail_source_readiness_posture?: PolicyDetailSourceReadinessPosture;
  current_detail_ready_target_count?: number;
  previous_detail_ready_target_count?: number;
  current_no_policies_observed_target_count?: number;
  previous_no_policies_observed_target_count?: number;
  current_detail_unavailable_target_count?: number;
  previous_detail_unavailable_target_count?: number;
  current_partial_detail_target_count?: number;
  previous_partial_detail_target_count?: number;
}

export interface PolicyHistoryWindow {
  status: "unavailable" | "current_only" | "comparison_ready";
  summary: string;
  recent_snapshots: PolicyHistorySnapshotRecord[];
  comparison_to_previous: PolicyHistoryComparison | null;
}

export interface PolicyCurrentComparison {
  status: "unavailable" | "current_vs_latest_persisted_ready";
  summary: string;
  comparison_snapshot_id: string | null;
  comparison_persisted_at: string | null;
  current_observed_at: string | null;
  current_observed_policy_count: number;
  persisted_observed_policy_count: number;
  current_detail_record_count: number;
  persisted_detail_record_count: number;
  observed_policy_delta: number;
  detail_record_delta: number;
  added_policy_count: number;
  removed_policy_count: number;
  changed_policy_count: number;
  change_preview: PolicyComparisonChangePreview[];
  notes: string[];
}

export interface PoliciesListResponse extends ApiResponseMetadata {
  data_status: "live" | "degraded";
  serving_mode: "live_collector" | "persisted_fallback" | "empty_scaffold";
  evidence_confidence: EvidenceConfidenceSummary;
  summary: string;
  served_persisted_at: string | null;
  sync_source: string;
  sync_status: "ok" | "degraded" | "failed" | "unknown";
  completeness: "complete" | "partial" | "unknown";
  detail_mode: "counters_only" | "static_policies_when_present" | "mixed" | "unknown";
  detail_source_readiness: PolicyDetailSourceReadinessRecord;
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
  target_footprints: PolicyTargetFootprintRecord[];
  comparison_to_latest_persisted: PolicyCurrentComparison;
  history: PolicyHistoryWindow;
  items: PolicyRecord[];
}

export interface WorkflowHistoryItem {
  workflow_id: string;
  sync_run_id: string;
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
  inventory_snapshot_summary: WorkflowInventorySnapshotSummary | null;
  inventory_comparison_to_previous: WorkflowInventorySnapshotComparison | null;
  topology_snapshot_summary: TopologyHistorySnapshotRecord | null;
  topology_comparison_to_previous: TopologyHistoryComparison | null;
  policy_snapshot_summary: PolicyHistorySnapshotRecord | null;
  policy_comparison_to_previous: PolicyHistoryComparison | null;
  notes: string[];
}

export interface HistoryBaselineSummary {
  baseline_posture: "preserved_same_workspace_baseline" | "new_baseline";
  summary: string;
  notes: string[];
}

export interface WorkflowHistoryResponse extends ApiResponseMetadata {
  data_status: "persisted_activity_history" | "empty";
  summary: string;
  baseline_summary: HistoryBaselineSummary;
  count: number;
  items: WorkflowHistoryItem[];
}

export interface AuditHistoryItem {
  event_id: string;
  event_type: "read_side_sync_recorded" | "readiness_snapshot_recorded";
  source: "app-api";
  actor: "platform_system";
  target_scope: string;
  result: "succeeded" | "failed" | "partial" | "unknown";
  correlation_id: string;
  sync_run_id: string | null;
  readiness_snapshot_id: string | null;
  occurred_at: string;
  message: string;
  inventory_snapshot_summary: WorkflowInventorySnapshotSummary | null;
  inventory_comparison_to_previous: WorkflowInventorySnapshotComparison | null;
  topology_snapshot_summary: TopologyHistorySnapshotRecord | null;
  topology_comparison_to_previous: TopologyHistoryComparison | null;
  policy_snapshot_summary: PolicyHistorySnapshotRecord | null;
  policy_comparison_to_previous: PolicyHistoryComparison | null;
  readiness_snapshot_summary: AuditReadinessSnapshotSummary | null;
  notes: string[];
}

export interface AuditReadinessSnapshotSummary {
  snapshot_id: string;
  persisted_at: string;
  readiness_status: string;
  planning_readiness: string;
  phase_recommendation: string;
  summary: string;
  blocker_count: number;
  strongest_blockers: string[];
}

export interface AuditHistoryResponse extends ApiResponseMetadata {
  data_status: "persisted_activity_history" | "empty";
  summary: string;
  baseline_summary: HistoryBaselineSummary;
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
  delivery_tier:
    | "delivered_read_only"
    | "bounded_partial_read_only"
    | "future_roadmap"
    | "out_of_scope";
  evidence_basis:
    | "live_validated"
    | "persisted_validated"
    | "platform_probe"
    | "design_review"
    | "roadmap_only";
  vendor_posture:
    | "current_nokia_focus"
    | "future_juniper_target"
    | "future_multi_vendor_candidate";
  availability_scope: string;
  status_detail: string;
  caveats: string[];
  source_of_determination: string;
  workflow_readiness_status:
    | "supports_planning"
    | "partial_foundation"
    | "blocked"
    | "roadmap_only"
    | "context_only";
  workflow_readiness_scopes: Array<
    | "planning_depth"
    | "preview_contracts"
    | "validation_contracts"
    | "workflow_audit_relationships"
    | "phase_transition"
  >;
  workflow_readiness_detail: string;
  related_readiness_blockers: Array<
    | "workflow_lifecycle_contract_missing"
    | "dry_run_contract_missing"
    | "validation_result_contract_missing"
    | "topology_truth_still_bounded"
    | "policy_truth_still_bounded"
    | "history_still_sync_derived"
  >;
}

export type CapabilityRecordIdentityTuple = Pick<
  CapabilityRecord,
  "vendor" | "platform" | "domain" | "feature" | "version_scope"
>;

export interface DryRunReadinessPrerequisite {
  item_id?: string | null;
  prerequisite:
    | "inventory_read_model"
    | "topology_comparison_evidence"
    | "policy_comparison_evidence"
    | "workflow_audit_visibility"
    | "capability_matrix_precision";
  status: "ready" | "partial" | "not_ready";
  support_posture:
    | "supported"
    | "partially_supported"
    | "unsupported"
    | "unknown"
    | "not_implemented_in_platform";
  evidence_basis:
    | "live_validated"
    | "persisted_validated"
    | "platform_probe"
    | "design_review"
    | "roadmap_only";
  evidence_coverage: "strong" | "bounded" | "partial" | "blocked";
  related_capabilities: string[];
  current_evidence: string;
  blocking_gaps: string[];
}

export interface DryRunReadinessBlocker {
  item_id?: string | null;
  blocker:
    | "workflow_lifecycle_contract_missing"
    | "dry_run_contract_missing"
    | "validation_result_contract_missing"
    | "topology_truth_still_bounded"
    | "policy_truth_still_bounded"
    | "history_still_sync_derived";
  category: "contract" | "truth" | "history";
  severity: "critical" | "major";
  evidence_basis:
    | "live_validated"
    | "persisted_validated"
    | "platform_probe"
    | "design_review"
    | "roadmap_only";
  summary: string;
  blocked_readiness_scopes: Array<
    | "planning_depth"
    | "preview_contracts"
    | "validation_contracts"
    | "workflow_audit_relationships"
    | "phase_transition"
  >;
  related_prerequisites: Array<
    | "inventory_read_model"
    | "topology_comparison_evidence"
    | "policy_comparison_evidence"
    | "workflow_audit_visibility"
    | "capability_matrix_precision"
  >;
  notes: string[];
}

export interface DryRunReadinessAssessmentArea {
  item_id?: string | null;
  area:
    | "model_maturity"
    | "history_maturity"
    | "comparison_maturity"
    | "capability_maturity"
    | "blocker_maturity";
  status: "strong_for_planning" | "mixed" | "blocked";
  summary: string;
  strongest_gaps: string[];
}

export interface DryRunReadinessSummary {
  status: "foundation_strengthening" | "bounded_readiness_support";
  planning_readiness: "readiness_planning_supported" | "more_foundation_needed";
  phase_recommendation: "remain_phase_2_read_only_foundation";
  summary: string;
  readiness_scope: string;
  notes: string[];
  strongest_blockers: string[];
  bounded_next_steps: string[];
  evidence_coverage_counts: Record<string, number>;
  support_posture_counts: Record<string, number>;
  blocker_category_counts: Record<string, number>;
  blocker_severity_counts: Record<string, number>;
  blocked_scope_counts: Record<string, number>;
  assessment_areas: DryRunReadinessAssessmentArea[];
  blockers: DryRunReadinessBlocker[];
  prerequisites: DryRunReadinessPrerequisite[];
}

export interface CapabilitiesListResponse extends ApiResponseMetadata {
  data_status: "placeholder" | "bounded_matrix";
  summary: string;
  count: number;
  readiness_snapshot_id?: string | null;
  readiness_persisted_at?: string | null;
  domain_counts: Record<string, number>;
  support_counts: Record<string, number>;
  implementation_counts: Record<string, number>;
  delivery_tier_counts: Record<string, number>;
  evidence_basis_counts: Record<string, number>;
  vendor_counts: Record<string, number>;
  vendor_posture_counts: Record<string, number>;
  workflow_readiness_counts: Record<string, number>;
  workflow_readiness_scope_counts: Record<string, number>;
  dry_run_readiness?: DryRunReadinessSummary;
  items: CapabilityRecord[];
}
