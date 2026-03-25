# Week 33 evidence-backed reassessment memo

## Purpose

This memo records **one** disciplined reassessment after **Week 32** product closure and **Week 33** verifier / documentation / archive alignment. It is **scheduling guidance**, not a new ADR and **not** authorization to expand scope.

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md) — unchanged by this memo.

**Operating verdict:** [`conditionally_ready_with_explicit_limits`](./production-readiness-assessment.md) — unchanged; this memo does not claim broader production readiness.

## 1. Parity, docs, and archive outcome (Week 33)

| Area | Evidence-backed outcome |
| --- | --- |
| **Verifier vs docs** | [`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md) defines what packaged **`verify-core-runtime.sh`** proves for **Service Dossier** and **Change Safety Case**: **app-web** bundle markers; **optional** structural **`GET`** sampling when **`python3`** and list gates pass; **honest skip** when gates fail—**not** assembly logic in shell. |
| **Runtime proof** | [`verify-core-runtime.sh`](../scripts/verify-core-runtime.sh) implements that split; [`deployment-runbook.md`](./deployment-runbook.md) and [`data-flows.md`](./data-flows.md) align with the contract for week **32** surfaces. |
| **Completed-task archive** | [`../../agent/sdn-tasks/completed/week-32-archive-index.md`](../../agent/sdn-tasks/completed/week-32-archive-index.md) inventories Week **32** artifacts; [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) remains **operational truth** for shipped behavior. |
| **Cross-doc alignment** | [`roadmap.md`](./roadmap.md) **Week 32 closure** matches **`03-CURRENT-STATUS.md`** on verification language; [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) records anti-reopen posture including **misusing integrity work as product backlog**. |

**Conclusion:** Week **33** integrity work **closes documentation and verification honesty gaps** around Week **32**. It does **not** reopen **Service Dossier v1** or **Change Safety Case v1** semantics, add new collector domains, or change the default verdict above.

## 2. Current reality vs future aspirations

| Current reality (evidence today) | Not implied (aspiration / out of scope) |
| --- | --- |
| Bounded read-only product surfaces through **Week 32** (see **`03-CURRENT-STATUS.md`** and post-week notes **21–32**). | Full topology truth, full policy truth, workflow-grade lifecycle, dry-run, validation engines, or phase transition. |
| Nokia-first lab shapes documented in [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) and [`topology-truth-depth-review.md`](./topology-truth-depth-review.md). | Multi-vendor parity, BGP-signaled policy families, or dataplane path proof without new collector evidence. |
| [`ADR-0001`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) established a **default** for an earlier checkpoint (inventory/devices history as primary slice at that time). Later weeks delivered additional bounded slices; **ADR-0001 remains the pattern**: one narrow evidence-gated slice, not parallel thrash. | Treating ADR-0001 as a mandate to **re-run** inventory history as the “next” implementation without new gap evidence. |

## 3. Strongest remaining *categories* for a next narrow slice (when justified)

Choose **at most one** category only after **live lab or repository evidence** identifies a concrete, bounded gap—not by roadmap momentum.

1. **Truth-depth (collector- or review-gated)**  
   - **Policy:** only when [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) plus **live** collector proof justifies a narrow extension (e.g. additional **proven** normalized shapes)—**not** speculative `static_non_local` / BGP depth.  
   - **Topology:** only when [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) plus evidence justify a narrow follow-on; default bias remains **documentation-first** where the review already says inference/collection limits should be clarified before broad code churn.

2. **Honest labeling / copy (no new semantics)**  
   Clarify **dossier vs explorer**, **change safety case vs impact report vs evidence export**, or similar **read-only** boundaries where operators confuse contracts—**UI copy and docs**, not new **`GET`** assemblies.

3. **Structural verifier or test tightening**  
   Adjust **`verify-core-runtime.sh`**, **`pytest`**, or **`vitest`** for **existing** routes and markers when drift is proven (e.g. bundling string moves)—**not** duplicating business logic in shell.

4. **Documentation-only alignment**  
   When code, verifier, and operator docs disagree on **bounded** behavior—**no** new product semantics.

**Default when no new evidence:** run the **ADR-0001 / topology / policy** reassessment **read** cycle and operate the stack on **rebuild → redeploy → verify** ([`deployment-runbook.md`](./deployment-runbook.md))—**not** a new feature lane.

## 4. Why not another large composed workspace by default

- **Week 31** and **Week 32** already delivered major vertical slices (**Service Explorer**, **Impact Report**, **Maintenance Preview**, **Service Dossier**, **Change Safety Case**, cockpit/search integration). Those are **closed** under [`post-week-31-bounded-phase2-recommendation.md`](./post-week-31-bounded-phase2-recommendation.md) and [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md).
- A “Week 32-sized” innovation lane **by default** would **compound** partial-truth risk, blur **Phase 2** non-claims, and ignore the **evidence-first** gate in [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md).
- **Integrity work** (parity, archive, memos) is **not** a substitute backlog for another large workspace—see **misusing integrity work as product backlog** in **`post-week-32`**.

## 5. Non-goals

- Phase transition; workflow implementation; dry-run APIs; validation engines  
- Reopening closed weeks **24–32** product themes without **new evidence**  
- Treating this memo as approval for a specific implementation PR without a separate evidence note

## References

| Topic | Document |
| --- | --- |
| Operational truth | [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) |
| Default truth-depth decision pattern | [`decisions/ADR-0001-next-bounded-truth-depth-slice.md`](./decisions/ADR-0001-next-bounded-truth-depth-slice.md) |
| Post–week 32 scheduling | [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) |
| Week 32 verifier audit | [`week-32-verifier-parity-contract.md`](./week-32-verifier-parity-contract.md) |
| Policy evidence | [`policy-truth-depth-review.md`](./policy-truth-depth-review.md) |
| Topology evidence | [`topology-truth-depth-review.md`](./topology-truth-depth-review.md) |
| Readiness / operating boundary | [`production-readiness-assessment.md`](./production-readiness-assessment.md) |
