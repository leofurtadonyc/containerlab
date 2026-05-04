# Production Prerequisite Spine

## Purpose

This document is the platform's production-entry contract. It turns the current `conditionally_ready_with_explicit_limits` posture into an explicit engineering spine for moving from a lab-ready, bounded read-side product plus one platform-only action slice toward production operation.

It is not a production-readiness claim. It does not change the current phase, broaden the safe-action contract, or authorize real device actuation.

Current supporting evidence:

- [`production-readiness-assessment.md`](./production-readiness-assessment.md) records the bounded readiness verdict and current limits.
- [`week-40-runtime-truth-baseline.md`](./week-40-runtime-truth-baseline.md) records the latest packaged runtime validation baseline.
- [`safe-action-workflow-contract-v1.md`](./safe-action-workflow-contract-v1.md) and [`rollback-orchestration-contract-v1.md`](./rollback-orchestration-contract-v1.md) define the current platform-only action and rollback boundaries.
- [`action-safety-case-contract-v1.md`](./action-safety-case-contract-v1.md) defines the bounded operator review assembly that unifies existing action artifacts without authorizing production actuation.
- [`decisions/ADR-0012-production-entry-spine.md`](./decisions/ADR-0012-production-entry-spine.md) records the decision to govern production entry through this spine.

## Current Production Posture

The current platform is suitable for bounded lab and operator-evaluation use when treated as:

- a read-only product surface for platform health, inventory, topology, policy, evidence quality, investigation, stability, maintenance evidence, and related bounded workspaces
- a repo-built local runtime with documented build, deploy, and verifier paths
- a platform-only safe-action and rollback demo slice whose effects remain within backend-owned records and local operator intent overlays

It is not ready for:

- real production users with account-level accountability
- production secrets, credential rotation, or tenant separation
- broad production monitoring and on-call operation
- immutable audit or compliance-grade event retention
- automated database backup/restore guarantees
- real device push, device restore, or closed-loop remediation
- multi-vendor operational support beyond documented Nokia-first evidence

## Classification Vocabulary

Every prerequisite below is classified with one or more of these gates:

- `production-blocking`: must exist before any production environment is claimed.
- `required-before-real-users`: must exist before named operators use the platform for real operational decisions.
- `required-before-real-device-actuation`: must exist before any workflow can push to, configure, restore, or otherwise change real network devices.
- `required-before-multi-vendor-support`: must exist before Juniper or other vendors are presented as supported beyond bounded planning.
- `later-hardening`: important, but can follow the first production-entry gate if scoped risk is accepted.

## Production Entry Matrix

| Area | Current posture | Classification | Production-entry requirement |
| --- | --- | --- | --- |
| Authentication | No production identity provider integration is established as a product gate. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation` | Integrate a real IdP/OIDC provider, disable anonymous operator access for production, define service-to-service auth posture, and document break-glass access. |
| Authorization / RBAC | Current surfaces expose capability and readiness language, not enforceable operator roles. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation` | Define roles such as viewer, investigator, change author, approver, executor, auditor, and admin; enforce permissions in app-api and WebUI affordances. |
| Secrets management | Runtime uses environment/config patterns suitable for lab deployment, not production rotation. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation` | Move credentials to a production secret backend, define rotation, prevent committed/plaintext secrets, and separate lab, staging, and production credentials. |
| Database backup/restore | Postgres is durable in the lab runtime, but no production backup and restore drill is guaranteed. | `production-blocking`, `required-before-real-users` | Add scheduled backups, restore drills, RPO/RTO targets, migration rollback plan, and evidence that restored data preserves workflow/audit integrity. |
| Audit and event immutability | Audit history exists as a bounded read-side view; it is not immutable or compliance-grade. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation` | Introduce append-only audit/event storage, tamper-evidence, retention policy, actor identity binding, and export/review procedures. |
| CI/CD | Repository tests and verifiers exist, but no production promotion pipeline is the deployment authority. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation` | Define gated build, test, image signing or provenance, environment promotion, migration checks, and rollback of application releases. |
| Runtime deployment environments | Containerlab runtime is valuable for lab proof; it is not a production deployment model. | `production-blocking`, `required-before-real-users` | Define dev, lab, staging, and production environments with network boundaries, TLS, ingress, persistence, health, resource limits, and upgrade procedures. |
| Prometheus/Grafana production monitoring | Current monitoring has useful real metrics and dashboards for the lab scrape set. | `production-blocking`, `required-before-real-users`, `later-hardening` | Add production SLOs, alerts, retention, dashboard ownership, on-call runbooks, exporter coverage decisions, and separation between observability facts and product truth. |
| ODL bounded production role | ODL is a bounded controller/protocol component; live southbound truth is still scoped. | `required-before-real-device-actuation`, `required-before-multi-vendor-support` | Define whether ODL is production read-only enrichment, controller protocol gateway, or actuation participant; gate each role separately with session health, auth, failure-mode, and rollback evidence. |
| gNMI collector hardening | Collector has real Nokia lab metrics and read paths, but production security/scale posture is incomplete. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation`, `required-before-multi-vendor-support` | Add credential isolation, target authorization, backoff, per-target budgets, TLS/mTLS posture, scale tests, stale-data handling, and vendor adapter acceptance gates. |
| Safe action approval model | Current safe action is one platform-only bounded slice, not general device change authority. | `required-before-real-device-actuation`, `required-before-real-users` | Introduce enforced multi-step approval, role separation, change windows, evidence snapshot binding, cancellation, and explicit approver/executor identity capture. |
| Rollback proof model | Current rollback orchestration is bounded compensation around platform records, not device restore. | `required-before-real-device-actuation` | Define rollback artifact capture, pre/post evidence snapshots, device-state restore proof, failed-rollback handling, and operator-visible rollback confidence limits. |
| Change-management integration | Current workspaces can produce reports and safety cases, but no ITSM/change-system authority exists. | `required-before-real-users`, `required-before-real-device-actuation`, `later-hardening` | Integrate or explicitly bridge to the organization's change system with ticket binding, approval status, maintenance windows, and audit correlation. |
| Operator accountability | Current UI has operator-facing surfaces, but no authenticated accountable actor chain. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation` | Bind every material read, export, approval, action, rollback, and config-affecting request to authenticated actor, role, reason, timestamp, and request id. |
| Multi-vendor readiness gates | Nokia-first evidence exists; broader vendor support remains architectural, not operational parity. | `required-before-multi-vendor-support`, `required-before-real-device-actuation` | Define per-vendor adapter contracts, capability matrices, golden fixtures, lab evidence, failure modes, and no-parity copy rules before support claims. |
| Lab-to-production separation | Platform and labs are architecturally separated, but production environment controls are not implemented. | `production-blocking`, `required-before-real-users`, `required-before-real-device-actuation` | Separate lab targets, demo data, credentials, topology files, DNS, routes, storage, and release channels from production deployment paths. |
| Evidence quality requirements | Evidence quality workspace and weakness explanation are present; quality gates do not yet block production workflows. | `required-before-real-users`, `required-before-real-device-actuation`, `required-before-multi-vendor-support` | Define minimum evidence-quality gates per use case, block unsafe claims when evidence is weak, and bind action/rollback eligibility to cited evidence snapshots. |

## Production Blockers

These block any production-readiness claim:

1. No production authentication and RBAC enforcement.
2. No production secret backend, rotation model, or environment separation for credentials.
3. No database backup/restore drill with stated RPO/RTO and migration recovery evidence.
4. No immutable or tamper-evident audit/event model tied to authenticated actors.
5. No CI/CD promotion gate that owns production builds, tests, deployments, and release rollback.
6. No production deployment environment definition with TLS, ingress, persistence, resource limits, and operational runbooks.
7. No production monitoring program with alerts, SLOs, and ownership.
8. No explicit lab-to-production separation controls.

Production entry cannot proceed by improving UI copy alone. These are platform control-plane and operations prerequisites.

## Real User Blockers

Real users means named operators relying on the platform for operational interpretation, even read-only. Before that:

- Identity and RBAC must bind users to roles and visible capabilities.
- Audit must capture meaningful operator reads, exports, decisions, and workflow interactions.
- Evidence quality limits must be visible at the point of decision and must not be buried in secondary docs.
- Runtime health, stale data, partial collection, and fallback serving must be operator-visible and alert-backed.
- Backup/restore and incident response must be tested for the environment that users rely on.

## Real Device Actuation Blockers

No current capability should be described as general real device actuation. The present safe-action and rollback slices are bounded platform-only workflows.

Before any real device push, restore, or closed-loop action:

1. Authentication, RBAC, approval, and operator accountability must be enforced server-side.
2. Change-management integration or a formally accepted equivalent must bind a change request to approval status and maintenance window.
3. Evidence snapshots must be captured and frozen for the candidate action.
4. Preview, validation, action, and rollback must use the same subject identity and evidence anchors.
5. Device-specific adapters must prove idempotency, diff quality, timeout behavior, partial-failure behavior, and rollback limits.
6. ODL's role must be explicitly selected for that workflow: not involved, read-only evidence, protocol gateway, or actuation participant.
7. Rollback must have device-state proof, not just platform compensation records.
8. Audit must capture actor, approver, executor, payload summary, evidence ids, device targets, result, and rollback eligibility.

## Lab-Only Until Replaced

These must remain lab-only unless explicitly replaced by production-grade controls:

- Containerlab topology as the deployment authority.
- Demo/lab target credentials and static topology assumptions.
- Non-rotated environment-file secrets.
- Structural verifier success as a substitute for production monitoring.
- Safe-action platform-only intent overlay as a substitute for device configuration.
- Rollback orchestration records as a substitute for device restore.
- ODL lab auth verification as a substitute for production controller integration.
- Nokia-only lab evidence as a substitute for multi-vendor support.

## Safe Action And Rollback Language

Current safe-action and rollback language must remain bounded:

- "Safe action" means the documented `safe_action_workflow_v1` platform-only slice unless a future ADR narrows and approves real device actuation.
- "Rollback" means the documented `rollback_orchestration_v1` platform compensation/record workflow unless a future ADR proves device restore semantics for a specific workflow.
- "Action safety case" means the documented `action_safety_case_v1` review assembly over existing workflow, preview, validation, action, rollback, evidence-quality, and controller-evidence artifacts; it is not production approval or safe-to-execute authority.
- Neither name implies production authorization, safe-to-change authority, device push, device restore, or change-management approval.
- UI and docs must keep non-claims visible near action and rollback affordances.

## First 4-8 Week Engineering Plan

This plan creates the minimum spine needed to make later implementation concrete. It is intentionally ordered so controls precede real actuation.

### Phase A - Production Boundary Definition (week 1)

Outputs:

- environment taxonomy: lab, staging, production
- production threat and trust boundary note
- identity/RBAC role matrix draft
- secret inventory and rotation target design
- list of routes and actions requiring authenticated actor capture

Exit criteria:

- no route family is left with ambiguous production exposure
- safe-action and rollback remain explicitly platform-only

### Phase B - Identity, RBAC, and Accountability Design (weeks 2-3)

Outputs:

- OIDC/authentication ADR or implementation plan
- RBAC permission matrix for API routes and WebUI affordances
- audit actor schema and event taxonomy
- break-glass and service-account policy

Exit criteria:

- reviewers can tell who may view, export, approve, execute, administer, and audit
- future implementation tickets can be split without redesigning roles

### Phase C - Secrets, Data Protection, and Audit Immutability (weeks 3-5)

Outputs:

- secret backend selection and migration plan
- backup schedule, restore drill plan, RPO/RTO targets
- append-only or tamper-evident audit design
- retention and export policy

Exit criteria:

- production data durability and audit integrity have testable acceptance criteria
- credentials are no longer treated as deployment-file details

### Phase D - CI/CD and Runtime Environment Gate (weeks 5-6)

Outputs:

- production pipeline gate definition
- image provenance/signing or equivalent release evidence decision
- staging deploy and migration verification plan
- production monitoring and alerting minimum set

Exit criteria:

- a build cannot become production by manual local convention alone
- runtime health, stale data, collection failure, and persistence failure have owners and alerts

### Phase E - Actuation Readiness Design (weeks 6-8)

Outputs:

- safe-action approval model extension plan
- rollback proof model design
- change-management integration plan
- ODL actuation role decision for the first candidate workflow
- first vendor/device actuation gate checklist

Exit criteria:

- the platform has a narrow, reviewable path toward one real actuation candidate
- no real device actuation is allowed until prior phases are implemented and verified

## Acceptance Criteria For Production Entry

Production entry requires all `production-blocking` items to be implemented, tested, documented, and rehearsed in a non-production environment. At minimum:

- an authenticated user can be authorized, denied, and audited
- secrets can be rotated without code changes
- database restore has been rehearsed from backup
- production deployment is promoted through CI/CD gates
- monitoring alerts identify runtime, data freshness, and persistence failures
- lab-only topology, credentials, and data are not part of production runtime
- evidence quality and fallback states remain visible in product surfaces
- safe-action and rollback remain disabled for real device effects unless a separate actuation gate is accepted

## Acceptance Criteria For Real Device Actuation

Real device actuation requires a separate approval after production entry. At minimum:

- one narrow workflow is selected and documented with exact device-side effect
- preview, validation, action, and rollback share durable evidence anchors
- device adapter behavior is tested against success, timeout, partial failure, and rollback scenarios
- RBAC enforces author, approver, executor, and auditor separation
- change-management status is checked or explicitly waived by a documented production policy
- audit records are immutable or tamper-evident
- rollback proof includes device-state evidence, not only platform records
- ODL involvement is explicit and bounded

## Acceptance Criteria For Multi-Vendor Support

Multi-vendor support requires per-vendor gates, not generic adapter promises:

- vendor-specific evidence collection fixtures and live lab proof
- normalized model mapping with unsupported states preserved honestly
- capability matrix entries tied to evidence, not roadmap intent
- per-vendor safety and rollback limitations
- WebUI copy that avoids parity claims when a vendor is planning-only
- CI tests and runtime verifier branches for each supported vendor lane

## Decision Log Hooks

Future work should create separate ADRs for:

- production authentication and RBAC
- secret backend and rotation model
- audit immutability model
- backup/restore and migration rollback model
- production deployment and CI/CD promotion model
- first real device actuation candidate
- ODL production role for actuation, if any
- multi-vendor acceptance gates

This document remains the parent spine; implementation ADRs must cite it and state which gate they satisfy.
