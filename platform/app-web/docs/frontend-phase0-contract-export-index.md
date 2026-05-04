# Frontend Phase 0 Contract Export Index

Generated from `platform/app-web/src/api/contracts.ts` using the TypeScript AST. This closes the Phase 0 requirement for an exact frontend contract export index.

## Summary

- Frontend exports indexed: 316
- Backend schema class name matches: 219
- ApiClient response types backed by frontend exports: 62

## Export Index

| Export | Kind | Source line | Backend schema counterpart | ApiClient usage |
| --- | --- | ---: | --- | --- |
| `ActionSafetyCaseGate` | interface | 3359 | app-api/src/app_api/schemas/action_safety_case.py | Not a direct `ApiClient` return type |
| `ActionSafetyCasePosture` | type | 3340 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ActionSafetyCaseReference` | interface | 3349 | app-api/src/app_api/schemas/action_safety_case.py | Not a direct `ApiClient` return type |
| `ActionSafetyCaseResponse` | interface | 3366 | app-api/src/app_api/schemas/action_safety_case.py | `getActionSafetyCase` |
| `ApiResponseMetadata` | interface | 1 | app-api/src/app_api/schemas/common.py | Not a direct `ApiClient` return type |
| `AuditHistoryItem` | interface | 2333 | app-api/src/app_api/schemas/audit_history.py | Not a direct `ApiClient` return type |
| `AuditHistoryResponse` | interface | 2366 | app-api/src/app_api/schemas/audit_history.py | `getAuditHistory` |
| `AuditReadinessSnapshotSummary` | interface | 2355 | app-api/src/app_api/schemas/audit_history.py | Not a direct `ApiClient` return type |
| `BriefingEvidenceStatus` | type | 2863 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `BriefingSectionKey` | type | 2855 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `CandidatePathRecord` | interface | 606 | app-api/src/app_api/schemas/policies.py | Not a direct `ApiClient` return type |
| `CapabilitiesListResponse` | interface | 2536 | app-api/src/app_api/schemas/capabilities.py | `getCapabilities` |
| `CapabilityRecord` | interface | 2375 | app-api/src/app_api/schemas/capabilities.py | Not a direct `ApiClient` return type |
| `CapabilityRecordIdentityTuple` | type | 2437 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ChangeEvidenceDomain` | type | 2555 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ChangeIntelligenceSafetyFraming` | interface | 2577 | app-api/src/app_api/schemas/change_intelligence.py | Not a direct `ApiClient` return type |
| `ChangeSafetyCaseContext` | type | 3051 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ChangeSafetyCaseExplicitNonClaim` | type | 3056 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ChangeSafetyCaseResponse` | interface | 3074 | app-api/src/app_api/schemas/change_safety_case.py | `getPolicyChangeSafetyCase`, `getServiceChangeSafetyCase`, `getTopologyChangeSafetyCase` |
| `ChangeSafetyCaseSafetyFraming` | interface | 3066 | app-api/src/app_api/schemas/change_safety_case.py | Not a direct `ApiClient` return type |
| `CheckVerdict` | type | 2213 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ControllerEvidenceResponse` | interface | 593 | app-api/src/app_api/schemas/controller_evidence.py | `getControllerEvidence` |
| `ControllerEvidenceSafetyFramingV2` | interface | 587 | app-api/src/app_api/schemas/controller_evidence.py | Not a direct `ApiClient` return type |
| `ControllerReachability` | type | 515 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `CrossDomainDeltaDigestResponse` | interface | 2629 | app-api/src/app_api/schemas/delta_digest.py | `getDeltaDigest` |
| `CurrentRowPosture` | type | 148 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `DegradedPolicyV1Classification` | interface | 623 | app-api/src/app_api/schemas/degraded_policy_v1.py | Not a direct `ApiClient` return type |
| `DegradedPolicyV1ReasonCode` | type | 615 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `DegradedServiceRollup` | interface | 2925 | app-api/src/app_api/schemas/service_explorer.py | Not a direct `ApiClient` return type |
| `DeltaDigestSafetyFraming` | interface | 2605 | app-api/src/app_api/schemas/delta_digest.py | Not a direct `ApiClient` return type |
| `DeltaDigestSection` | interface | 2620 | app-api/src/app_api/schemas/delta_digest.py | Not a direct `ApiClient` return type |
| `DeltaDigestSectionKey` | type | 2596 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `DeltaDigestSourceProvenance` | interface | 2613 | app-api/src/app_api/schemas/delta_digest.py | Not a direct `ApiClient` return type |
| `DerivationMode` | type | 562 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `DeviceRecord` | interface | 150 | app-api/src/app_api/schemas/devices.py | Not a direct `ApiClient` return type |
| `DevicesListResponse` | interface | 189 | app-api/src/app_api/schemas/devices.py | `getDevices` |
| `DomainEvidenceStatus` | type | 2563 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `DomainFreshnessEcho` | interface | 2671 | app-api/src/app_api/schemas/evidence_consistency_summary.py | Not a direct `ApiClient` return type |
| `DryRunReadinessAssessmentArea` | interface | 2504 | app-api/src/app_api/schemas/capabilities.py | Not a direct `ApiClient` return type |
| `DryRunReadinessBlocker` | interface | 2469 | app-api/src/app_api/schemas/capabilities.py | Not a direct `ApiClient` return type |
| `DryRunReadinessPrerequisite` | interface | 2442 | app-api/src/app_api/schemas/capabilities.py | Not a direct `ApiClient` return type |
| `DryRunReadinessSummary` | interface | 2517 | app-api/src/app_api/schemas/capabilities.py | Not a direct `ApiClient` return type |
| `ErrorDetail` | interface | 26 | app-api/src/app_api/schemas/common.py | Not a direct `ApiClient` return type |
| `ErrorResponse` | interface | 31 | app-api/src/app_api/schemas/common.py | Not a direct `ApiClient` return type |
| `EvidenceConfidenceSummary` | interface | 38 | app-api/src/app_api/schemas/common.py | Not a direct `ApiClient` return type |
| `EvidenceConsistencyContradictionCategory` | type | 2642 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `EvidenceConsistencyItemRow` | interface | 2663 | app-api/src/app_api/schemas/evidence_consistency_summary.py | Not a direct `ApiClient` return type |
| `EvidenceConsistencyPivotHint` | interface | 2658 | app-api/src/app_api/schemas/evidence_consistency_summary.py | Not a direct `ApiClient` return type |
| `EvidenceConsistencySafetyFraming` | interface | 2677 | app-api/src/app_api/schemas/evidence_consistency_summary.py | Not a direct `ApiClient` return type |
| `EvidenceConsistencySignal` | type | 2651 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `EvidenceConsistencySummaryResponse` | interface | 2685 | app-api/src/app_api/schemas/evidence_consistency_summary.py | `getEvidenceConsistencySummary` |
| `EvidencePackSafetyFraming` | interface | 2742 | app-api/src/app_api/schemas/evidence_pack.py | Not a direct `ApiClient` return type |
| `EvidenceQualityDimension` | type | 3135 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `EvidenceQualityRow` | interface | 3155 | app-api/src/app_api/schemas/evidence_quality_workspace.py | Not a direct `ApiClient` return type |
| `EvidenceQualitySubjectDomain` | type | 3144 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `EvidenceQualitySummaryResponse` | interface | 3163 | app-api/src/app_api/schemas/evidence_quality_workspace.py | `getEvidenceQualityWorkspace` |
| `EvidenceStrength` | type | 555 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `EvidenceWeaknessExplanationBlock` | interface | 3212 | app-api/src/app_api/schemas/evidence_weakness_explanation.py | Not a direct `ApiClient` return type |
| `EvidenceWeaknessExplanationCategory` | type | 3183 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `EvidenceWeaknessExplanationResponse` | interface | 3221 | app-api/src/app_api/schemas/evidence_weakness_explanation.py | `getEvidenceWeaknessExplanation` |
| `EvidenceWeaknessNextBestPivot` | interface | 3204 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `EvidenceWeaknessNextBestPivotId` | type | 3191 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ExplainabilityCandidatePathRollup` | interface | 1304 | app-api/src/app_api/schemas/policy_explainability.py | Not a direct `ApiClient` return type |
| `ExplainabilityCandidateSignal` | type | 1300 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ExplainabilityUnknownCandidatePosture` | type | 1302 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `FailureImpactDegradedPostureBreakdown` | interface | 856 | app-api/src/app_api/schemas/failure_impact.py | Not a direct `ApiClient` return type |
| `FailureImpactExplicitNonClaim` | type | 827 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `FailureImpactFreshness` | interface | 862 | app-api/src/app_api/schemas/failure_impact.py | Not a direct `ApiClient` return type |
| `FailureImpactRollupCounts` | interface | 849 | app-api/src/app_api/schemas/failure_impact.py | Not a direct `ApiClient` return type |
| `FailureImpactSafetyFraming` | interface | 836 | app-api/src/app_api/schemas/failure_impact.py | Not a direct `ApiClient` return type |
| `FailureImpactSubject` | interface | 844 | app-api/src/app_api/schemas/failure_impact.py | Not a direct `ApiClient` return type |
| `FailureImpactViewResponse` | interface | 871 | app-api/src/app_api/schemas/failure_impact.py | `getTopologyObjectFailureImpact` |
| `HistoryBaselineSummary` | interface | 2003 | app-api/src/app_api/schemas/common.py | Not a direct `ApiClient` return type |
| `ImpactReportContext` | type | 3012 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ImpactReportExplicitNonClaim` | type | 3014 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ImpactReportResponse` | interface | 3032 | app-api/src/app_api/schemas/impact_report.py | `getServiceImpactReport`, `getPolicyImpactReport`, `getMaintenanceImpactReport` |
| `ImpactReportSafetyFraming` | interface | 3023 | app-api/src/app_api/schemas/impact_report.py | Not a direct `ApiClient` return type |
| `IntendedPathHint` | interface | 717 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `IntendedPathHintKind` | type | 712 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `InventoryCurrentComparison` | interface | 169 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `InventoryHistoryComparison` | interface | 1779 | app-api/src/app_api/schemas/devices.py | Not a direct `ApiClient` return type |
| `InventoryHistoryDeviceChangePreview` | interface | 1718 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `InventoryHistorySnapshotRecord` | interface | 1764 | app-api/src/app_api/schemas/devices.py | Not a direct `ApiClient` return type |
| `InventoryHistoryWindow` | interface | 1800 | app-api/src/app_api/schemas/devices.py | Not a direct `ApiClient` return type |
| `InvestigationContextAssemblyResponse` | interface | 2730 | app-api/src/app_api/schemas/investigation_workspace.py | `getInvestigationWorkspaceContext` |
| `InvestigationContextDomain` | type | 2706 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `InvestigationNextInspectionSuggestion` | interface | 2721 | app-api/src/app_api/schemas/investigation_workspace.py | Not a direct `ApiClient` return type |
| `InvestigationSuggestionRule` | type | 2717 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `InvestigationWorkspaceSafetyFraming` | interface | 2698 | app-api/src/app_api/schemas/investigation_workspace.py | Not a direct `ApiClient` return type |
| `MaintenanceEvidenceWorkspaceResponse` | interface | 1012 | app-api/src/app_api/schemas/maintenance_evidence_workspace.py | `getMaintenanceEvidenceWorkspace` |
| `MaintenanceExplainabilityPointer` | interface | 917 | app-api/src/app_api/schemas/maintenance_preview.py | Not a direct `ApiClient` return type |
| `MaintenancePreviewContext` | type | 883 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `MaintenancePreviewExplicitNonClaim` | type | 889 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `MaintenancePreviewResponse` | interface | 930 | app-api/src/app_api/schemas/maintenance_preview.py | `getMaintenancePreview` |
| `MaintenancePreviewSafetyFraming` | interface | 901 | app-api/src/app_api/schemas/maintenance_preview.py | Not a direct `ApiClient` return type |
| `MaintenanceSubjectSummary` | interface | 909 | app-api/src/app_api/schemas/maintenance_preview.py | Not a direct `ApiClient` return type |
| `MaintenanceTopologyImpactSection` | interface | 923 | app-api/src/app_api/schemas/maintenance_preview.py | Not a direct `ApiClient` return type |
| `MaintenanceWindowAffectedServiceRollupRow` | interface | 966 | app-api/src/app_api/schemas/maintenance_window_workspace.py | Not a direct `ApiClient` return type |
| `MaintenanceWindowPolicyRollupRow` | interface | 974 | app-api/src/app_api/schemas/maintenance_window_workspace.py | Not a direct `ApiClient` return type |
| `MaintenanceWindowSubjectResolutionFailure` | interface | 951 | app-api/src/app_api/schemas/maintenance_window_workspace.py | Not a direct `ApiClient` return type |
| `MaintenanceWindowSubjectStripRow` | interface | 957 | app-api/src/app_api/schemas/maintenance_window_workspace.py | Not a direct `ApiClient` return type |
| `MaintenanceWindowTensionCueRow` | interface | 980 | app-api/src/app_api/schemas/maintenance_window_workspace.py | Not a direct `ApiClient` return type |
| `MaintenanceWindowWorkspaceResponse` | interface | 986 | app-api/src/app_api/schemas/maintenance_window_workspace.py | `getMaintenanceWindowWorkspace` |
| `MemberPolicyEvidenceDeltaPointer` | interface | 1545 | app-api/src/app_api/schemas/service_evidence_delta.py | Not a direct `ApiClient` return type |
| `ObjectVisibilityPosture` | type | 541 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ObservedPathHint` | interface | 731 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `ObservedPathHintKind` | type | 724 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `OperationalStabilityRow` | interface | 3107 | app-api/src/app_api/schemas/operational_stability_summary.py | Not a direct `ApiClient` return type |
| `OperationalStabilitySummaryResponse` | interface | 3116 | app-api/src/app_api/schemas/operational_stability_summary.py | `getOperationalStabilitySummary` |
| `OperatorBriefingContextEcho` | interface | 2873 | app-api/src/app_api/schemas/operator_briefing.py | Not a direct `ApiClient` return type |
| `OperatorBriefingSafetyFraming` | interface | 2882 | app-api/src/app_api/schemas/operator_briefing.py | Not a direct `ApiClient` return type |
| `OperatorBriefingSectionMeta` | interface | 2865 | app-api/src/app_api/schemas/operator_briefing.py | Not a direct `ApiClient` return type |
| `OperatorBriefingWorkspaceResponse` | interface | 2890 | app-api/src/app_api/schemas/operator_briefing.py | `getOperatorBriefing` |
| `OperatorSearchFamily` | type | 2810 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `OperatorSearchFamilyGroup` | interface | 2837 | app-api/src/app_api/schemas/operator_search.py | Not a direct `ApiClient` return type |
| `OperatorSearchHit` | interface | 2828 | app-api/src/app_api/schemas/operator_search.py | Not a direct `ApiClient` return type |
| `OperatorSearchPivotTarget` | interface | 2819 | app-api/src/app_api/schemas/operator_search.py | Not a direct `ApiClient` return type |
| `OperatorSearchRankingBasis` | type | 2817 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `OperatorSearchResponse` | interface | 2845 | app-api/src/app_api/schemas/operator_search.py | `getOperatorSearch` |
| `PathAnalysisAuthorityPosture` | type | 675 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PathAnalysisCandidatePathSummary` | interface | 741 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `PathAnalysisCaveat` | interface | 767 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `PathAnalysisCaveatCode` | type | 758 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PathAnalysisExplicitNonClaim` | type | 679 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PathAnalysisFreshness` | interface | 750 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `PathAnalysisSafetyFraming` | interface | 693 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `PathAnalysisSubject` | interface | 701 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `PathAnalysisTruthAlignment` | interface | 778 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `PathAnalysisTruthAlignmentPosture` | type | 772 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PathAnalysisViewResponse` | interface | 783 | app-api/src/app_api/schemas/path_analysis.py | `getPolicyPathAnalysis` |
| `PathEvidenceAttribution` | interface | 670 | app-api/src/app_api/schemas/path_analysis.py | Not a direct `ApiClient` return type |
| `PathEvidenceDomain` | type | 660 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PathExplorerWorkspaceResponse` | interface | 1347 | app-api/src/app_api/schemas/path_explorer.py | `getPathExplorerWorkspace` |
| `PlatformComponentStatus` | interface | 62 | app-api/src/app_api/schemas/platform.py | Not a direct `ApiClient` return type |
| `PlatformReadPathStatus` | interface | 89 | app-api/src/app_api/schemas/platform.py | Not a direct `ApiClient` return type |
| `PlatformRecoveryBaselinePosture` | type | 122 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PlatformRecoveryPersistedArtifacts` | interface | 114 | app-api/src/app_api/schemas/platform.py | Not a direct `ApiClient` return type |
| `PlatformRecoveryReadSidePosture` | type | 126 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PlatformRecoveryStatus` | interface | 131 | app-api/src/app_api/schemas/platform.py | Not a direct `ApiClient` return type |
| `PlatformStatusResponse` | interface | 139 | app-api/src/app_api/schemas/platform.py | `getPlatformStatus` |
| `PoliciesListResponse` | interface | 1941 | app-api/src/app_api/schemas/policies.py | `getPolicies` |
| `PolicyComparisonChangePreview` | interface | 1708 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyCurrentComparison` | interface | 1922 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyDetailSourceReadinessPosture` | type | 1660 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyDetailSourceReadinessRecord` | interface | 1667 | app-api/src/app_api/schemas/policies.py | Not a direct `ApiClient` return type |
| `PolicyDossierFreshnessBlock` | interface | 1278 | app-api/src/app_api/schemas/policy_dossier.py | Not a direct `ApiClient` return type |
| `PolicyDossierNavigationTargets` | interface | 1271 | app-api/src/app_api/schemas/policy_dossier.py | Not a direct `ApiClient` return type |
| `PolicyDossierResponse` | interface | 1287 | app-api/src/app_api/schemas/policy_dossier.py | `getPolicyDossier` |
| `PolicyDossierTopologyObjectHint` | interface | 1266 | app-api/src/app_api/schemas/policy_dossier.py | Not a direct `ApiClient` return type |
| `PolicyEvidenceDeltaAnchorCurrent` | interface | 1592 | app-api/src/app_api/schemas/policy_evidence_delta.py | Not a direct `ApiClient` return type |
| `PolicyEvidenceDeltaAnchorPrevious` | interface | 1599 | app-api/src/app_api/schemas/policy_evidence_delta.py | Not a direct `ApiClient` return type |
| `PolicyEvidenceDeltaCategory` | type | 1566 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyEvidenceDeltaComparisonStatus` | type | 1606 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyEvidenceDeltaExplicitNonClaim` | type | 1575 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyEvidenceDeltaItem` | interface | 1612 | app-api/src/app_api/schemas/policy_evidence_delta.py | Not a direct `ApiClient` return type |
| `PolicyEvidenceDeltaResponse` | interface | 1618 | app-api/src/app_api/schemas/policy_evidence_delta.py | `getPolicyEvidenceDelta` |
| `PolicyEvidenceDeltaSafetyFraming` | interface | 1584 | app-api/src/app_api/schemas/policy_evidence_delta.py | Not a direct `ApiClient` return type |
| `PolicyEvidenceTimelineEntry` | interface | 1422 | app-api/src/app_api/schemas/policy_evidence_timeline.py | Not a direct `ApiClient` return type |
| `PolicyEvidenceTimelineEntryKind` | type | 1398 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyEvidenceTimelineExplicitNonClaim` | type | 1405 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyEvidenceTimelineResponse` | interface | 1431 | app-api/src/app_api/schemas/policy_evidence_timeline.py | `getPolicyEvidenceTimeline` |
| `PolicyEvidenceTimelineSafetyFraming` | interface | 1414 | app-api/src/app_api/schemas/policy_evidence_timeline.py | Not a direct `ApiClient` return type |
| `PolicyExplainabilityNavigationTargets` | interface | 1312 | app-api/src/app_api/schemas/policy_explainability.py | Not a direct `ApiClient` return type |
| `PolicyExplainabilityResponse` | interface | 1328 | app-api/src/app_api/schemas/policy_explainability.py | `getPolicyExplainability` |
| `PolicyExplainabilitySparseSignals` | interface | 1321 | app-api/src/app_api/schemas/policy_explainability.py | Not a direct `ApiClient` return type |
| `PolicyHistoryComparison` | interface | 1872 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyHistorySnapshotRecord` | interface | 1674 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyHistoryWindow` | interface | 1915 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PolicyRecord` | interface | 632 | app-api/src/app_api/schemas/policies.py | Not a direct `ApiClient` return type |
| `PolicyTargetFootprintRecord` | interface | 1631 | app-api/src/app_api/schemas/policies.py | Not a direct `ApiClient` return type |
| `PolicyTopologyImpactResponse` | interface | 1388 | app-api/src/app_api/schemas/policy_topology_impact.py | `getPolicyTopologyImpact` |
| `PolicyTopologyImpactRow` | interface | 1376 | app-api/src/app_api/schemas/policy_topology_impact.py | Not a direct `ApiClient` return type |
| `PreviewChangeItem` | interface | 2107 | app-api/src/app_api/schemas/preview_engine.py | Not a direct `ApiClient` return type |
| `PreviewDecisionState` | type | 2085 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PreviewDetailPayload` | interface | 2135 | app-api/src/app_api/schemas/preview_engine.py | Not a direct `ApiClient` return type |
| `PreviewDetailResponse` | interface | 2160 | app-api/src/app_api/schemas/preview_engine.py | `getPreviewDetail`, `createPreview` |
| `PreviewDiffModel` | interface | 2117 | app-api/src/app_api/schemas/preview_engine.py | Not a direct `ApiClient` return type |
| `PreviewDiffResponse` | interface | 2198 | app-api/src/app_api/schemas/preview_engine.py | `getPreviewDiff` |
| `PreviewEventItem` | interface | 2181 | app-api/src/app_api/schemas/preview_engine.py | Not a direct `ApiClient` return type |
| `PreviewListItem` | interface | 2164 | app-api/src/app_api/schemas/preview_engine.py | Not a direct `ApiClient` return type |
| `PreviewListResponse` | interface | 2176 | app-api/src/app_api/schemas/preview_engine.py | `getPreviewList` |
| `PreviewSafetyFraming` | interface | 2131 | app-api/src/app_api/schemas/preview_engine.py | Not a direct `ApiClient` return type |
| `PreviewStatus` | type | 2086 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `PreviewTimelineResponse` | interface | 2192 | app-api/src/app_api/schemas/preview_engine.py | `getPreviewTimeline` |
| `PreviewTruthScopeSummary` | interface | 2096 | app-api/src/app_api/schemas/preview_engine.py | Not a direct `ApiClient` return type |
| `ProtocolExposurePosture` | type | 539 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ProtocolLaneDetailV2` | interface | 569 | app-api/src/app_api/schemas/controller_evidence.py | Not a direct `ApiClient` return type |
| `ProtocolLanePosture` | type | 517 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ProtocolLaneSummary` | interface | 527 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ReadinessSnapshotHistoryItem` | interface | 2750 | app-api/src/app_api/schemas/readiness_snapshot_history.py | Not a direct `ApiClient` return type |
| `ReadinessSnapshotHistoryResponse` | interface | 2762 | app-api/src/app_api/schemas/readiness_snapshot_history.py | Not a direct `ApiClient` return type |
| `ReadPathReliabilityPosture` | type | 3153 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ReadSideQueryEcho` | interface | 13 | app-api/src/app_api/schemas/read_side_query.py | Not a direct `ApiClient` return type |
| `RecentChangeDomainSlice` | interface | 2565 | app-api/src/app_api/schemas/change_intelligence.py | Not a direct `ApiClient` return type |
| `RecentChangeSummaryResponse` | interface | 2585 | app-api/src/app_api/schemas/change_intelligence.py | `getRecentChangeSummary` |
| `RelatedPolicyMatchedField` | type | 799 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `RelatedPolicyRelationshipKind` | type | 801 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `RollbackDetailResponse` | interface | 3395 | app-api/src/app_api/schemas/rollback_orchestration.py | `getRollbackDetail`, `createRollback`, `approveRollback`, `rejectRollback`, `executeRollback`, `cancelRollback` |
| `RollbackListResponse` | interface | 3414 | app-api/src/app_api/schemas/rollback_orchestration.py | `getRollbackList` |
| `RollbackTimelineResponse` | interface | 3428 | app-api/src/app_api/schemas/rollback_orchestration.py | `getRollbackTimeline` |
| `SafeActionDetailResponse` | interface | 3288 | app-api/src/app_api/schemas/safe_actions.py | `getSafeActionDetail`, `createSafeAction`, `approveSafeAction`, `rejectSafeAction`, `executeSafeAction`, `cancelSafeAction` |
| `SafeActionListResponse` | interface | 3310 | app-api/src/app_api/schemas/safe_actions.py | `getSafeActionList` |
| `SafeActionTimelineResponse` | interface | 3325 | app-api/src/app_api/schemas/safe_actions.py | `getSafeActionTimeline` |
| `ServiceDetailResponse` | interface | 2968 | app-api/src/app_api/schemas/service_explorer.py | `getService` |
| `ServiceDossierResponse` | interface | 2992 | app-api/src/app_api/schemas/service_dossier.py | `getServiceDossier` |
| `ServiceDossierSafetyFraming` | interface | 2984 | app-api/src/app_api/schemas/service_dossier.py | Not a direct `ApiClient` return type |
| `ServiceEvidenceDeltaAnchorCurrent` | interface | 1521 | app-api/src/app_api/schemas/service_evidence_delta.py | Not a direct `ApiClient` return type |
| `ServiceEvidenceDeltaAnchorPrevious` | interface | 1527 | app-api/src/app_api/schemas/service_evidence_delta.py | Not a direct `ApiClient` return type |
| `ServiceEvidenceDeltaCategory` | type | 1493 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ServiceEvidenceDeltaComparisonStatus` | type | 1534 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ServiceEvidenceDeltaExplicitNonClaim` | type | 1502 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ServiceEvidenceDeltaItem` | interface | 1539 | app-api/src/app_api/schemas/service_evidence_delta.py | Not a direct `ApiClient` return type |
| `ServiceEvidenceDeltaResponse` | interface | 1551 | app-api/src/app_api/schemas/service_evidence_delta.py | `getServiceEvidenceDelta` |
| `ServiceEvidenceDeltaSafetyFraming` | interface | 1513 | app-api/src/app_api/schemas/service_evidence_delta.py | Not a direct `ApiClient` return type |
| `ServiceEvidenceTimelineEntry` | interface | 1471 | app-api/src/app_api/schemas/service_evidence_timeline.py | Not a direct `ApiClient` return type |
| `ServiceEvidenceTimelineEntryKind` | type | 1442 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ServiceEvidenceTimelineExplicitNonClaim` | type | 1452 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ServiceEvidenceTimelineResponse` | interface | 1482 | app-api/src/app_api/schemas/service_evidence_timeline.py | `getServiceEvidenceTimeline` |
| `ServiceEvidenceTimelineSafetyFraming` | interface | 1463 | app-api/src/app_api/schemas/service_evidence_timeline.py | Not a direct `ApiClient` return type |
| `ServiceExplorerPolicyInventoryEcho` | interface | 2912 | app-api/src/app_api/schemas/service_explorer.py | Not a direct `ApiClient` return type |
| `ServiceExplorerTopologyEvidenceStatus` | type | 2966 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ServiceImpactWorkspaceResponse` | interface | 1360 | app-api/src/app_api/schemas/service_impact_workspace.py | `getServiceImpactWorkspace` |
| `ServiceListRow` | interface | 2931 | app-api/src/app_api/schemas/service_explorer.py | Not a direct `ApiClient` return type |
| `ServiceMemberSummary` | interface | 2946 | app-api/src/app_api/schemas/service_explorer.py | Not a direct `ApiClient` return type |
| `ServicesListResponse` | interface | 2957 | app-api/src/app_api/schemas/service_explorer.py | `getServices` |
| `ServiceStabilityProfileResponse` | interface | 3266 | app-api/src/app_api/schemas/service_stability_profile.py | `getServiceStabilityProfile` |
| `ServiceTopologyLinkRecord` | interface | 2938 | app-api/src/app_api/schemas/service_explorer.py | Not a direct `ApiClient` return type |
| `SessionPosture` | type | 547 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `SituationPackAssemblyResponse` | interface | 2794 | app-api/src/app_api/schemas/evidence_pack.py | `getEvidencePackSituation` |
| `SituationReviewGuidance` | interface | 2784 | app-api/src/app_api/schemas/evidence_pack.py | Not a direct `ApiClient` return type |
| `SituationReviewNavigationPrompt` | interface | 2774 | app-api/src/app_api/schemas/evidence_pack.py | Not a direct `ApiClient` return type |
| `SituationReviewNavPromptRule` | type | 2771 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `StabilityPosture` | type | 3099 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `StabilityProfilePivotHint` | interface | 3237 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `StalePosture` | type | 2094 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyCollectionPosture` | type | 75 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyComparisonSummary` | interface | 296 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyCoverageSummaryRecord` | interface | 272 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyEndpointPairingPosture` | type | 77 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyHistoryComparison` | interface | 1829 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyHistorySnapshotRecord` | interface | 1807 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyHistoryWindow` | interface | 1865 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyInferencePosture` | type | 73 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyLinkRecord` | interface | 214 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyNodeParticipationPosture` | type | 83 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyNodeRecord` | interface | 202 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyObjectDossierDegradedRelatedPreviewItem` | interface | 1100 | app-api/src/app_api/schemas/topology_object_dossier.py | Not a direct `ApiClient` return type |
| `TopologyObjectDossierFreshnessBlock` | interface | 1113 | app-api/src/app_api/schemas/topology_object_dossier.py | Not a direct `ApiClient` return type |
| `TopologyObjectDossierNavigationTargets` | interface | 1106 | app-api/src/app_api/schemas/topology_object_dossier.py | Not a direct `ApiClient` return type |
| `TopologyObjectDossierResponse` | interface | 1122 | app-api/src/app_api/schemas/topology_object_dossier.py | `getTopologyObjectDossier` |
| `TopologyObjectEvidenceDeltaAnchorCurrent` | interface | 1225 | app-api/src/app_api/schemas/topology_object_evidence_delta.py | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceDeltaAnchorPrevious` | interface | 1231 | app-api/src/app_api/schemas/topology_object_evidence_delta.py | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceDeltaCategory` | type | 1193 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceDeltaComparisonStatus` | type | 1240 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceDeltaExplicitNonClaim` | type | 1203 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceDeltaItem` | interface | 1245 | app-api/src/app_api/schemas/topology_object_evidence_delta.py | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceDeltaResponse` | interface | 1251 | app-api/src/app_api/schemas/topology_object_evidence_delta.py | `getTopologyObjectEvidenceDelta` |
| `TopologyObjectEvidenceDeltaSafetyFraming` | interface | 1217 | app-api/src/app_api/schemas/topology_object_evidence_delta.py | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceTimelineEntry` | interface | 1170 | app-api/src/app_api/schemas/topology_object_evidence_timeline.py | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceTimelineEntryKind` | type | 1137 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceTimelineExplicitNonClaim` | type | 1149 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyObjectEvidenceTimelineResponse` | interface | 1181 | app-api/src/app_api/schemas/topology_object_evidence_timeline.py | `getTopologyObjectEvidenceTimeline` |
| `TopologyObjectEvidenceTimelineSafetyFraming` | interface | 1162 | app-api/src/app_api/schemas/topology_object_evidence_timeline.py | Not a direct `ApiClient` return type |
| `TopologyObjectIdentitySection` | interface | 1087 | app-api/src/app_api/schemas/topology_object_dossier.py | Not a direct `ApiClient` return type |
| `TopologyObjectKind` | type | 797 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyObjectRelatedPoliciesResponse` | interface | 818 | app-api/src/app_api/schemas/topology_related_policies.py | `getTopologyObjectRelatedPolicies` |
| `TopologyObjectStabilityProfileResponse` | interface | 3243 | app-api/src/app_api/schemas/topology_object_stability_profile.py | `getTopologyObjectStabilityProfile` |
| `TopologyRecord` | interface | 284 | app-api/src/app_api/schemas/topology.py | Not a direct `ApiClient` return type |
| `TopologyRelatedPolicyReference` | interface | 805 | app-api/src/app_api/schemas/topology_related_policies.py | Not a direct `ApiClient` return type |
| `TopologyResponse` | interface | 317 | app-api/src/app_api/schemas/topology.py | `getTopology` |
| `TopologyRiskAttentionSection` | interface | 1094 | app-api/src/app_api/schemas/topology_object_dossier.py | Not a direct `ApiClient` return type |
| `TopologyRiskSummaryExplicitNonClaim` | type | 1031 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyRiskSummaryFreshness` | interface | 1064 | app-api/src/app_api/schemas/topology_risk_summary.py | Not a direct `ApiClient` return type |
| `TopologyRiskSummaryRankingInputs` | interface | 1049 | app-api/src/app_api/schemas/topology_risk_summary.py | Not a direct `ApiClient` return type |
| `TopologyRiskSummaryResponse` | interface | 1073 | app-api/src/app_api/schemas/topology_risk_summary.py | `getTopologyRiskSummary` |
| `TopologyRiskSummaryRow` | interface | 1056 | app-api/src/app_api/schemas/topology_risk_summary.py | Not a direct `ApiClient` return type |
| `TopologyRiskSummarySafetyFraming` | interface | 1041 | app-api/src/app_api/schemas/topology_risk_summary.py | Not a direct `ApiClient` return type |
| `TopologyTruthControllerFetchStatus` | type | 373 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyTruthControlPlaneAdjacencyPosture` | type | 350 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyTruthCounts` | interface | 477 | app-api/src/app_api/schemas/topology_truth.py | Not a direct `ApiClient` return type |
| `TopologyTruthDisagreementKind` | type | 359 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyTruthDisagreementRecord` | interface | 399 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyTruthFreshnessSummary` | interface | 471 | app-api/src/app_api/schemas/topology_truth.py | Not a direct `ApiClient` return type |
| `TopologyTruthLinkRecord` | interface | 419 | app-api/src/app_api/schemas/topology_truth.py | Not a direct `ApiClient` return type |
| `TopologyTruthMergedTopology` | interface | 463 | app-api/src/app_api/schemas/topology_truth.py | Not a direct `ApiClient` return type |
| `TopologyTruthNodeRecord` | interface | 408 | app-api/src/app_api/schemas/topology_truth.py | Not a direct `ApiClient` return type |
| `TopologyTruthPosture` | type | 338 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyTruthProvenance` | interface | 390 | app-api/src/app_api/schemas/topology_truth.py | Not a direct `ApiClient` return type |
| `TopologyTruthResponse` | interface | 502 | app-api/src/app_api/schemas/topology_truth.py | `getTopologyTruth` |
| `TopologyTruthSafetyFraming` | interface | 496 | app-api/src/app_api/schemas/topology_truth.py | Not a direct `ApiClient` return type |
| `TopologyTruthSourceRef` | interface | 375 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `TopologyTruthSourceType` | type | 329 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ValidationCapabilityDecision` | type | 2212 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ValidationCheckResult` | interface | 2225 | app-api/src/app_api/schemas/validation_engine.py | Not a direct `ApiClient` return type |
| `ValidationContext` | type | 2210 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ValidationDetailResponse` | interface | 2273 | app-api/src/app_api/schemas/validation_engine.py | `getValidationDetail`, `createValidation` |
| `ValidationEventItem` | interface | 2317 | app-api/src/app_api/schemas/validation_engine.py | Not a direct `ApiClient` return type |
| `ValidationEvidenceItem` | interface | 2242 | app-api/src/app_api/schemas/validation_engine.py | Not a direct `ApiClient` return type |
| `ValidationListItem` | interface | 2301 | app-api/src/app_api/schemas/validation_engine.py | Not a direct `ApiClient` return type |
| `ValidationListResponse` | interface | 2313 | app-api/src/app_api/schemas/validation_engine.py | `getValidationList` |
| `ValidationOverallVerdict` | type | 2211 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `ValidationResultPayload` | interface | 2256 | app-api/src/app_api/schemas/validation_engine.py | Not a direct `ApiClient` return type |
| `ValidationSafetyFraming` | interface | 2252 | app-api/src/app_api/schemas/validation_engine.py | Not a direct `ApiClient` return type |
| `ValidationTimelineResponse` | interface | 2328 | app-api/src/app_api/schemas/validation_engine.py | `getValidationTimeline` |
| `ValidationTruthScopeSummary` | interface | 2215 | app-api/src/app_api/schemas/validation_engine.py | Not a direct `ApiClient` return type |
| `WorkflowHistoryItem` | interface | 1980 | app-api/src/app_api/schemas/workflow_history.py | Not a direct `ApiClient` return type |
| `WorkflowHistoryResponse` | interface | 2009 | app-api/src/app_api/schemas/workflow_history.py | `getWorkflowHistory` |
| `WorkflowInventorySnapshotComparison` | interface | 1743 | app-api/src/app_api/schemas/workflow_history.py | Not a direct `ApiClient` return type |
| `WorkflowInventorySnapshotSummary` | interface | 1728 | app-api/src/app_api/schemas/workflow_history.py | Not a direct `ApiClient` return type |
| `WorkflowLifecycleDetailResponse` | interface | 2058 | app-api/src/app_api/schemas/workflow_lifecycle.py | `getWorkflowLifecycleDetail`, `createWorkflowLifecycle`, `transitionWorkflowLifecycle` |
| `WorkflowLifecycleEventItem` | interface | 2064 | app-api/src/app_api/schemas/workflow_lifecycle.py | Not a direct `ApiClient` return type |
| `WorkflowLifecycleListResponse` | interface | 2052 | app-api/src/app_api/schemas/workflow_lifecycle.py | `getWorkflowLifecycleList` |
| `WorkflowLifecycleRecord` | interface | 2035 | app-api/src/app_api/schemas/workflow_lifecycle.py | Not a direct `ApiClient` return type |
| `WorkflowLifecycleSafetyFraming` | interface | 2030 | app-api/src/app_api/schemas/workflow_lifecycle.py | Not a direct `ApiClient` return type |
| `WorkflowLifecycleStatus` | type | 2019 | No exact schema class-name match recorded | Not a direct `ApiClient` return type |
| `WorkflowLifecycleTimelineResponse` | interface | 2077 | app-api/src/app_api/schemas/workflow_lifecycle.py | `getWorkflowLifecycleTimeline` |

## Rewrite Requirement

- Generated OpenAPI types may replace this manual index later, but Phase 1 chose a drift-check harness first.
- Any removed or renamed export must update either this index or the generated replacement before feature migration.
- Every direct `ApiClient` response type must remain backed by a frontend export or an explicit generated-client exception.
