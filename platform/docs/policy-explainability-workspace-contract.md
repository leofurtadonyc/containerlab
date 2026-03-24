# Policy Explainability Workspace v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for **Policy Explainability Workspace v1**: a **focused read-only lens** for one **`policy_id`** that helps operators answer, using **existing** Phase **2** evidence only:

- **Why** does the platform believe traffic is associated with this policy’s path story (intent vs observed signals)?
- **Which** candidate path(s) look **active** or **preferred** in the current inventory slice?
- **Which** candidates look **inactive**, **unknown**, or **unsupported**—and what **hints** (not verdicts) explain that posture?
- **Where** can I see **time-ordered** anchors and **deltas** without claiming dataplane proof?

The workspace **indexes and narrates** the same underlying contracts as [**Policy dossier v1**](./policy-dossier-contract.md) and [**Path analysis**](./path-analysis-contract.md), but with **explainability-first section semantics** (path story, candidates, alternates, rejection/unknown framing)—not a second dossier API and not a replacement for full Path analysis / timeline / delta panels.

Stable product vocabulary (for implementation and tests when the surface ships): **`policy_explainability_workspace_v1`**

**Relationship to adjacent surfaces:**

| Surface | Role | Distinction |
| --- | --- | --- |
| [**Path analysis**](./path-analysis-contract.md) (`path_analysis_phase2_v1`) | **Authoritative** per-policy path interpretation API | Single API response; not a composed multi-panel workspace layout |
| [**Policy dossier**](./policy-dossier-contract.md) (`policy_dossier_v1`) | **Composed** briefing across path, topology impact, timeline, delta | **Breadth**—not optimized for “why path / which candidate” narrative order |
| [**Policies**](./policy-truth-depth-review.md) inventory | **Authoritative** row truth | Flat table; not an explainability story |
| [**Service Explorer**](./service-explorer-contract.md) | Grouping over policies | Multi-policy; not single-policy path focus |
| **Policy Explainability Workspace v1** | **Explainability narrative** over the same inputs | **Depth** on path/candidate/timeline/delta **story**; read-only; **no new collector fields** |

**Implementation posture (v1):** May ship as a **WebUI workspace** (e.g. `policy_workspace=explainability` or dedicated route), **client-side composition** of the same APIs, and/or a **future** dedicated read assembly—this file defines **semantics and honesty**, not a mandatory ship shape before UI exists.

---

## Workspace objective

**In scope:** Orient the operator on **path explanation**—intent hints, observed/candidate-path signals, coarse **truth alignment**, topology **naming** alignment, timeline **anchors**, and delta **highlights**—with **explicit** gaps when evidence is missing or partial.

**Out of scope:** Proving **actual** forwarding, validating **change safety**, running **workflows**, or replacing **Investigation**, **Situation room**, or **full** Path analysis / timeline / delta **panels**.

---

## Evidence sources composed (reuse only)

The workspace **MUST NOT** invent a parallel truth domain. It **ONLY** composes views over contracts already defined in Phase **2**:

| Source | Contract / API | Role in explainability workspace |
| --- | --- | --- |
| **Policy inventory** | `GET /api/v1/policies` — [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) | Identity, **`candidate_paths`**, intent/observed/support posture — **baseline** for “what rows exist.” |
| **Path analysis** | `GET /api/v1/policies/{policy_id}/path-analysis` — [`path-analysis-contract.md`](./path-analysis-contract.md), [ADR-0002](./decisions/ADR-0002-path-analysis-phase2-read-only-contract.md) | **Primary** structured path explanation: intended vs observed hints, **candidate_path_summaries**, **truth_alignment**, **caveats**. |
| **Topology impact** | `GET /api/v1/policies/{policy_id}/topology-impact` — [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) (inverse) | **Dependency / naming** alignment to topology objects—**not** validated underlay adjacency. |
| **Evidence timeline** | `GET /api/v1/policies/{policy_id}/evidence-timeline` — [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md) | **Ordering anchors** for “what changed when” — **not** forensic completeness in the workspace body. |
| **Evidence delta** | `GET /api/v1/policies/{policy_id}/evidence-delta` — [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) | **Comparison anchors** vs persisted snapshot — **not** a drift approval engine. |
| **Degraded policy (v1)** | Per-row on policies — [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) | **Interpretation risk** flags for the same inventory row—**not** new classification rules. |

**Disallowed:** Synthetic path math, Grafana/Prometheus as primary evidence, workflow history as **causal** proof, or write-side simulation.

---

## Path explanation structure (normative story)

When implemented, the workspace presentation **SHOULD** follow this **explainability order** (sections may collapse when empty; **order** stays stable when present):

1. **Subject and scope** — `policy_id`, endpoints/color/source_target as already on **`PolicyRecord`** / **`PathAnalysisSubject`**; one-line **inventory posture** (current vs stale row echo).
2. **Current path explanation summary** — Short rollup of **what the platform is saying** about intent vs observed, drawn from **path analysis** **`truth_alignment`** and **safety framing**—**not** a restatement of the full JSON.
3. **Active candidate summary** — From **`candidate_path_summaries`** (and inventory **`candidate_paths`** where aligned): paths whose **`path_state`** / summary posture indicate **active** or **preferred** in the **bounded** sense defined by path analysis—see **Candidate-path semantics** below.
4. **Alternate / rejected / inactive candidate hints** — Candidates that are **inactive**, **unknown**, or **not preferred**, with **rejection hints** only where the **underlying contract** already exposes a basis (e.g. notes, support posture, path_state)—**no invented “because TE said no”** strings.
5. **Topology dependency summary** — Bounded excerpt from **topology-impact** rows: which nodes/links **name-align**—orthogonal to dataplane hop-by-hop proof.
6. **Evidence timeline anchors** — Top **N** entries or counts + scope line from **evidence timeline**—link to **full** timeline panel.
7. **Evidence delta anchors** — **`comparison_status`** and highlighted **delta_items** from **evidence delta**—link to **full** delta panel.
8. **Service impact & maintenance preview pivots** — Read-only pointers to [**Service Explorer**](./service-explorer-contract.md) (e.g. `policy:{policy_id}` or shared **color/headend/endpoint** groupings), [**Change intelligence**](./change-intelligence-contract.md), [**Investigation**](./investigation-workspace-contract.md), [**Operator briefing**](./operator-briefing-workspace-contract.md), [**Situation room**](./evidence-pack-contract.md)—**same** `inv_from`, `policy_id`, `sync_runs_limit` discipline as other shells; **not** execution or approval.

---

## Candidate-path and rejection-hint semantics

| Signal | Meaning in this workspace |
| --- | --- |
| **`path_state` / summary lines** (from path analysis + inventory) | **Observed classification** in the current slice—**not** proof of hardware forwarding. |
| **“Active” / “preferred”** language | **MAY** be used only when **consistent** with **`CandidatePathRecord`** / **`PathAnalysisCandidatePathSummary`** fields and path-analysis **caveats**—if ambiguous, use **unknown**. |
| **“Rejected” / “alternate”** | **MUST** mean **platform-visible** inactive/unsupported/lower-preference hints—**not** controller CSPF rejection, **not** “operator should not use,” unless echoed as **interpretation** from existing notes/posture. |
| **Preference integers** | **Ordering hints** from inventory—**not** TE optimality scores. |

When the platform **cannot** distinguish candidates (partial detail, counters-only posture, empty candidate list), the workspace **MUST** show an **explicit unknown** state and **must not** fabricate rejection narratives.

---

## Explicit unknown states

| Condition | Required behavior |
| --- | --- |
| **No path-analysis payload** or **degraded/blocked** assembly | **Unknown** path story; cite **path-analysis** **`caveats`** and inventory **`empty_reason`** / **`detail_mode`** as applicable. |
| **All candidates `unknown` or empty** | **Unknown** active path; **no** default to “first row wins.” |
| **Topology impact empty** | **Unknown** topology naming alignment—**not** “no dependencies.” |
| **Timeline/delta sparse** | **Honest** sparse copy; links to **full** panels. |
| **Stale row posture** | Visible **stale** echo—**not** silent refresh. |

---

## Non-substitution

| Layer | Role |
| --- | --- |
| **Path analysis / timeline / delta APIs** | **Authoritative** for full payloads, scroll/focus params, and **404** semantics. |
| **Policy Explainability Workspace v1** | **Narrative composition** and **pivots**—**does not** replace opening those APIs’ **full** UIs. |

If nested sources disagree on freshness, **surface the stricter caveat** (aligned with [**Policy dossier**](./policy-dossier-contract.md) propagation rules).

---

## Navigation expectations

- **Deep links** — **`policy_id`** in shell query; optional **`policy_workspace`** (or future dedicated flag) **MUST** round-trip with [**Policies**](./policy-truth-depth-review.md) and [**Policy dossier**](./policy-dossier-contract.md) patterns.
- **Cross-surface** — **`inv_from=policy_explainability`** (or equivalent) **MAY** be set as a **client-only** breadcrumb for Investigation / Briefing—**not** authority sent to app-api beyond documented hints.
- **Service Explorer** — Pivot using documented **`service_id`** forms from [**Service Explorer contract**](./service-explorer-contract.md).
- **Per-policy panels** — Preserve **`policy_evidence_timeline_focus`**, **`policy_evidence_delta_focus`**, and path-analysis anchor links per existing week **27–28** shell conventions.

---

## Caveats / missing evidence

- **Collector partiality** — Echo [**topology**](./topology-truth-depth-review.md) partiality axes and [**path-analysis**](./path-analysis-contract.md) caveats where relevant.
- **Not all candidates have detail** — Bounded per-target policy detail remains subject to [**policy-truth-depth-review.md**](./policy-truth-depth-review.md).
- **Persisted fallback** — If policies are **persisted_fallback**, the workspace **MUST** surface the same honesty as **`GET /api/v1/policies`**—**not** “live path” claims.

---

## Explicit non-claims

**Policy Explainability Workspace v1** is:

- **not** dataplane packet proof or per-hop label verification
- **not** controller omniscience or BGP-LS–derived path authority
- **not** guaranteed complete candidate-path truth (inventory and path analysis bounds apply)
- **not** traffic-engineering (TE) optimization authority or CSPF output
- **not** a validation verdict, safe-to-change recommendation, or drift approval
- **not** a workflow, dry-run, or change-execution surface
- **not** a substitute for **full** Path analysis, Evidence timeline, or Evidence delta **panels** when deep inspection is required
- **not** Grafana/Prometheus as path truth

Additionally:

- **not** customer billing, entitlement, or SLA truth
- **not** implied blast-radius or dependency completeness beyond string-equality topology-impact rules

---

## Backend API (app-api)

**Route:** **`GET /api/v1/policies/{policy_id}/explainability`**

**Response shape:** Pydantic model **`PolicyExplainabilityResponse`** (`platform/app-api/src/app_api/schemas/policy_explainability.py`) with **`contract_id`** **`policy_explainability_workspace_v1`**. The body embeds the same nested contracts as the standalone APIs—**path analysis**, **topology impact**, **evidence timeline**, **evidence delta**—plus **`policy_record`**, **`path_explanation_summary`** (bounded echo of path-analysis **`truth_alignment.summary`**), **`candidate_path_rollups`** (from **`candidate_path_summaries`** when present, otherwise inventory **`candidate_paths`**), **`unknown_candidate_posture`**, **`sparse_signals`** (honest flags when topology naming is unknown, timeline is sparse, or delta is not ready), **`navigation_targets`** (including **`inv_from=policy_explainability`**, Service Explorer, and delta-digest hints), **`freshness`**, and **`merged_caveats`**.

**404:** Returned when no normalized inventory row exists for **`policy_id`**, or when the same assembly preconditions as **policy dossier** fail (missing nested contract assembly).

**Semantics:** Read-only composition of existing Phase **2** contracts only; no fabricated rejection narratives, no dataplane proof beyond source evidence, no workflow authority.

---

## Contract id

- **`contract_id`:** **`policy_explainability_workspace_v1`** on any **dedicated** assembly response when implemented (parallel naming to other `*_v1` product assemblies).

---

## References

| Topic | Document |
| --- | --- |
| Path analysis | [`path-analysis-contract.md`](./path-analysis-contract.md) |
| Policy dossier | [`policy-dossier-contract.md`](./policy-dossier-contract.md) |
| Policy inventory truth | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Evidence timeline | [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md) |
| Evidence delta | [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) |
| Topology ↔ policy (inverse) | [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) |
| Degraded policy (v1) | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Service Explorer | [`service-explorer-contract.md`](./service-explorer-contract.md) |
| Investigation | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Change intelligence | [`change-intelligence-contract.md`](./change-intelligence-contract.md) |
| Current phase | [`../../agent/sdn/01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md) |

---

## Revision policy

Adding **new** path-math domains, **unified** cross-layer path scores, or **write** paths requires **`policy_explainability_workspace_v2`** (or an explicit minor version) and updated non-claims.
