# Preview And Diff Semantics

## Purpose

This document defines the bounded semantics, uncertainty rules, and blocker rules that future preview and diff contracts must follow.

It exists to keep future dry-run-oriented contracts honest before any dry-run behavior exists.

## Core Semantics Rule

Future preview and diff contracts must describe bounded normalized platform-facing understanding.

They must not pretend to be:

- device-native plans
- guaranteed execution outcomes
- approval decisions
- validation verdicts
- rollback plans

## Allowed Claim Boundaries

Future preview and diff contracts may claim only:

- what normalized platform objects are likely relevant
- what normalized changes appear likely given current evidence
- what is supported, unsupported, partial, blocked, or unknown
- what assumptions the contract relies on
- what evidence references support the contract
- what uncertainty prevents stronger claims

## Prohibited Claim Boundaries

Future preview and diff contracts must not claim:

- exact command generation
- exact configuration generation
- exact runtime device behavior
- controller truth beyond what the platform owns explicitly
- complete policy truth beyond the bounded policy model
- complete topology truth beyond the bounded topology model
- guaranteed validation success
- guaranteed execution success
- guaranteed rollback success

## Uncertainty Rule

Uncertainty is mandatory whenever a stronger claim would exceed current platform truth.

Future contracts must always be able to express:

- bounded evidence
- partial model truth
- unsupported scope
- stale evidence
- missing evidence
- blocked previewability

## Recommended Uncertainty Postures

Use explicit postures such as:

- `strong_for_current_slice`
- `bounded_partial`
- `partial`
- `blocked`
- `unknown`

These values are descriptive only.

They are not confidence scores and not statistical probability statements.

## Blocker Rule

Future preview and diff contracts must carry explicit blocker records whenever the platform cannot honestly provide a stronger output.

### Minimum blocker fields

| Field | Type | Purpose |
| --- | --- | --- |
| `blocker_code` | `string` | Stable normalized blocker name. |
| `category` | `string` | Contract, truth, capability, scope, freshness, or dependency. |
| `severity` | `string` | `critical` or `major`. |
| `summary` | `string` | Human-readable explanation of the blocker. |
| `affected_scope` | `array` | Which part of the request or diff is affected. |
| `notes` | `array` | Additional honesty-preserving explanation. |

### Recommended blocker categories

- `contract`
- `truth`
- `capability`
- `scope`
- `freshness`
- `dependency`

## Unsupported Rule

Unsupported content must not be hidden inside notes only.

Future contracts should expose unsupported elements explicitly so callers can distinguish:

- supported claims
- partial claims
- blocked claims
- unsupported requests

## Evidence Reference Rule

Preview and diff contracts must explain what platform-owned evidence they depend on.

Evidence references should prefer:

- persisted normalized snapshots
- current read-only API models
- capability records
- integration health records
- workflow and audit records when those later become real

Evidence references should not depend on:

- raw vendor payloads as product contract truth
- hidden internal heuristics with no surfaced explanation

## Normalization Rule

Preview and diff contracts must remain vendor-neutral at the product layer.

If later implementation needs vendor-specific rendering, that rendering must remain behind adapter boundaries and must not replace the normalized product contract.

## Freshness Rule

If a preview or diff depends on persisted or stale evidence, that fact must be explicit.

The contract should never imply current live truth when it is actually using:

- persisted fallback snapshots
- bounded inferred topology
- aggregate-only policy evidence
- stale capability evidence

## Lifecycle Rule

Future preview and diff artifacts should align with the canonical workflow lifecycle vocabulary in:

- `platform/docs/workflow-lifecycle-vocabulary.md`

At minimum:

- preview generation should align with `ready_for_preview`, `preview_generated`, and `blocked`
- validation posture should align with `validation_pending`, `validation_passed`, and `validation_failed`
- no preview or diff artifact should imply `approved`, `executing`, `executed`, or `succeeded`

## Phase 2 Out-Of-Scope Reminder

In the current phase, none of the following exist yet:

- preview API implementation
- diff API implementation
- preview engine
- validation engine
- approval engine
- execution engine
- rollback engine

So these semantics are design guardrails only.

They exist to prevent fake dry-run claims later.