# Cross-domain evidence consistency summary v1 (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for **cross-domain evidence consistency summary v1**: a **single, concise read-side summary** that helps operators see—where Phase **2** honesty already allows—**whether multiple independent evidence families appear aligned, weakly aligned, or in tension** for the **same** or **overlapping** operational subjects, **without** inventing validation engines, drift verdicts, root-cause authority, or workflow safety.

The summary **compares interpretations already exposed** by existing APIs and contracts (strings, postures, freshness fields, history gates, **`comparison_status`** families, explicit caveats). It **does not** compute new configuration diffs, dataplane proofs, or unified “network truth” scores.

Stable product vocabulary (for implementation and tests when the surface ships): **`evidence_consistency_summary_v1`**

**Implementation posture (v1):** **`GET /api/v1/evidence-consistency/summary`** in **`app-api`**; **WebUI** **Overview** / **NOC cockpit** **`EvidenceConsistencyOverviewEntry`** and shell view **`view=evidence-consistency`** (**`EvidenceConsistencyView`**) with **`navigateToEvidenceConsistencyWorkspace`** from composed surfaces — **this file** remains the **semantic bounds**, **contradiction taxonomy**, and **non-claims** authority for **`evidence_consistency_summary_v1`**.

---

## Overlap review: why this is not a duplicate of adjacent surfaces

| Adjacent surface | Canonical role | **Evidence consistency summary** is **not** a duplicate because |
| --- | --- | --- |
| [**Change intelligence**](./change-intelligence-contract.md) | **Recent activity** — **what appears to have changed recently** across domains (`backend_defined_bounded_lookback`, activity rows). | Consistency summary is **not** a recency index; it may **cite** change intelligence as **one signal** but **leads** with **cross-check** and **tension** between **co-present** static and dynamic read-side postures—not “what moved.” |
| [**Cross-domain delta digest**](./cross-domain-delta-digest-contract.md) | **Delta-shaped sections** — ordered digest of **changes**, comparisons, pointers (`cross_domain_delta_digest_v1`). | Digest is **delta- and section-ordered**; consistency summary is **relational**—**alignment / weak alignment / contradiction** across domains for **linked** subjects, **without** replacing digest layout or duplicating delta math. |
| [**Change safety case**](./change-safety-case-contract.md) | **Subject-centric pre-change** sufficiency — **one** policy / service / topology subject, **gap** and **understanding posture** (`change_safety_case_v1`). | Safety case is **deep** on **one** subject; consistency summary is **cross-domain** and may be **global or windowed**—**safety-adjacent** but **not** the same section order or report shape. |
| [**Service evidence timeline**](./service-evidence-timeline-contract.md) / [**Service evidence delta**](./service-evidence-delta-contract.md) | **Service-primary** chronology and **A vs B** comparison for **`service_id`**. | Service-scoped **time** and **delta** contracts; consistency summary may **reference** them as **inputs** when **`service_id`** is in scope but **does not** substitute for **`service_evidence_timeline_v1`** or **`service_evidence_delta_v1`** semantics. |

**Relation to week 24 / 30 / 32 work:** Completed tasks established **recent-summary** aggregation ([`week-24-monday-task-01-change-intelligence-contract-and-safety-rules.md`](../../agent/sdn-tasks/completed/week-24-monday-task-01-change-intelligence-contract-and-safety-rules.md)), **digest** sections ([`week-30-monday-task-01-cross-domain-delta-digest-contract.md`](../../agent/sdn-tasks/completed/week-30-monday-task-01-cross-domain-delta-digest-contract.md)), and **pre-change** composed reports ([`week-32-wednesday-task-01-change-safety-case-contract.md`](../../agent/sdn-tasks/completed/week-32-wednesday-task-01-change-safety-case-contract.md)). **Evidence consistency** adds a **new** question: *do the read-side stories we already show **agree** or **pull apart** in ways operators should notice?*

---

## Supported domains (inputs)

A conforming summary **may** draw **only** from these **Phase 2** evidence families (each subject to its own contract limits). The summary **does not** add domains.

| Domain | Primary read-side sources (examples) | Role in consistency summary |
| --- | --- | --- |
| **Platform / sync anchor** | **`GET /api/v1/platform/status`**, sync-run visibility in **`GET /api/v1/workflow-history`**, **`GET /api/v1/audit-history`** | **Time anchor honesty** — e.g. “recent sync” vs **stale** inventory/topology **without** implying a single global clock. |
| **Devices (inventory)** | **`GET /api/v1/devices`**, **`history`**, **`comparison_to_latest_persisted`**, **`data_status`**, **`serving_mode`** | **Freshness and comparison posture** for inventory vs other domains. |
| **Topology** | **`GET /api/v1/topology`**, **`history`**, **`coverage_summary`**, pairing / inference postures | **Partiality** and **relationship** honesty vs policy strings and inventory. |
| **Policies** | **`GET /api/v1/policies`**, **`degraded_policy_v1`**, **`history`**, optional [**policy evidence delta**](./policy-evidence-delta-contract.md) / [**timeline**](./policy-evidence-timeline-contract.md) | **Posture** and **history gates** vs topology linkage and inventory. |
| **Change intelligence** | **`GET /api/v1/change-intelligence/recent-summary`** | **Activity** signal vs **static** snapshot comparisons (tension when both are in scope). |
| **Capabilities / readiness (optional)** | **`GET /api/v1/capabilities`**, readiness snapshot inspection | **Planning-support** only — **not** expanded into scoring; may surface **tension** with **degraded** operational read-side if both are visible. |
| **Service-scoped (optional)** | [**Service Explorer**](./service-explorer-contract.md), [**service evidence timeline**](./service-evidence-timeline-contract.md), [**service evidence delta**](./service-evidence-delta-contract.md) | When **`service_id`** is in scope — **membership** and **service-level** deltas vs flat policy/topology views. |

**Disallowed as primary inputs:** Grafana as **business truth**; Prometheus as **row-level** evidence; **workflow** execution records as proof of correctness; **new** collector tables.

---

## Consistency signals (non-authoritative vocabulary)

These are **allowed** labels for **rows** or **notes** in the summary. They **must** map to **cited** fields or **explicit caveats** from source responses—**not** invented grades.

| Signal | Meaning |
| --- | --- |
| **`appears_aligned`** | Two or more domains **independently** expose compatible postures for the **same** cited identity or pivot (e.g. matching string rules already documented in [**topology-related-policies**](./topology-related-policies-contract.md)); **still** not proof of correctness. |
| **`weak_alignment`** | Overlap exists but **at least one** domain is **partial**, **degraded**, **truncated**, or **history-gated**—operators should **not** treat as redundant confirmation. |
| **`appears_in_tension`** | **Contradiction category** applies (see below)—read-side stories **pull apart** in a way that is **visible** from API fields; **not** a root-cause verdict. |
| **`not_comparable`** | Insufficient overlapping anchors (e.g. **no** comparable history on one side, empty membership, or **unsupported** identity form)—**no** invented alignment. |
| **`gap_note`** | Honest **cannot assess** — missing snapshot, **collector_unavailable**, or internal consistency edge between history summary and snapshot load (same honesty pattern as **policy evidence delta**). |

Implementations **must not** emit **`appears_aligned`** when the only “agreement” is **absence** of data in multiple domains (silent emptiness is **not** alignment).

---

## Contradiction taxonomy (v1, bounded)

A **contradiction** here means **observable tension** between **normalized read-side fields or caveats** already defined in contracts—**not** proof that the network is wrong or that two systems are logically inconsistent in the vendor sense.

| Category | When it applies (examples) |
| --- | --- |
| **`identity_or_reference_tension`** | The same **string** is used as a **pivot** in one domain but **fails** identity rules or **match** in another (e.g. policy **`headend`/`endpoint`** vs topology **`node_id`** match rules) **as already documented**—summary **cites** both sides. |
| **`freshness_or_serving_mismatch`** | **Overlapping** scope shows **`live`** vs **`persisted_fallback`**, **`stale`** row posture, or **`data_status`** mismatch such that operators could **overread** one panel as “current” without seeing the other—summary **makes tension explicit**. |
| **`posture_tension`** | **Degraded** / **unknown** posture in **policy** or **inventory** coexists with **topology** presentation that **implies** full linkage or **`present`** evidence **without** merged caveats from both sources. |
| **`activity_vs_static_tension`** | **Change intelligence** or **digest** points to **recent movement** in a domain while **per-domain history** or **evidence delta** reports **`no_comparable_anchor`**, **empty** history, or **insufficient_evidence** for the **same** subject family—**not** a bug claim; **read-side honesty** gap. |
| **`history_gate_mismatch`** | One domain exposes **`comparison_ready`**-class semantics while another **linked** domain lacks **two** snapshots or comparable rows—**bounded** tension, not a workflow defect. |
| **`scope_mismatch`** | **Truncation**, **`limit`**, or **`detail_mode`** means **different** effective universes for the same **operator question**—summary surfaces **scope** tension (same spirit as **delta digest** truncation rules). |

Adding categories that imply **approval**, **validation**, **SLA**, **customer impact**, or **automated remediation** requires a **contract revision** and new non-claims.

---

## Explicit non-claims

A **cross-domain evidence consistency summary v1** is:

- **Not** **validation truth** — does not pass/fail changes, intent, or conformance.
- **Not** **drift truth** — does not assert configuration drift, golden-config truth, or “expected vs actual” authority ([**policy evidence delta**](./policy-evidence-delta-contract.md) remains **not** drift truth; same discipline here).
- **Not** **root cause** — does not identify failure domains, blast radius, or incident ownership.
- **Not** **safe-to-change** or **workflow safety** — does not substitute for [**Change safety case**](./change-safety-case-contract.md) or execution approval.
- **Not** a **unified score** or **severity index** across domains unless a **source contract** already exposes a comparable field (default: **forbidden**).
- **Not** **Grafana semantics** — product-owned summary; see [`dashboards.md`](./dashboards.md).
- **Not** **completeness** when evidence is partial — **`bounded_partial`** and **`gap_note`** remain first-class.

---

## Assembly rules (normative)

1. **No new diff engine:** Tension detection **reuses** existing comparison fields, **`delta_items`** categories, **`comparison_status`**, **`caveats`**, **`missing_evidence_notes`**, **`evidence_confidence`**, topology **coverage** postures—**no** novel hashes or graph algorithms.
2. **Same identity rules:** Cross-domain references follow **existing** string equality and pivot rules (**not** new entity resolution).
3. **Propagate source caveats:** Merge **`caveats`** from nested responses **without** weakening them.
4. **Single coherent `generated_at`:** The summary exposes a clear **assembly timestamp**; per-domain **freshness** may differ—**must** remain visible.
5. **Empty / sparse:** When domains are **empty** or **fallback-served**, prefer **`gap_note`** / **`not_comparable`** over **empty** UI that implies “all clear.”

---

## Empty / sparse behavior

1. **New baseline / redeploy:** Emit explicit **no cross-domain comparison** language when history is **single-snapshot** or **unavailable**—same honesty model as devices/topology/policy gates.
2. **Partial domains:** **Do not** block the whole summary; **isolate** sections per domain.
3. **No invented tension:** **Absence** of contradiction is a valid outcome; **do not** fabricate conflict to fill space.

---

## Related documents

- [`change-intelligence-contract.md`](./change-intelligence-contract.md)
- [`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md)
- [`change-safety-case-contract.md`](./change-safety-case-contract.md)
- [`service-evidence-timeline-contract.md`](./service-evidence-timeline-contract.md)
- [`service-evidence-delta-contract.md`](./service-evidence-delta-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../agent/sdn/03-CURRENT-STATUS.md)
- [`agent/sdn/week-35-schedule-overview.md`](../agent/sdn/week-35-schedule-overview.md)

---

## Gap audit (this authoring task)

| Area | Status |
| --- | --- |
| **Contract document** | **Delivered:** this file (`evidence-consistency-summary-contract.md`). |
| **Schema + route** | **Shipped:** `GET /api/v1/evidence-consistency/summary` — **`evidence_consistency_summary_v1`** (`schemas/evidence_consistency_summary.py`, `services/evidence_consistency_summary.py`, `routers/evidence_consistency.py`). |
| **WebUI** | **Shipped:** **`EvidenceConsistencyOverviewEntry`** on **Overview** (standard layout) and **NOC cockpit** quick grid (`evidence-consistency-overview-entry.tsx`). |
| **Tests / verifier** | **Shipped:** repository **`pytest`** (`tests/test_evidence_consistency_summary.py`), **`vitest`** / **`api-client-week28-paths`**, structural **`verify-core-runtime.sh`** sampling. |
