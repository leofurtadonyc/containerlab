# Topology object evidence delta contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **topology-object-centric evidence delta** product slice: an operator-facing **comparison-style** view of **what appears different** for **one topology `node` or `link`** between **current** read-side evidence (as **related-policies**, **failure-impact**, and **topology snapshot** context would surface for that **`object_id`**) and a **recent persisted or historical anchor**—so operators can **orient** on **grouped** change-like signals in the **bounded models the platform already exposes**—**without** claiming **topology drift truth**, **pairing or coverage completeness**, **blast-radius simulation**, **outage or SLA impact**, **cross-object ranking**, or **substitution** for per-policy or per-service deep diff.

**Topology object evidence delta v1** is **evidence-derived** and **topology-object-scoped**: the subject is **`object_kind`** (`node` \| `link`) and **`object_id`** on the **normalized topology snapshot**, using the **same identity and 404 rules** as [**Topology object dossier v1**](./topology-object-dossier-contract.md), [**Failure impact**](./failure-impact-contract.md), [**Related policies**](./topology-related-policies-contract.md), and [**Topology risk summary**](./topology-risk-summary-contract.md). It **compares** sets and rollups that are **already** defined on those read APIs and on [**policy inventory**](./data-flows.md) / **policy history** where they intersect the **related-policy** set; it does **not** invent a graph diff engine, **not** a dataplane reconciliation verdict, and **not** global topology posture delta across the whole inventory.

Stable product vocabulary (for implementation and tests when the surface ships): **`contract_id`:** **`topology_object_evidence_delta_v1`**

**HTTP / WebUI (illustrative until routed):** a read API such as **`GET /api/v1/topology/objects/{object_id}/evidence-delta`** with the same path identity rules as [**topology object evidence timeline**](./topology-object-evidence-timeline-contract.md). Until implemented, this file is the **authoritative vocabulary** for delta layout and non-claims.

---

## Overlap review: why this is distinct, not duplicate work

| Closed / adjacent slice | Canonical role | **Topology object evidence delta** is **not** a duplicate because |
| --- | --- | --- |
| [**Policy evidence delta**](./policy-evidence-delta-contract.md) (`week-28-thursday-task-01`) | **One `policy_id`** — **`policy_evidence_delta_v1`** | **Policy-primary**. Topology-object delta is **object-primary**: it reasons about the **related-policy set**, **failure-impact rollups**, and **topology row / risk-summary inputs** for **one** **`object_id`**—**not** a rename of **`GET /api/v1/policies/{policy_id}/evidence-delta`**. |
| [**Service evidence delta**](./service-evidence-delta-contract.md) (`week-35-tuesday-task-01`) | **One `service_id`** — **`service_evidence_delta_v1`** | **Service-primary** (Explorer membership, **`degraded_service`**, **`topology_links`**). Topology-object delta is **node/link-primary** on the **topology snapshot**—orthogonal subject; **may** cite overlapping **`policy_id`**s but **does not** use **`service_id`**. |
| [**Topology object dossier v1**](./topology-object-dossier-contract.md) (`week-29-monday-task-01`) | **One composed workspace** — **section order**, merged caveats | Dossier is **static composition** for **one screen**; delta is **A vs B** comparison with **explicit anchors**—**orthogonal**; **pivot** expected, **not** merged JSON. |
| [**Topology object evidence timeline**](./topology-object-evidence-timeline-contract.md) | **Chronology** — **`topology_object_evidence_timeline_v1`** | Timeline is **ordering**; delta is **difference across two anchors**—**orthogonal** (same relationship as policy timeline vs policy delta). |
| [**Failure impact**](./failure-impact-contract.md) | **Current** **`failure_impact_v1`** rollup for **`object_id`** | Failure impact is **one-sided** assembly for **current** slice; delta **compares** failure-impact-shaped **or equivalent** rollups **across labeled anchors**—**not** a second failure-impact **`GET`** without comparison semantics. |
| **Global topology comparison** | **`GET /api/v1/topology`** **comparison_to_latest_persisted** (when present) | Product-wide topology slice honesty; **not** a per-object **evidence delta** contract—object delta **may cite** persisted topology **only** as it affects **this** **`object_id`** row, **not** whole-graph simulation. |

This contract **does not** reopen **topology truth-depth** pairing authority, **endpoint-pairing** completeness claims, or **coverage-history** semantics; it **consumes** APIs **as documented today** and may emit **explicit** **unsupported** / **gap** when persisted anchors are **partial** or **non-comparable**.

---

## Topology object identity

Implementations **MUST** use the **same** **`object_id`** and **node vs link** resolution as [**Topology object dossier**](./topology-object-dossier-contract.md) and [**Related policies**](./topology-related-policies-contract.md):

- **Unknown** **`object_id`** → **404** (same as related-policies / failure-impact / dossier)—**no** fabricated delta.
- **Related-policy set** for comparison = **same** string-equality rules as **`GET /api/v1/topology/objects/{object_id}/related-policies`** at each anchor **when** that assembly is available for the anchor slice.

---

## Compared sources (v1)

A v1 delta assembly may **only** compare evidence that Phase **2** already exposes read-only:

| Role | Typical source | Meaning |
| --- | --- | --- |
| **Current (“A”)** | **Current** topology object lens: **`GET /api/v1/topology/objects/{object_id}/related-policies`**, **`GET /api/v1/topology/objects/{object_id}/failure-impact`**, **`GET /api/v1/topology/risk-summary`** **row** for this **`object_id`**, and the **current** topology **node** or **link** row from **`GET /api/v1/topology`** (identity, state, pairing **cues** already exposed)—plus **per-related** **`policy_id`** rows on **`GET /api/v1/policies`** as needed for **degraded_policy_v1** alignment | **Not** “network ground truth”; **read-side** evidence only. |
| **Previous (“B”) anchor** | A **single** explicitly labeled anchor drawn from **existing** persisted semantics: e.g. **previous persisted normalized topology snapshot** that still contains **`object_id`**, intersected with **related-policy** and **policy** history rules **already** used elsewhere (same **honesty** as **policy** / **service** delta families), **or** a **labeled** “previous assembly” id when the product defines a stable persisted reference for **object-shaped** assemblies | **B** must be **labeled** (`persisted_at`, snapshot id, “previous topology snapshot,” etc.). Operators must see **what** was compared. |

**Disallowed as primary delta inputs:** Grafana panels, Prometheus series as row-level object diffs, synthetic “topology health delta scores,” workflow payloads as **authoritative** change truth, or **cross-object** ranking inside the delta body.

---

## Current vs previous anchor behavior

1. **Anchors are explicit** — The response must name **which** “current” assembly time and **which** “previous” anchor were used for **topology**, **policy inventory**, and **related-policy** membership when those domains participate.
2. **Not every pair is valid** — If **no** persisted topology row exists for **`object_id`** on **B**, or **policy** history is **not** `comparison_ready` for the related set, the contract emits **`insufficient_evidence`**, **`gap_note`**, or **single-anchor-only** posture—**no** fake “no changes.”
3. **Reuse persisted comparison posture** — Where **`GET /api/v1/topology`** or **`GET /api/v1/policies`** already exposes **`comparison_to_latest_persisted`**, **`history`**, or bounded **snapshot** semantics, implementations **should** **reuse** those definitions for choosing **B** rather than inventing a second reconciliation story.
4. **No merge of unrelated domains** — Inventory freshness, collector posture, or Grafana mirrors appear as **caveats** only; they do **not** become a single “object delta score.”

---

## Delta categories (v1 vocabulary)

Deltas are **categories of observable difference** in **normalized object-scoped** fields and **derived sets**, not a single severity score.

| Category | Meaning |
| --- | --- |
| **`related_policy_set_change`** | **`policy_id`** **added** or **removed** from the **related-policy** set for this **`object_id`** between anchors (set diff on **string-equality** related references). |
| **`failure_impact_rollup_change`** | Differences in **failure-impact** **`rollup_counts`** or **`degraded_posture_breakdown`** **within the related set** when both anchors expose **`failure_impact_v1`**-shaped assemblies—**subset-scoped**, **not** global policy health. |
| **`related_member_degraded_policy_change`** | One or more **related** policies changed **`degraded_policy_v1.posture`** or **`reason_codes`** — implementations **may** cite nested **`policy_evidence_delta_v1`** **pointers** or **summary** per [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) **without** duplicating full policy delta payloads by default. |
| **`topology_row_observation_change`** | Bounded differences in **topology node/link** fields **already exposed** on the snapshot row (e.g. **state**, **current_posture**, **endpoint pairing** **cues**) **when both** anchors include a comparable row for **`object_id`**—**not** proof of dataplane or pairing **truth**. |
| **`risk_summary_ranking_inputs_change`** | Differences in **risk-summary** **`D`/`U`/`R`/`K`**-class inputs **for this object** when both assemblies expose a comparable row—**not** re-ranking the full inventory in the delta body. |
| **`topology_snapshot_caveat_echo_change`** | Differences in **caveats**, **missing_evidence_notes**, or **global** related-policy **caveats** that affect interpretation—**honesty** deltas, not device fault. |
| **`no_comparable_fields`** | Both anchors exist but **no** overlapping comparable object-scoped fields for this slice. |
| **`gap_note`** | **Cannot compare**, **missing anchor**, or **partial** persisted evidence—**not** a silent empty diff. |

Adding categories that imply **approval**, **validation**, **blast-radius** **truth**, or **automated remediation** requires a **contract revision** and new non-claims.

---

## Reuse of policy evidence delta semantics

When a **related** **`policy_id`** has a **comparable** [**policy evidence delta**](./policy-evidence-delta-contract.md) between the **same anchor family** as the topology-object delta, implementations **may**:

1. **Embed** a **summary** of **`policy_evidence_delta_v1`** **`comparison_status`** and **category** flags **per changed** related policy, **or**
2. **Point** to **`GET /api/v1/policies/{policy_id}/evidence-delta`** as **authoritative** for **full** per-policy diff.

Implementations **must not** **recompute** a **different** policy delta algorithm than **`policy_evidence_delta_v1`**. **Topology-object** delta is **not** a substitute for opening **per-policy** delta when **deep** policy field diff is needed.

---

## Unknown / insufficient-evidence behavior

1. **No second anchor** — Emit **`gap_note`** / **`comparison_status`**-class semantics consistent with **policy** / **service** delta honesty: **no** fake “no changes.”
2. **Topology row missing on B** — **Omit** **`topology_row_observation_change`** or mark **unsupported**; **no** inferred equality.
3. **Related-policy assembly unavailable on one side** — **Downgrade** to **gap** or **partial** with explicit notes; **no** invented related set.
4. **Partial policy detail** — **`detail_mode`** / **`empty_reason`** limits **may** block **some** member policy deltas; **downgrade** categories accordingly.
5. **Risk-summary row absent on one side** — **`risk_summary_ranking_inputs_change`** **omitted** or **gap_note**; **no** synthetic rank delta.

---

## Explicit non-claims

Stable keys (align with schema literals when implemented):

- **`not_topology_drift_truth`** — Differences are **read-side evidence** deltas, not authoritative topology or control-plane drift.
- **`not_pairing_or_coverage_truth`** — **Not** proving endpoint pairing completeness, node participation, or coverage history **authority**.
- **`not_blast_radius_or_dependency_simulation`** — **Not** simulated failure propagation or dependency graphs.
- **`not_outage_or_sla_impact`** — **Not** outage, SLA, customer, or availability impact claims.
- **`not_cross_object_ranking`** — **Not** comparing topology objects by synthetic score inside this delta (risk-summary **row** excerpt is **one object** only).
- **`not_policy_correctness_verdict`** — **Not** aggregate “policies are correct/incorrect” for the object.
- **`not_workflow_validation`** — **Not** tied to workflow execution, approval, or dry-run validation engines.
- **`not_dataplane_or_forwarding_verdict`** — **Not** dataplane or forwarding outcome proof.
- **`not_substitute_for_policy_delta`** — [**Policy evidence delta**](./policy-evidence-delta-contract.md) remains **authoritative** for **full** **`policy_id`**-scoped comparison.
- **`not_substitute_for_service_delta`** — [**Service evidence delta**](./service-evidence-delta-contract.md) remains **authoritative** for **service**-scoped comparison.
- **`not_replacement_for_topology_object_timeline`** — Complements [**topology object evidence timeline**](./topology-object-evidence-timeline-contract.md); does **not** replace chronology.
- **`not_grafana_delta`** — **Grafana** does **not** own product delta semantics ([`dashboards.md`](./dashboards.md)).

---

## Operator-safe copy expectations

- Prefer **“topology object evidence delta”** or **“object-scoped read-side difference”** over **“topology drift,”** **“link failure,”** or **“blast radius change”** unless paired with a **visible** disclaimer that meaning is **evidence-bounded**.
- **Grafana** must **not** own delta semantics; **app-api** and product copy **own** the contract.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) | **Per-policy** **`policy_evidence_delta_v1`**; **source** for related-member projections. |
| [`service-evidence-delta-contract.md`](./service-evidence-delta-contract.md) | **Per-service** **`service_evidence_delta_v1`**; **different** subject. |
| [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md) | **Chronology** **`topology_object_evidence_timeline_v1`**; delta is **orthogonal**. |
| [`failure-impact-contract.md`](./failure-impact-contract.md) | **Current** impact rollups; delta **compares** across anchors when defined. |
| [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md) | **Ranking** inputs; delta **may** cite **per-object** row changes—**not** full-table diff. |
| [`data-flows.md`](./data-flows.md) | Policy and topology **history** honesty for choosing **B**. |

---

## Gap audit (implementation follow-on)

| Area | Status (week 36 Tuesday task 02) |
| --- | --- |
| **Contract document** | **Delivered:** this file (`topology-object-evidence-delta-contract.md`). |
| **Schema + route** | **Delivered:** **`GET /api/v1/topology/objects/{object_id}/evidence-delta`** — **`schemas/topology_object_evidence_delta.py`**, **`services/topology_object_evidence_delta.py`**, **`routers/topology.py`**. |
| **WebUI** | **Delivered:** **`TopologyObjectEvidenceDeltaPanel`** on **Topology** (selected node/link) and **Topology** dossier workspace. |
| **Tests / verifier** | **Delivered:** **`test_topology_object_evidence_delta.py`**, **`verify-core-runtime.sh`** when **`first_node_id`** is sampled; **`vitest`** **`api-client-week28-paths.test.ts`**, **`topology-object-dossier-workspace.test.tsx`**. |

---

## Related documents

- [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)
- [`topology-object-evidence-timeline-contract.md`](./topology-object-evidence-timeline-contract.md)
- [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md)
- [`service-evidence-delta-contract.md`](./service-evidence-delta-contract.md)
- [`failure-impact-contract.md`](./failure-impact-contract.md)
- [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md)
- [`topology-related-policies-contract.md`](./topology-related-policies-contract.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/week-36-schedule-overview.md`](../../agent/sdn/week-36-schedule-overview.md)
