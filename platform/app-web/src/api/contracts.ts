export interface ApiResponseMetadata {
  service: "app-api";
  version: string;
  phase: "phase_2_read_only_foundation";
  generated_at: string;
}

/**
 * Phase 2 bounded query echo: devices/policies use `limit` + `history_recent_limit`;
 * workflow/audit history use `limit` on `items` plus source load limits (`sync_runs_limit`,
 * and for audit, `readiness_snapshot_history_limit`). Fields are `null` when not applicable.
 */
export interface ReadSideQueryEcho {
  limit_requested: number | null;
  items_total: number;
  items_returned: number;
  history_recent_limit_requested: number | null;
  history_recent_limit_effective: number | null;
  history_recent_snapshots_returned: number | null;
  sync_runs_limit_requested: number | null;
  sync_runs_limit_effective: number | null;
  readiness_snapshot_history_limit_requested: number | null;
  readiness_snapshot_history_limit_effective: number | null;
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
  read_side_query: ReadSideQueryEcho;
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

export type DegradedPolicyV1ReasonCode =
  | "intent_declared_observed_not_active"
  | "persisted_row_stale"
  | "partial_or_unsupported_support_posture"
  | "health_not_healthy"
  | "no_active_candidate_path_when_paths_present";

/** Bounded read-side degraded-policy interpretation (`contract_id: degraded_policy_v1`). */
export interface DegradedPolicyV1Classification {
  contract_id: "degraded_policy_v1";
  posture: "ok" | "degraded" | "unknown";
  reason_codes: DegradedPolicyV1ReasonCode[];
  confidence: "low" | "medium";
  summary: string;
  explicit_non_claims: string[];
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
  degraded_policy_v1: DegradedPolicyV1Classification;
}

/** Bounded read-only path analysis (`GET /api/v1/policies/{policy_id}/path-analysis`). */
export type PathEvidenceDomain =
  | "devices"
  | "topology"
  | "policies"
  | "platform_status"
  | "odl_controller_probe"
  | "workflow_history"
  | "audit_history"
  | "unknown";

export interface PathEvidenceAttribution {
  domain: PathEvidenceDomain;
  reference: string;
}

export type PathAnalysisAuthorityPosture =
  | "interpretation_support_only"
  | "read_only_assembly_non_authoritative";

export type PathAnalysisExplicitNonClaim =
  | "not_validation_verdict"
  | "not_drift_engine_result"
  | "not_safe_to_change_recommendation"
  | "not_workflow_execution_or_authorization"
  | "not_dry_run_execution"
  | "not_dataplane_forwarding_truth"
  | "not_traffic_engineering_resolution_truth"
  | "not_per_hop_label_stack_verification"
  | "not_controller_computed_path_truth"
  | "not_odl_substitute_for_gnmi_collector_read_paths"
  | "not_cross_domain_completeness_guarantee"
  | "not_implied_forwarding_equivalence";

export interface PathAnalysisSafetyFraming {
  contract_id: string;
  authority_posture: PathAnalysisAuthorityPosture;
  explicit_non_claims: PathAnalysisExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface PathAnalysisSubject {
  anchor_kind: "policy";
  policy_id: string;
  policy_name: string;
  policy_type: "static_local" | "static_non_local" | "unknown";
  color: number;
  headend: string;
  endpoint: string;
  source_target: string;
}

export type IntendedPathHintKind =
  | "policy_intent_endpoints"
  | "policy_declared_candidate"
  | "unknown";

export interface IntendedPathHint {
  hint_id: string;
  kind: IntendedPathHintKind;
  summary: string;
  evidence_sources: PathEvidenceAttribution[];
}

export type ObservedPathHintKind =
  | "policy_observed_state"
  | "policy_candidate_path_state"
  | "topology_context_only"
  | "inventory_context_only"
  | "unknown";

export interface ObservedPathHint {
  hint_id: string;
  kind: ObservedPathHintKind;
  summary: string;
  candidate_path_name: string | null;
  observed_path_state: "active" | "inactive" | "unknown" | null;
  evidence_sources: PathEvidenceAttribution[];
  notes: string[];
}

export interface PathAnalysisCandidatePathSummary {
  name: string;
  current_posture: CurrentRowPosture;
  path_state: "active" | "inactive" | "unknown";
  last_recorded_path_state: "active" | "inactive" | "unknown";
  preference: number | null;
  notes: string[];
}

export interface PathAnalysisFreshness {
  assembly_generated_at: string;
  policy_snapshot_observed_at: string | null;
  topology_snapshot_observed_at: string | null;
  inventory_snapshot_observed_at: string | null;
  serving_mode_echo: "live" | "persisted_fallback" | "mixed" | "unknown" | null;
}

export type PathAnalysisCaveatCode =
  | "topology_partial"
  | "policy_detail_partial"
  | "no_dataplane_evidence"
  | "inferred_topology_links"
  | "odl_probe_only"
  | "persisted_fallback_stale_row"
  | "unknown";

export interface PathAnalysisCaveat {
  code: PathAnalysisCaveatCode;
  message: string;
}

export type PathAnalysisTruthAlignmentPosture =
  | "intended_vs_observed_aligned"
  | "uncertain"
  | "contradictory"
  | "insufficient_evidence";

export interface PathAnalysisTruthAlignment {
  posture: PathAnalysisTruthAlignmentPosture;
  summary: string;
}

export interface PathAnalysisViewResponse {
  metadata: ApiResponseMetadata;
  safety_framing: PathAnalysisSafetyFraming;
  subject: PathAnalysisSubject;
  intended_path_hints: IntendedPathHint[];
  observed_path_hints: ObservedPathHint[];
  candidate_path_summaries: PathAnalysisCandidatePathSummary[];
  evidence_sources: PathEvidenceAttribution[];
  freshness: PathAnalysisFreshness;
  truth_alignment: PathAnalysisTruthAlignment;
  caveats: PathAnalysisCaveat[];
}

/** `GET /api/v1/topology/objects/{object_id}/related-policies` (bounded string-equality pivot). */
export type TopologyObjectKind = "node" | "link";

export type RelatedPolicyMatchedField = "headend" | "endpoint" | "source_target";

export type RelatedPolicyRelationshipKind =
  | "policy_field_matches_node_identifier"
  | "policy_field_matches_link_endpoint_identifier";

export interface TopologyRelatedPolicyReference {
  policy_id: string;
  policy_name: string;
  policy_type: "static_local" | "static_non_local" | "unknown";
  relationship_kind: RelatedPolicyRelationshipKind;
  matched_field: RelatedPolicyMatchedField;
  matched_policy_value: string;
  matched_topology_identifier: string;
  anchor_topology_node_id: string;
  evidence_source: string;
  caveats: string[];
}

export interface TopologyObjectRelatedPoliciesResponse {
  metadata: ApiResponseMetadata;
  object_kind: TopologyObjectKind;
  object_id: string;
  derivation_summary: string;
  global_caveats: string[];
  items: TopologyRelatedPolicyReference[];
}

export type FailureImpactExplicitNonClaim =
  | "not_blast_radius_or_dependency_truth"
  | "not_dataplane_or_te_impact_truth"
  | "not_graph_simulation"
  | "not_validation_or_safe_change_authority"
  | "not_sla_or_availability_guarantee"
  | "not_replace_controller_computed_truth"
  | "not_global_policy_health_proxy";

export interface FailureImpactSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only" | "read_only_assembly_non_authoritative";
  explicit_non_claims: FailureImpactExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface FailureImpactSubject {
  kind: TopologyObjectKind;
  object_id: string;
}

export interface FailureImpactRollupCounts {
  related_policies_total: number;
  degraded_related_policies_total: number;
  non_degraded_related_policies_total: number;
  related_policies_path_analysis_supported_total: number;
}

export interface FailureImpactDegradedPostureBreakdown {
  ok: number;
  degraded: number;
  unknown: number;
}

export interface FailureImpactFreshness {
  assembly_generated_at: string;
  policy_inventory_observed_at: string | null;
  topology_snapshot_observed_at: string | null;
  policy_inventory_empty_reason: string | null;
  policy_serving_mode_echo: string;
}

/** `GET /api/v1/topology/objects/{object_id}/failure-impact` (bounded evidence rollup; not blast radius). */
export interface FailureImpactViewResponse {
  metadata: ApiResponseMetadata;
  contract_id: "failure_impact_v1";
  safety_framing: FailureImpactSafetyFraming;
  subject: FailureImpactSubject;
  rollup_counts: FailureImpactRollupCounts;
  degraded_posture_breakdown: FailureImpactDegradedPostureBreakdown;
  freshness: FailureImpactFreshness;
  caveats: string[];
  missing_evidence_notes: string[];
}

export type MaintenancePreviewContext =
  | "planning_window"
  | "topology_drilldown"
  | "change_adjacent"
  | "explicit_subject";

export type MaintenancePreviewExplicitNonClaim =
  | "not_simulation_or_what_if_traffic_engine"
  | "not_blast_radius_or_dependency_completeness"
  | "not_safe_to_change_risk_scoring_or_approval"
  | "not_maintenance_approval_or_change_control_authority"
  | "not_traffic_or_protection_guarantee"
  | "not_sla_or_availability_entitlement"
  | "not_dataplane_forwarding_or_te_path_proof"
  | "not_substitute_for_full_failure_impact_service_explorer_or_explainability_panels"
  | "not_grafana_or_prometheus_business_truth"
  | "not_operator_sign_off_or_audit_readiness";

export interface MaintenancePreviewSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only";
  explicit_non_claims: MaintenancePreviewExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface MaintenanceSubjectSummary {
  object_kind: TopologyObjectKind;
  object_id: string;
  display_name: string;
  source_node_id: string | null;
  target_node_id: string | null;
}

export interface MaintenanceExplainabilityPointer {
  policy_id: string;
  policies_explainability_path: string;
  policies_path_analysis_path: string;
}

export interface MaintenanceTopologyImpactSection {
  coverage_summary: TopologyCoverageSummaryRecord;
  topology_snapshot_observed_at: string | null;
  dossier_path: string;
}

/** `GET /api/v1/maintenance-preview` — reuse-only assembly; not approval or simulation. */
export interface MaintenancePreviewResponse {
  metadata: ApiResponseMetadata;
  contract_id: "maintenance_preview_v1";
  safety_framing: MaintenancePreviewSafetyFraming;
  preview_context: MaintenancePreviewContext;
  source_contract_ids: string[];
  subject: MaintenanceSubjectSummary;
  sparse_preview: boolean;
  sparse_reasons: string[];
  related_policies: TopologyObjectRelatedPoliciesResponse;
  failure_impact: FailureImpactViewResponse;
  related_services: ServiceListRow[];
  related_services_total: number;
  related_services_truncated: boolean;
  topology_impact: MaintenanceTopologyImpactSection;
  explainability_pointers: MaintenanceExplainabilityPointer[];
  recommended_pivots: string[];
  assembly_caveats: string[];
}

export type TopologyRiskSummaryExplicitNonClaim =
  | "not_sla_or_service_risk_truth"
  | "not_traffic_or_dataplane_risk_truth"
  | "not_failure_probability"
  | "not_validated_blast_radius"
  | "not_optimization_engine"
  | "not_global_policy_health_ranking"
  | "not_validation_or_safe_change_authority"
  | "not_replace_per_object_failure_impact";

export interface TopologyRiskSummarySafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only" | "read_only_assembly_non_authoritative";
  explicit_non_claims: TopologyRiskSummaryExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface TopologyRiskSummaryRankingInputs {
  degraded_related_count: number;
  unknown_related_count: number;
  related_policy_breadth: number;
  ok_related_count: number;
}

export interface TopologyRiskSummaryRow {
  rank_index: number;
  object_kind: TopologyObjectKind;
  object_id: string;
  ranking_inputs: TopologyRiskSummaryRankingInputs;
  degraded_posture_breakdown: FailureImpactDegradedPostureBreakdown;
}

export interface TopologyRiskSummaryFreshness {
  assembly_generated_at: string;
  policy_inventory_observed_at: string | null;
  topology_snapshot_observed_at: string | null;
  policy_inventory_empty_reason: string | null;
  policy_serving_mode_echo: string;
}

/** `GET /api/v1/topology/risk-summary` (attention ranking from related policies + degraded v1; not SLA/traffic risk). */
export interface TopologyRiskSummaryResponse {
  metadata: ApiResponseMetadata;
  contract_id: "topology_risk_summary_v1";
  ranking_basis: string;
  safety_framing: TopologyRiskSummarySafetyFraming;
  assembly_confidence: "low" | "medium";
  ranked_objects: TopologyRiskSummaryRow[];
  total_objects: number;
  freshness: TopologyRiskSummaryFreshness;
  caveats: string[];
  missing_evidence_notes: string[];
}

/** `GET /api/v1/topology/objects/{object_id}/dossier` (composed read-only briefing; not blast radius or workflow). */
export interface TopologyObjectIdentitySection {
  object_kind: TopologyObjectKind;
  object_id: string;
  display_label: string;
  identity_detail_lines: string[];
}

export interface TopologyRiskAttentionSection {
  ranking_basis: string;
  row: TopologyRiskSummaryRow | null;
  risk_row_gap_note: string | null;
}

export interface TopologyObjectDossierDegradedRelatedPreviewItem {
  policy_id: string;
  policy_name: string;
  degraded_policy_v1: DegradedPolicyV1Classification;
}

export interface TopologyObjectDossierNavigationTargets {
  investigation_shell_params: Record<string, string>;
  situation_room_shell_params: Record<string, string>;
  topology_shell_params: Record<string, string>;
  related_policy_ids_for_policies_view: string[];
}

export interface TopologyObjectDossierFreshnessBlock {
  dossier_assembled_at: string;
  policy_inventory_observed_at: string | null;
  topology_snapshot_observed_at: string | null;
  policy_inventory_empty_reason: string | null;
  policy_serving_mode_echo: string;
  topology_risk_summary_assembly_generated_at: string | null;
}

export interface TopologyObjectDossierResponse {
  metadata: ApiResponseMetadata;
  contract_id: "topology_object_dossier_v1";
  object_identity: TopologyObjectIdentitySection;
  topology_posture_summary_lines: string[];
  failure_impact: FailureImpactViewResponse;
  risk_attention: TopologyRiskAttentionSection;
  related_policies: TopologyObjectRelatedPoliciesResponse;
  degraded_related_policies_preview: TopologyObjectDossierDegradedRelatedPreviewItem[];
  navigation_targets: TopologyObjectDossierNavigationTargets;
  freshness: TopologyObjectDossierFreshnessBlock;
  merged_caveats: string[];
}

export interface PolicyDossierTopologyObjectHint {
  topology_object_kind: TopologyObjectKind;
  topology_object_id: string;
}

export interface PolicyDossierNavigationTargets {
  investigation_shell_params: Record<string, string>;
  situation_room_shell_params: Record<string, string>;
  policies_view_params: Record<string, string>;
  topology_object_hints: PolicyDossierTopologyObjectHint[];
}

export interface PolicyDossierFreshnessBlock {
  dossier_assembled_at: string;
  policy_inventory_observed_at: string | null;
  topology_snapshot_observed_at: string | null;
  policy_inventory_empty_reason: string | null;
  policy_serving_mode_echo: string;
}

/** `GET /api/v1/policies/{policy_id}/dossier` (composed read-only briefing; not dataplane or workflow truth). */
export interface PolicyDossierResponse {
  metadata: ApiResponseMetadata;
  contract_id: "policy_dossier_v1";
  policy_record: PolicyRecord;
  path_analysis: PathAnalysisViewResponse;
  topology_impact: PolicyTopologyImpactResponse;
  evidence_timeline: PolicyEvidenceTimelineResponse;
  evidence_delta: PolicyEvidenceDeltaResponse;
  navigation_targets: PolicyDossierNavigationTargets;
  freshness: PolicyDossierFreshnessBlock;
  merged_caveats: string[];
}

export type ExplainabilityCandidateSignal = "active_signal" | "inactive_signal" | "unknown_signal";

export type ExplainabilityUnknownCandidatePosture = "none" | "partial" | "full";

export interface ExplainabilityCandidatePathRollup {
  name: string;
  signal: ExplainabilityCandidateSignal;
  path_state: string;
  preference?: number | null;
  hint_lines: string[];
}

export interface PolicyExplainabilityNavigationTargets {
  investigation_shell_params: Record<string, string>;
  situation_room_shell_params: Record<string, string>;
  policies_view_params: Record<string, string>;
  topology_object_hints: PolicyDossierTopologyObjectHint[];
  service_explorer_shell_params: Record<string, string>;
  delta_digest_shell_params: Record<string, string>;
}

export interface PolicyExplainabilitySparseSignals {
  topology_naming_alignment_unknown: boolean;
  evidence_timeline_sparse: boolean;
  evidence_delta_not_ready: boolean;
}

/** `GET /api/v1/policies/{policy_id}/explainability` (explainability narrative; not dataplane proof or workflow authority). */
export interface PolicyExplainabilityResponse {
  metadata: ApiResponseMetadata;
  contract_id: "policy_explainability_workspace_v1";
  policy_id: string;
  policy_record: PolicyRecord;
  path_analysis: PathAnalysisViewResponse;
  topology_impact: PolicyTopologyImpactResponse;
  evidence_timeline: PolicyEvidenceTimelineResponse;
  evidence_delta: PolicyEvidenceDeltaResponse;
  path_explanation_summary: string;
  candidate_path_rollups: ExplainabilityCandidatePathRollup[];
  unknown_candidate_posture: ExplainabilityUnknownCandidatePosture;
  sparse_signals: PolicyExplainabilitySparseSignals;
  navigation_targets: PolicyExplainabilityNavigationTargets;
  freshness: PolicyDossierFreshnessBlock;
  merged_caveats: string[];
}

/** `GET /api/v1/policies/{policy_id}/topology-impact` (inverse pivot; naming alignment only). */
export interface PolicyTopologyImpactRow {
  topology_object_kind: TopologyObjectKind;
  topology_object_id: string;
  relationship_kind: RelatedPolicyRelationshipKind;
  matched_field: RelatedPolicyMatchedField;
  matched_policy_value: string;
  matched_topology_identifier: string;
  anchor_topology_node_id: string;
  evidence_source: string;
  caveats: string[];
}

export interface PolicyTopologyImpactResponse {
  metadata: ApiResponseMetadata;
  policy_id: string;
  policy_name: string;
  derivation_summary: string;
  global_caveats: string[];
  items: PolicyTopologyImpactRow[];
}

/** `GET /api/v1/policies/{policy_id}/evidence-timeline` (bounded read-side anchors; not forensic chronology). */
export type PolicyEvidenceTimelineEntryKind =
  | "policy_inventory_snapshot_anchor"
  | "policy_history_persisted_checkpoint"
  | "policy_history_comparison_span"
  | "path_analysis_assembly_anchor"
  | "degraded_policy_v1_signal_anchor";

export type PolicyEvidenceTimelineExplicitNonClaim =
  | "not_unified_forensic_chronology"
  | "not_packet_path_proof"
  | "not_workflow_execution_history"
  | "not_validation_truth"
  | "not_change_causality_engine"
  | "not_controller_event_bus"
  | "not_cross_policy_ranking";

export interface PolicyEvidenceTimelineSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only" | "read_only_assembly_non_authoritative";
  explicit_non_claims: PolicyEvidenceTimelineExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface PolicyEvidenceTimelineEntry {
  entry_kind: PolicyEvidenceTimelineEntryKind;
  sort_key: string;
  tie_break: number;
  summary: string;
  provenance: string;
  reference: string;
}

export interface PolicyEvidenceTimelineResponse {
  metadata: ApiResponseMetadata;
  contract_id: string;
  safety_framing: PolicyEvidenceTimelineSafetyFraming;
  policy_id: string;
  scope_summary: string;
  entries: PolicyEvidenceTimelineEntry[];
  missing_evidence_notes: string[];
}

/** `GET /api/v1/policies/{policy_id}/evidence-delta` (bounded read-side difference hints; not drift truth). */
export type PolicyEvidenceDeltaCategory =
  | "posture_or_state_field_change"
  | "degraded_policy_v1_change"
  | "candidate_path_shape_change"
  | "path_analysis_availability_change"
  | "serving_mode_or_freshness_change"
  | "no_comparable_fields"
  | "gap_note";

export type PolicyEvidenceDeltaExplicitNonClaim =
  | "not_drift_truth"
  | "not_config_diff_truth"
  | "not_policy_correctness_verdict"
  | "not_workflow_validation"
  | "not_dataplane_or_te_verdict"
  | "not_replacement_for_timeline"
  | "not_cross_policy_ranking";

export interface PolicyEvidenceDeltaSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only" | "read_only_assembly_non_authoritative";
  explicit_non_claims: PolicyEvidenceDeltaExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface PolicyEvidenceDeltaAnchorCurrent {
  anchor_role: "current_inventory";
  observed_at: string | null;
  row_posture: "current" | "stale";
  serving_mode: "live" | "partial_live" | "persisted_fallback" | "unknown";
}

export interface PolicyEvidenceDeltaAnchorPrevious {
  anchor_role: "previous_persisted_snapshot";
  snapshot_id: string;
  persisted_at: string;
  observed_at: string | null;
}

export type PolicyEvidenceDeltaComparisonStatus =
  | "delta_ready"
  | "no_comparable_anchor"
  | "anchor_policy_absent"
  | "insufficient_evidence";

export interface PolicyEvidenceDeltaItem {
  category: PolicyEvidenceDeltaCategory;
  summary: string;
  detail: string | null;
}

export interface PolicyEvidenceDeltaResponse {
  metadata: ApiResponseMetadata;
  contract_id: string;
  safety_framing: PolicyEvidenceDeltaSafetyFraming;
  policy_id: string;
  comparison_status: PolicyEvidenceDeltaComparisonStatus;
  scope_summary: string;
  current_anchor: PolicyEvidenceDeltaAnchorCurrent;
  previous_anchor: PolicyEvidenceDeltaAnchorPrevious | null;
  delta_items: PolicyEvidenceDeltaItem[];
  caveats: string[];
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
  /** Persisted read-side sync run anchor when the backend exposes it. */
  sync_run_id?: string;
  persisted_at: string;
  /** Collector or API endpoint string persisted with the sync run, when exposed. */
  source_endpoint?: string;
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
  /** Bounded static-local slice count for this persisted snapshot when exposed. */
  static_local_policy_count?: number;
  observed_target_count?: number;
  policy_capable_target_count?: number;
  detail_record_count: number;
  /** Nested readiness (parity with top-level policy response) when the backend includes it. */
  detail_source_readiness?: PolicyDetailSourceReadinessRecord;
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
  current_static_local_policy_count?: number;
  previous_static_local_policy_count?: number;
  static_local_policy_delta?: number;
  current_observed_at?: string | null;
  previous_observed_at?: string | null;
  current_data_status?: "live" | "degraded";
  previous_data_status?: "live" | "degraded";
  current_sync_run_id?: string;
  previous_sync_run_id?: string;
  current_source_endpoint?: string;
  previous_source_endpoint?: string;
  /** Nested readiness for the newer snapshot in the pair (parity with policies history API). */
  current_detail_source_readiness?: PolicyDetailSourceReadinessRecord;
  /** Nested readiness for the older snapshot in the pair. */
  previous_detail_source_readiness?: PolicyDetailSourceReadinessRecord;
}

export interface PolicyHistoryWindow {
  status: "unavailable" | "current_only" | "comparison_ready";
  summary: string;
  recent_snapshots: PolicyHistorySnapshotRecord[];
  comparison_to_previous: PolicyHistoryComparison | null;
}

export interface PolicyCurrentComparison {
  status: "unavailable" | "live_vs_latest_persisted_ready";
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
  read_side_query: ReadSideQueryEcho;
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
  read_side_query: ReadSideQueryEcho;
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
  read_side_query: ReadSideQueryEcho;
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

export type ChangeEvidenceDomain =
  | "devices"
  | "topology"
  | "policies"
  | "readiness"
  | "workflow_history"
  | "audit_history";

export type DomainEvidenceStatus = "present" | "absent" | "partial";

export interface RecentChangeDomainSlice {
  domain: ChangeEvidenceDomain;
  signal_families: string[];
  evidence_status: DomainEvidenceStatus;
  headline: string;
  detail_notes: string[];
  persisted_snapshot_count?: number | null;
  latest_persisted_at?: string | null;
  sync_runs_in_window?: number | null;
  latest_sync_finished_at?: string | null;
}

export interface ChangeIntelligenceSafetyFraming {
  contract_id: string;
  authority_posture: "summarization_only" | "evidence_aggregated_non_authoritative";
  explicit_non_claims: string[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface RecentChangeSummaryResponse {
  metadata: ApiResponseMetadata;
  safety: ChangeIntelligenceSafetyFraming;
  window_semantics: string;
  completeness_posture: string;
  sync_runs_limit_applied: number;
  readiness_snapshots_considered: number;
  domains: RecentChangeDomainSlice[];
  aggregation_notes: string[];
}

export type DeltaDigestSectionKey =
  | "recent_sync_anchor"
  | "device_inventory_delta"
  | "topology_coverage_posture"
  | "policy_delta_degraded"
  | "change_intelligence_pointer"
  | "recommended_pivots"
  | "caveats_missing_evidence";

export interface DeltaDigestSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only";
  explicit_non_claims: string[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface DeltaDigestSourceProvenance {
  source: string;
  note: string;
  generated_at?: string | null;
  data_status_or_serving_hint?: string | null;
}

export interface DeltaDigestSection {
  section_key: DeltaDigestSectionKey;
  headline: string;
  evidence_status: "present" | "partial" | "absent" | "unavailable";
  detail_notes: string[];
  caveats: string[];
}

/** `GET /api/v1/delta-digest` — cross_domain_delta_digest_v1 assembly. */
export interface CrossDomainDeltaDigestResponse {
  metadata: ApiResponseMetadata;
  contract_id: string;
  safety: DeltaDigestSafetyFraming;
  sync_runs_limit_applied: number;
  completeness_posture: string;
  recent_change_summary: RecentChangeSummaryResponse;
  source_provenance: DeltaDigestSourceProvenance[];
  sections: DeltaDigestSection[];
  digest_framing_notes: string[];
}

/** Backend-owned investigation workspace assembly (`GET /api/v1/investigation-workspace/context`). */
export interface InvestigationWorkspaceSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only" | "read_only_assembly_non_authoritative";
  explicit_non_claims: string[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export type InvestigationContextDomain =
  | "devices"
  | "topology"
  | "policies"
  | "readiness"
  | "workflow_history"
  | "audit_history"
  | "change_intelligence"
  | "platform_status"
  | "capabilities";

export type InvestigationSuggestionRule =
  | "evidence_backed_read_only_surfaces_only"
  | "optional_next_product_surfaces_without_preference_ordering";

export interface InvestigationNextInspectionSuggestion {
  suggestion_id: string;
  context_domain: InvestigationContextDomain;
  framing_rule: InvestigationSuggestionRule;
  headline: string;
  rationale: string;
}

/** Nested read-only assembly of existing app-api responses; not a new truth domain. */
export interface InvestigationContextAssemblyResponse {
  metadata: ApiResponseMetadata;
  safety: InvestigationWorkspaceSafetyFraming;
  assembly_notes: string[];
  recent_change: RecentChangeSummaryResponse;
  platform_status: PlatformStatusResponse;
  capabilities: CapabilitiesListResponse;
  next_inspection_framing: string;
  next_inspection_suggestions: InvestigationNextInspectionSuggestion[];
}

/** Evidence pack safety framing (`schemas/evidence_pack.py`). */
export interface EvidencePackSafetyFraming {
  contract_id: string;
  authority_posture: string;
  explicit_non_claims: string[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface ReadinessSnapshotHistoryItem {
  snapshot_id: string;
  persisted_at: string;
  readiness_status: string;
  planning_readiness: string;
  phase_recommendation: string;
  summary: string;
  blocker_count: number;
  strongest_blockers: string[];
}

/** Persisted readiness snapshot list (`GET /api/v1/readiness-snapshot-history`). */
export interface ReadinessSnapshotHistoryResponse extends ApiResponseMetadata {
  data_status: "empty" | "bounded_history";
  summary: string;
  count: number;
  read_side_query: ReadSideQueryEcho;
  items: ReadinessSnapshotHistoryItem[];
}

/** Situation-pack review prompt rule (`schemas/evidence_pack.py`). */
export type SituationReviewNavPromptRule = "evidence_navigation_only" | "no_preference_ordering";

/** One bounded navigation hint from the situation pack assembly—never execution authority. */
export interface SituationReviewNavigationPrompt {
  prompt_id: string;
  headline: string;
  rationale: string;
  framing_rule: SituationReviewNavPromptRule;
  /** Shell `view` query target (e.g. `devices`, `workflows`). */
  product_view: string;
}

/** Backend-derived gap notes and optional review prompts for the situation room. */
export interface SituationReviewGuidance {
  review_framing: string;
  explicit_missing_evidence_notes: string[];
  review_navigation_prompts: SituationReviewNavigationPrompt[];
}

/**
 * Backend-owned situation pack (`GET /api/v1/evidence-pack/situation`).
 * Change intelligence / platform / capabilities are nested under `investigation_context` only.
 */
export interface SituationPackAssemblyResponse {
  metadata: ApiResponseMetadata;
  safety: EvidencePackSafetyFraming;
  assembly_notes: string[];
  situation_pack_guidance_framing: string;
  situation_review_guidance: SituationReviewGuidance;
  devices: DevicesListResponse;
  topology: TopologyResponse;
  policies: PoliciesListResponse;
  readiness: ReadinessSnapshotHistoryResponse;
  workflow_history: WorkflowHistoryResponse;
  audit_history: AuditHistoryResponse;
  investigation_context: InvestigationContextAssemblyResponse;
}

/** `GET /api/v1/operator-search` — bounded inventory field search (`operator_search_pivot_v1`). */
export type OperatorSearchFamily =
  | "policies"
  | "topology_nodes"
  | "topology_links"
  | "devices"
  | "capabilities";

export type OperatorSearchRankingBasis = "exact_id" | "multi_token_substring" | "substring_match";

export interface OperatorSearchPivotTarget {
  view: string;
  policy_id?: string | null;
  device_id?: string | null;
  topology_object?: string | null;
  topology_object_kind?: "node" | "link" | null;
  readiness_capability_feature?: string | null;
}

export interface OperatorSearchHit {
  object_kind: string;
  primary_id: string;
  title: string;
  ranking_basis: OperatorSearchRankingBasis;
  match_reason: string;
  pivot: OperatorSearchPivotTarget;
}

export interface OperatorSearchFamilyGroup {
  family: OperatorSearchFamily;
  items: OperatorSearchHit[];
  items_total_matched: number;
  capped?: boolean;
  cap?: number | null;
}

export interface OperatorSearchResponse extends ApiResponseMetadata {
  contract_id: "operator_search_pivot_v1";
  q: string;
  result_state: "hits" | "no_hits" | "ambiguous";
  guidance: string | null;
  groups: OperatorSearchFamilyGroup[];
  explicit_non_claims: string[];
}

/** `GET /api/v1/operator-briefing` — operator_briefing_workspace_v1 composed assembly. */
export type BriefingSectionKey =
  | "briefing_context"
  | "delta_digest"
  | "policy_dossier"
  | "topology_object_dossier"
  | "situation_room"
  | "investigation_workspace";

export type BriefingEvidenceStatus = "present" | "partial" | "absent" | "unavailable";

export interface OperatorBriefingSectionMeta {
  section_key: BriefingSectionKey;
  evidence_status: BriefingEvidenceStatus;
  caveats: string[];
  freshness_lines: string[];
  error_note?: string | null;
}

export interface OperatorBriefingContextEcho {
  sync_runs_limit_requested: number;
  policy_id: string | null;
  topology_object: string | null;
  topology_object_kind: TopologyObjectKind | null;
  inv_from_client_hint: string | null;
  global_search_q_client_hint: string | null;
}

export interface OperatorBriefingSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only";
  explicit_non_claims: string[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface OperatorBriefingWorkspaceResponse {
  metadata: ApiResponseMetadata;
  contract_id: string;
  safety: OperatorBriefingSafetyFraming;
  sync_runs_limit_applied: number;
  briefing_context: OperatorBriefingContextEcho;
  delta_digest: CrossDomainDeltaDigestResponse | null;
  delta_digest_error: string | null;
  policy_dossier: PolicyDossierResponse | null;
  policy_dossier_note: string | null;
  topology_object_dossier: TopologyObjectDossierResponse | null;
  topology_object_dossier_note: string | null;
  situation_pack: SituationPackAssemblyResponse | null;
  situation_pack_error: string | null;
  investigation_workspace: InvestigationContextAssemblyResponse | null;
  investigation_workspace_error: string | null;
  section_meta: OperatorBriefingSectionMeta[];
  merged_caveats: string[];
  recommended_pivots: string[];
}

/** `GET /api/v1/services` / `GET /api/v1/services/{service_id}` — service_explorer_v1. */
export interface ServiceExplorerPolicyInventoryEcho {
  data_status: "live" | "degraded";
  serving_mode: "live_collector" | "persisted_fallback" | "empty_scaffold";
  empty_reason:
    | "none"
    | "no_policies_observed"
    | "per_policy_details_unavailable"
    | "collector_unavailable";
  summary: string;
  observed_policy_count: number;
  policy_items_total: number;
}

export interface DegradedServiceRollup {
  posture: "ok" | "degraded" | "unknown";
  reason_codes: DegradedPolicyV1Classification["reason_codes"];
  reason_codes_truncated: boolean;
}

export interface ServiceListRow {
  service_id: string;
  kind: "policy" | "color" | "headend" | "endpoint";
  member_count: number;
  degraded_group_posture: "ok" | "degraded" | "unknown";
}

export interface ServiceTopologyLinkRecord {
  policy_id: string;
  node_id: string;
  display_name: string;
  matched_on: "node_id" | "display_name" | "device_id";
  matched_from_policy_field: "headend" | "source_target" | "endpoint";
}

export interface ServiceMemberSummary {
  policy_id: string;
  policy_name: string;
  policy_type: "static_local" | "static_non_local" | "unknown";
  headend: string;
  endpoint: string;
  color: number;
  source_target: string;
  degraded_policy_v1: DegradedPolicyV1Classification;
}

export interface ServicesListResponse extends ApiResponseMetadata {
  contract_id: "service_explorer_v1";
  policy_inventory: ServiceExplorerPolicyInventoryEcho;
  items: ServiceListRow[];
  read_side_query: ReadSideQueryEcho;
  caveats: string[];
  recommended_pivots: string[];
}

export type ServiceExplorerTopologyEvidenceStatus = "present" | "partial" | "unavailable";

export interface ServiceDetailResponse extends ApiResponseMetadata {
  contract_id: "service_explorer_v1";
  service_id: string;
  kind: "policy" | "color" | "headend" | "endpoint";
  policy_inventory: ServiceExplorerPolicyInventoryEcho;
  members: ServiceMemberSummary[];
  members_total: number;
  degraded_service: DegradedServiceRollup;
  topology_evidence_status: ServiceExplorerTopologyEvidenceStatus;
  topology_links: ServiceTopologyLinkRecord[];
  topology_caveats: string[];
  caveats: string[];
  recommended_pivots: string[];
}

/** `GET /api/v1/services/{service_id}/dossier` — service_dossier_v1 (composed assemblies). */
export interface ServiceDossierSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only";
  explicit_non_claims: string[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface ServiceDossierResponse extends ApiResponseMetadata {
  contract_id: "service_dossier_v1";
  safety_framing: ServiceDossierSafetyFraming;
  service_explorer_detail: ServiceDetailResponse;
  default_member_policy_id: string;
  member_posture_counts: Record<string, number>;
  policy_explainability: PolicyExplainabilityResponse | null;
  explainability_unavailable_note: string | null;
  maintenance_preview: MaintenancePreviewResponse | null;
  maintenance_preview_subject_node_id: string | null;
  maintenance_unavailable_note: string | null;
  merged_caveats: string[];
  missing_evidence_notes: string[];
  source_contract_ids: string[];
  recommended_api_pivots: string[];
  investigation_pivot_hint: string;
  sparse_dossier: boolean;
  sparse_reasons: string[];
}

export type ImpactReportContext = "service_impact" | "policy_impact" | "maintenance_impact";

export type ImpactReportExplicitNonClaim =
  | "not_compliance_or_legal_artifact"
  | "not_validation_record_or_test_sign_off"
  | "not_incident_command_authority_or_operational_authorization"
  | "not_safe_to_change_approval_or_maintenance_approval"
  | "not_guaranteed_complete_dependency_or_underlay_proof"
  | "not_tamper_evident_immutable_or_non_repudiation_evidence"
  | "not_substitute_for_live_authoritative_read_apis_when_freshness_matters";

export interface ImpactReportSafetyFraming {
  contract_id: string;
  authority_posture: "interpretation_support_only";
  explicit_non_claims: ImpactReportExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

/** `GET /api/v1/reports/*` — composed packaging for operator communication; not evidence_export_v1 or briefing bundles. */
export interface ImpactReportResponse {
  metadata: ApiResponseMetadata;
  contract_id: "impact_report_v1";
  report_context: ImpactReportContext;
  safety_framing: ImpactReportSafetyFraming;
  source_contract_ids: string[];
  scope_summary: string;
  explicit_excluded_concerns: string[];
  sparse_report: boolean;
  sparse_reasons: string[];
  recommended_api_pivots: string[];
  anchor_service_id?: string | null;
  anchor_policy_id?: string | null;
  anchor_maintenance?: MaintenanceSubjectSummary | null;
  service_detail?: ServiceDetailResponse | null;
  policy_dossier?: PolicyDossierResponse | null;
  maintenance_preview?: MaintenancePreviewResponse | null;
}

export type ChangeSafetyCaseContext =
  | "policy_change_safety"
  | "service_change_safety"
  | "topology_change_safety";

export type ChangeSafetyCaseExplicitNonClaim =
  | "not_dry_run_or_simulation"
  | "not_validation_authority"
  | "not_approval_or_authorization"
  | "not_safe_to_change_truth"
  | "not_rollback_or_execution_planning"
  | "not_guaranteed_complete_dependency_or_underlay_proof"
  | "not_substitute_for_live_authoritative_read_apis_when_freshness_matters";

/** `GET /api/v1/reports/change-safety-case/*` — pre-change evidence posture; not validation or approval. */
export interface ChangeSafetyCaseSafetyFraming {
  contract_id: string;
  authority_posture: "pre_change_interpretation_only";
  explicit_non_claims: ChangeSafetyCaseExplicitNonClaim[];
  phase: "phase_2_read_only_foundation";
  summary_disclaimer: string;
}

export interface ChangeSafetyCaseResponse {
  metadata: ApiResponseMetadata;
  contract_id: "change_safety_case_v1";
  safety_case_context: ChangeSafetyCaseContext;
  safety_framing: ChangeSafetyCaseSafetyFraming;
  source_contract_ids: string[];
  understanding_posture_summary: string;
  evidence_inventory: string[];
  merged_caveats: string[];
  evidence_gaps: string[];
  next_review_guidance: string[];
  recommended_api_pivots: string[];
  investigation_situation_briefing_pivot_hints: string[];
  sparse_case: boolean;
  sparse_reasons: string[];
  anchor_policy_id?: string | null;
  anchor_service_id?: string | null;
  anchor_maintenance?: MaintenanceSubjectSummary | null;
  policy_dossier?: PolicyDossierResponse | null;
  policy_explainability?: PolicyExplainabilityResponse | null;
  service_dossier?: ServiceDossierResponse | null;
  maintenance_preview?: MaintenancePreviewResponse | null;
}
