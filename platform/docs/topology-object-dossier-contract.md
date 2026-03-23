# Topology object dossier v1 contract (Phase 2, read-only)

## Purpose

This document is the **backend-owned bounded contract** for a future **read-only topology object dossier** product slice: a **single composed operator-facing workspace** for **one** topology **node** or **link** that surfaces **existing** week **27–28** evidence in a **stable section order**—so operators can orient on relationship, posture, and attention signals **without** simulating failures, blast radius, dependencies, traffic, SLA outcomes, or change authority.

**Topology object dossier v1** is **evidence-derived** and **assembly-only**: it **composes** responses and summaries already defined on other read APIs and contracts. It **does not** introduce new truth domains, new collector semantics, or new ranking engines beyond what those contracts already allow.

Stable **`contract_id`:** **`topology_object_dossier_v1`**

**Future implementation (not required by this document alone):** a single read API such as **`GET /api/v1/topology/objects/{object_id}/dossier`** (name illustrative until routed) returning **`TopologyObjectDossierResponse`**—or an equivalent **WebUI-side** composition that **strictly** mirrors the same section contract. Until implemented, this file is the **authoritative vocabulary** for dossier layout and non-claims.

---

## Supported subject types

| Subject | Identity | Notes |
| --- | --- | --- |
| **Topology node** | `node_id` on the current normalized topology snapshot | Same identity rules as [`topology-related-policies-contract.md`](./topology-related-policies-contract.md), [`failure-impact-contract.md`](./failure-impact-contract.md), and [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md) (**404** if unknown). |
| **Topology link** | `link_id` on the current normalized topology snapshot | Related policies follow **union-of-endpoint** rules already documented for links; co-presence on a link does **not** imply dataplane use of that link. |

**Out of scope for v1:** device-only subjects without a topology row, regions, SRLGs, abstract services, policy-first dossiers, or multi-object bundles.

---

## Dossier purpose

The dossier answers: **“What does the platform already expose about this topology object in one place?”**—not **“What will fail if this object fails?”** or **“What should we change next?”**

It is intended to reduce **operator navigation churn** between **Topology**, **Policies**, **Investigation**, and **Situation room** by **echoing** bounded summaries and **linking** to the same read-only drill-downs those surfaces already use.

---

## Composed sources (reuse only)

The dossier may **only** assemble evidence from read-side contracts already shipped in Phase **2**. Conceptual mapping:

| Source | Contract / API | Role in dossier |
| --- | --- | --- |
| **Topology snapshot row** | `GET /api/v1/topology` | **Object identity**, endpoint pairing / partiality **summary** for caveats ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)). |
| **Failure impact** | `GET /api/v1/topology/objects/{object_id}/failure-impact` ([`failure-impact-contract.md`](./failure-impact-contract.md)) | **Failure-impact summary** section—relationship rollups and **`degraded_policy_rollup`** **within the related set only**. |
| **Topology risk summary contribution** | `GET /api/v1/topology/risk-summary` ([`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md)) | **One object’s** ranking inputs **`D`/`U`/`R`/`K`** (or equivalent row slice) for this **`object_id`**—**not** re-ranking the full inventory in the dossier unless the API explicitly returns a single-row excerpt. |
| **Related policies** | `GET /api/v1/topology/objects/{object_id}/related-policies` ([`topology-related-policies-contract.md`](./topology-related-policies-contract.md)) | **Related policies preview** (ids, minimal row anchors, relationship metadata). |
| **Degraded-policy v1** | Per policy on `GET /api/v1/policies` ([`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md)) | **Degraded-policy subset preview** **scoped to related policy ids only**. |
| **Path analysis (optional pointer)** | `GET /api/v1/policies/{policy_id}/path-analysis` ([`path-analysis-contract.md`](./path-analysis-contract.md)) | **Navigation** to per-policy path analysis—not embedded dataplane truth. |

**Disallowed as primary dossier evidence:** Grafana panels, Prometheus scrape math as dossier “scores,” workflow/audit history as **causality**, synthetic ML, or any write-side or simulated execution.

**Non-substitution:** The dossier **does not** replace [`failure-impact-contract.md`](./failure-impact-contract.md), [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md), or [`topology-related-policies-contract.md`](./topology-related-policies-contract.md); it **composes** them. If nested payloads disagree on freshness, **propagate the stricter caveat** (see below).

---

## Required section layout (order is normative)

When implemented, the dossier presentation (API JSON sections or WebUI cards) **SHOULD** follow this **top-to-bottom** order so operators learn a stable mental model:

1. **Object identity** — `object_kind` (`node` \| `link`), `object_id`, display name(s) from topology, optional role/source hints **as already exposed** on the topology snapshot.
2. **Topology posture summary** — Bounded echo of **inference**, **endpoint pairing**, **collection**, **node participation** (for nodes) or link pairing context (for links)—**summary lines only**, not a second topology API.
3. **Failure-impact summary** — Condensed **`failure_impact_v1`** framing: related-policy counts, **`degraded_policy_rollup`** within the related set, path-analysis **support** tallies, **`caveats`** / **`missing_evidence_notes`** as returned by failure-impact (or honest cross-reference if composed client-side).
4. **Topology risk summary contribution** — The **`D`/`U`/`R`** (and derived **`K`**) tuple **for this object** from risk-summary **or** an equivalent deterministic excerpt; include **`ranking_basis`** string echo where applicable; **not** the full ranked table unless product explicitly chooses a combined view.
5. **Related policies preview** — Truncated list (bounded **`limit`**, e.g. top N by stable sort) of related **`policy_id`** rows with **relationship_kind** / **matched_field** per related-policies—**not** full policy detail.
6. **Degraded-policy subset preview** — Within the related set only: counts or short list by **`degraded_policy_v1.posture`**—aligned with [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md); **not** new classification rules.
7. **Navigation / pivot block** — Read-only **links or shell hints** to:
   - **Investigation** — e.g. `navigateToInvestigationView` with `inv_from=topology`, pinned **`topology_object`** / **`topology_object_kind`**; optional **`failure_impact_entry`**, **`risk_summary_entry`** where product already defines mutual exclusivity.
   - **Situation room** — `view=situation-room` with honest **`sync_runs_limit`** alignment to other surfaces—**not** duplicating evidence-pack assembly in dossier body.
   - **Policies** — per-**`policy_id`** opens `view=policies` with selection; optional scroll hints for path-analysis / evidence timeline per existing client-only params.
   - **Topology** — stay on object selection / full table as already implemented.
8. **Evidence freshness / caveat block** — Aggregated **`generated_at`**, **`observed_at`**, assembly timestamps, serving-mode echoes, and **merged** **`caveats`** / **`missing_evidence_notes`** from composed sources.

Sections **may** collapse when empty (see **Empty / sparse / partial evidence**), but **order** remains stable when present.

---

## Freshness and caveat propagation rules

1. **Single object scope:** Freshness is **always** “as of dossier assembly time” plus **nested** source timestamps when exposed.
2. **No silent upgrade:** If **any** composed source reports **stale** inventory rows, **persisted fallback**, or **insufficient evidence**, the dossier **must** surface that in the caveat block **even if** another source looks current.
3. **Stricter caveat wins:** When two nested payloads conflict on **freshness posture** for the same underlying snapshot, prefer the **more conservative** wording (e.g. stale over current) in the merged caveat summary.
4. **No new freshness domain:** Reuse vocabulary from **`evidence_confidence`**, **`comparison_to_latest_persisted`**, and existing **platform-status** read-path patterns—do not invent new “confidence scores.”

---

## Navigation expectations

- **Read-only:** All pivots use existing **`view=`** and bounded query parameters (**`policy_id`**, **`topology_object`**, **`topology_object_kind`**, **`sync_runs_limit`**, investigation shell hints)—same as week **27–28** navigation helpers.
- **No new workflow verbs:** The dossier **must not** add approve, apply, schedule, or validate actions.
- **Honest labels:** Buttons and links **must** match destination contracts (e.g. “Open failure impact detail” points to the same failure-impact semantics, not “simulate outage”).

---

## Empty / sparse / partial evidence rules

| Condition | Required behavior |
| --- | --- |
| **Unknown `object_id`** | **404** (same as related-policies / failure-impact). |
| **No related policies** | Show **explicit** “no related policies for this object” in section 5; **`D`/`U`/`R`** for risk contribution may be **zero** with honest copy—**not** “healthy.” |
| **Failure-impact unavailable** | Section 3 shows **error or unavailable** state per failure-impact rules; dossier **still** may show identity + topology summary + risk row if those sources load—**with caveat** that failure-impact is missing. |
| **Risk-summary row missing for object** | Section 4 shows **honest gap** (e.g. object not in ranked set due to assembly filter)—**not** fabricated zeros from unrelated policies. |
| **Truncated related list** | If preview is capped at N rows, state **“showing N of M”** when **`M > N`** and link to **full** related-policies or Topology drill-down. |
| **Policy inventory partial** | Propagate **`empty_reason`**, **counters-only**, or **detail_mode** caveats from `GET /api/v1/policies`—same honesty as Policies page. |

---

## Explicit non-claims

The topology object dossier v1 is:

- **not** blast-radius truth, dependency truth, or reachability simulation
- **not** traffic risk, congestion risk, or utilization truth
- **not** SLA, availability guarantee, or “customer impact” scoring
- **not** a workflow, change window, or execution surface
- **not** a simulation page or what-if engine
- **not** a global inventory or platform health verdict
- **not** a replacement for Grafana, Prometheus, or deep time-series troubleshooting
- **not** an authority for policy correctness, configuration drift, or validation outcomes

The word **“dossier”** means **composed read-side briefing** only.

---

## Relationship to other documents

| Topic | Document |
| --- | --- |
| Related policies | [`topology-related-policies-contract.md`](./topology-related-policies-contract.md) |
| Failure impact | [`failure-impact-contract.md`](./failure-impact-contract.md) |
| Topology risk summary | [`topology-risk-summary-contract.md`](./topology-risk-summary-contract.md) |
| Degraded policy v1 | [`degraded-policy-v1-contract.md`](./degraded-policy-v1-contract.md) |
| Path analysis | [`path-analysis-contract.md`](./path-analysis-contract.md), [`ADR-0002`](./decisions/ADR-0002-path-analysis-phase2-read-only-contract.md) |
| Investigation workspace | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |
| Evidence pack / situation room | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Topology truth boundaries | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Post–week 28 scheduling posture | [`post-week-28-bounded-phase2-recommendation.md`](./post-week-28-bounded-phase2-recommendation.md) |

---

## Revision policy

Adding **new** sections that imply simulation, cross-domain scoring, or TE resolution requires a **new contract revision** (`topology_object_dossier_v2` or explicit minor version) and updated non-claims.
