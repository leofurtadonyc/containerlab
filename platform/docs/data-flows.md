# Platform Data Flows

## Purpose

This document describes the major data flows in the platform and the boundaries that shape them.

The goal is to make it clear:

- how the platform integrates with lab topologies
- how observed state is expected to move through the system
- how product APIs and UI flows are separated from observability flows
- where ODL fits without taking over the architecture

## Current Status

The current repository state includes:

- a separate platform topology
- a live `app-api` read path for inventory, topology, policy, capabilities,
  platform status (including recovery summary), workflow-history, and audit-history
- a live `gnmi-collector` path with Nokia adapter boundaries and normalized
  deliveries to `app-api`
- Prometheus and Grafana with real scrape targets and bounded dashboard families
  for the current metrics
- Postgres with **bounded durable persistence** for normalized inventory,
  topology, and policy snapshots, sync-run records, readiness snapshots, and
  the history fields needed for week **16–20** coverage and source-readiness
  history (not a full durable domain model for every future product area)
- repo-built local images for the initial platform service set
- bounded post-deploy verification for the current core runtime contract, ODL
  credential path, preserved-baseline posture when artifacts exist, **conditional**
  devices/inventory history checks aligned with topology and policy history when
  Postgres holds inventory snapshot rows, and optional same-workspace restart drill
- **Readiness:** product and Grafana platform overview share **evaluation sample**
  (this response) versus **persisted snapshot** (last material change) vocabulary;
  observability mirrors numeric ages only—not validation or drift verdicts
- **Grafana honesty:** change-validation family is **markdown-only** (no fake
  metrics; not a validation engine); vendor/adapters overview uses **real**
  bounded collector and collector-boundary metrics (**Nokia-first** scope)—see
  `dashboards.md` and `production-readiness-assessment.md`
- **Investigation workspace (week 25):** **`GET /api/v1/investigation-workspace/context`** assembles nested **existing** responses (change-intelligence **`recent-summary`**, **`/api/v1/platform/status`**, **`/api/v1/capabilities`**) per **`investigation-workspace-contract.md`** / **`schemas/investigation_workspace.py`** / **`services/investigation_workspace.py`** / **`investigation_next_inspection.py`**—interpretation support only; **not** validation, execution, or safe-to-change authority; the response includes **`next_inspection_framing`** / **`next_inspection_suggestions`** (bounded navigation prompts from nested evidence fields only; **no** cross-domain scoring); **`verify-core-runtime.sh`** and repository **`pytest`** pin structural JSON shape (including suggestion-field presence on live stacks); **WebUI** **Overview** exposes a bounded **Open investigation workspace** entry (same **`sync_runs_limit`** window as the Overview recent-change summary) and **`view=investigation`** renders **`InvestigationWorkspaceProduct`**—safety framing, **recency anchors** (embedded timestamps only; not a unified event log), **cross-domain context** panels, domain-level recent-change rows, platform read paths, capabilities excerpt, **next-inspection** section—**not** workflow, approval, or forensic-chronology semantics
- **Path analysis (week 27):** **`GET /api/v1/policies/{policy_id}/path-analysis`** serves **`PathAnalysisViewResponse`** from **`services/path_analysis.py`** per **`path-analysis-contract.md`** / **`ADR-0002`**—policy-anchored intended vs observed hints, candidate-path summaries, evidence attribution, freshness, truth-alignment posture, caveats—**not** dataplane forwarding truth, TE resolution, or controller path authority; **404** when the policy id is absent from the current normalized policy inventory records
- **Degraded policy v1 (week 27):** each **`PolicyRecord`** on **`GET /api/v1/policies`** includes **`degraded_policy_v1`** assembled in **`services/degraded_policy_v1.py`** from normalized inventory fields only—see **`degraded-policy-v1-contract.md`**; explicit non-claims; **not** SLA, dataplane verdict, validation authority, or controller-computed policy truth; **WebUI** **Overview** (policy inventory card) and **Platform Health** (`navigateToPoliciesWithDegradedPolicyV1Posture`) surface bounded counts and drill down to **Policies** with **`degraded_policy_v1_posture`** URL sync
- **Topology ↔ policy naming pivots (week 27):** **`GET /api/v1/topology/objects/{object_id}/related-policies`** serves **`TopologyObjectRelatedPoliciesResponse`** from **`services/topology_related_policies.py`** per **`topology-related-policies-contract.md`**—string-equality pivot from a topology **node** or **link** id to **`PolicyInventoryRecord`** fields; **404** when the object id is not in the current topology snapshot—**not** operational dependency or TE path truth; **WebUI** **Topology** exposes **`TopologyRelatedPoliciesPanel`** (shared **`PolicyImpactSummaryBlock`** relationship context) on selected node and link detail rows, optional **`topology_object`** / **`topology_object_kind`** URL sync, and **Open policy details** navigates to **`view=policies`** with **`policy_id`** (Policies view reads **`policy_id`** from the query string when present); **`GET /api/v1/policies/{policy_id}/topology-impact`** (**`services/policy_topology_impact.py`**, inverse pivot) lists aligning topology objects for one policy—**WebUI** **Policies** **`PolicyTopologyImpactPanel`** with **Open in topology**
- **Failure impact v1 (week 28):** **`GET /api/v1/topology/objects/{object_id}/failure-impact`** serves **`FailureImpactViewResponse`** from **`services/failure_impact.py`** per **`failure-impact-contract.md`**—reuses the same topology object identity and related-policy set as related-policies, rolls up **`degraded_policy_v1`** postures and path-analysis support counts **within that set only**—**not** blast-radius simulation, **not** global policy health; **WebUI** **Topology** **`TopologyFailureImpactPanel`** (selected node/link) consumes the same contract with explicit non-claims and navigation to **Policies** / **Investigation**
- **Topology object evidence timeline v1 (week 36):** **`GET /api/v1/topology/objects/{object_id}/evidence-timeline`** serves **`TopologyObjectEvidenceTimelineResponse`** from **`services/topology_object_evidence_timeline.py`** per **`topology-object-evidence-timeline-contract.md`**—same **`object_id`** / **404** rules as related-policies; newest-first anchors from topology/failure-impact/related-policies/risk-summary excerpt plus **`policy_evidence_timeline_v1`** projections for related policies—**not** forensic chronology, pairing/coverage truth, or workflow order; **WebUI** **`TopologyObjectEvidenceTimelinePanel`** on **Topology** (selected node/link) and **Topology** dossier workspace; **`verify-core-runtime.sh`** structural **`GET`** when **`python3`** samples **`first_node_id`**
- **Topology object evidence delta v1 (week 36):** **`GET /api/v1/topology/objects/{object_id}/evidence-delta`** serves **`TopologyObjectEvidenceDeltaResponse`** from **`services/topology_object_evidence_delta.py`** per **`topology-object-evidence-delta-contract.md`**—same **`object_id`** / **404** rules; compares current related-policy membership, failure-impact rollups, degraded related members, bounded topology row fields, risk-summary **D/U/R/K** inputs, and caveat echoes **versus** a **previous** persisted normalized **topology** plus **policy** snapshot pair when policy history is **`comparison_ready`**; optional **`member_policy_delta_pointers`** to **`policy_evidence_delta_v1`**; **not** topology drift truth or blast-radius simulation; **WebUI** **`TopologyObjectEvidenceDeltaPanel`** on **Topology** (selected node/link) and **Topology** dossier workspace; **`verify-core-runtime.sh`** structural **`GET`** when **`python3`** samples **`first_node_id`**
- **Topology object stability profile v1 (week 37):** **`GET /api/v1/topology/objects/{object_id}/stability-profile`** serves **`topology_object_stability_profile_v1`** per **`topology-object-stability-profile-contract.md`** / **`schemas/topology_object_stability_profile.py`** / **`services/topology_object_stability_profile.py`** / **`routers/topology_object_stability_profile.py`**—same **`object_id`** / **404** rules as dossier/timeline/delta; **`primary_stability_posture`** and bounded cue lists from nested evidence-timeline, evidence-delta, failure-impact, and topology risk summary row excerpt; honest partial assembly via **`assembly_notes`** when a nested builder throws; **not** prediction, blast-radius truth, or substitute for dossier/timeline/delta contracts—**WebUI** later week **37** tasks
- **Service stability profile v1 (week 37):** **`GET /api/v1/services/{service_id}/stability-profile`** serves **`service_stability_profile_v1`** per **`service-stability-profile-contract.md`** / **`schemas/service_stability_profile.py`** / **`services/service_stability_profile.py`** / **`routers/service_stability_profile.py`**—same **`service_id`** / **404** family as Service Explorer detail and service evidence timeline/delta; **`primary_stability_posture`** and cue lists from service evidence-timeline, service evidence-delta, **`degraded_service`** roll-up, and optional service dossier **`merged_caveats`**; router registered **before** catch-all **`GET /services/{service_id}`**; partial nested assembly via **`assembly_notes`**; **not** SLA or customer-impact truth, **not** substitute for Explorer/dossier/timeline/delta—**WebUI** later week **37** tasks
- **Maintenance evidence workspace v1 (week 36):** **`GET /api/v1/maintenance-evidence-workspace`** (same subject selectors as **`GET /api/v1/maintenance-preview`**) serves **`MaintenanceEvidenceWorkspaceResponse`** from **`services/maintenance_evidence_workspace.py`** per **`maintenance-evidence-workspace-contract.md`**—nested **`maintenance_preview_v1`**, **`topology_object_dossier_v1`**, **`topology_object_evidence_timeline_v1`**, **`topology_object_evidence_delta_v1`**, and **`change_safety_case_v1`** (**`topology_change_safety`**, includes nested maintenance preview per CSC contract); **`merged_caveats`**, **`recommended_api_pivots`**; **not** **`evidence_export_v1`**, **not** approval or simulation truth; **WebUI** **`view=maintenance-evidence-workspace`** (**`MaintenanceEvidenceWorkspaceView`**) with the same shell **`maintenance_*`** subject parameters as Maintenance Preview; honest pivots from **Topology** dossier, **Maintenance Preview**, **Change Safety Case** (topology anchor), and **Service Impact Workspace**; repository **`vitest`** covers navigation URL builders and product static render
- **Topology risk summary v1 (week 28):** **`GET /api/v1/topology/risk-summary`** serves **`TopologyRiskSummaryResponse`** from **`services/topology_risk_summary.py`** per **`topology-risk-summary-contract.md`**—ranks all topology nodes and links by lexicographic **`D` / `U` / `R`** from the same related-policy and **`degraded_policy_v1`** rules as failure-impact—**not** SLA or traffic risk, **not** global policy ranking; aggregate **`missing_evidence_notes`** when path-analysis support is partial; **WebUI** **`TopologyRiskAttentionPanel`** on **Overview** (top rows + **Open in Topology** / **Open investigation** with **`inv_from=overview`** + **`risk_summary_entry=v1`**) and **Topology** (full list + **Select object** for in-page drill to related policies / failure-impact + **Open investigation** with **`inv_from=topology`** + **`risk_summary_entry=v1`**) — navigation-only shell; **not** `failure_impact_entry` (distinct client param)
- **Policy evidence timeline (week 28):** **`GET /api/v1/policies/{policy_id}/evidence-timeline`** serves **`PolicyEvidenceTimelineResponse`** from **`services/policy_evidence_timeline.py`** per **`policy-evidence-timeline-contract.md`**—newest-first typed anchors from current inventory, persisted history checkpoints (when the policy row exists in those snapshots), optional comparison span when two full persisted snapshots exist, path-analysis assembly time, and **`degraded_policy_v1`** context; **`missing_evidence_notes`** when evidence is sparse; **404** when the **`policy_id`** is absent from the normalized policy inventory—**not** a unified forensic chronology, **not** packet-path proof, **not** workflow execution truth; **WebUI** **Policies** **`PolicyEvidenceTimelinePanel`** surfaces the same response with loading/error states and read-only navigation to **Investigation** and **Path analysis**; **workflow-history** / **audit-history** may offer **Policy timeline** drillthrough from **`policy_comparison_to_previous.change_preview`** (client-only **`policy_evidence_timeline_focus`** URL hint for scroll/emphasis—not workflow scope)
- **Policy evidence delta (week 28):** **`GET /api/v1/policies/{policy_id}/evidence-delta`** serves **`PolicyEvidenceDeltaResponse`** from **`services/policy_evidence_delta.py`** per **`policy-evidence-delta-contract.md`**—when policy history exposes a bounded latest-two persisted comparison, compares the **current** inventory row to the **previous** persisted snapshot row for the same **`policy_id`**; emits categorized **`delta_items`**, honest **`comparison_status`** when no anchor exists or the policy row is absent from the anchor snapshot, **`caveats`** (including that path-analysis is only assembled for the current row), and explicit non-claims—**not** drift truth, **not** configuration diff authority; **404** when the **`policy_id`** is absent from the normalized policy inventory; **WebUI** **Policies** **`PolicyEvidenceDeltaPanel`** (selected policy, after evidence timeline) consumes the same response with bounded operator copy—**not** drift or validation semantics; client-only **`policy_evidence_delta_focus`** (with **`policy_evidence_timeline_focus`**) scrolls to and briefly emphasizes those panels after navigation—shell hints only, not app-api contracts
- **Overview operator workspace (week 28):** **WebUI** **Overview** **`OperatorWorkspaceEntry`** composes **read-only** navigation into **`#topology-risk-attention`**, **`view=topology`** (full ranked table), failure impact on the **first** topology node when nodes exist, and policy timeline/delta entry via the **first** policy id when policy rows exist—explicit honest absence copy when slices are empty; **not** new backend aggregation, **not** workflow or validation semantics; the existing **Investigation workspace (bounded)** card remains the detailed investigation entry with the same **`sync_runs_limit`** as recent-change
- **Devices ↔ related policies (week 27):** **WebUI** **Devices** reuses the same **`TopologyRelatedPoliciesPanel`** with **`objectKind=node`** and **`objectId=device_id`** when the inventory device id matches a topology **node** id (same bounded string pivot); selected row syncs **`device_id`** in the shell query string; **`navigateToPoliciesPolicyPathAnalysis`** opens **Policies** with **`policy_id`** and scrolls to **`#policy-path-analysis`**
- **Investigation navigation context (week 27):** the WebUI shell records optional client-only **`inv_from`** (`overview`, **`situation-room`**, **`topology`**, **`devices`**, **`policies`**) when launching **`view=investigation`** via **`navigateToInvestigationView`** so the investigation route can show a breadcrumb back to the prior surface; existing shell parameters (**`device_id`**, **`policy_id`**, **`topology_object`** / **`topology_object_kind`**, **`sync_runs_limit`**, filters) stay in the query string across pivots because navigation uses **`mergeViewIntoSearch`**—not an app-api contract and not operational truth
- **Investigation entry from failure impact (week 28):** **`TopologyFailureImpactPanel`** **Open in Investigation** passes **`topology_object`**, **`topology_object_kind`**, and client-only **`failure_impact_entry=v1`**; **`InvestigationNavContextBanner`** surfaces bounded read-only framing—**not** workflow or scoring semantics
- **Post-deploy structural checks (week 27–29):** **`verify-core-runtime.sh`** always asserts **`GET /api/v1/topology/risk-summary`** includes **`topology_risk_summary_v1`** and **`ranked_objects`**, **`GET /api/v1/operator-search?q=...`** includes **`operator_search_pivot_v1`**, and **`GET /api/v1/exports/situation-room/summary`** / **`GET /api/v1/exports/investigation-workspace/summary`** include **`evidence_export_v1`** (week **29** export envelope over existing assemblies). When **`python3`** is available, it samples the first policy id and first topology node id from the live compact **`/api/v1/policies`** and **`/api/v1/topology`** responses and asserts stable JSON substrings on **`GET /api/v1/policies/{policy_id}/path-analysis`**, **`GET /api/v1/policies/{policy_id}/evidence-timeline`**, **`GET /api/v1/policies/{policy_id}/evidence-delta`** (including **`comparison_status`**), **`GET /api/v1/topology/objects/{node_id}/related-policies`**, **`GET /api/v1/topology/objects/{node_id}/failure-impact`**, **`GET /api/v1/topology/objects/{node_id}/evidence-timeline`**, **`GET /api/v1/topology/objects/{node_id}/evidence-delta`**, **`GET /api/v1/exports/policies/{policy_id}/dossier`**, and **`GET /api/v1/exports/topology-objects/{node_id}/dossier`**, plus **`contract_id":"degraded_policy_v1"`** on policy items when the list is non-empty—**contract presence only**, not business-logic duplication; skipped with an honest **notice** when **`python3`** is missing or lists are empty (see **`deployment-runbook.md`**)
- **Evidence pack / situation room (week 26):** **`GET /api/v1/evidence-pack/situation`** composes **existing** read-side responses (devices, topology, policies, readiness snapshot history, workflow history, audit history) plus nested **`investigation_context`** (same investigation-workspace assembly family) per **`evidence-pack-contract.md`** / **`schemas/evidence_pack.py`** / **`services/situation_pack.py`** / **`services/situation_review_guidance.py`**—interpretation support only; the response includes backend **`situation_review_guidance`** (**`review_framing`**, **`explicit_missing_evidence_notes`**, sorted **`review_navigation_prompts`** with shell **`product_view`** targets; evidence-navigation only; **not** ranked execution steps, safe-to-change authority, or validation verdicts); **`verify-core-runtime.sh`** and repository **`pytest`** pin structural JSON shape on live stacks; **WebUI** **Overview** exposes **Situation room (bounded evidence pack)** and **`view=situation-room`** renders **`SituationRoomProduct`**—numbered cross-domain sections, explicit non-claims, assembly notes, nav hub—**not** Grafana-owned semantics; Grafana does not implement evidence-pack contracts
- **Evidence export v1 (week 29):** **`GET /api/v1/exports/...`** serializes the **same** Phase **2** read assemblies (policy dossier, topology object dossier, situation pack summary, investigation workspace summary) behind envelope **`evidence_export_v1`** per **`evidence-export-contract.md`** / **`schemas/evidence_export.py`** / **`services/evidence_export.py`** / **`routers/exports.py`**—JSON (canonical) or Markdown (`format` query); explicit **`export_framing`**, **`explicit_non_claims`**, and **`source_contract_ids`** echo nested **`contract_id`** values; **not** a new truth domain, compliance hold, tamper evidence, or substitute for live views; **WebUI** **`EvidenceExportActions`** + **`downloadEvidenceExport`** on dossier workspaces, **Situation room**, and **Investigation** offer bounded download actions; **`verify-core-runtime.sh`** includes structural substring checks on export URLs alongside existing dossier/pack checks when policy and topology samples exist; repository **`pytest`** / **`vitest`** cover export responses and UI wiring
- **Briefing export bundle + replay boundaries (week 30):** **`GET /api/v1/exports/operator-briefing`** returns **`briefing_export_bundle_v1`** per **`briefing-export-bundle-contract.md`** / **`routers/exports.py`**—ordered **`evidence_export_v1`** members for the same bounded context as **`GET /api/v1/operator-briefing`**; **`verify-core-runtime.sh`** asserts structural JSON on that route and shipped **`/assets/*.js`** markers (**`briefing_export_bundle_v1`**, **`evidence_replay_viewer_v1`**, **`operator_briefing_workspace_v1`**); **WebUI** **`view=operator-briefing`** offers **Briefing archive (bundle)** downloads plus per-surface **`evidence_export_v1`** exports; **`evidence_replay_viewer_v1`** (**`parseEvidenceExportJson`**) accepts **only** a root **`evidence_export_v1`** file—operators extract **member** JSON from a bundle for replay (see **`evidence-replay-viewer-contract.md`**); repository **`vitest`** covers bundle URL builders and replay parse rejection of bundle roots
- **Maintenance window handoff v1 (week 38):** **`GET /api/v1/exports/maintenance-window-handoff`** returns **`maintenance_window_handoff_v1`** per **`maintenance-window-handoff-contract.md`** / **`routers/exports.py`**—embeds **`maintenance_window_workspace_v1`** for the same query dimensions as **`GET /api/v1/maintenance-window-workspace`** (repeated **`subject`**, **`preview_context`**, **`sync_runs_limit`**, optional **`handoff_label`** / **`operator_note`**); **not** **`evidence_export_v1`**, **not** **`briefing_export_bundle_v1`**, **not** **`impact_report_v1`** or **`change_safety_case_v1`**; **`verify-core-runtime.sh`** asserts structural JSON on that route when a topology **`node_id`** sample exists (**`maintenance_window_handoff_v1`**, nested **`maintenance_window_workspace_v1`**)
- **Maintenance window workspace + week 38 verifier parity (week 38 Friday):** **`GET /api/v1/maintenance-window-workspace`** (repeated **`subject=`**, aligned with WebUI **`mww_subject`**) — structural **`verify-core-runtime.sh`** **`GET`** when **`python3`** samples **`first_node_id`** (**`maintenance_window_workspace_v1`**, **`deduped_affected_services`**); shipped **`/assets/*.js`** must include **`mww_subject`** alongside **`maintenance_window_workspace_v1`**; repository **`vitest`** **`week38-verifier-bundle-markers.test.ts`** pins **`mww_subject`** / client route / NOC + global-search pivot sources—**not** business-logic replay of app-api assembly
- **Impact Report vs evidence replay (week 31):** **`GET /api/v1/reports/...`** returns **`impact_report_v1`** per **`impact-report-contract.md`** / **`routers/reports.py`**; **`evidence_replay_viewer_v1`** accepts **only** root **`evidence_export_v1`** from **`GET /api/v1/exports/...`**—**`impact_report_v1`** downloads are **not** evidence-replay inputs; **`verify-core-runtime.sh`** asserts structural substrings on **`/api/v1/reports/policy-impact`** and **`/api/v1/reports/maintenance-impact`** when policy and topology samples exist; repository **`vitest`** rejects **`impact_report_v1`** in **`parseEvidenceExportJson`**
- **Operator contract labeling (week 35):** WebUI copy reinforces boundaries between **Service Explorer** (list/detail GET) vs **Service dossier** / **Service Impact workspace** (composed shells); **Change Safety Case** vs **Impact Report** vs **`evidence_export_v1`** downloads vs **Evidence replay** (offline file viewer)—see **`week-33-bounded-next-slice-recommendation.md`**; **no** new APIs or response shapes
- **Evidence consistency summary + verifier parity (week 35):** **`GET /api/v1/evidence-consistency/summary`** serves **`evidence_consistency_summary_v1`** per **`evidence-consistency-summary-contract.md`**; **`verify-core-runtime.sh`** asserts structural JSON (**`contract_id`**, **`items`**, **`sync_runs_limit_applied`**, **`safety_framing`**) and shipped **`/assets/*.js`** substring **`evidence_consistency_summary_v1`** (Overview/NOC + **`view=evidence-consistency`** workspace); repository **`pytest`** **`test_evidence_consistency_summary.py`**; **not** validation or drift engines
- **Operational stability summary (week 37):** **`GET /api/v1/stability/summary`** serves **`operational_stability_summary_v1`** per **`operational-stability-summary-contract.md`** / **`schemas/operational_stability_summary.py`** / **`services/operational_stability_summary.py`**—bounded **`operational_stability_posture`** and rows from existing **change intelligence** plus optional **policies** / **devices** / **topology** list assemblies only; optional **`sync_runs_limit`** query (aligned with change-intelligence bounds); repository **`pytest`** **`test_operational_stability_summary.py`**; **not** prediction, unified health score, or substitute for **evidence consistency**—**WebUI** **`view=stability-workspace`** (**`StabilityWorkspaceView`**) consumes the same contract with optional **`topology_object_stability_profile_v1`** / **`service_stability_profile_v1`** anchors via shell query params; repository **`vitest`** stability-workspace tests
- **Stability workspace cross-surface pivots (week 37 Thursday task 02):** **`navigateToStabilityWorkspace`** links **Overview** / **NOC** (**`StabilityOverviewEntry`**, same **`operational_stability_summary_v1`** preview as Overview standard mode), **topology object dossier**, **service dossier**, **maintenance preview**, **maintenance evidence workspace**, **change safety case** (bounded window when no anchor; **`service_id`** when **`service_change_safety`**; **`topology_object`** / **`topology_object_kind`** when **`topology_change_safety`**), **operator briefing** (topology dossier anchor when present; otherwise window-only), and **global operator search** deeplinks where **`operator_search_pivot_v1`** already exposes **`topology_object`** / **`topology_object_kind`** or **`policy_id`** (policy-shaped **`service_id`**=`policy:…`), echoing **`global_search_q`** when applicable—**not** new search corpus or ranking, **not** conflation with **`evidence_consistency`** or **`maintenance_evidence_workspace_v1`**
- **Week 37 verifier + runbook alignment (Friday task 01):** **`verify-core-runtime.sh`** asserts structural JSON on **`GET /api/v1/stability/summary?sync_runs_limit=10`** and, when **`python3`** samples topology **`node_id`** and Service Explorer **`service_id`**, on **`GET /api/v1/topology/objects/{node_id}/stability-profile`** and **`GET /api/v1/services/{service_id}/stability-profile`**; shipped **`/assets/*.js`** must include **`operational_stability_summary_v1`** (alongside prior bundle markers); repository **`vitest`** **`week37-verifier-bundle-markers.test.ts`** pins **`operational_stability_summary_v1`** / profile contract id comments in **`contracts.ts`** and stability workspace sources—**structural parity only**, not shell-side business logic (see **`deployment-runbook.md`**)
- **Global operator search — week 31 pivots (week 31):** **`GlobalOperatorSearch`** secondary actions include **impact report** (policy- and maintenance-shaped anchors, with honest `title` copy) and **`Impact report hub`**, alongside existing Service Explorer, explainability, maintenance preview, briefing, digest, and investigation shortcuts — still **`operator_search_pivot_v1`** / **`GET /api/v1/operator-search`** only; **`verify-core-runtime.sh`** checks **`Impact report hub`**, **`service_explorer_v1`**, and **`policy_explainability_workspace_v1`** in shipped **`/assets/*.js`**, and **`GET /api/v1/maintenance-preview`** (sampled topology **`node_id`**) when nodes exist; **`operator-search-contract.md`** pivot table updated
- **NOC cockpit / global search / briefing — maintenance evidence (week 36):** **`noc_cockpit_v1`** priority navigation and primary launch grid add **`maintenance_evidence_workspace_v1`** pivots (same topology anchors as maintenance preview); **`GlobalOperatorSearch`** adds **Maintenance evidence workspace** for topology hits; **`operator_briefing_workspace_v1`** WebUI adds **Live pivots** + export intro honesty for **Maintenance evidence** vs **`evidence_export_v1`** / **`briefing_export_bundle_v1`**; **`verify-core-runtime.sh`** asserts **`maintenance_evidence_workspace_v1`** in shipped **`/assets/*.js`**; **`docs/noc-cockpit-contract.md`**, **`operator-search-contract.md`**, **`operator-briefing-workspace-contract.md`** aligned
- **Week 36 verifier + runbook alignment (Friday task 01):** **`verify-core-runtime.sh`** adds compact **`GET /api/v1/maintenance-evidence-workspace?node_id=…&preview_context=topology_drilldown`** substring checks (**`maintenance_evidence_workspace_v1`**, nested **`maintenance_preview_v1`**, **`topology_change_safety`**) when **`python3`** samples a topology **`node_id`**; **`deployment-runbook.md`** documents the **`app-api`** branch and bundle marker; repository **`vitest`** **`week36-verifier-bundle-markers.test.ts`** pins **`topology_object_evidence_timeline_v1`**, **`topology_object_evidence_delta_v1`**, and **`maintenance_evidence_workspace_v1`** in sources wired into the app bundle—structural parity only
- **Service Dossier v1 (week 32):** **`GET /api/v1/services/{service_id}/dossier`** serves **`ServiceDossierResponse`** with **`contract_id`** **`service_dossier_v1`** per **`service-dossier-contract.md`** — composed **read-side** assembly over Service Explorer detail, optional explainability/maintenance/impact pivots, merged caveats; **not** a new service registry or traffic proof; **WebUI** **`view=service-dossier`** with **`service_id`**; NOC cockpit and global search offer bounded **Service dossier** navigators (week **32** Tuesday + Friday)—same search contract as week **29–31**; **`verify-core-runtime.sh`** performs bounded structural **`GET`** sampling when **`python3`** and Service Explorer **`items`** exist (plus **`service_dossier_v1`** bundle marker)—[`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md)
- **Change Safety Case v1 (week 32):** **`GET /api/v1/reports/change-safety-case/policy`**, **`…/service`**, **`…/maintenance`** return **`change_safety_case_v1`** per **`change-safety-case-contract.md`** — pre-change **interpretation** packaging over reused evidence, **`evidence_gaps`**, advisory **next-review** framing; **not** dry-run, approval, simulation, or actuation authority; **WebUI** **`view=change-safety-case`** with bounded URL context; report downloads use the same routes—**not** **`evidence_export_v1`**; **`evidence_replay_viewer_v1`** rejects root **`change_safety_case_v1`** (parallel to **`impact_report_v1`**); NOC cockpit + global search add **Change safety case** pivots and **Change safety case hub** (week **32** Friday); **`verify-core-runtime.sh`** asserts **`change_safety_case_v1`** in shipped **`/assets/*.js`** and may **`GET`** the three report routes when **`python3`** sampling gates match—[`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md)
- **Global operator search — week 32 integration (week 32):** extends week **31** pivots with **Service dossier** (policy-shaped) and **Change safety case** (policy, maintenance, hub)—still no new search backend; **`verify-core-runtime.sh`** requires **`service_dossier_v1`** in shipped **`/assets/*.js`** and may **`GET`** **`/api/v1/services/{service_id}/dossier`** when sampling gates match
- **Change intelligence (week 24):** backend-owned bounded vocabulary and
  **`GET /api/v1/change-intelligence/recent-summary`** cross-domain summary over
  existing snapshot metrics, readiness snapshot recency context, and sync-run history—see
  `change-intelligence-contract.md`; **WebUI** **Overview** (**`RecentChangeIntelligencePanel`**) and
  **Platform Health** (coarse supporting card + trust cue) consume the same contract with explicit
  non-claims; **read-only** **`view=`** drilldowns jump from the panel to **Devices**, **Topology**,
  **Policies**, **Workflow history**, and **Audit history** (lists are **not** filtered by the summary
  window); **Workflow history** and **Audit history** pages link back to **Overview** for the bounded
  aggregate panel—interpretation and navigation only; **`verify-core-runtime.sh`** includes **structural**
  substring checks on the live **`recent-summary`** JSON (contract id, window semantics, key domain fields,
  **`sync_runs_limit`** echo)—**not** validation, drift detection, safe-to-change scoring, or workflow
  authority; summaries remain **app-api**–owned (Grafana does not implement this semantics layer)

It does not yet include:

- substantive ODL integration beyond the bounded platform-health probe
- workflow execution, dry-run APIs, or workflow-owned durable storage

The workflow-history and audit-history frontend views are read-only product pages
with persisted context, topology coverage and policy source-readiness posture in
history where records exist, baseline summaries (preserved versus new baseline),
and operator documentation for the same-workspace restart drill that proves
preserved-baseline recovery only when host-backed Postgres data survives.

This document explains the current flow direction honestly, including which paths are useful today and which remain scaffolded.

## Persisted Vs Transient

At the current stage, the platform uses both durable and transient read-side behavior.

Persisted today:

- normalized inventory snapshots written by `app-api` to Postgres
- normalized topology snapshots, node records, and link records written by `app-api` to Postgres
- normalized policy snapshots, policy records, and candidate-path records written by `app-api` to Postgres
- sync-run records for those bounded inventory, topology, and policy persistence writes

Transient today:

- live collector responses fetched over HTTP from `gnmi-collector`
- in-memory metrics caches inside `app-api` and `gnmi-collector`
- frontend UI state in `app-web`

Fallback behavior today:

- devices use the live collector-backed read path first and fall back to the latest persisted normalized inventory snapshot only when that live path is unavailable
- topology uses the live collector-backed read path first and falls back to the latest persisted normalized topology snapshot only when that live path is unavailable
- policy uses the live collector-backed read path first and falls back to the latest persisted normalized policy snapshot only when that live path is unavailable
- workflow-history and audit-history are read from persisted sync-run activity, but they still do not represent a full workflow engine or user-action audit log

Current truth labels today:

- `live` means the response is primarily backed by the active collector-to-backend read path
- `persisted_fallback` means the live collector path could not be used and the response is serving the latest persisted normalized snapshot
- `preserved_same_workspace_baseline` means at least one bounded persisted application artifact still exists in Postgres after restart or redeploy in the same workspace; it does not mean every read-side slice has a persisted fallback anchor
- `new_baseline` means the current runtime is rebuilding its persisted anchors from the current environment because no bounded persisted application artifacts are presently available in Postgres
- `inferred` currently describes bounded topology knowledge that is derived from interface-state interpretation rather than protocol-derived adjacency truth
- `partial` means the platform is intentionally exposing bounded read-side knowledge rather than claiming full operational truth
- `unavailable` means the backend does not currently have the additional persisted evidence required to build a bounded comparison view
- `stale` is currently a frontend interpretation used mainly by workflow-history and audit-history pages to describe the age of persisted sync-derived evidence relative to page generation time

Collector-boundary latency and failure posture (bounded):

- `app-api` calls the collector on a **bounded per-path latency budget** (configured timeout); this is a **fail-fast** boundary so product APIs do not block indefinitely on a slow collector.
- **`timeout_budget_exceeded`** means the fetch **ran out of budget**—`app-api` **stopped waiting** for the collector response. That is **not** the same as a connection refused, HTTP error, or invalid payload; those are **separate** classified boundary failures.
- After **any** boundary failure or timeout, slice responses may use **persisted fallback** when a snapshot exists, or **blocked / empty** posture when it does not; **`serving_mode`** and **`evidence_confidence`** on each slice API explain the result—not Grafana.
- **`partial_live_feed`** means the fetch **finished within budget** but the collector still returned only **bounded partial** live coverage; platform status may mark the read path **degraded** even though the budget was not exceeded.
- **`/api/v1/platform/status`** `read_paths[].notes` may include a short **latency posture line** for operators; it supplements but does not replace slice-level serving and evidence fields.

## Read-side query ergonomics (Phase 2)

Read-only list endpoints may expose **bounded optional query parameters** so clients can reduce payload size without implying new truth semantics. Shared rules:

- **Primary flat lists:** `GET /api/v1/devices` and `GET /api/v1/policies` accept an optional `limit` query parameter (integer **1–500**). When present, the response truncates the **`items`** array only. **`count`** and **`read_side_query.items_total`** remain the **full logical list size** before truncation; **`read_side_query`** echoes `limit_requested`, `items_total`, and `items_returned` so truncation is never mistaken for inventory shrinkage.
- **History snapshot summaries:** the same two endpoints accept optional **`history_recent_limit`** (integer **1–50**, default **3**). It controls how many persisted snapshot **summary** rows appear in **`history.recent_snapshots`**. It does **not** change latest-versus-previous **comparison** semantics (that still uses the two newest full persisted snapshots). **`read_side_query`** echoes `history_recent_limit_requested`, `history_recent_limit_effective`, and `history_recent_snapshots_returned` (the latter may be fewer than the effective limit when Postgres holds fewer rows).
- **Not supported via query:** free-text search, arbitrary filters that claim new domains, workflow or dry-run flags, vendor-specific query vocabulary on generic routes, or unbounded pagination cursors.
- **Workflow history (`GET /api/v1/workflow-history`):** optional **`limit`** on the primary **`items`** list (same **1–500** rule and honest **`count`** / **`read_side_query.items_total`** semantics as devices/policies). Optional **`sync_runs_limit`** (**1–100**, default **50**) bounds how many persisted sync-run rows are loaded before building items. **`read_side_query`** echoes primary `limit` plus `sync_runs_limit_*`; history-recent fields are **`null`** (not applicable).
- **Audit history (`GET /api/v1/audit-history`):** same optional **`limit`** on **`items`** and **`sync_runs_limit`** as workflow-history, plus optional **`readiness_snapshot_history_limit`** (**1–50**, default **20**) for persisted readiness snapshot rows merged with sync events before sort. Echo includes `readiness_snapshot_history_limit_*` alongside the primary list and sync-run limits.
- **Topology:** `GET /api/v1/topology` does not apply `limit` to nested `nodes` / `links` in the current contract—graph payloads need a separate truncation story.

Implementation reference: `platform/app-api/src/app_api/schemas/read_side_query.py` and `platform/app-api/src/app_api/dependencies/read_side_query.py`.

- **WebUI:** the Phase 2 WebUI keeps **`view`** in the page URL (`?view=devices`, etc.) and mirrors the same bounded query parameter names for devices, policies, workflow-history, and audit-history so operator filtered views are shareable from the address bar. Typed parsing and merge helpers live under `platform/app-web/src/api/read-side-query-params.ts` with URL helpers under `platform/app-web/src/lib/url-app-state.ts`. Selected workflow-history and audit-history rows can open **read-only** “related product surface” navigation (Devices, Topology, Policies, Readiness) by switching **`view=`**—bounded drill-down for operator context, not workflow execution or new backend filters.
- **Readiness / capability decision-support URLs (week 23):** on **`view=readiness`** (and navigation into Readiness from Capabilities or history drilldowns), the WebUI uses bounded **`readiness_blocker`**, **`readiness_prerequisite`**, and **`readiness_capability_feature`** query parameters for scroll alignment and shareable context—**product navigation only**; they do not authorize workflow steps or change backend filtering beyond the documented **`readiness-snapshot-history`** optional **`blocker`** filter. The **`/api/v1/capabilities`** response exposes **`related_readiness_blockers`** on capability rows and **`related_prerequisites`** on **`dry_run_readiness`** blockers so the UI can cross-link consistently with **`readiness-capability-decision-support-contract.md`**.

Important current limitation:

- the current topology now uses host-backed Postgres, Prometheus, and Grafana data directories, so bounded read-side state and observability state survive normal container replacement within the same workspace, but backup, restore, and broader lifecycle hardening are still intentionally out of scope

## Deployment And Integration Model

The platform and the labs are deployed separately.

The default integration model is management-plane-first:

- lab devices expose management reachability
- platform services connect over that management path
- no direct data-plane coupling is assumed
- no lab-specific direct wiring is treated as the default design

This keeps the platform reusable across multiple lab scenarios.

## Core Flow Categories

The main platform flow categories are:

- collector-to-backend observed-state flow
- backend-to-frontend product flow
- metrics flow
- bounded ODL integration flow
- database persistence flow

## Collector To Backend Flow

This is the primary observed-state path for the platform.

Intended flow:

1. `gnmi-collector` connects to devices over gNMI on the management plane.
2. Vendor-specific collection logic runs inside named adapter boundaries.
3. Raw records are mapped into normalized platform-friendly shapes.
4. The collector delivers normalized outputs to `app-api` through a bounded integration path.
5. `app-api` becomes responsible for product-facing interpretation and future persistence decisions.

Boundary rules:

- raw vendor payloads must not become the product API
- adapter logic must stay inside the collector or explicit backend integration boundaries
- the collector does not become the product brain

Current state:

- collector package structure exists
- adapter and mapping scaffolding exist
- narrow normalized inventory, topology, and policy delivery shapes now exist between the collector and the backend
- live transport from the collector process into `app-api` now exists for those bounded read-side slices
- those bounded collector deliveries now also carry configured-target coverage, observed-target counts, freshness-window timestamps, degraded-scope summaries, and policy detail-ready posture so `app-api` can expose clearer product trust cues without inventing fuller truth

Current topology coverage semantics:

- the current topology path now uses the explicit coverage vocabulary defined in `platform/schemas/topology/topology-read-path-coverage-semantics.md`
- collector delivery now carries the smallest honest endpoint-pairing signals the live evidence supports, centered on per-link `endpoint_pairing_state` plus aggregate `paired_link_count` and `single_sided_link_count`
- collector delivery now also carries an aggregate `endpoint_pairing_posture`, but that remains a bounded coverage observation rather than a product verdict
- collector-side endpoint-pairing semantics must not imply protocol adjacency truth, path validity, or controller agreement

## Backend To Frontend Flow

This is the primary product flow.

Intended flow:

1. `app-api` exposes versioned APIs.
2. `app-web` consumes those APIs.
3. The frontend renders product pages, navigation, and operator-facing views.
4. Business logic stays in `app-api`, not in the frontend.

Boundary rules:

- `app-web` does not talk directly to Postgres
- `app-web` does not talk directly to `gnmi-collector`
- `app-web` does not talk directly to ODL
- the frontend is API-driven

Current state:

- backend health and metrics endpoints exist
- versioned read-only inventory, topology, policy, capability, and platform status endpoints now exist as bounded live product contracts
- the current inventory API is fed by a bounded normalized live collector contract and now also exposes explicit serving-mode plus current-versus-latest-persisted comparison semantics where a persisted inventory snapshot exists
- the current topology API is fed by a backend-owned normalized live read model that explicitly marks partial and unknown state and now also exposes explicit serving-mode plus current-versus-latest-persisted topology comparison semantics
- the current topology API and the topology read-path row in platform status now also carry explicit endpoint-pairing posture plus paired-versus-single-sided inferred-link counts owned by the backend contract
- the current policy API is fed by a backend-owned normalized live read model that explicitly marks support, observed, and unknown state and now also exposes explicit serving-mode plus current-versus-latest-persisted policy comparison semantics
- inventory and topology may be served from the latest persisted normalized snapshot if the live collector boundary is temporarily unavailable
- policy may now also be served from the latest persisted normalized policy snapshot if the live collector boundary is temporarily unavailable
- useful frontend read-only pages now consume those stable contracts for overview, platform health, devices, topology, policies, and capabilities
- overview and platform health now also surface the backend-owned bounded read-path coverage, freshness-window, and degraded-scope posture that the platform-status contract exposes for inventory, topology, and policy
- the platform-status contract now also exposes a backend-owned `recovery` summary so product, verifier, and observability consumers can reuse one bounded same-workspace preserved-baseline versus new-baseline contract instead of inferring recovery posture independently
- workflow-history and audit-history pages now interpret persisted sync-derived evidence using bounded recency and comparison cues, and surface the response-level baseline summary so operators can see preserved-baseline versus new-baseline posture directly; those remain product-facing explanations rather than workflow, audit-forensics, or validation conclusions
- **Readiness (capabilities / Readiness view):** distinguish **evaluation sample** time (bounded assembly for this response, e.g. `generated_at`) from **persisted snapshot** time (last material change to the persisted readiness row, e.g. `readiness_persisted_at`). Grafana’s platform overview uses the same phrases for observability-only stat panels; neither implies a validation engine, dry-run, or full readiness truth. **Decision-support linking** between capability rows, prerequisites, blockers, and planning scopes follows **`readiness-capability-decision-support-contract.md`** (read-only interpretation, not workflow authority). **`GET /api/v1/readiness-snapshot-history`** offers bounded optional `limit`, `blocker` (`ReadinessBlockerName`), and `include_blockers_detail` for persisted snapshot rows—planning-support inspection only, with honest **`read_side_query`** echo and **`empty`** when no snapshots exist. Live **`verify-core-runtime.sh`** includes structural substring checks that **`/api/v1/capabilities`** still returns the **`related_readiness_blockers`** and **`related_prerequisites`** JSON keys—field presence only, same honesty model as other compact JSON gates.

Current topology coverage semantics:

- the backend remains the owner of product-facing topology coverage semantics
- the topology product contract now carries explicit bounded endpoint-pairing semantics rather than leaving all pairing posture implicit in generic attributes and prose
- the implemented additions are aggregate `endpoint_pairing_posture`, `paired_link_count`, and `single_sided_link_count`, plus per-link `endpoint_pairing_state` and `endpoint_evidence_count`
- these fields remain bounded trust cues only and must not be interpreted as topology validation, adjacency validation, or workflow eligibility

Current comparison semantics:

- devices compare the current normalized inventory response against the latest persisted normalized inventory snapshot when one exists and the current response is still live-backed
- devices also expose a short recent persisted inventory snapshot window and a bounded latest-versus-previous persisted inventory comparison when those persisted records exist; **`history.recent_snapshots`** summaries include anchors such as **`sync_run_id`**, **`source_endpoint`**, **`persisted_at`**, **`observed_at`**, sync/data posture, and aggregate counts, and **`history.comparison_to_previous`** may include bounded **`change_preview`** and related comparison fields when two snapshots exist—these are product/API contracts on **`/api/v1/devices`** (and mirrored on workflow-history and audit-history inventory envelopes where applicable), not Grafana timelines
- topology compares the current normalized topology response against the latest persisted normalized topology snapshot when one exists and the current response is still live-backed
- topology also exposes a short recent persisted topology snapshot window and a bounded latest-versus-previous persisted topology comparison when those persisted records exist
- topology history and comparison now carry derived coverage posture (inference, endpoint-pairing, collection, node-participation postures plus paired/single-sided and linked/isolated counts) as trust cues, not validation conclusions; persisted topology link rows store `endpoint_pairing_state` and `endpoint_evidence_count` in JSON `attributes` so history loads can recompute the same vocabulary after restart
- the topology product page surfaces persisted coverage posture in recent-snapshot and comparison readouts so operators can see how coverage changed across persisted snapshots; these remain persisted coverage cues only, not drift or fault verdicts
- policies compare the current normalized policy response against the latest persisted normalized policy snapshot, and may also compare the latest persisted policy snapshot against the immediately previous persisted policy snapshot for bounded history support
- policy history and comparison now expose persisted source-readiness posture and counts (detail-ready targets, no-policies-observed targets, etc.) so operators can see how coverage changed across persisted snapshots; these remain coverage cues only, not validation verdicts
- **Product versus Grafana:** persisted **policy history** (recent snapshots, comparison, source-readiness **across** snapshots) is owned by **`app-api` `/api/v1/policies` and the WebUI**; Grafana’s SR policy dashboards intentionally mirror **current** numeric posture (gaps, labels, sync evidence) and explicit scope text, not snapshot-to-snapshot history or drift conclusions; **`app-api`** **`/metrics`** may also expose **`platform_app_api_policy_snapshots_persisted_total`** and **`platform_app_api_policy_snapshot_latest_persisted_at_seconds`** (Postgres **`policy_snapshots`** row count and latest **`persisted_at`**) plus existing **`platform_app_api_sync_run_*`** history metrics—numeric depth and chronology only, not replacement **`history`** semantics
- **Product versus Grafana (devices inventory history):** rich **`/api/v1/devices`** **`history`** (recent snapshots, **`comparison_to_previous`**, **`change_preview`**, honest empty-baseline notices in the verifier) is owned by **`app-api` and the WebUI** (Devices page, Overview/Platform Health cues); Grafana and **`/metrics`** may expose only low-cardinality mirrors such as **`platform_app_api_inventory_snapshots_persisted_total`** and **`platform_app_api_inventory_snapshot_latest_persisted_at_seconds`** (Postgres **`inventory_snapshots`** table row count and latest **`persisted_at`**) plus existing **`platform_app_api_sync_run_*`** history metrics—numeric depth and chronology only, not replacement history semantics
- workflow-history and audit-history may attach bounded inventory, topology, and policy snapshot context plus immediate previous-snapshot comparison evidence where those persisted sync-run records exist
- for inventory on **workflow-history** and **audit-history** items, `inventory_snapshot_summary` and `inventory_comparison_to_previous` mirror the persisted sync-run envelope field-for-field in JSON: when no comparison row was attached to that run, **`inventory_comparison_to_previous` is `null`**—the API does not synthesize a zero-delta comparison object; `app-api` pytest pins the full comparison shape when present and this honest-null path (same pattern as topology snapshot-without-comparison)
- workflow-history and audit-history responses now expose a response-level `baseline_summary` so operators can tell whether those views reflect preserved sync-derived history from the current workspace baseline or are effectively starting from a new baseline after restart or redeploy; the summary is derived from persisted sync-run and readiness-snapshot presence plus current response posture and remains bounded to preserved-baseline versus new-baseline and available-history-window interpretation
- none of these comparisons currently claim policy correctness, topology validity, intended-versus-observed reconciliation, or automated remediation guidance

## Inventory Read-Model Limitations

The current inventory read model is intentionally conservative.

What is real today:

- the devices API returns a stable platform-owned structure for device identity, platform, role, management address, collector status, and capability posture
- live collector-backed inventory remains the primary read path
- the backend now persists bounded normalized inventory snapshots and can fall back to the latest persisted snapshot when live collection is unavailable
- the devices response can now distinguish live collection, persisted fallback, and comparison-unavailable versus comparison-ready states explicitly
- the devices response now also exposes a short recent persisted snapshot window plus bounded latest-versus-previous persisted comparison support where those normalized persisted records exist

What remains partial:

- the inventory slice does not yet represent intended device state, validated lifecycle state, or controller-derived truth
- persisted inventory support is intentionally limited to bounded normalized snapshot comparison rather than a final durable device domain model
- inventory comparison counts remain explanatory summaries over normalized device attributes rather than drift judgments or operator recommendations

## Topology Read-Model Limitations

The current topology read model is intentionally conservative.

What is real today:

- the topology API returns a stable platform-owned structure for nodes, links, source, sync status, completeness, timestamps, and notes
- partial and unknown states are explicit in the contract
- the backend owns the read model rather than exposing collector or controller-native shapes
- the topology response now also carries a bounded `coverage_summary` and per-link endpoint-pairing fields so operators can distinguish paired versus single-sided inferred evidence more directly
- the backend now persists bounded normalized topology snapshots and can fall back to the latest persisted snapshot when live collection is unavailable
- the topology response can now distinguish live collection, persisted fallback, and comparison-unavailable versus comparison-ready states explicitly
- the topology response now also exposes a short recent persisted snapshot window plus bounded latest-versus-previous persisted comparison support where those normalized persisted records exist
- topology history snapshots and comparisons now include derived coverage posture (inference, endpoint-pairing, collection, node-participation postures and paired/single-sided/linked/isolated counts) as bounded trust cues; workflow-history and audit-history topology summaries carry the same coverage context where honest persisted records exist

What remains partial:

- the topology does not yet represent full adjacency discovery
- the graph remains a bounded live slice rather than comprehensive operational truth
- persisted topology support is intentionally limited to normalized snapshot history rather than a final topology database design
- comparison counts describe bounded normalized node and link differences, not protocol-adjacency validation, path computation, or controller truth

Current topology coverage interpretation:

- the current topology contract now sharpens endpoint-pairing and single-sided-link interpretation inside the existing bounded inferred slice without redesigning the broader topology-source model
- `paired` means both endpoints were observed for one emitted inferred link; it does not mean validated adjacency truth
- `partially_paired` is an aggregate posture meaning the response includes both paired and single-sided links; it does not mean measured global topology completeness
- `single_sided` means emitted inferred links currently rely on one observed endpoint; it does not automatically mean operational fault
- `unknown` should remain rare and should only be used when the runtime cannot classify pairing honestly from emitted normalized evidence

## Policy Read-Model Limitations

The current policy read model is also intentionally conservative.

What is real today:

- the policies API returns a stable platform-owned structure for policy inventory
- intended, observed, support, and health states are explicit
- candidate paths are represented in a normalized form rather than as vendor-native payloads
- the backend exposes current live policy observations and now persists bounded normalized policy snapshots plus candidate-path records to Postgres
- the policy response can now distinguish live collection, persisted fallback, and comparison-unavailable versus comparison-ready states explicitly, both for current-versus-latest-persisted and bounded persisted-versus-previous history views
- policy history snapshots and comparisons now include source-readiness posture and counts (detail-ready targets, no-policies-observed targets, etc.) as bounded trust cues; workflow-history and audit-history policy summaries carry the same source-readiness context where honest persisted records exist
- for policy sync-derived **workflow-history** and **audit-history** items, when a persisted policy snapshot is attached, the envelope mirrors `/api/v1/policies` history semantics: snapshot summaries include posture plus detail-ready, no-policies-observed, detail-unavailable, and partial-detail target counts, and `policy_comparison_to_previous` (when present) carries **current** and **previous** values for those counts alongside readiness posture—still coverage cues from persisted rows only, not workflow execution or validation

What remains partial:

- the policy inventory is backed only by a bounded live SR policy counter slice rather than full per-policy or controller-derived state
- persisted policy support is intentionally limited to bounded normalized snapshot history rather than a final durable policy database design
- support states such as `unknown` and `not_implemented_in_platform` are expected and honest in the current phase
- candidate path data remains absent or bounded rather than validated operational path computation
- no policy details, editing, validation, or workflow execution flows exist yet
- comparison counts remain explanatory summaries over normalized policy observations rather than a drift verdict, validation result, or action recommendation

## Metrics Flow

This is the observability flow, not the product data flow.

Intended flow:

1. platform services expose `/metrics` endpoints where appropriate
2. `prometheus` scrapes those endpoints
3. Prometheus stores and evaluates time-series data
4. `grafana` queries Prometheus
5. Grafana presents dashboard views and observability drilldowns

Expected metric sources over time:

- `app-api`
- `gnmi-collector`
- ODL where useful
- Prometheus itself
- Grafana where useful
- future exporters such as a Postgres exporter

Boundary rules:

- Prometheus is not the application database
- Grafana is not the product UI
- observability data must not replace normalized product models

Current state:

- Prometheus scrape configuration exists
- Grafana provisioning exists
- placeholder dashboard families exist
- `app-api` now exposes bounded HTTP request and latency metrics
- `gnmi-collector` now exposes bounded inventory collection, normalization, and backend-readiness metrics
- `gnmi-collector` now also exposes bounded observed-target coverage and observation-age metrics for inventory, topology, and policy plus policy detail-ready target counts, which the platform overview dashboard can use directly
- Prometheus should actively scrape only the currently real service metrics targets and keep the remaining service targets documented as future placeholders
- `verify-core-runtime` now provides one bounded post-deploy regression for Prometheus readiness, current real target discovery, Grafana health, datasource provisioning, and overview dashboard discovery

Current product-versus-observability split:

- `app-api` and `app-web` carry the human-readable degraded-scope summaries and bounded read-path explanations
- Prometheus and Grafana carry the numeric proxies for those same conditions, such as observed-versus-configured target gaps, freshness age, paired-versus-single-sided topology evidence counts or shares, and policy detail-ready gaps
- observability panels therefore reinforce the product posture without becoming a second product contract
- **Persisted history (policy, topology, devices inventory):** snapshot lists, comparisons, source-readiness or coverage **across** time, and (for devices) **`history`** snapshot/comparison **`change_preview`** and related fields are **product-owned** via `app-api` and WebUI; Grafana mirrors **current** posture, sync-run history metrics, and bounded **`inventory_snapshots`** and **`policy_snapshots`** table gauges (**`platform_app_api_inventory_snapshots_persisted_total`**, **`platform_app_api_inventory_snapshot_latest_persisted_at_seconds`**, **`platform_app_api_policy_snapshots_persisted_total`**, **`platform_app_api_policy_snapshot_latest_persisted_at_seconds`**) with explicit scope text—not snapshot-to-snapshot product history timelines, drift verdicts, or validation semantics (see `policy-truth-depth-review.md`, `dashboards.md`, and `deployment-runbook.md` verifier sections)
- **Change-validation and vendor dashboard families:** text-only or real-metrics honesty as provisioned; Grafana is **not** a change-validation engine—see `dashboards.md`

Week 14 topology split:

- `app-api` and `app-web` should carry the human-readable endpoint-pairing vocabulary and the bounded aggregate pairing posture
- Prometheus and Grafana should carry only numeric topology pairing projections such as `paired_link_count`, `single_sided_link_count`, and derived shares, plus any backend-owned pairing-posture labels projected directly from metrics
- Grafana must not become the source of product-facing pairing posture language even when it displays those backend-owned label projections

## ODL Integration Flow

ODL is a bounded input path, not the system center.

Intended flow:

1. ODL collects or exposes controller-side state where it adds genuine value.
2. `app-api` queries ODL through explicit integration modules.
3. ODL-derived records are translated into internal platform-friendly structures.
4. ODL becomes one observed input among several, not the only truth source.

Boundary rules:

- ODL does not own product APIs
- ODL does not own workflow logic
- ODL does not replace collector-based observed state
- ODL outputs must not leak directly into product contracts

Current state:

- service presence and topology-level role exist
- substantive integration code is still pending

## Database Persistence Flow

Postgres is the durable application-state path.

Intended flow:

1. `app-api` decides what durable records should exist.
2. `app-api` persists those records to Postgres.
3. Alembic migrations evolve the schema over time.

Boundary rules:

- Postgres is not the metrics store
- the collector does not write durable product state directly to Postgres
- Grafana and Prometheus do not become persistence owners for business records

Current state:

- init SQL bootstrap exists
- Alembic scaffolding exists
- the backend now persists bounded normalized inventory snapshots, normalized topology snapshots, and sync-run records
- the backend now persists bounded normalized policy snapshots and candidate-path records alongside those existing inventory/topology snapshots
- devices, topology, and policy can fall back to the latest persisted normalized snapshot if the live collector boundary is temporarily unavailable
- devices, topology, and policy can also expose bounded current-versus-latest-persisted comparison summaries when both current live-backed state and an earlier persisted normalized snapshot exist
- workflow-history and audit-history currently read persisted sync-run activity rather than separate durable **audit** tables
- **Workflow lifecycle foundation:** **`workflow_lifecycles`** and **`workflow_lifecycle_events`** persist **operator workflow records** and **transitions**; **`GET` / `POST` `/api/v1/workflow-lifecycle`** — see **`workflow-lifecycle-contract.md`** — this is **not** sync-run history and **not** network actuation or dry-run
- **Preview engine v1:** **`preview_requests`** and **`preview_events`** persist **bounded pre-change previews**; **`GET` / `POST` `/api/v1/previews`** — see **`dry-run-preview-diff-contract-v1.md`** and **`ADR-0003-preview-diff-engine-phase2.md`** — capability-gated **normalized** diff for **`static_local`** **`intent_state`** only; **not** network execution, **not** evidence replay / evidence-delta semantics, **not** maintenance-preview (`maintenance_preview_v1`)
- bounded persisted read-side state survives **normal container replacement in the same workspace** when host-backed directories (e.g. `platform/postgres/data`) remain in place; removing or replacing those directories starts a **new baseline**—same boundary as `deployment-runbook.md` and `production-readiness-assessment.md` (not backup, HA, or cross-host DR)
- audit history remains a read-only view over sync activity plus readiness snapshots; **workflow lifecycle** is a separate durable product domain (see above)
- broader domain persistence logic is still pending

## Flow Summary By Consumer

### For product views

- source of truth direction: `app-api`
- durable state direction: `postgres`
- UI consumer: `app-web`

### For observability

- metrics source direction: service `/metrics` endpoints
- time-series store: `prometheus`
- dashboard consumer: `grafana`

### For controller-side enrichment

- bounded protocol/controller component: `odl`
- consuming service: `app-api`

## Current Vs Future

### Current

- flow directions are documented
- platform topology and service boundaries exist
- backend and collector skeleton endpoints exist
- bounded normalized inventory, topology, and policy integrations now connect the collector shape to the backend read paths
- backend-owned normalized inventory, topology, and policy read models now exist as stable live API slices with explicit live, persisted-fallback, partial, unknown, and bounded comparison semantics where supported
- observability scaffolding exists
- bounded persistence direction is explicit and now partially implemented for inventory, topology, and policy snapshots
- persisted sync-run activity now supports bounded read-side history views, while live collector reads remain the primary source for current observed state

### Future

- deeper backend persistence of policy-oriented history and broader domain records beyond the current bounded snapshot slice
- harder durability across full platform reprovisioning
- richer frontend product pages for workflow history, audit history, and deeper read-oriented exploration
- ODL-backed enrichment where justified
- later dry-run and workflow-related data paths

## Related Documents

- `roadmap.md` — phased scope and **`conditionally_ready_with_explicit_limits`** operating boundary
- `production-readiness-assessment.md` — strict readiness verdict and what remains outside safe use
- `deployment-runbook.md` — build, deploy, **`verify-core-runtime`** / **`verify-odl-auth`**, conditional history checks, same-workspace drill
- `dashboards.md` — Grafana scope honesty (including change-validation and vendor families)
