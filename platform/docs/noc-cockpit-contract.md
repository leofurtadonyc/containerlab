# NOC cockpit v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for a **NOC (network operations center) cockpit v1** slice: a **single operator landing posture** that **composes** the **same** Phase **2** read-only evidence already exposed by existing APIs and WebUI surfaces—so watch officers can **orient**, **prioritize attention**, and **pivot** into detailed views **without** implying a new scoring engine, incident commander authority, or unified “system truth” synthesized outside those contracts.

**NOC cockpit v1** is **layout and prioritization over already-bounded assemblies**—not a new collector domain, not a new validation or drift engine, and **not** a substitute for Grafana, Postgres, workflow execution, or per-page deep tables.

Stable product vocabulary (for implementation and tests when the cockpit ships): **`noc_cockpit_v1`**

**Implementation posture (v1):** May ship as a **dedicated Overview mode**, **route**, or **dashboard region** in **`app-web`** that **reuses** existing client queries and navigation helpers only. A future thin **read-only** **`GET /api/v1/.../noc-cockpit`** assembly is **optional**; this file defines **what the cockpit may show**, **how widgets relate**, and **honesty limits**, not a mandatory backend shape before UI composition exists.

---

## Core widgets and inputs (recommended)

A conforming cockpit **SHOULD** surface the following **widget families**, each fed only from **documented** Phase **2** sources. Row counts, caps, and refresh cadence are **product choices** but must remain **honest** about truncation and staleness.

| Widget | Primary evidence sources | Typical operator value | Honest limit |
| --- | --- | --- | --- |
| **Top topology attention** | **`GET /api/v1/topology/risk-summary`** ([`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md)) — ranked **`ranked_objects`** slice | Fast visibility of nodes/links the product already ranks for attention in the current assembly | **Not** blast-radius truth, **not** SLA or traffic risk; lexicographic / string-equality semantics per contract—not global dependency graph proof. |
| **Top degraded policies** | **`GET /api/v1/policies`** items with **`degraded_policy_v1`** ([`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) family) — filter/sort by posture / reason codes already on rows | Highlights inventory rows where degraded classification is already computed | **Not** new policy health scoring; **not** proof beyond the current normalized inventory slice; empty or partial lists must be explicit. |
| **Recent change summary** | **`GET /api/v1/change-intelligence/recent-summary`** ([`change-intelligence-contract.md`](./change-intelligence-contract.md)) with bounded **`sync_runs_limit`** | Cross-domain “what moved” interpretation support aligned with existing change intelligence | **Not** validation verdict, **not** drift engine, **not** safe-to-change recommendation. |
| **Investigation / situation-room quick entry** | Shell navigation to **`view=investigation`** and **`view=situation-room`** with shared **`sync_runs_limit`** semantics ([`investigation-workspace-contract.md`](./investigation-workspace-contract.md), [`evidence-pack-contract.md`](./evidence-pack-contract.md)) | One-click entry to bounded assemblies already defined | **Not** execution authority; interpretation-only assemblies. |
| **Search entry** | **`GET /api/v1/operator-search?q=...`** ([`operator-search-contract.md`](./operator-search-contract.md)) + **`GlobalOperatorSearch`** (or equivalent) | Cross-surface pivot to devices, topology, policies, capabilities | **Not** log/metrics search; **not** completeness when results are capped or **`ambiguous`**. |
| **Selected urgent pivots into dossiers** | **`navigateToPolicyDossierWorkspace`**, **`navigateToTopologyDossier`**, existing week **27–29** URL helpers ([`policy-dossier-contract.md`](./policy-dossier-contract.md), [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)) | From a cockpit row → composed dossier for that **`policy_id`** or topology **`object_id`** | Dossiers remain **bounded**; cockpit **does not** add facts. |
| **Optional: evidence export hooks** | **`GET /api/v1/exports/...`** ([`evidence-export-contract.md`](./evidence-export-contract.md)) from cockpit context | Same bounded snapshots as elsewhere; optional shortcuts only | **Not** compliance artifact, **not** tamper evidence by default. |
| **Cross-domain delta digest (quick entry)** | **`GET /api/v1/.../delta-digest`** / **`cross_domain_delta_digest_v1`** ([`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md) family) | One-click orientation into the digest workspace with the same **`sync_runs_limit`** as other Overview windows | **Not** a new ranking engine; digest remains interpretation support only. |
| **Operator briefing (quick entry)** | Shell to **`view=operator-briefing`** with **`operator_briefing_workspace_v1`** ([`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md)) | Composed handoff before dossier deep dives; copy may reference **`briefing_export_bundle_v1`** vs per-surface **`evidence_export_v1`** | **Not** incident command; exports remain bounded file snapshots, not compliance holds. |
| **Evidence replay (quick entry)** | Shell to **`view=evidence`** / evidence replay route with **`evidence_replay_viewer_v1`** ([`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) when present) | Opens **frozen** imported **`evidence_export_v1`** (or bundle member JSON), with honest contrast to **live** APIs | **Not** live product truth; **not** tamper-proof replay; live bounded exports remain on briefing / per-view export actions. |
| **Priority navigation (cockpit)** | Same **`topology/risk-summary`** top row + worst **`degraded_policy_v1`** row as the attention panels (stable sort) | One-click **topology dossier**, **maintenance preview**, **`maintenance_evidence_workspace_v1` maintenance evidence workspace**, **`maintenance_window_workspace_v1` maintenance window workspace** (multi-subject rollup; seeded from the same topology row), **investigation**, **impact report** (policy + maintenance-shaped), **policy dossier**, **Service Explorer**, **policy explainability**, **`path_explorer_v1` Path Explorer**, **`service_impact_workspace_v1` Service Impact workspace**, and **`evidence_quality_workspace_v1` evidence quality workspace** (cross-domain; also when attention rows are empty) pivots labeled as navigation suggestions | Same non-claims as **“Urgent” pivots** — **not** incident priority or approval to change the network. |
| **Primary launch surfaces (cockpit composition)** | Same row selection as priority navigation; **`navigateToServiceExplorer`**, **`navigateToPolicyExplainabilityWorkspace`**, **`navigateToPathExplorer`**, **`navigateToServiceImpactWorkspace`**, **`navigateToMaintenancePreviewForTopologyObject`**, **`navigateToMaintenanceEvidenceWorkspaceForTopologyObject`**, **`navigateToImpactReportForPolicy`** / **`navigateToImpactReportForMaintenance`**, plus **`navigateToEvidenceQualityWorkspace`** (**Evidence quality review** card) | Dedicated cards above digest/briefing for watch-style entry into week **31** surfaces without new assemblies | **Not** new ranking; **not** scoring; **`maintenance_evidence_workspace_v1`** is a composed live GET distinct from **`evidence_export_v1`**, **`impact_report_v1`**, and **`change_safety_case_v1`** downloads. Impact reports remain **`impact_report_v1`** communication packages (distinct from **`evidence_export_v1`** replay inputs). Path Explorer and Service Impact workspace remain **composed read-only `GET`** workspaces—not exports. **`evidence_quality_workspace_v1`** is cross-domain read-path limits—**not** evidence-consistency or stability workspaces. |

**Out of scope for v1:** workflow run controls, dry-run triggers, ODL write paths, synthetic “incident severity” across domains, real-time log tailing, Prometheus/Grafana embeds as cockpit “widgets,” or cross-tenant aggregation.

---

## Inputs and refresh

| Input | Role |
| --- | --- |
| **`sync_runs_limit`** (shared) | Aligns change-intelligence, investigation, situation-room, workflow/audit windows where those APIs already take it—**same bounds** as documented per route; cockpit **must not** invent a separate window math. |
| **Manual refresh** | Re-fetch visible widgets; show per-widget loading/error without implying stronger evidence than the API returned. |
| **URL / shell state** | Optional `view=` and selection params preserved when pivoting out of the cockpit—client-only hints follow existing navigation contracts. On **Overview**, **`overview_mode=cockpit`** selects the **NOC cockpit v1** layout in **`app-web`** (hero, attention rows, workspace entry, global-search hint); omit **`overview_mode`** or use any value other than **`cockpit`** for the **Standard** overview (full summary grid and trust cues). Implemented via **`readOverviewModeFromSearch`** / **`navigateOverviewLayoutMode`** (`overview_mode` query param). |

---

## Ranking and selection behavior

1. **Topology attention rows** — Prefer the **same ordering** as **`topology/risk-summary`** `ranked_objects` (or a **documented prefix** of that list, e.g. top **N**). **Do not** re-rank by cockpit-only heuristics unless the contract documents an explicit, bounded tie-break (default: **no** extra ranking).
2. **Degraded policies** — Sort by **existing** `degraded_policy_v1.posture` / **reason_codes** / policy identity using **stable** rules (e.g. worst posture first, then `policy_id`). **No** cross-domain score.
3. **Change summary domains** — Present domains in the **same** order as **`recent-change`** response or **documented** stable ordering; **do not** hide **`completeness_posture`** or **`aggregation_notes`** when the API exposes them.
4. **“Urgent” pivots** — Any curated short list of links **must** label itself as **navigation suggestions** derived from **visible fields** (e.g. top risk rows + top degraded policies)—**not** incident priority, **not** approval to change the network.

---

## Composition rules

1. **Single-screen coherence** — The cockpit **may** show multiple widgets side by side, but each widget **must** identify its **source contract** (or link to the canonical page) so operators know which API owns the semantics.
2. **No merged scores** — **Do not** compute a cockpit-wide “health score,” “risk score,” or “urgency index” from multiple domains unless each input field is already labeled as such in its source contract (default: **forbidden** in v1).
3. **Staleness** — If any underlying response is **stale**, **persisted_fallback**, or **blocked**, that posture **must** be visible on the cockpit (badge, caption, or link to the owning view)—**not** only in the full page.
4. **Truncation** — If a list is capped, show **items_returned** / **items_total** echoes when the source API provides them, or a one-line **truncation note**.
5. **Failure isolation** — One failed widget **must not** block others; show bounded error copy per widget.

---

## Navigation expectations

| From cockpit | Expected behavior |
| --- | --- |
| **Topology row** | Navigate to **Topology** with **`topology_object`**, **`topology_object_kind`**, optional **`topology_workspace=dossier`** per existing helpers. |
| **Policy row** | Navigate to **Policies** with **`policy_id`**; optional **`policy_workspace=dossier`** for policy dossier. |
| **Change domain** | **`view=`** drilldowns per [`change-intelligence-contract.md`](./change-intelligence-contract.md) / existing WebUI patterns. |
| **Investigation / Situation** | **`navigateToInvestigationView`**, **`navigateToSituationRoomView`** (or equivalents) with **`sync_runs_limit`** preserved where applicable. |
| **Search** | Focus **`GlobalOperatorSearch`** or route to search results—**not** a second search engine. |

**Non-substitution:** The cockpit **orients**; **Policies**, **Topology**, **Investigation**, **Situation room**, and **Exports** remain **authoritative** for their respective contracts.

---

## Explicit non-claims

NOC cockpit v1:

- is **not** an incident management system, on-call roster, or ticketing integration
- is **not** automatic remediation, change approval, or maintenance window authority
- is **not** a single “source of truth” for topology, policy, or inventory completeness
- is **not** log analysis, packet capture, or metrics exploration (see Grafana/Prometheus product boundaries)
- is **not** workflow execution, dry-run output, or validation verdict aggregation
- is **not** guaranteed to surface every degraded object if APIs cap or filter lists

The word **“cockpit”** means **bounded situational awareness for Phase 2 read-only operations** in the current product shell—not air traffic control for the entire network estate.

---

## Relationship to Overview

**Overview** may already embed subsets of these ideas (e.g. recent change, risk attention, operator workspace entry). NOC cockpit v1 **refines** the **operator narrative** for watch-style use: **denser attention ordering**, **consistent `sync_runs_limit`**, and **explicit** pivot lanes—**without** changing underlying API contracts. If both exist, **avoid contradictory copy**; prefer **one** canonical description of limits per widget family in docs and UI.

---

## Revision policy

Adding **new** widget types backed by **new** truth domains, **unified** cross-domain scoring, or **write** paths requires **`noc_cockpit_v2`** (or an explicit minor version) and updated non-claims.

---

## Related documents

| Topic | Document |
| --- | --- |
| Topology risk summary | [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md) |
| Degraded policy classification | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Change intelligence | [`change-intelligence-contract.md`](./change-intelligence-contract.md) |
| Investigation workspace | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Evidence pack / situation room | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Operator search | [`operator-search-contract.md`](./operator-search-contract.md) |
| Policy / topology dossiers | [`policy-dossier-contract.md`](./policy-dossier-contract.md), [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Evidence export | [`evidence-export-contract.md`](./evidence-export-contract.md) |
