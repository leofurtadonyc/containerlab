# ADR-0012: Production entry spine

## Status

Accepted.

## Context

The platform has a strong bounded lab/runtime baseline for its current scope: Phase 2 read-only product foundations plus one narrow Phase 5 safe-action and rollback slice. The current verdict remains `conditionally_ready_with_explicit_limits`.

That verdict is useful, but it is not enough to guide production transition. "Not production-ready" is too vague unless the repository defines which controls block production, which controls block real users, which controls block real device actuation, and which controls block multi-vendor support.

The current safe-action and rollback names also need a production guardrail. They are real bounded product contracts, but their present effect is platform-only. They do not authorize general device push, production change execution, or device restore.

## Decision

Adopt [`../production-prerequisite-spine.md`](../production-prerequisite-spine.md) as the parent production-entry contract for the platform.

The spine classifies production prerequisites with these gates:

- `production-blocking`
- `required-before-real-users`
- `required-before-real-device-actuation`
- `required-before-multi-vendor-support`
- `later-hardening`

The spine is authoritative for production-entry planning until superseded by a later ADR. Implementation work may satisfy parts of the spine, but cannot bypass it by adding marketing language, UI copy, or isolated feature work.

## Consequences

- The platform still does not claim production readiness.
- The current phase does not change.
- Full authentication, RBAC, secrets tooling, immutable audit, backup/restore, CI/CD, and production deployment controls remain future implementation work.
- Safe-action and rollback contracts remain bounded platform-only behavior until a later ADR and implementation prove a specific real device actuation path.
- Future production-hardening tasks must state which spine gate they satisfy and which acceptance criteria remain open.
- Multi-vendor support cannot be claimed from architecture alone; it must pass per-vendor evidence and adapter gates.

## Non-Decisions

This ADR does not:

- select an identity provider
- define the final RBAC schema
- choose a secrets backend
- implement backup/restore automation
- implement immutable audit storage
- define a production Kubernetes or VM deployment model
- change ODL from bounded protocol/controller component to actuation authority
- enable any real device push or restore behavior

## References

- [`../production-prerequisite-spine.md`](../production-prerequisite-spine.md)
- [`../production-readiness-assessment.md`](../production-readiness-assessment.md)
- [`../week-40-runtime-truth-baseline.md`](../week-40-runtime-truth-baseline.md)
- [`../safe-action-workflow-contract-v1.md`](../safe-action-workflow-contract-v1.md)
- [`../rollback-orchestration-contract-v1.md`](../rollback-orchestration-contract-v1.md)
