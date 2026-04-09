# Cross-domain delta digest v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for a **cross-domain delta digest v1**: a **single, concise read-side summary** that helps operators answer—within Phase **2** honesty limits—**“What appears to have changed recently across the platform’s bounded evidence domains?”**

The digest **aggregates pointers and delta-shaped summaries** that are **already computable** from existing read APIs, persisted snapshot history, and documented comparison fields. It **does not** introduce a new collector domain, a unified event log, or a cross-domain scoring engine.

Stable product vocabulary (for implementation and tests when the digest ships): **`cross_domain_delta_digest_v1`**

**Relationship to change intelligence:** [`change-intelligence-contract.md`](./change-intelligence-contract.md) defines **`GET /api/v1/change-intelligence/recent-summary`**—a **backend-owned cross-domain “recent activity”** summary with explicit domain rows and completeness posture. The **delta digest** is **complementary**: it is **framed around deltas and comparisons** (inventory/topology/policy posture shifts, sync anchoring, pointers into change intelligence) and **normative section layout** for operator scanning. A future implementation **must** reuse the change-intelligence summary where applicable **as a pointer or embedded excerpt**, not invent a second competing aggregation semantics layer.

**Implementation posture (v1):** May ship as a **WebUI composition** (e.g. Overview region or dedicated view) that calls **only** documented **`GET /api/v1/...`** routes, and/or the thin read-only backend assembly **`GET /api/v1/delta-digest`** (**`cross_domain_delta_digest_v1`**) in **`app-api`** (`schemas/delta_digest.py`, `services/delta_digest.py`, `routers/delta_digest.py`)—this file defines **what the digest may claim**, **section order**, and **honesty limits**. The route embeds **`GET /api/v1/change-intelligence/recent-summary`** as **`recent_change_summary`** (same contract id inside) and composes **platform**, **devices**, **topology**, **policies**, and **capabilities** list responses **without** new diff or collector semantics.

---

## Included domains

A conforming digest **may** draw **only** from these **Phase 2** evidence families (each subject to its own contract limits):

| Domain | Primary sources (examples) | Role in the digest |
| --- | --- | --- |
| **Sync / platform anchor** | **`GET /api/v1/platform/status`**, sync-run visibility in **`GET /api/v1/workflow-history`**, **`GET /api/v1/audit-history`**, Postgres-backed sync-run rows | **Recent sync anchor summary**—bounded recency, not a global “network last changed” clock |
| **Devices (inventory)** | **`GET /api/v1/devices`**, inventory **`history`**, **`comparison_to_latest_persisted`**, snapshot history contracts | **Device inventory delta summary**—honest comparison and history gates per devices truth depth |
| **Topology** | **`GET /api/v1/topology`**, topology **`history`**, coverage / pairing / collection posture fields | **Topology change / coverage posture summary**—partial graphs and inference limits stay visible |
| **Policies** | **`GET /api/v1/policies`**, **`degraded_policy_v1`** ([`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)), policy **`history`**, optional alignment with [**`policy_evidence_delta_v1`**](./policy-evidence-delta-contract.md) when a policy id is in scope | **Policy delta + degraded change summary**—inventory-normalized bounds; no dataplane proof |
| **Change intelligence** | **`GET /api/v1/change-intelligence/recent-summary`** ([`change-intelligence-contract.md`](./change-intelligence-contract.md)) | **Change-intelligence pointer summary**—cross-domain “what moved” row or link; same **`sync_runs_limit`** discipline where shared |
| **Capabilities / readiness (optional excerpt)** | **`GET /api/v1/capabilities`**, readiness snapshot inspection surfaces | **Only** when already used in assemblies—planning-support tone; not expanded into new scoring |

**Out of scope for v1:** Grafana or Prometheus as digest **business-truth** sources (metrics may inform **staleness** display only where already mirrored in product contracts); ODL write paths; workflow execution records as operational change truth.

---

## Time anchoring rules

1. **Sync-run alignment:** When the digest shares a window with **change intelligence**, **investigation**, **situation room**, or **Overview** recent-change panels, use the **same** documented **`sync_runs_limit`** (and max bounds) as those routes—**do not** invent independent window math.
2. **Snapshot anchors:** “Delta” language must trace to **API-visible** anchors—e.g. **`comparison_to_latest_persisted`**, persisted **`history.recent_snapshots`**, policy evidence delta **`comparison_status`**—with explicit **empty/unavailable** states when Postgres or snapshots do not support a comparison.
3. **Backend-defined recency:** Where a domain uses **`backend_defined_bounded_lookback`** or echo fields (**`read_side_query`**, **`sync_runs_limit_applied`**, etc.), the digest **repeats** those postures; it does **not** imply wall-clock completeness across all domains.
4. **Single coherent “as-of”:** The digest should present a clear **assembly timestamp** (or **`generated_at`**) and per-section **freshness** hints when underlying responses differ in age.

---

## Digest section layout (normative v1)

Sections **SHOULD** appear in this **order** so operators get a stable scan pattern. Each section **must** tolerate **empty/sparse** without collapsing honesty.

1. **Recent sync anchor summary** — Bounded summary of **visible sync-run / platform observation** recency (from workflow/audit/platform surfaces already exposed). **Not** a forensic timeline of every task.
2. **Device inventory delta summary** — Honest inventory movement: snapshot anchors, comparison posture, role/count deltas where **`devices`** history supports them; **explicit** when history is unavailable or fallback-served.
3. **Topology change / coverage posture summary** — Changes or posture shifts visible in **topology** snapshot/history and coverage fields; **explicit** when topology is partial, inferred, or degraded.
4. **Policy delta + degraded change summary** — Policy inventory deltas, **`degraded_policy_v1`** posture movements, and—when in scope—pointers to **evidence delta** / timeline **without** duplicating per-policy engines.
5. **Change-intelligence pointer summary** — Short pointer to **`recent-summary`** (or embedded excerpt with **same** contract id and non-claims). Serves as the **cross-domain activity index** link, not a second competing scorer.
6. **Recommended pivots** — Bounded navigation suggestions into [**policy**](./policy-dossier-contract.md) / [**topology object**](./topology-object-dossier-contract.md) **dossiers**, [**situation room**](./evidence-pack-contract.md), [**investigation workspace**](./investigation-workspace-contract.md), and [**operator search**](./operator-search-contract.md)—labeled as **navigation suggestions derived from visible evidence**, not incident priority.
7. **Caveats / missing evidence** — Merged **`caveats`**, **`missing_evidence_notes`**, completeness postures, and per-domain **blocked/fallback** reasons **as already exposed** by source contracts.

---

## Bounded comparison rules

1. **No new diff engine:** The digest **must not** compute novel structural diffs, configuration hashes, or dependency graphs beyond what **existing** APIs and schemas already expose (e.g. policy [**`evidence-delta`**](./policy-evidence-delta-contract.md) **`delta_items`**, devices/topology **`comparison_to_previous`** when present).
2. **Same identity rules:** Cross-domain references (e.g. device id vs topology node id) follow **existing** string-equality and pivot rules from [**topology-related-policies**](./topology-related-policies-contract.md) and related contracts—**not** new entity resolution.
3. **No merged scores:** Do **not** produce a digest-wide **health score**, **risk score**, or **urgency index** from multiple domains unless the **source field** is already labeled as such in its contract (default: **forbidden** in v1).
4. **Truncation:** When lists are capped, show **`items_returned`**, **`items_total`**, or one-line **truncation notes** when the source API provides them—consistent with [**NOC cockpit**](./noc-cockpit-contract.md) truncation rules.

---

## Explicit non-claims

A **cross-domain delta digest v1** is:

- **Not** a **forensic timeline** — it does not replace workflow/audit event streams or per-record chronologies; it summarizes **bounded deltas** and **pointers**.
- **Not** a **workflow execution truth source** — sync-run and audit visibility are **read-side** and **bounded**; no execution authority.
- **Not** a **drift verdict** — no “expected vs actual” authority; policy [**evidence delta**](./policy-evidence-delta-contract.md) remains **not** drift truth.
- **Not** **validation proof** — no conformance, intent verification, or safe-to-change claims.
- **Not** **incident command authority** — no severity engine, on-call roster, or approval to change the network.
- **Not** a **unified cross-domain score** — no synthetic urgency index across inventory, topology, and policy.

Additional denials (aligned with change intelligence and investigation assemblies):

- **Not** safe-to-change, **not** approval to execute operations  
- **Not** completeness when evidence is partial—**bounded_partial** must remain visible  
- **Not** Grafana-owned semantics for digest content (see [`dashboards.md`](./dashboards.md))

---

## Caveat and freshness propagation

1. **Per-section isolation:** A failed or **fallback** domain **must not** block other sections; show **bounded error/partial** copy per section.
2. **Propagate source caveats:** Merge **`caveats`**, **`missing_evidence_notes`**, **`assembly_notes`**, and **`explicit_non_claims`** from nested responses **without** weakening or hiding them.
3. **Freshness honesty:** When **devices**, **topology**, or **policies** responses differ in **`data_status`**, **`serving_mode`**, or **`evidence_confidence`**, the digest **surfaces** that posture at section scope—it **must not** imply uniform freshness.
4. **Readiness:** If readiness excerpts appear, they remain **planning-support** only ([`readiness-capability-decision-support-contract.md`](./readiness-capability-decision-support-contract.md)).

---

## Empty / sparse behavior

1. **New baseline / empty history:** When Postgres or API responses lack snapshot rows, emit **explicit** “no comparison available” / “fresh baseline” language—same honesty model as devices/topology/policy history gates.
2. **Single-snapshot domains:** Sections **must** render **honest partiality** (e.g. policy delta **not comparable**) rather than blanking the digest.
3. **No invented activity:** Do **not** fill gaps with inferred events; **absence** is a valid outcome.
4. **Operator guidance:** Prefer **“open X for detail”** pivots over speculative narrative.

---

## Related documents

- [`change-intelligence-contract.md`](./change-intelligence-contract.md) — recent-summary aggregation  
- [`evidence-consistency-summary-contract.md`](./evidence-consistency-summary-contract.md) — cross-domain **alignment / tension** (`evidence_consistency_summary_v1`); complementary to digest **deltas**, not a second digest  
- [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) — nested assembly context  
- [`evidence-pack-contract.md`](./evidence-pack-contract.md) — situation room assembly  
- [`noc-cockpit-contract.md`](./noc-cockpit-contract.md) — Overview composition without new truth engines  
- [`policy-dossier-contract.md`](./policy-dossier-contract.md), [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) — dossier pivots  
- [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) — bounded per-policy comparison semantics  
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md), [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)  
- [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) — operational verdict  

---

## Current phase

This contract defines a **Phase 2 read-only product surface** within the current repo state. It **does not** authorize broader workflow expansion, phase transition, or validation engines.

Implementations **must not** justify changing [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md) unless separate evidence exists for a documented phase-boundary review (out of scope for this document).
