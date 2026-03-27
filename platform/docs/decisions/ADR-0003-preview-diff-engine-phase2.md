# ADR-0003 — Backend-owned preview / diff engine (Phase 2)

## Status

Accepted.

## Context

The platform is Phase 2 — read-only product foundation. Operators still need honest **pre-change reasoning** before any future control plane. Prior documentation listed **dry-run contract missing** as a blocker; the product required a **durable, capability-gated** preview domain distinct from evidence replay, sync-derived deltas, and maintenance-oriented previews.

## Decision

1. Implement a **backend-owned** preview engine with **durable** `preview_requests` and `preview_events` tables, **not** network actuation.
2. **V1 scope:** one narrow family — **`policy_static_local_intent_preview_v1`** — comparing current normalized `intent_state` to a proposed value for **`static_local`** policies only.
3. **Mandatory capability gating** using live capability matrix data and policies evidence confidence.
4. **Explicit decision states:** `allowed` / `blocked` / `unsupported` / `unknown` with documented reasons and metrics.
5. **Separation:** preview artifacts are **not** evidence exports, replay payloads, sync-history deltas, or maintenance-preview contracts; naming and routes stay distinct (`/api/v1/previews`).
6. **Phase boundary:** Phase 2 remains read-only; this ADR does **not** authorize validation engines, execution, rollback, or phase transition.

## Consequences

- Readiness narrative removes obsolete **workflow lifecycle contract missing** and **dry_run contract missing** blockers; **validation-result** and truth/history gaps remain.
- WebUI exposes a **Preview workspace** for bounded requests; operators must still read explicit non-claims.
- Future validation-result attachment can link via reserved fields without redesigning the preview row shape.

## References

- `platform/docs/dry-run-preview-diff-contract-v1.md`
- `platform/docs/workflow-lifecycle-contract.md`
- `agent/sdn/01-CURRENT-PHASE.md` (unchanged: Phase 2 read-only foundation)
