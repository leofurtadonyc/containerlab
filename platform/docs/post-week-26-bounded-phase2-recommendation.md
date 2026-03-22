# Post–Week 26 bounded Phase 2 recommendation

## Purpose

This note records the **next disciplined scheduling posture** after week **26** so planning does not default to reopening the closed **operator evidence pack / situation room** slice—**`evidence_pack_phase2_v1`** contract vocabulary, **`GET /api/v1/evidence-pack/situation`** composed assembly (devices, topology, policies, readiness snapshot history, workflow history, audit history, nested **`investigation_context`**), backend **`situation_review_guidance`** (**`review_framing`**, **`explicit_missing_evidence_notes`**, sorted **`review_navigation_prompts`**), Overview **Situation room** entry and **`view=situation-room`** **`SituationRoomProduct`** (numbered cross-domain sections, bounded review navigation, API-backed gap notes, nested investigation reuse, assembly notes, nav hub), repository **`pytest`** / **`vitest`** / structural **`verify-core-runtime.sh`** evidence-pack JSON checks, and cross-doc alignment (**`roadmap.md`**, **`deployment-runbook.md`**, **`data-flows.md`**, **`evidence-pack-contract.md`**)—by momentum.

It is a **recommendation and anti-drift guardrail** only.

It does **not** authorize:

- phase transition
- workflow implementation, dry-run APIs, or validation engines
- broader topology truth, policy truth, or multi-vendor parity than current reviews prove
- treating evidence-pack assemblies as validation verdicts, drift results, safe-to-change recommendations, workflow progress, or operator execution steps
- expanding evidence packs into new persistence domains, collectors, cross-domain scoring engines, or Grafana-owned evidence-pack semantics
- forensic or workflow-chronology claims beyond what nested API fields already expose
- “command center,” incident-runbook authority, or ranked operational actions synthesized across domains

## Relationship to prior guidance

Week **21** posture remains in [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md). Week **22** posture remains in [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md). Week **23** posture remains in [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md). Week **24** bounded **change-intelligence** closure remains in [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md). Week **25** bounded **investigation workspace** closure remains in [`post-week-25-bounded-phase2-recommendation.md`](./post-week-25-bounded-phase2-recommendation.md). Week **26** **adds** explicit closure of the bounded **operator evidence pack / situation room** workstream (read-only composed assembly and interpretation support only); it does **not** replace ADR-0001 or the topology/policy reviews, and it does **not** subsume week **25** investigation workspace, week **24** change intelligence, or week **23** readiness decision-support semantics.

## What week 26 actually closed

Week **26** delivered **bounded Phase 2 operator evidence pack / situation room** (see [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) **Week 26** closure and completed tasks under `agent/sdn-tasks/completed/week-26-*.md`):

- **Contract:** [`evidence-pack-contract.md`](./evidence-pack-contract.md) plus [`schemas/evidence_pack.py`](../app-api/src/app_api/schemas/evidence_pack.py) — **`evidence_pack_phase2_v1`**, **`SituationPackAssemblyResponse`**, **`SituationReviewGuidance`**, explicit non-claims
- **API:** **`GET /api/v1/evidence-pack/situation`** with optional **`sync_runs_limit`** (aligned with nested change intelligence and workflow/audit windows) — composes **existing** read-side builders only; **no** new collection or scoring
- **Guidance:** [`services/situation_review_guidance.py`](../app-api/src/app_api/services/situation_review_guidance.py) — **`build_situation_review_guidance`** derives gap notes and navigation prompts from fields already present in the assembly
- **WebUI:** Overview **Situation room (bounded evidence pack)** entry; **`view=situation-room`** **`SituationRoomProduct`** — safety framing, cross-domain sections, bounded review navigation, API-backed gap notes, nested investigation timeline / context / next-inspection — **read-only** **`view=`** navigation only
- **Regression:** repository **`pytest`** / **`vitest`** and structural **`verify-core-runtime.sh`** substring checks on live evidence-pack JSON (including bounded **`sync_runs_limit`** echo); sorted **`review_navigation_prompts`** pinned in tests
- **Documentation:** **`data-flows.md`**, **`roadmap.md`**, **`deployment-runbook.md`** aligned with the same Phase 2 non-claims

Week **26** did **not**:

- add validation engines, drift detection, safe-to-change scoring, or workflow authorization semantics
- add new collector truth domains or new persistence models for situation-pack assembly
- move Grafana to product ownership of evidence-pack semantics (**app-api** remains the brain)
- duplicate change-intelligence aggregation math (week **24**) or investigation-workspace composition logic (week **25**) as separate top-level routing
- imply approvals, execution, rollback, or unified forensic timelines across domains

## Scheduling default (evidence-first)

There is **still no automatic default implementation lane** after week **26**.

The **primary gate** remains an **evidence-gated reassessment** using:

- [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md)
- [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) (Post–Week **19** scheduling note)
- [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) (Post–Week **20** scheduling note)
- [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md)
- [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md)
- [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md)
- [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md)
- [`post-week-25-bounded-phase2-recommendation.md`](./post-week-25-bounded-phase2-recommendation.md)

**Meaning:** choose **at most one** narrow read-only slice only after **live lab or repository evidence** identifies a concrete, bounded gap. Prefer **small blast radius** and **clear operator value** inside Phase **2**. Evidence pack / situation room is **not** the default next churn lane.

## Narrow follow-ons that remain *plausible* when evidence appears

When a gap is proven—not assumed—these categories stay **architecture-aligned**:

1. **Documentation-only alignment** when drift appears between code, verifier, and operator docs.
2. **Further situation-room UX or copy** only when a **specific** operator gap remains after week **26** (for example a documented confusion that does **not** require reopening the whole assembly contract). The **core** week **26** slice is **closed**; avoid cosmetic churn.
3. **Verifier or pytest tightening** for **existing** contracts (structural checks, honest skip/notice behavior)—not duplication of application logic in bash.
4. **Collector-first policy work** only inside the **proven** Nokia **`static_local`** envelope, and only when **new live evidence** in-repo justifies it—see policy review.

## Explicit anti-recommendations (do not default here)

- **Reopening week 26 themes by momentum:** evidence-pack contract prose, **`GET /api/v1/evidence-pack/situation`** assembly fields, **`situation_review_guidance`** / **`build_situation_review_guidance`** behavior, Overview/situation-room entry and **`SituationRoomProduct`** layout, bounded review navigation + gap notes, **`pytest`** / **`vitest`** / **`verify-core-runtime`** evidence-pack checks, or cross-doc evidence-pack wording—**closed** unless **new evidence** shows a concrete bug or contract drift.
- **Reopening week 25 themes by momentum** (unchanged from [`post-week-25-bounded-phase2-recommendation.md`](./post-week-25-bounded-phase2-recommendation.md)): investigation contract, **`GET /api/v1/investigation-workspace/context`**, **`next_inspection_*`**, Overview/Investigation product surface, recency/context/next-inspection UI, tests, verifier, cross-doc investigation wording.
- **Reopening week 24 themes by momentum** (unchanged from [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md)): change-intelligence contract, **`recent-summary`**, Overview/Platform Health panels, product/history drilldowns, Workflow/Audit Overview links, change-intelligence tests/verifier, cross-doc change-intelligence wording.
- **Reopening week 23 themes by momentum** (unchanged from [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md)): decision-support contract, **`readiness-snapshot-history`**, Readiness URL parameters, Capabilities cross-links, capabilities verifier checks, cross-doc decision-support wording.
- **Reopening week 22 themes by momentum** (unchanged from [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md)): optional query parameters, **`read_side_query`** echo UX, workflow/audit query panels, history evidence drilldown, verifier echo checks.
- **Topology implementation** by momentum: pairing, partiality, coverage history, and doc/product alignment are **closed** as default lanes unless **new live evidence** shows a narrow gain beyond shipped cues ([`topology-truth-depth-review.md`](./topology-truth-depth-review.md)).
- **Policy family expansion** without **independent collector proof** ([`policy-truth-depth-review.md`](./policy-truth-depth-review.md)).
- **Workflow, dry-run, validation**, or treating Grafana as the product surface for readiness, history, change intelligence, investigation workspace, evidence packs, or validation.
- **Multi-vendor or Juniper parity** in product or observability claims.
- **Phase transition** or “production program” language that exceeds `conditionally_ready_with_explicit_limits` ([`production-readiness-assessment.md`](./production-readiness-assessment.md)).

## References

| Topic | Document |
| --- | --- |
| Current operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Bounded slice scheduling | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 21 posture | [`post-week-21-bounded-phase2-recommendation.md`](./post-week-21-bounded-phase2-recommendation.md) |
| Post–week 22 posture | [`post-week-22-bounded-phase2-recommendation.md`](./post-week-22-bounded-phase2-recommendation.md) |
| Post–week 23 posture | [`post-week-23-bounded-phase2-recommendation.md`](./post-week-23-bounded-phase2-recommendation.md) |
| Post–week 24 posture (change intelligence closure) | [`post-week-24-bounded-phase2-recommendation.md`](./post-week-24-bounded-phase2-recommendation.md) |
| Post–week 25 posture (investigation workspace closure) | [`post-week-25-bounded-phase2-recommendation.md`](./post-week-25-bounded-phase2-recommendation.md) |
| Evidence pack contract (shipped) | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Topology: what is closed vs deferred | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Policy: proven vs deferred | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Roadmap checkpoint narrative | [`roadmap.md`](./roadmap.md) |
