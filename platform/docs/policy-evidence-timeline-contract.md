# Policy evidence timeline contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **per-policy evidence timeline** product slice: an operator-facing, **chronology-like** ordering of **existing** policy-related timestamps and evidence pointers—so operators can see **what happened when** in the **bounded read models the platform already exposes**—without claiming a unified forensic log, packet-path proof, workflow execution truth, or validation authority.

The timeline is **evidence-derived** and **policy-scoped**: the subject is a **`policy_id`** (or equivalent inventory anchor) on the normalized policy inventory that backs **`GET /api/v1/policies`**. It **assembles** and **labels** time-bearing fields already present in API-visible or persisted policy evidence; it does **not** invent new collection streams, controller event buses, or dataplane samplers.

Planned stable **`contract_id`:** **`policy_evidence_timeline_v1`** (use in schemas when implemented).

---

## Supported evidence sources (bounded reuse)

A v1 assembly may **only** draw on domains that already exist in Phase **2** and that expose **honest** timestamps or ordering anchors for policy. Typical sources (illustrative; exact field names follow existing schemas):

| Source | What it contributes | Honest limit |
| --- | --- | --- |
| **Policy inventory list / detail** (`GET /api/v1/policies`) | Current row posture, **`observed_at`** on the serving snapshot, serving mode (live vs persisted fallback), **`degraded_policy_v1`**, candidate-path rows | Narrow **`static_local`** envelope where reviews justify it; broader families unproven off-lab; not full controller policy truth. |
| **Policy history window** (same API family) | Persisted snapshot summaries: **`persisted_at`**, **`observed_at`**, comparison-to-previous anchors when two snapshots exist | Bounded window and retention; not an infinite audit trail. |
| **Path analysis** (`GET /api/v1/policies/{policy_id}/path-analysis`) | **`freshness`** / assembly time, evidence attribution, caveats | Interpretation support only—see **`path-analysis-contract.md`**. |
| **Topology / inventory freshness** (when cited as **caveats** only) | Optional **anchors** for “what else was observed around this assembly” | Topology/inventory contracts remain authoritative for their domains; timeline **cites**, does not merge graphs. |
| **Sync-derived workflow-history / audit-history** | Rows **only when** the existing envelope already embeds policy snapshot or comparison pointers the product can cite without inventing workflow lifecycle semantics | Sync-derived, not full workflow or SOC audit—see **`data-flows.md`** and history honesty language. |

**Disallowed as primary timeline evidence:** Grafana panels, raw Prometheus series as “events,” synthetic scoring, or cross-policy ranking engines.

---

## Timeline entry types (v1 vocabulary)

Entries are **typed** so operators and clients do not confuse inventory observation time with workflow causality or validation results.

| Type | Meaning |
| --- | --- |
| **`policy_inventory_snapshot_anchor`** | A point anchored to a **policy inventory snapshot** (e.g. list response **`observed_at`** or a **history** snapshot summary). |
| **`policy_history_persisted_checkpoint`** | A **persisted** checkpoint from the bounded policy history window (**`persisted_at`**-class anchors). |
| **`policy_history_comparison_span`** | When **two** persisted snapshots exist, a bounded span or pair for **before/after** interpretation—not a drift verdict. |
| **`path_analysis_assembly_anchor`** | Time of **`path-analysis`** assembly and/or nested **freshness** fields—interpretation only. |
| **`degraded_policy_v1_signal_anchor`** | **Point-in-time** classification context for **`degraded_policy_v1`** on a row—**not** an independent event stream. |
| **`sync_activity_touch`** | Optional: a workflow-history or audit-history row that **explicitly** carries policy snapshot or comparison metadata already defined on those APIs—**not** generic workflow steps. |
| **`gap_note`** | Explicit **missing evidence** or **unsupported chronology** (see below)—not a hidden empty state. |

Adding types that imply **execution**, **approval**, or **validation verdicts** requires a **new contract revision** and explicit non-claims.

---

## Ordering semantics

1. **Primary sort key** — Each entry carries one or more **machine-comparable** timestamps (`observed_at`, `persisted_at`, `assembly_generated_at`, etc.) taken **verbatim** from source payloads. Default ordering is **newest-first** within the policy scope unless a follow-on explicitly defines **oldest-first** for a sub-view.
2. **Same instant** — When two entries share the same resolved instant, **tie-break** deterministically: type order (stable table in schema), then source id (e.g. snapshot id), then lexical **`policy_id`** if needed.
3. **No causal inference** — Earlier/later in the list does **not** imply **cause**, **fault**, or **blast radius**. Ordering is **evidence ordering**, not narrative truth.
4. **Cross-source mixing** — Entries from different sources may appear interleaved by time; **provenance** must remain visible on each entry (domain + API pointer string).

---

## Recency anchors

- **Recency** means **“last time this evidence family was observed or persisted in the bounded product slice,”** aligned with investigation workspace language: **embedded timestamps only**, not a reconstructed operator or syslog timeline.
- Prefer **echoing** timestamps already used in **`GET /api/v1/policies`**, **`path-analysis`**, and policy **history** rather than inventing new clocks.
- **Assembly time** for a composed response should be explicit (**`generated_at`** / **`metadata.generated_at`**) so operators know when the **rollup** was built versus when **underlying** evidence was observed.

---

## Gap notes

The response (or UI) must surface **honest gaps** when evidence is partial:

- **No history rows** — Only **current** inventory anchors are available; say so explicitly.
- **Collector unavailable / persisted fallback** — Stale or fallback posture per policy row semantics; do not sell **live** precision.
- **`detail_mode` / `empty_reason` limits** — Counters-only or **no** per-policy detail; timeline cannot invent rows.
- **Path analysis unsupported** — Omit or mark **unsupported** path-analysis anchors; do not substitute TE math.
- **Workflow/audit** — If no sync-derived row references this **policy_id** with citeable metadata, **do not** fabricate workflow events.

Gap notes are **first-class** (`gap_note` entries or a dedicated list), not footnote-only afterthoughts.

---

## Explicit non-claims

Stable keys (align with schema literals when implemented):

- **`not_unified_forensic_chronology`** — Not a single forensic timeline across all systems.
- **`not_packet_path_proof`** — Not dataplane or per-hop proof.
- **`not_workflow_execution_history`** — Not full workflow lifecycle history beyond **bounded** sync-derived evidence already exposed.
- **`not_validation_truth`** — Not conformance, drift verdict, or safe-to-change authority.
- **`not_change_causality_engine`** — Not inferred root cause or blame across changes.
- **`not_controller_event_bus`** — Not a replay of controller or device control-plane event streams unless already in product APIs.
- **`not_cross_policy_ranking`** — Not comparing policies by synthetic “risk” or “health score.”

---

## Fallback behavior when only partial evidence exists

1. **Return what exists** — Emit only entry types that have **non-empty** backing fields; never synthesize placeholder events.
2. **Downgrade scope** — Title and summary must say **“partial evidence window”** or **“current snapshot only”** when history is empty or detail is blocked.
3. **Preserve non-claims** — The default explicit non-claims list remains **fully** visible; partial evidence does not relax honesty.
4. **No Grafana ownership** — Product and **app-api** own semantics; observability mirrors are not the timeline source of truth.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| **`path-analysis-contract.md`** | Per-policy path **interpretation**; may supply **path_analysis_assembly_anchor** entries. |
| **`degraded-policy-v1-contract.md`** | Per-row classification; may supply **degraded_policy_v1_signal_anchor** (point-in-time). |
| **`failure-impact-contract.md`** | Topology-object rollups; **orthogonal** unless cross-linked as navigation only. |
| **`investigation-workspace-contract.md`** | Cross-domain assembly; **InvestigationEvidenceTimeline** is **not** duplicated—policy timeline is **narrower** and **policy-first**. |
| **Policy list / history APIs** | **Source** data; this contract defines the **product shape** for ordering and typing. |

---

## Gap audit: implementation follow-on (not required by this document)

| Gap | Notes |
| --- | --- |
| **Schema + route** | e.g. **`GET /api/v1/policies/{policy_id}/evidence-timeline`** with **`policy_evidence_timeline_v1`** response—read-only. |
| **Assembly service** | Compose anchors from policies + history + optional path-analysis pointer; no new collectors in v1. |
| **WebUI** | Optional **Policies** drill-through panel with the same non-claims. |
| **Tests** | **`pytest`** / **`vitest`** lock literals and ordering—**not** shell duplication of business rules. |

---

## Related documents

- [`path-analysis-contract.md`](./path-analysis-contract.md)
- [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)
- [`investigation-workspace-contract.md`](./investigation-workspace-contract.md)
- [`data-flows.md`](./data-flows.md)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md)
- [`agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md)
