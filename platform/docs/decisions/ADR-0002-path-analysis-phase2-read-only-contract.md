# ADR-0002: Phase 2 read-only path-analysis contract

## Status

Accepted (contract and gap audit in week **27** Monday task **01**; **`GET /api/v1/policies/{policy_id}/path-analysis`** implemented in week **27** Monday task **02**).

## Context

Operators need a coherent, **honest** read-only answer space for questions like “what path does this policy imply?” and “what do we actually observe?” The platform already exposes **policy** candidate paths, **topology** partiality, **inventory**, and **bounded** controller probe signals—but it does **not** have dataplane or full TE resolution truth in Phase 2.

## Decision

Introduce a **backend-owned path-analysis contract** (`path_analysis_phase2_v1`) with:

- Policy-anchored **`PathAnalysisSubject`** for Phase 2 v1.
- Separate **intended** and **observed** hint lists, **candidate-path summaries**, **evidence attribution**, **freshness**, **truth-alignment posture** (interpretation-only), and **caveats**.
- Explicit **non-claims** excluding dataplane certainty, TE resolution, controller path authority, and ODL-as-substitute-for-collector semantics.

The read API **`GET /api/v1/policies/{policy_id}/path-analysis`** implements this vocabulary; the **WebUI Policies** view consumes it in a **Path analysis** panel for the selected policy row (week **27** Monday task **03**), without adding new truth claims beyond this contract.

## Consequences

- Follow-on work can add WebUI or alternate route families without inventing new truth domains beyond the existing policy inventory pipeline.
- Topology and policy **closed slices** remain closed; path analysis **consumes** their contracts and adds **interpretation framing**, not replacement semantics.
- **`conditionally_ready_with_explicit_limits`** is unchanged; the new endpoint is a bounded read-side assembly over existing evidence.

## References

- `platform/docs/path-analysis-contract.md`
- `platform/app-api/src/app_api/schemas/path_analysis.py`
- `platform/app-api/src/app_api/services/path_analysis.py`
- `platform/app-api/src/app_api/routers/policies.py`
- `platform/app-web/src/features/policies/policy-path-analysis-panel.tsx`
