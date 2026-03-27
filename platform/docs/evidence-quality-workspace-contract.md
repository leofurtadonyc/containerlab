# Evidence Quality Workspace v1 contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for **evidence quality workspace v1**: a **dedicated operator-facing workspace** (future **`GET`** / shell) that explains **why** read-side evidence may be **weak, partial, stale, fallback-driven, history-gated, truncated, or risky to over-trust**—using **only** fields, postures, and caveats **already exposed** by Phase **2** contracts and APIs.

It answers:

- **“Across the domains we already show, what limits collection assurance, read-path reliability, and comparison honesty right now—and where should I look next for depth, without treating this workspace as approval, remediation, or validation?”**

Stable product vocabulary: **`contract_id`:** **`evidence_quality_workspace_v1`**

**HTTP (implemented in app-api):** **`GET /api/v1/evidence-quality-workspace`**

- **Query parameters:** **`sync_runs_limit`** (bounded, default **20**, max **100**) — aligns with other bounded summaries; reserved for future embedded assemblies; **does not** embed change intelligence by default in v1.
- **Response:** **`evidence_quality_workspace_v1`** — **`read_path_reliability_posture`** (**`bounded_ok`** \| **`mixed_degraded`** \| **`heavily_limited`**) derived from cited weakness rows only; **`collection_assurance_summary`** (plain-language roll-up from **`GET /api/v1/platform/status`** **`read_paths`**); **`rows[]`** with **`evidence_quality_dimension`**, **`evidence_subject_domain`**, **`summary`**, optional **`detail`**, **`source_citations`** (e.g. **`GET /api/v1/devices`** field paths). **`safety_framing.explicit_non_claims`** are normative.
- **WebUI (implemented):** shell **`view=evidence-quality-workspace`** — **`EvidenceQualityWorkspaceView`** in **`platform/app-web/src/features/evidence-quality-workspace/view.tsx`**; typed client **`getEvidenceQualityWorkspace`**; optional **`sync_runs_limit`** in URL (aligned with other bounded summaries). **Not** validation UI or remediation workflow.

**Schema:** [`platform/app-api/src/app_api/schemas/evidence_quality_workspace.py`](../../platform/app-api/src/app_api/schemas/evidence_quality_workspace.py) — **`EvidenceQualityRow`**, **`ReadPathReliabilityPosture`**, **`EvidenceQualityDimension`** (read-path reliability taxonomy).

This file remains the **authoritative** vocabulary for workspace intent, **evidence-quality dimensions**, overlap boundaries, pivot discipline, and non-claims.

**Related (structured explanation + next-best pivot):** [`evidence-weakness-explanation-contract.md`](./evidence-weakness-explanation-contract.md) — **`evidence_weakness_explanation_v1`**; operator explanation categories and read-only **next-best pivot** semantics (not investigation next-inspection). **Backend:** **`GET /api/v1/evidence-weakness-explanation`** maps each workspace row to explanation categories and bounded pivots (same **`sync_runs_limit`** as this **`GET`**).

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md).

---

## Task classification and overlap review (not duplicate work)

**Classification:** **new** bounded product contract. Completed artifacts define **adjacent** lanes—cited so reviewers see **composition and explanation**, not **reopen**:

| Completed artifact | Canonical role | **Evidence quality workspace v1** is **not** a duplicate because |
| --- | --- | --- |
| [`week-21-wednesday-task-02-collector-boundary-fallback-explanation-refinement.md`](../../agent/sdn-tasks/completed/week-21-wednesday-task-02-collector-boundary-fallback-explanation-refinement.md) | **Cross-doc** alignment on collector vs backend boundaries, fallback honesty | That work **refined wording** across docs and product copy. **Evidence quality workspace** is a **product surface** that **aggregates weakness explanation** across domains in one workspace—**not** a re-edit of the same sentences in isolation. |
| [`week-22-monday-task-01-read-side-query-ergonomics-contract.md`](../../agent/sdn-tasks/completed/week-22-monday-task-01-read-side-query-ergonomics-contract.md) | **`read_side_query`** echo, payload sizing, shareable URLs | Read-side query defines **how** requests are bounded and echoed. **Evidence quality workspace** explains **quality and fragility** of what comes back (stale, partial, truncated)—**orthogonal** to parameter ergonomics; may **cite** scope limits as **one** quality dimension. |
| [`week-35-wednesday-task-01-cross-domain-evidence-consistency-summary-contract.md`](../../agent/sdn-tasks/completed/week-35-wednesday-task-01-cross-domain-evidence-consistency-summary-contract.md) → [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md) | **Aligned / weak alignment / tension** between **co-present** read-side stories | Consistency answers *do independent domains **agree or contradict**?* **Evidence quality workspace** answers *is the **evidence itself** thin, fallback-prone, stale, or comparison-limited?*—**not** a second consistency taxonomy; tension rows may **appear as context** when they **also** reflect read-path weakness, **without** substituting **`evidence_consistency_summary_v1`**. |
| [`week-36-wednesday-task-01-maintenance-evidence-workspace-contract.md`](../../agent/sdn-tasks/completed/week-36-wednesday-task-01-maintenance-evidence-workspace-contract.md) → [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md) | **Single** maintenance topology subject—composed preview, dossier, timeline/delta, pivots | **Maintenance-primary** deep story for **one** object. **Evidence quality workspace** is **domain-neutral quality framing** (collection, fallback, history gates)—**not** maintenance assembly rules and **not** a rename of **`maintenance_evidence_workspace_v1`**. |
| [`week-37-monday-task-01-operational-stability-summary-v1-contract.md`](../../agent/sdn-tasks/completed/week-37-monday-task-01-operational-stability-summary-v1-contract.md) → [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md) | **Steadiness, churn, recurrence, degraded recurrence, insufficient evidence** in bounded windows | Stability centers **volatility and recurrence** over time. **Evidence quality workspace** centers **infrastructure and epistemic limits** (why snapshots may be stale, why comparison is blocked, why collector path is degraded)—**not** stability posture labels as the **primary** row vocabulary; may **reference** stability when it **illustrates** weak anchors. |
| [`week-38-monday-task-01-maintenance-window-workspace-v1-contract.md`](../../agent/sdn-tasks/completed/week-38-monday-task-01-maintenance-window-workspace-v1-contract.md) → [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md) | **Multi-subject** maintenance-window planning rollups | **Window-specific** union/dedup semantics. **Evidence quality workspace** is **not** tied to a maintenance window subject list—**not** multi-subject preview rollup; may **cite** per-subject weakness when **scoped** to a window in a future revision. |

**One-line distinction:** **Evidence consistency** = *cross-domain agreement vs tension*; **operational stability** = *steadiness vs churn over time*; **maintenance / window workspaces** = *maintenance-oriented composition*; **evidence quality workspace** = *why the read paths and anchors we have are **fragile or incomplete***.

---

## Primary question (normative)

The workspace **must** frame copy around **evidence quality and read-path honesty**: **collection** posture, **serving** mode, **freshness**, **history depth**, **comparison readiness**, **truncation**, **fallback**, and **explicit caveats** already present in API payloads—**not** “rate the network,” “approve change,” “remediate the collector,” or “validate configuration.”

---

## Evidence-quality dimensions (v1 vocabulary)

Rows or sections **map to cited** source fields or **explicit caveats** from existing contracts—**no** invented grades or ML scores.

| Dimension | Meaning (operator-facing) | Typical cited sources (examples only) |
| --- | --- | --- |
| **Collection assurance** | Whether live collector-to-backend delivery is **present**, **degraded**, **unavailable**, or **unknown** for relevant domains—**as already labeled** in platform status, metrics-adjacent honesty, or per-domain **`data_status`** / collection postures. | **`GET /api/v1/platform/status`**, device/policy **`data_status`**, topology **collection** / inference postures |
| **Read-path fragility** | **Live** vs **`persisted_fallback`**, **stale** rows, **degraded** scope, or **partial** inventory/topology/policy truth—**not** a new fragility score. | **`serving_mode`**, **`comparison_to_latest_persisted`**, topology partiality axes, policy **`detail_mode`** |
| **Fallback conditions** | When responses are **honestly** served from **persisted snapshots** without live parity, or when **collector_unavailable**-class honesty applies. | Same fields as above; aligns with **week 21** boundary narrative **without** duplicating doc-only edits |
| **Sparse history / anchors** | **Single-snapshot**, **no_comparable_anchor**, **`insufficient_evidence`**, **empty** **`history.recent_snapshots`**, **`comparison_status`** families that block delta/timeline depth. | Devices/policies/topology **`history`**, evidence timeline/delta contracts |
| **Comparison limits** | **`history_gate`**, **`limit`** / **`sync_runs_limit`** truncation, **`read_side_query`** scope, **`detail_mode`** that caps policy or topology depth. | **`read_side_query`** echo (week **22**), list **`limit`** semantics, policy/topology **detail** honesty |
| **Unsupported or partial detail** | **`unsupported`**, **`not_implemented`**, **placeholder**-class matrix rows, or **explicit** “no policies observed” classes—**cited**, not expanded into new capability claims. | Capabilities, policies list, topology policy linkage |
| **Cross-domain scope mismatch** | When **different effective universes** apply to the same operator question (e.g. **truncated** digest vs **full** history panel)—same **spirit** as evidence-consistency **scope_mismatch** but framed here as **quality of evidence surface**, not **contradiction between stories**. | Evidence consistency summary **may** be **one optional input** to **explain** why tension exists **without** replaying full consistency rows as the workspace body |

Implementations **must not** collapse these dimensions into a **single numeric “quality score”** unless a **source contract** already exposes an explicit comparable field (default: **forbidden**).

---

## Read-path reliability taxonomy (API v1)

Rows use **`evidence_quality_dimension`** (one of the seven dimensions above). **`read_path_reliability_posture`** on the summary response is a **coarse roll-up** from row presence (**`bounded_ok`** \| **`mixed_degraded`** \| **`heavily_limited`**) — **not** a hidden numeric rank; it exists so operators can scan severity when multiple rows are present.

---

## Domain coverage (inputs)

A conforming workspace **may** draw **only** from **Phase 2** read-side families already listed in adjacent contracts (devices, topology, policies, platform status, workflow/audit history, change intelligence, evidence consistency, stability summaries, maintenance-oriented assemblies where in scope, etc.). It **does not** add domains.

**Disallowed as primary workspace evidence:** Grafana/Prometheus as **row-level business truth**; **workflow** execution as proof of collection health; **new** collector tables or persistence models introduced solely for this workspace.

---

## Overlap boundaries (normative)

1. **Versus [`evidence_consistency_summary_v1`](./evidence-consistency-summary-contract.md):** Do **not** re-emit the full **alignment / tension** taxonomy as the **primary** workspace structure. **Evidence quality workspace** may **reference** consistency summary when **tension coexists with** weak anchors or fallback—**cited linkage**, not duplicate **`GET`** semantics.

2. **Versus [`operational_stability_summary_v1`](./operational-stability-summary-contract.md):** Do **not** substitute **stability posture** rows for **quality-of-evidence** rows. If stability is cited, it must be as **supporting context** (e.g. “insufficient evidence for stability view” **overlaps** quality dimension **sparse history**).

3. **Versus [`maintenance_evidence_workspace_v1`](./maintenance-evidence-workspace-contract.md) / [`maintenance_window_workspace_v1`](./maintenance-window-workspace-contract.md):** Do **not** merge maintenance workspace JSON or window rollup JSON into this workspace as **the** body. Maintenance workspaces remain **authoritative** for maintenance-oriented composition; **evidence quality workspace** addresses **cross-cutting read-path limits** that may **apply while** using those surfaces.

4. **Versus change-safety / impact / path surfaces:** **Evidence quality workspace** does **not** provide **pre-change sufficiency**, **impact simulation**, or **path proof**—it explains **limits of evidence** that operators should weigh **before** over-trusting higher-level narratives **elsewhere**.

---

## Pivots and “where to go next” (read-only)

The workspace **may** include **deterministic navigation prompts** to existing product **`view=`** routes and **`GET`** families that deepen **honest** read-side context (devices history, topology dossier, policy detail, investigation, maintenance evidence workspace, etc.)—**same** pivot discipline as other Phase **2** workspaces: **navigation and interpretation**, **not** workflow steps or remediation playbooks.

---

## Explicit non-claims

An **evidence quality workspace v1** is:

- **Not** **validation** — does not pass/fail changes, intent, or conformance.
- **Not** **remediation guidance** — does not instruct operators to “fix” collectors, devices, or controllers; **read-only** framing only.
- **Not** **root-cause** — does not assign blame to a subsystem beyond **cited** **`data_status`** / **`caveats`** / **posture** fields.
- **Not** **safe-to-change** or **approval** — does not substitute for [**Change safety case**](./change-safety-case-contract.md) or maintenance approval semantics.
- **Not** a **new truth engine** — **no** novel hashes, graph algorithms, or unified health scores; **reuse-only** assembly from existing responses.
- **Not** **Grafana semantics** — product-owned workspace; see [`dashboards.md`](./dashboards.md).

---

## Empty / sparse behavior

1. When **all** relevant domains are **empty**, **placeholder**, or **unsupported**, the workspace **must** say so explicitly—**not** imply “healthy” or “aligned.”
2. **Absence** of weakness signals when evidence is **actually** thin is a **failure mode**—prefer **`gap_note`**-class honesty over silent **OK**.

---

## Related documents

- [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md)
- [`operational-stability-summary-contract.md`](./operational-stability-summary-contract.md)
- [`maintenance-evidence-workspace-contract.md`](./maintenance-evidence-workspace-contract.md)
- [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../agent/sdn/03-CURRENT-STATUS.md)
- [`agent/sdn/week-39-schedule-overview.md`](../agent/sdn/week-39-schedule-overview.md)
