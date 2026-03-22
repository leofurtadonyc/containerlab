# ADR-0002: Phase 2 read-only path-analysis contract

## Status

Accepted (contract and gap audit delivered in week **27** Monday task **01**).

## Context

Operators need a coherent, **honest** read-only answer space for questions like “what path does this policy imply?” and “what do we actually observe?” The platform already exposes **policy** candidate paths, **topology** partiality, **inventory**, and **bounded** controller probe signals—but it does **not** have dataplane or full TE resolution truth in Phase 2.

## Decision

Introduce a **backend-owned path-analysis contract** (`path_analysis_phase2_v1`) with:

- Policy-anchored **`PathAnalysisSubject`** for Phase 2 v1.
- Separate **intended** and **observed** hint lists, **candidate-path summaries**, **evidence attribution**, **freshness**, **truth-alignment posture** (interpretation-only), and **caveats**.
- Explicit **non-claims** excluding dataplane certainty, TE resolution, controller path authority, and ODL-as-substitute-for-collector semantics.

Implementation of HTTP routes and UI is **deferred** to follow-on tasks; this ADR only locks the **vocabulary and honesty boundaries**.

## Consequences

- Follow-on work can implement `GET /api/v1/path-analysis/...` and WebUI without inventing new truth domains in the first slice.
- Topology and policy **closed slices** remain closed; path analysis **consumes** their contracts and adds **interpretation framing**, not replacement semantics.
- **`conditionally_ready_with_explicit_limits`** is unchanged until a shipped path-analysis surface is proven end to end.

## References

- `platform/docs/path-analysis-contract.md`
- `platform/app-api/src/app_api/schemas/path_analysis.py`
