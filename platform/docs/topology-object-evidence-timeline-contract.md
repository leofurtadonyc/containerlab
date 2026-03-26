# Topology object evidence timeline contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **topology-object-centric evidence timeline** product slice: an operator-facing, **chronology-like** ordering of **existing** time-bearing evidence **scoped to one topology `node` or `link`**—so operators can see **how evidence touching this object evolved** in the bounded read models the platform already exposes—**without** claiming a unified forensic log, dataplane event bus, workflow execution order, pairing or coverage-history **truth**, validation authority, or blast-radius simulation.

The timeline is **evidence-derived** and **topology-object-scoped**: the primary subject is **`object_kind`** (`node` \| `link`) and **`object_id`** on the **current normalized topology snapshot**, using the **same identity and 404 rules** as [**Topology object dossier v1**](./topology-object-dossier-contract.md), [**Failure impact**](./failure-impact-contract.md), [**Topology risk summary**](./topology-risk-summary-contract.md), and [**Related policies**](./topology-related-policies-contract.md). It **assembles**, **labels**, and **orders** timestamps and pointers already present in API-visible or persisted evidence **related to** that object (via topology rows, failure-impact, risk-summary contribution, related policies, and **projections** from per-policy **`policy_evidence_timeline_v1`** for **related** `policy_id`s); it does **not** invent collection streams, controller event buses, graph simulation, or new telemetry.

**Why this slice matters (Phase 2–safe):** the product already has **policy-primary** ([**Policy evidence timeline**](./policy-evidence-timeline-contract.md)) and **service-primary** ([**Service evidence timeline**](./service-evidence-timeline-contract.md)) chronologies, and a **composed** [**Topology object dossier**](./topology-object-dossier-contract.md). Operators still **lack** a **single vocabulary** for a **topology-object-first time story**. This contract defines that lens—**composition and ordering**, not a new truth engine—**without** reopening [**topology truth-depth**](./topology-truth-depth-review.md) pairing semantics, endpoint-pairing implementation work, or coverage-history **authority**.

Stable product vocabulary (for implementation and tests when the surface ships): **`contract_id`:** **`topology_object_evidence_timeline_v1`**

**HTTP / WebUI:** **`GET /api/v1/topology/objects/{object_id}/evidence-timeline`** returns **`topology_object_evidence_timeline_v1`** (**`schemas/topology_object_evidence_timeline.py`**, **`services/topology_object_evidence_timeline.py`**). **WebUI:** **Topology** standard panels and **Topology** dossier workspace include **`TopologyObjectEvidenceTimelinePanel`** — same non-claims as the API.

---

## Overlap review: why this is distinct, not duplicate work

| Closed slice | Canonical role | **Topology object evidence timeline** is **not** a duplicate because |
| --- | --- | --- |
| [**Policy evidence timeline**](./policy-evidence-timeline-contract.md) (`week-28-tuesday-task-01`) | **One `policy_id`** — **`policy_evidence_timeline_v1`** | Policy timeline is **policy-primary**. This contract is **topology-object-primary**: it **interleaves** evidence **across related policies and topology-scoped assemblies** with **`object_id`** / **`policy_id`** provenance—**not** a rename of the policy route. |
| [**Service evidence timeline**](./service-evidence-timeline-contract.md) (`week-35-monday-task-01`) | **One `service_id`** — **`service_evidence_timeline_v1`** | Service timeline is **membership- and service-primary**. Topology timeline is **node/link-primary** on the **topology snapshot**—orthogonal subject; **may** cite overlapping policies but **does not** use **`service_id`** as primary key. |
| [**Topology object dossier v1**](./topology-object-dossier-contract.md) (`week-29-monday-task-01`) | **One composed workspace** — **section order**, merged caveats | Dossier is **static composed sections** for **one screen**; the **timeline** is **chronology-first** (ordered entries)—**orthogonal** product shape. **Pivot** from dossier to timeline is expected; **not** the same JSON. |
| [**Failure impact**](./failure-impact-contract.md) | **Impact-oriented** **`failure_impact_v1`** for **`object_id`** | Failure impact emphasizes **relationship and degraded rollups**; timeline emphasizes **temporal ordering** of **evidence touches**—**complementary**; **not** interchangeable. |
| [**Investigation workspace**](./investigation-workspace-contract.md) | Cross-domain **`investigation_workspace`** context | Investigation is a **workspace shell** with pinned context; this timeline is **narrower** and **topology-object-primary**—**not** duplicating **InvestigationEvidenceTimeline** semantics where those exist. |
| [**Evidence pack / situation**](./evidence-pack-contract.md) (if present) | Composed **situation** assembly | Situation room / evidence pack remain **bounded** assemblies; timeline **may** **cite** overlapping domains—**does not** replace **`evidence_export_v1`** or situation contracts. |

This contract **does not** reopen **topology pairing**, **partiality decomposition**, or **coverage-history** implementation lanes closed in prior weeks; it **consumes** topology and policy APIs **as documented today**, with **explicit caveats** when those APIs report partial or stale posture.

---

## Supported subject types

| Subject | Identity | Notes |
| --- | --- | --- |
| **Topology node** | `object_kind=node`, `object_id` = `node_id` on the current normalized topology snapshot | Same rules as [**Topology object dossier**](./topology-object-dossier-contract.md) — **404** if unknown. |
| **Topology link** | `object_kind=link`, `object_id` = `link_id` on the current normalized topology snapshot | Related policies follow **union-of-endpoint** rules already documented for links; co-presence on a link does **not** imply dataplane use of that link. |

**Out of scope for v1:** device-only subjects without a topology row, abstract regions, SRLGs, multi-object bundles, or policy-first timelines (use **policy** route).

---

## Supported evidence sources (bounded reuse only)

A v1 assembly may **only** draw on domains that already exist in Phase **2** and that expose **honest** timestamps or ordering anchors **relatable to** the **`object_id`** (directly or via **related `policy_id`**). Typical sources (illustrative; exact field names follow existing schemas):

| Source | What it contributes | Honest limit |
| --- | --- | --- |
| **Topology snapshot row** | `GET /api/v1/topology` — **object identity**, **`observed_at`** / list metadata, pairing and partiality **caveats** | **Cites** topology contracts—**does not** merge graphs or assert pairing **truth** beyond API text. |
| **Failure impact** | `GET /api/v1/topology/objects/{object_id}/failure-impact` — assembly times, **`caveats`**, **`missing_evidence_notes`**, related-policy rollups | **Anchors** and **caveats** for object scope—**not** a second failure-impact **`GET`**. |
| **Topology risk summary** | `GET /api/v1/topology/risk-summary` — **one row’s** **`D`/`U`/`R`/`K`** (or equivalent) for this **`object_id`** | **Excerpt** for chronology when timestamps exist—**not** re-ranking the full table in the timeline body. |
| **Related policies** | `GET /api/v1/topology/objects/{object_id}/related-policies` | **Membership** set for **which `policy_id`s** may contribute **projected** policy-timeline entries—**same** related set rules as dossier. |
| **Per-related-policy policy evidence timeline** (conceptual) | **`policy_evidence_timeline_v1`** for each **related** **`policy_id`** | **Projection** or **cite** with **`source`** = **`policy_evidence_timeline_v1`** — **policy** route remains **authoritative** for **full** policy-only ordering. |
| **Policy inventory / history** | `GET /api/v1/policies` for **related** policies | **`observed_at`**, **`persisted_at`**, comparison checkpoints—bounded windows. |
| **Path analysis** | `GET /api/v1/policies/{policy_id}/path-analysis` for **related** policies | **`path_analysis_assembly_anchor`**-class times—interpretation-only per [**path-analysis-contract.md**](./path-analysis-contract.md). |
| **Change intelligence** | `GET /api/v1/change-intelligence/recent-summary` | **Optional** bounded **recency** context when **honestly** relatable to **related** policies or object-scoped signals—**not** a new scoring engine. |
| **Workflow-history / audit-history** | Rows **only when** citeable **`policy_id`** or snapshot metadata already embeds in the envelope | Sync-derived, bounded—**not** full workflow lifecycle semantics. |
| **Investigation / evidence-pack surfaces** | **Only** when an **existing** API response already exposes citeable timestamps or pointers for this **`object_id`** or a **related** policy in an **honest** way | **No** new investigation or pack semantics. |

**Disallowed as primary timeline evidence:** Grafana panels, raw Prometheus series as “events,” synthetic topology “health scores,” cross-object ranking, graph **simulation**, dependency **inference**, or dataplane proof.

---

## Timeline entry types (v1 vocabulary)

Entries are **typed** so operators do not confuse **inventory observation time** with **workflow causality**, **blast radius**, **pairing completeness**, or **validation**.

| Type | Meaning |
| --- | --- |
| **`topology_object_snapshot_anchor`** | Point-in-time context tied to the **topology** list/snapshot **slice** for this **`object_id`** (e.g. **`observed_at`** or equivalent). |
| **`failure_impact_assembly_anchor`** | **Failure-impact** response assembly / freshness class times—**interpretation** only; includes nested **`caveats`**. |
| **`topology_risk_summary_row_anchor`** | **Risk-summary** contribution row for this **`object_id`** when machine-comparable times exist—**not** inventing ranks. |
| **`related_policies_list_anchor`** | **Anchor** from **related-policies** list fetch—**membership** and **relationship_kind** context for downstream projections. |
| **`related_policy_timeline_entry`** | **Normalized projection** of a **`policy_evidence_timeline_v1`** entry for a **related** **`policy_id`**, with provenance—**policy** route **authoritative** for full policy-only context. |
| **`related_policy_history_checkpoint`** | **Persisted** checkpoint from **policy** **history** for a **related** **`policy_id`**. |
| **`related_path_analysis_assembly_anchor`** | Path-analysis **assembly** time for a **related** policy. |
| **`degraded_policy_signal_for_related_policy`** | **Only** when **`degraded_policy_v1`** fields for a **related** policy change between **honest** snapshots—**not** a standalone sensor stream. |
| **`sync_activity_touch`** | Workflow/audit row **only** when citeable **policy** / snapshot metadata for a **related** policy—**not** generic steps. |
| **`gap_note`** | **Missing evidence**, **unsupported** chronology, **partial** topology posture, or **no** related policies—**first-class** (see **Gap notes**). |

Adding types that imply **execution**, **approval**, **incident** ownership, **pairing proof**, or **validation verdicts** requires a **new contract revision** and explicit non-claims.

---

## Ordering semantics

1. **Primary sort key** — Each entry carries **machine-comparable** timestamps taken **verbatim** from source payloads (`observed_at`, `persisted_at`, `assembly_generated_at`, etc.). Default ordering is **newest-first** for the **topology object** scope unless a follow-on defines **oldest-first** for a sub-view.
2. **Same instant** — Tie-break deterministically: type order (stable table in schema), then **`policy_id`** (lexicographic) when present, then **`object_id`**, then source id.
3. **No causal inference** — Earlier/later does **not** imply **cause**, **fault**, **blast radius**, or **correct pairing**. Ordering is **evidence ordering** over **bounded** product data.
4. **Cross-policy mixing** — Entries from **different related policies** **may** interleave by time; **every** entry **must** carry **visible provenance** (**`policy_id`** when applicable, **source domain**, **API pointer** string).
5. **No duplicate policy timeline** — The **topology-object** timeline **does not** replace **`GET /api/v1/policies/{policy_id}/evidence-timeline`**; it **may** surface **subset** or **projection** rows **with** pointers to the **full** policy timeline.

---

## Recency and assembly time

- **Recency** for the **object** scope means **“last time this evidence family was observed or persisted in the bounded product slice for this topology object or its related policies,”** consistent with investigation and policy-timeline language: **embedded timestamps only**.
- The **composed** response **must** expose explicit **`generated_at`** (or **`metadata.generated_at`**) for the **rollup** so operators **distinguish** **assembly time** from **underlying** observation times.

---

## Gap notes

The response (or UI) **must** surface **honest gaps**:

- **Unknown or stale `object_id`** — **404** or **empty** per topology rules; **do not** fabricate rows.
- **No related policies** — **only** topology- and failure-impact-class anchors; **say so**.
- **Partial related set** — **Truncation** or **limit** from related-policies **must** be **visible** in framing.
- **Policy timeline unsupported** for a related policy — **`gap_note`** with **open policy timeline** pivot.
- **Topology partiality / pairing caveats** — **Echo** stricter caveat language from topology and [**topology-truth-depth-review.md**](./topology-truth-depth-review.md) where applicable—timeline **does not** “fix” partiality.
- **No sync-derived** rows — **do not** fabricate workflow events.

**Gap notes** are **first-class** (`gap_note` entries or a dedicated list), not footnote-only.

---

## Explicit non-claims

Stable keys (align with schema literals when implemented):

- **`not_unified_forensic_chronology`** — Not a forensic timeline across all systems or syslog merge.
- **`not_dataplane_or_forwarding_proof`** — Not per-hop, traffic, or forwarding truth.
- **`not_topology_pairing_or_coverage_truth`** — Not proving endpoint pairing completeness, node participation, or coverage history **authority**—those remain under their **closed** contracts; timeline **cites** APIs **as-is**.
- **`not_workflow_execution_order`** — Not full workflow lifecycle history beyond **bounded** sync-derived evidence already exposed.
- **`not_validation_truth`** — Not conformance, drift verdict, or safe-to-change authority.
- **`not_blast_radius_or_dependency_simulation`** — Not simulated failure propagation or dependency graphs.
- **`not_cross_object_ranking`** — Not comparing topology objects by synthetic “risk” or “health score.”
- **`not_substitute_for_policy_timeline`** — **Policy** evidence timeline remains **authoritative** for **pure policy** scope.
- **`not_substitute_for_service_timeline`** — **Service** evidence timeline remains **authoritative** for **pure service** scope.
- **`not_substitute_for_topology_dossier`** — **Topology object dossier** remains the **composed section** workspace; timeline is **chronology-first**.
- **`not_grafana_timeline`** — Grafana remains observability-only ([`dashboards.md`](./dashboards.md)).

---

## Fallback behavior when only partial evidence exists

1. **Return what exists** — Emit only entry types with **non-empty** backing fields; **never** synthesize placeholder events.
2. **Downgrade scope** — Title and summary **must** say **“partial evidence window”** or **“current snapshot only”** when history is empty or detail is blocked.
3. **Preserve non-claims** — The default explicit non-claims list remains **fully** visible; partial evidence does **not** relax honesty.
4. **Sparse related set** — Large related-policy sets **may** cap projections per policy with **honest** “+N more in policy timeline” pointers—**not** silent truncation.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| [**Topology object dossier**](./topology-object-dossier-contract.md) | **Composed sections**; **pivot** to timeline, **not** merge. |
| [**Policy evidence timeline**](./policy-evidence-timeline-contract.md) | **Policy-primary**; **source** for **related_policy_timeline_entry** projections. |
| [**Service evidence timeline**](./service-evidence-timeline-contract.md) | **Service-primary**; **different** subject. |
| [**Failure impact**](./failure-impact-contract.md) | **Impact** semantics; timeline **cites** assembly anchors only. |
| [**Topology risk summary**](./topology-risk-summary-contract.md) | **Ranking** inputs; timeline **may** cite row times—**not** re-rank. |
| [**Investigation workspace**](./investigation-workspace-contract.md) | **Workspace** shell; timeline may **align** with pinned **`topology_object`**—**not** duplicate workspace assembly. |
| [**Topology object evidence delta**](./topology-object-evidence-delta-contract.md) (planned **`topology_object_evidence_delta_v1`**) | **A vs B** difference across anchors; **orthogonal** to chronology—complements timeline, **not** a replacement. |

---

## Gap audit (implementation follow-on)

| Area | Status |
| --- | --- |
| **Contract document** | **Delivered:** this file (`topology-object-evidence-timeline-contract.md`). |
| **Schema + route** | **Shipped:** **`GET /api/v1/topology/objects/{object_id}/evidence-timeline`** — **`TopologyObjectEvidenceTimelineResponse`**. |
| **WebUI** | **Shipped:** **`TopologyObjectEvidenceTimelinePanel`** on **Topology** (selected node/link) and dossier workspace. |
| **Tests / verifier** | **Shipped:** **`pytest`** **`test_topology_object_evidence_timeline.py`**; **`verify-core-runtime.sh`** structural **`GET`** when **`python3`** samples **`first_node_id`**. |

---

## Related documents

- [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)
- [`topology-object-evidence-delta-contract.md`](./topology-object-evidence-delta-contract.md)
- [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md)
- [`service-evidence-timeline-contract.md`](./service-evidence-timeline-contract.md)
- [`failure-impact-contract.md`](./failure-impact-contract.md)
- [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md)
- [`topology-related-policies-contract.md`](./topology-related-policies-contract.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`path-analysis-contract.md`](./path-analysis-contract.md)
- [`investigation-workspace-contract.md`](./investigation-workspace-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/week-36-schedule-overview.md`](../../agent/sdn/week-36-schedule-overview.md)
