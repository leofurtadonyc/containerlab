# Policy dossier v1 contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **read-only policy dossier** product slice: a **single composed operator-facing workspace** for **one** **`policy_id`** that surfaces **existing** week **27–28** policy-scoped evidence in a **stable section order**—so operators can orient on intent, posture, path hints, topology naming alignment, and time-bounded anchors **without** claiming dataplane forwarding truth, validation verdicts, workflow execution, or change authority.

**Policy dossier v1** is **evidence-derived** and **assembly-only**: it **composes** summaries and pointers already defined on other read APIs and contracts. It **does not** introduce new truth domains, new collector semantics, or new scoring engines beyond what those contracts already allow.

Stable **`contract_id`:** **`policy_dossier_v1`**

**Future implementation (not required by this document alone):** a single read API such as **`GET /api/v1/policies/{policy_id}/dossier`** (name illustrative until routed) returning **`PolicyDossierResponse`**—or an equivalent **WebUI-side** composition that **strictly** mirrors the same section contract. Until implemented, this file is the **authoritative vocabulary** for dossier layout, non-claims, and navigation rules.

---

## Supported subject types

| Subject | Identity | Notes |
| --- | --- | --- |
| **Policy** | **`policy_id`** on the current normalized policy inventory that backs **`GET /api/v1/policies`** | Same identity rules as [`path-analysis-contract.md`](./path-analysis-contract.md), [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) (inverse pivot), [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md), and [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) (**404** or honest empty when the id is absent from the inventory slice the API can serve). |

**Out of scope for v1:** multi-policy bundles, abstract TE tunnels without a policy row, workflow runs as dossier subjects, device-only dossiers without a selected policy, or “global policy health” dashboards disguised as a single-policy workspace.

---

## Dossier purpose

The dossier answers: **“What does the platform already expose about this policy in one place?”**—not **“Is this path correct in the network?”**, **“Should we approve this change?”**, or **“What is the blast radius?”**

It is intended to reduce **operator navigation churn** between **Policies** (detail panels), **Topology**, **Devices**, **Investigation**, and **Situation room** by **echoing** bounded summaries and **linking** to the same read-only drill-downs those surfaces already use.

---

## Summary vs deep link (non-substitution)

| Layer | Role |
| --- | --- |
| **Existing per-policy APIs and panels** | **Authoritative** for their contract: full payloads, scroll targets, **404** semantics, and panel-specific caveats (`path_analysis_phase2_v1`, `policy_evidence_timeline_v1`, `policy_evidence_delta_v1`, topology-impact pivot, inventory `PolicyRecord` fields). |
| **Policy dossier v1** | **Composed briefing**: short summaries, **bounded** excerpts, **merged** caveat lines, and **shell navigation hints** (same `view=` / `policy_id` / client-only focus params as week **27–28**). It **does not** replace opening Path analysis, Evidence timeline, Evidence delta, or Topology impact panels in full. |

If nested payloads disagree on freshness or posture, **propagate the stricter caveat** in the merged block (see **Freshness and caveat propagation**).

---

## Composed sources (reuse only)

The dossier may **only** assemble evidence from read-side contracts already shipped in Phase **2**. Conceptual mapping:

| Source | Contract / API | Role in dossier |
| --- | --- | --- |
| **Policy inventory row** | **`GET /api/v1/policies`** (list/detail) — [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) | **Identity** (`policy_id`, `policy_name`, `headend` / `endpoint` / `source_target`), **intent/observed** hints, **`current_posture`**, **`candidate_paths`** summary, **support** posture — **not** a second policy API. |
| **Degraded-policy v1** | Per policy on list response — [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) | **Degraded-policy posture** section: **echo** `degraded_policy_v1` classification already on the record; **not** new rules. |
| **Path analysis** | **`GET /api/v1/policies/{policy_id}/path-analysis`** — [`path-analysis-contract.md`](./path-analysis-contract.md), [`ADR-0002`](./decisions/ADR-0002-path-analysis-phase2-read-only-contract.md) | **Path analysis summary**: bounded rollup of subject, candidate-path hints, **truth_alignment**, **caveats** — or **honest pointer** to open full panel; **not** embedded dataplane TE resolution. |
| **Topology impact (inverse pivot)** | **`GET /api/v1/policies/{policy_id}/topology-impact`** — [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) (inverse) | **Topology impact summary**: **string-equality** alignment rows to topology nodes/links — **not** adjacency-as-dependency or blast radius. |
| **Evidence timeline** | **`GET /api/v1/policies/{policy_id}/evidence-timeline`** — [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md) | **Evidence timeline summary**: top anchors or **count** + **scope** line — **not** full forensic chronology in the dossier body. |
| **Evidence delta** | **`GET /api/v1/policies/{policy_id}/evidence-delta`** — [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) | **Evidence delta summary**: **comparison_status** and **delta_items** rollup or pointer — **not** drift engine verdict. |
| **Platform / collector context (caveats only)** | **`GET /api/v1/platform/status`**, **`evidence_confidence`** on policy reads | **Optional** one-line **serving-mode** or **read-path** cues when already echoed by nested contracts — **not** new health scores. |

**Disallowed as primary dossier evidence:** Grafana panels, Prometheus scrape math as dossier “scores,” workflow/audit history as **causality**, synthetic ML, or any write-side or simulated execution.

**Non-substitution:** The dossier **does not** replace [`path-analysis-contract.md`](./path-analysis-contract.md), [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md), [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md), or the topology↔policy pivot contracts; it **composes** them.

---

## Required section layout (order is normative)

When implemented, the dossier presentation (API JSON sections or WebUI cards) **SHOULD** follow this **top-to-bottom** order so operators learn a stable mental model:

1. **Policy identity and inventory posture** — `policy_id`, `policy_name`, `headend` / `endpoint` / `source_target`, role hints, **`current_posture`**, **`intent_state`** / **`observed_state`**, **`support_state`** — **as already exposed** on the policy inventory row.
2. **Degraded-policy (v1) posture** — Echo **`degraded_policy_v1`** (`posture`, **`reason_codes`**, **`summary`**) from the same contract as [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md); **not** reclassification.
3. **Path analysis summary** — Condensed **`path_analysis_phase2_v1`** framing: subject anchor, candidate-path **summary** lines, **`truth_alignment`**, **`caveats`** — or explicit cross-reference to **full** path-analysis panel.
4. **Topology impact summary** — Rows from **`topology-impact`** (object kind/id, **relationship_kind**, **matched_field**) — **not** full topology table.
5. **Evidence timeline summary** — Bounded excerpt from **`policy_evidence_timeline_v1`** (e.g. anchor kinds, **count**, **sparse** honesty) — **not** replaying every entry.
6. **Evidence delta summary** — Bounded excerpt from **`policy_evidence_delta_v1`** (**`comparison_status`**, **delta** highlights) — **not** a second delta engine.
7. **Related object pivots** — Read-only **hints** to **Topology** (**`topology_object`** / **`topology_object_kind`**), **Devices** (**`device_id`** when aligned with inventory), **Policies** (stay on selection), **per-policy Path analysis** / **Evidence timeline** / **Evidence delta** with existing **client-only** scroll/focus params (`policy_evidence_timeline_focus`, `policy_evidence_delta_focus`, `#policy-path-analysis`).
8. **Investigation / situation-room links** — Same **`inv_from`**, **`policy_id`**, **`sync_runs_limit`**, and optional entry hints as [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) and week **27–28** shell patterns — **not** workflow execution.
9. **Evidence freshness / caveat block** — Merged **`generated_at`**, **`observed_at`**, assembly timestamps, serving-mode echoes, and **merged** **`caveats`** / **`missing_evidence_notes`** from composed sources.

Sections **may** collapse when empty (see **Empty / sparse / partial evidence**), but **order** remains stable when present.

---

## Freshness and caveat propagation rules

1. **Single policy scope:** Freshness is **always** “as of dossier assembly time” plus **nested** source timestamps when exposed.
2. **No silent upgrade:** If **any** composed source reports **stale** inventory rows, **persisted fallback**, **partial** support, or **insufficient evidence**, the dossier **must** surface that in the caveat block **even if** another source looks current.
3. **Stricter caveat wins:** When two nested payloads conflict on **freshness posture** for the same underlying snapshot, prefer the **more conservative** wording in the merged caveat summary.
4. **No new freshness domain:** Reuse vocabulary from **`evidence_confidence`**, **`comparison_to_latest_persisted`**, and existing **platform-status** read-path patterns—do not invent new “confidence scores.”

---

## Navigation expectations

- **Read-only:** All pivots use existing **`view=`** and bounded query parameters (**`policy_id`**, **`topology_object`**, **`topology_object_kind`**, **`sync_runs_limit`**, investigation shell hints, evidence timeline/delta focus params)—same as week **27–28** navigation helpers.
- **No new workflow verbs:** The dossier **must not** add approve, apply, schedule, or validate actions.
- **Honest labels:** Buttons and links **must** match destination contracts (e.g. “Open path analysis” points to the same path-analysis semantics, not “verify forwarding”).
- **Relationship to topology object dossier:** [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) addresses **nodes/links**; **policy dossier v1** addresses **policies**. They **compose** different primary subjects; cross-links are **navigation-only** string-alignment pivots, not merged truth domains.

---

## Empty / sparse / partial evidence rules

| Condition | Required behavior |
| --- | --- |
| **Unknown `policy_id`** | **404** or **honest empty** per the policy list API contract (same as path-analysis / timeline / delta). |
| **Path analysis unsupported** | Section 3 shows **unavailable** or **unsupported** state per path-analysis rules; other sections may still load with **caveat**. |
| **No topology-impact rows** | Section 4 states **explicit** “no alignment rows” — **not** “no topology exists.” |
| **Sparse timeline** | Section 5 shows **honest sparse** copy per evidence-timeline contract — **not** fabricated events. |
| **Delta not comparable** | Section 6 shows **`comparison_status`** honesty — **not** invented deltas. |
| **Policy inventory partial** | Propagate **`empty_reason`**, **counters-only**, or **detail_mode** caveats from `GET /api/v1/policies`—same honesty as Policies page. |

---

## Explicit non-claims

The policy dossier v1 is:

- **not** dataplane forwarding proof, per-hop verification, or active LSP state
- **not** traffic risk, congestion truth, or utilization authority
- **not** SLA, availability guarantee, or “customer impact” scoring
- **not** a workflow, change window, or execution surface
- **not** validation, drift detection, or “safe to change” authority
- **not** a replacement for Grafana, Prometheus, or controller-computed path truth
- **not** TE resolution, CSPF, or BGP-LS path graph authority

The word **“dossier”** means **composed read-side briefing** only.

---

## Relationship to other documents

| Topic | Document |
| --- | --- |
| Path analysis | [`path-analysis-contract.md`](./path-analysis-contract.md), [`ADR-0002`](./decisions/ADR-0002-path-analysis-phase2-read-only-contract.md) |
| Topology ↔ policy pivot | [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) |
| Degraded policy v1 | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Evidence timeline | [`policy-evidence-timeline-contract.md`](./policy-evidence-timeline-contract.md) |
| Evidence delta | [`policy-evidence-delta-contract.md`](./policy-evidence-delta-contract.md) |
| Topology object dossier (peer slice) | [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Investigation workspace | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Evidence pack / situation room | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Policy truth boundaries | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |

---

## Revision policy

Adding **new** sections that imply simulation, cross-domain scoring, or TE resolution requires a **new contract revision** (`policy_dossier_v2` or explicit minor version) and updated non-claims.
