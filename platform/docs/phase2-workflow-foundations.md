# Phase 2 To Workflow Foundations Mapping

## Purpose

This document maps current `Phase 2 — read-only product foundation` artifacts to the future workflow-oriented foundation they may support later.

It exists to answer three questions honestly:

- what can carry forward directly
- what can carry forward only partially
- what is useful only as planning context rather than reusable workflow foundation

## Phase Boundary

This document does not recommend a phase transition.

It does not authorize workflow implementation, dry-run implementation, preview generation, validation execution, approval handling, or safe action workflows.

It only maps current reusable groundwork against the future workflow-oriented phase described in [platform/docs/roadmap.md](platform/docs/roadmap.md).

## Reuse Categories

Use the following classifications strictly.

### `directly_reusable`

The artifact can carry forward into a future workflow-oriented phase with the same essential role, though later APIs or storage may still wrap it differently.

### `partially_reusable`

The artifact contains evidence, vocabulary, structure, or UX patterns that should carry forward, but it cannot be reused as the full future workflow object or system.

### `conceptually_helpful_only`

The artifact is useful for planning, operator explanation, or vocabulary shaping, but it should not be treated as a durable workflow-phase building block.

### `not_suitable_for_reuse`

The artifact should not be carried forward as workflow foundation because doing so would overstate current Phase 2 semantics or introduce architecture drift.

## Reuse Mapping

| Current Phase 2 artifact | Current evidence | Reuse classification | Why | Future workflow-phase use | Must not be overread as |
| --- | --- | --- | --- | --- | --- |
| Persisted normalized inventory, topology, and policy snapshots | Current status documents bounded persistence for inventory, topology, policy, sync-run, and readiness-support snapshots in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) and snapshot-attached history models exist in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py#L1) and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py#L1) | `directly_reusable` | These are already platform-owned persisted evidence artifacts rather than purely UI-level summaries. | Baseline evidence inputs for preview, validation, blocker explanation, and later audit linkage through evidence references. | Workflow state, intent state, approval state, or execution history. |
| Current-versus-latest-persisted and persisted-versus-previous comparison support | Comparison support exists across devices, topology, policy, workflow history, and audit history as documented in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) and modeled in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py#L18) and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py#L18) | `partially_reusable` | The comparison shapes and bounded explanatory semantics are useful, but they remain read-side explanatory evidence rather than workflow-grade validation or diff truth. | Supporting evidence for preview summaries, validation reasoning, and audit context where honest. | Validation verdicts, drift conclusions, or execution diffs. |
| Capability matrix records and support-status semantics | Capability and readiness schemas exist in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py#L1) and are described as future-enabling but still bounded in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) | `partially_reusable` | The support-status, evidence-basis, delivery-tier, vendor-posture, and workflow-readiness vocabulary is already normalized and backend-owned. | Capability gating, unsupported-condition explanation, blocker attribution, and workflow-readiness interpretation. | A workflow eligibility engine, validator, or action authorization surface. |
| Dry-run-readiness summary, prerequisites, blockers, and assessment areas | Readiness summary, prerequisite, blocker, and assessment models exist in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py#L71) and the bounded readiness-only posture is documented in [platform/docs/workflows.md](platform/docs/workflows.md) | `partially_reusable` | The structures already express blockers, evidence coverage, support posture, and planning-readiness boundaries honestly. | Foundation-level prerequisite and blocker vocabulary for later workflow planning and validation surfaces. | Workflow lifecycle state, preview output, validation results, or phase-transition evidence. |
| Readiness WebUI page | The readiness page is part of the current navigation in [platform/app-web/src/App.tsx](platform/app-web/src/App.tsx#L13) and safe fallback semantics are defined in [platform/app-web/src/lib/readiness.ts](platform/app-web/src/lib/readiness.ts#L1) | `conceptually_helpful_only` | The page proves the current product can explain readiness boundaries clearly, but the page itself is a Phase 2 planning-support surface. | Operator-facing explanation patterns for future readiness, blocker, and evidence views. | A workflow console, approval UI, or preview/validation UX. |
| Workflow-history and audit-history records derived from sync activity | Current sync-derived history models exist in [platform/app-api/src/app_api/models/workflow.py](platform/app-api/src/app_api/models/workflow.py#L90) and [platform/app-api/src/app_api/models/audit.py](platform/app-api/src/app_api/models/audit.py#L90), and the limitation is stated explicitly in [platform/docs/workflows.md](platform/docs/workflows.md) | `partially_reusable` | These records contain useful chronology, source, and evidence-attachment patterns, but their meaning is still limited to persisted read-side sync activity. | Generic chronology patterns, event wording discipline, and evidence references for later workflow surfaces. | Durable workflow lifecycle history, user action history, approval history, or execution audit history. |
| Workflow-history and audit-history pages | Current WebUI pages are documented as sync-derived visibility in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) | `conceptually_helpful_only` | The product patterns around recency, evidence-first sorting, and bounded explanation are useful, but the current page meaning is intentionally narrower than future workflow UX. | UX ideas for evidence-heavy workflow history and audit views later. | Action workflow UX or operator-forensics completeness. |
| Evidence-confidence summaries on devices, topology, and policies | Current status documents shared backend-owned evidence-confidence cues, and those cues are served through backend schemas referenced in [platform/app-api/src/app_api/services/devices.py](platform/app-api/src/app_api/services/devices.py), [platform/app-api/src/app_api/services/topology.py](platform/app-api/src/app_api/services/topology.py), and [platform/app-api/src/app_api/services/policies.py](platform/app-api/src/app_api/services/policies.py#L348) | `directly_reusable` | These cues already express bounded source posture, evidence kind, freshness posture, and blocked reason without pretending to be probability scores. | Evidence metadata inside preview, diff, validation, and blocker contracts. | Confidence scoring, validation verdicts, or risk scoring. |
| Serving-mode semantics such as `live_collector`, `persisted_fallback`, and `empty_scaffold` | Current serving-mode fields are present in devices, topology, and policies schemas and services, including [platform/app-api/src/app_api/schemas/devices.py](platform/app-api/src/app_api/schemas/devices.py#L56) and [platform/app-api/src/app_api/schemas/policies.py](platform/app-api/src/app_api/schemas/policies.py#L121) | `partially_reusable` | These semantics are useful provenance inputs, but they describe read-path posture rather than workflow outcome posture. | Provenance and freshness explanation inside later workflow evidence references. | Workflow states, approval states, or execution states. |
| Current workflow-phase design docs created during Phase 2 | The workflow lifecycle, preview/diff, validation/blocker, audit-relationship, and entity-model docs already exist under [platform/docs/workflows.md](platform/docs/workflows.md) and [platform/schemas/workflows](platform/schemas/workflows) | `directly_reusable` | These documents were written specifically as future-oriented design guardrails without introducing behavior. | Phase 4 contract, vocabulary, and relationship groundwork. | Implemented APIs or storage by themselves. |
| Grafana dashboards and readiness-support metrics | Current status documents real readiness-support and evidence-posture observability in [agent/sdn/03-CURRENT-STATUS.md](agent/sdn/03-CURRENT-STATUS.md) | `conceptually_helpful_only` | These signals are useful for operators and for post hoc visibility, but Grafana remains observability-only. | Supporting observability around later workflow foundations. | Product-owned workflow logic, workflow truth, or approval semantics. |
| Sync-derived audit event baseline schema | The generic audit schema exists in [platform/schemas/audit/audit-event.schema.json](platform/schemas/audit/audit-event.schema.json) and current mapping limitations are documented in [platform/schemas/workflows/audit-relationships.md](platform/schemas/workflows/audit-relationships.md) | `partially_reusable` | Generic event identity, source, actor, result, and timestamp fields are useful, but future workflow audit linkage requires richer relationship context. | Baseline event envelope for later workflow-aware audit records. | Complete workflow audit relationship modeling. |

## Reuse Summary By Category

### Directly reusable

- persisted normalized snapshots as workflow evidence inputs
- evidence-confidence vocabulary and summaries as workflow evidence metadata
- Phase 2 workflow-planning design docs as future contract and model guardrails

### Partially reusable

- current comparison support
- capability matrix and readiness schema vocabulary
- sync-derived history structures and generic audit envelopes
- serving-mode provenance cues

### Conceptually helpful only

- readiness page UX patterns
- workflow-history and audit-history page patterns
- Grafana readiness and evidence observability patterns

### Not suitable for reuse as-is

- treating sync-derived workflow-history as durable workflow lifecycle state
- treating sync-derived audit-history as workflow audit history
- treating readiness metadata as preview, diff, validation, approval, or execution behavior
- treating dashboards as workflow logic or product truth

## Gaps Still Missing Before A Workflow-Oriented Phase

The current Phase 2 foundation still lacks several workflow-grade artifacts that cannot be substituted by reuse alone.

- durable workflow lifecycle records for requested, planned, preview, validation, approval, execution, success, failure, and rollback stages
- workflow-owned storage and APIs for preview artifacts, diff artifacts, validation results, blocker state, approval records, and audit linkages
- workflow-grade audit events and workflow-to-audit linkage instead of sync-derived history only
- stronger topology and policy truth for any workflow-grade pre-change reasoning
- explicit separation between read-side evidence reuse and workflow-state ownership in storage and APIs
- implementation of Phase 4 surfaces after the build-order gates, not before them

## Transition Planning Notes

These notes are about sequencing only.

They do not imply readiness to transition now.

1. Carry forward current persisted snapshots and evidence-confidence semantics first, because they are the strongest directly reusable evidence foundation already owned by the backend.
2. Reuse capability and readiness vocabulary next, but keep it clearly scoped to support posture, blockers, and prerequisites rather than promoting it into workflow verdicts automatically.
3. Preserve comparison support as explanatory evidence only until stronger workflow-owned validation and diff artifacts exist.
4. Do not relabel sync-derived workflow-history or audit-history into workflow lifecycle or workflow audit truth; keep them as supporting evidence only.
5. Use the existing Phase 2 workflow-planning docs under `platform/schemas/workflows/` and `platform/docs/` as the design baseline before writing any Phase 4 implementation code.
6. Use [platform/schemas/workflows/workflow-owned-state-prerequisites.md](platform/schemas/workflows/workflow-owned-state-prerequisites.md) as the concrete ownership, storage, API-sequencing, and audit-linkage checklist before any workflow-owned entity design turns into migrations or endpoints.
7. Respect the documented order in [agent/sdn/16-implementation-order.md](agent/sdn/16-implementation-order.md) and [agent/sdn/35-build-order-enforcement-rules.md](agent/sdn/35-build-order-enforcement-rules.md): dry-run and workflow scaffolding comes after the read-only foundation, not instead of it.

## Non-Transition Reminder

This mapping does not change the current phase.

The correct interpretation is:

- Phase 2 has produced meaningful workflow-phase foundations
- those foundations are uneven across artifact types
- several critical workflow-grade artifacts still do not exist
- the platform should remain fully in `Phase 2 — read-only product foundation`