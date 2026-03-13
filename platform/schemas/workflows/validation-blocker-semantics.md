# Validation And Blocker Semantics

## Purpose

This document defines the strict semantics that future validation-result and blocker contracts must follow.

It exists to keep later preflight or validation-oriented surfaces honest before any validation engine exists.

## Core Rule

Future validation contracts must describe bounded normalized conclusions based on platform-owned evidence, explicit capability posture, and explicit blockers.

They must not pretend to be:

- runtime execution verdicts
- approval decisions
- complete live truth across partially modeled domains
- device-native reasoning surfaces

## Validation Status Definitions

The overall `validation_status` and each `check_status` should use the following meanings.

### `passed`

Use `passed` only when:

- the evaluated check or validation scope is supported strongly enough for the current slice
- the evidence basis and evidence coverage are strong enough to support a bounded positive conclusion
- no blocker or unsupported condition materially invalidates that positive conclusion for the reported scope

`passed` means:

- the bounded normalized validation claim succeeded for the stated scope

`passed` does not mean:

- execution is safe
- approval is implied
- convergence is guaranteed
- all adjacent scope outside the bounded slice also passes

### `failed`

Use `failed` only when:

- the evaluated check or validation scope is supported strongly enough for the current slice
- the evidence basis and evidence coverage are strong enough to support a bounded negative conclusion
- the failure is grounded in explicit platform-owned evidence rather than assumption alone

`failed` means:

- the bounded normalized validation claim did not hold for the stated scope

`failed` does not mean:

- runtime execution would fail in exactly the same way
- rollback would be required or feasible
- remediation is obvious or automatic

### `blocked`

Use `blocked` when:

- an explicit blocker prevents any honest positive or negative verdict for the affected claim surface
- the primary limitation is structural or capability-related rather than merely informational

Typical causes:

- required contract surface missing
- capability not implemented in the platform
- dependency unavailable
- history or truth limits that prevent an honest verdict

### `unknown`

Use `unknown` only when:

- some evidence exists
- the platform can evaluate the scope partially
- but the remaining ambiguity, inconsistency, or model limitation prevents a stronger verdict
- and the situation is not better represented as `blocked` or `insufficient_evidence`

`unknown` should be rare.

It is not a fallback bucket for unsupported scope or missing evidence.

### `insufficient_evidence`

Use `insufficient_evidence` when:

- the relevant evidence is missing, stale, too partial, inconsistent, inferred-only, or otherwise too weak for an honest pass or fail conclusion
- the shortfall is evidentiary rather than primarily contractual or capability-driven

This status keeps evidence weakness explicit instead of hiding it behind `unknown`.

## Unsupported Condition Semantics

Unsupported content should be represented explicitly in `unsupported_conditions`.

Unsupported is a condition, not a validation verdict.

Relationship to result statuses:

- unsupported scope commonly contributes to `blocked`
- unsupported sub-scope may coexist with an otherwise bounded `passed` or `failed` result if the unsupported area is explicitly excluded from the validated slice
- unsupported must not be silently merged into `unknown`

Capability alignment:

- reuse `supported`
- reuse `partially_supported`
- reuse `unsupported`
- reuse `unknown`
- reuse `not_implemented_in_platform`

These values align with the current capability schema in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py#L8).

## Insufficient Evidence Semantics

Insufficient evidence should be represented explicitly in `insufficient_evidence_conditions`.

Use it when the platform lacks enough trustworthy evidence to make a stronger claim even if the capability is nominally supported.

Typical causes:

- missing normalized snapshot
- stale evidence
- bounded inferred topology that is too weak for the requested validation slice
- aggregate-only policy evidence that is too weak for an object-level validation claim
- conflicting evidence across sources

Evidence alignment:

- reuse evidence basis values from the capability schema such as `live_validated`, `persisted_validated`, `platform_probe`, `design_review`, and `roadmap_only`
- reuse evidence coverage posture such as `strong`, `bounded`, `partial`, and `blocked`
- reuse confidence posture such as `strong`, `bounded`, `degraded`, `blocked`, and `unknown`

These values align with the current capability and preview evidence semantics in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py#L24) and [platform/schemas/workflows/preview-contract.md](platform/schemas/workflows/preview-contract.md#L212).

## Blocked Versus Insufficient Evidence

The distinction must remain strict.

- use `blocked` when an explicit blocker record says the contract surface cannot honestly produce a stronger verdict
- use `insufficient_evidence` when the main problem is evidence weakness inside an otherwise meaningful validation surface

They can coexist.

If both exist, the overall result should prefer `blocked` when the blocker prevents any honest verdict for the reported scope.

## Unknown Versus Insufficient Evidence

The distinction must also remain strict.

- use `insufficient_evidence` when evidence weakness is the reason a verdict cannot be made
- use `unknown` when evidence exists but remains ambiguous, internally inconsistent, or too model-limited for a stronger verdict

Do not use `unknown` as a shortcut for:

- stale evidence
- missing evidence
- unsupported capability
- blocked contract surface

## Severity Semantics

Blocker severity should remain intentionally narrow and aligned with current readiness blocker posture.

- `critical`: no honest positive or negative verdict can be made for the affected claim surface
- `major`: a stronger or complete verdict is prevented for a material portion of the affected scope, but a bounded partial result may still exist

These values align with the current readiness blocker schema in [platform/app-api/src/app_api/schemas/capabilities.py](platform/app-api/src/app_api/schemas/capabilities.py#L73).

## Relationship To Current Read-Only Evidence

Future validation contracts must stay honest about the current platform foundation.

In the current phase:

- much evidence is persisted read-side evidence rather than workflow-owned execution evidence
- topology truth remains bounded in some slices
- policy truth remains bounded in some slices
- workflow and audit history remain sync-derived rather than workflow-engine-derived

So future validation contracts must prefer:

- explicit evidence references
- explicit support posture
- explicit unsupported conditions
- explicit insufficient-evidence conditions
- explicit blockers

over implied certainty.

## What Validation Contracts Are Allowed To Claim

Future validation-result and blocker contracts may claim only:

- bounded normalized pass or fail conclusions where evidence genuinely supports them
- explicit blocked, unsupported, unknown, and insufficient-evidence areas
- explicit capability and evidence posture aligned with current read-only semantics
- explicit scope boundaries for every stronger claim

## What Validation Contracts Must Not Claim

Future validation-result and blocker contracts must not claim:

- runtime execution success or failure guarantees
- approval authorization
- complete controller truth or live network truth beyond platform-owned evidence
- vendor-native device plan semantics
- fake verdicts when evidence or support posture is too weak

## Lifecycle Alignment

Future validation-result artifacts should align with the canonical workflow lifecycle vocabulary in:

- `platform/docs/workflow-lifecycle-vocabulary.md`

At minimum:

- validation surfaces may align with `validation_pending`, `validation_passed`, `validation_failed`, and `blocked`
- validation surfaces must not imply `approved`, `executing`, `executed`, or `succeeded`

## Phase 2 Out-Of-Scope Reminder

In the current phase, none of the following exist yet:

- validation API implementation
- validation engine
- rule engine
- approval engine
- execution engine

So these semantics are design guardrails only.

They exist to prevent fake validation claims later.