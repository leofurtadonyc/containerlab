# Readiness / capability decision-support contract (Phase 2)

## Purpose

This document is the **bounded shared contract** for how **readiness** (dry-run *planning* posture, not execution) and the **capability matrix** relate in the product API. It exists so operators and clients can **navigate** prerequisites, blockers, affected planning scopes, and related capability rows **consistently** without inventing workflow authority, dry-run engines, or validation verdicts.

Implementation lives in:

- `platform/app-api/src/app_api/schemas/capabilities.py` — Pydantic models and closed identifier sets
- `platform/app-api/src/app_api/services/capabilities.py` — populated `DryRunReadinessSummary` and `CapabilityRecord` rows for `GET /api/v1/capabilities`
- `platform/app-api/src/app_api/persistence/readiness.py` — persisted readiness snapshots aligned with the same JSON shape
- `GET /api/v1/readiness-snapshot-history` — bounded list of persisted readiness snapshots with optional `ReadinessBlockerName` filter and `include_blockers_detail` (read-only inspection; see `read_side_query` echo)

## Explicit non-authorization

This contract supports **read-only interpretation and planning discussion** only. It does **not** imply:

- workflow eligibility, approval, or execution authority
- dry-run or preview **execution**, APIs, or persisted dry-run outcomes
- validation engines, pass/fail verdicts, or change authorization
- new persistence domains beyond existing bounded readiness snapshots

**Naming:** the API uses historical labels such as `dry_run_readiness` for the **bounded planning-support** summary. That is **language for future-phase planning**, not a claim that dry-run behavior exists in Phase 2.

## Identifier vocabularies (closed sets)

These literals are **stable contract keys**. Adding a value requires a deliberate schema/API revision.

### `WorkflowReadinessScope`

Future **planning** scopes used when interpreting `workflow_readiness_scopes` on capability rows and `blocked_readiness_scopes` on blockers:

- `planning_depth`
- `preview_contracts`
- `validation_contracts`
- `workflow_audit_relationships`
- `phase_transition`

### `ReadinessBlockerName`

Named **blockers** to future workflow-grade readiness (not runtime faults):

- `workflow_lifecycle_contract_missing`
- `dry_run_contract_missing`
- `validation_result_contract_missing`
- `topology_truth_still_bounded`
- `policy_truth_still_bounded`
- `history_still_sync_derived`

### `PrerequisiteName`

Foundation **prerequisite** areas assessed in `dry_run_readiness.prerequisites`:

- `inventory_read_model`
- `topology_comparison_evidence`
- `policy_comparison_evidence`
- `workflow_audit_visibility`
- `capability_matrix_precision`

## Directed relationships (decision-support graph)

Relationships are **directed hints for navigation and explanation**, not a state machine and not exhaustive causal graphs.

### 1. Capability matrix row (`CapabilityRecord`)

Each row describes one **feature** in the bounded matrix.

| Field | Role |
| --- | --- |
| `feature` | Stable string primary key for the row within the matrix (e.g. `device_inventory`, `workflow_history_visibility`). |
| `workflow_readiness_status` | Row-level interpretation of how far this feature supports **planning** language. |
| `workflow_readiness_scopes` | Which `WorkflowReadinessScope` values this row is **associated with** for interpretation (not a guarantee of coverage). |
| `related_readiness_blockers` | Zero or more `ReadinessBlockerName` values that **materially affect** how operators should read this row when discussing future workflow readiness. |

**Direction:** capability row → named blockers (backward link from product evidence to readiness constraints).

### 2. Dry-run readiness prerequisites (`DryRunReadinessPrerequisite`)

Rendered under `dry_run_readiness.prerequisites` in `CapabilitiesListResponse`.

| Field | Role |
| --- | --- |
| `prerequisite` | `PrerequisiteName` — one foundation area. |
| `status`, `support_posture`, `evidence_basis`, `evidence_coverage` | Bounded **interpretation** of evidence strength — not a scorecard for execution. |
| `related_capabilities` | **Forward** links: each string **must** match a `CapabilityRecord.feature` value from the **same** capabilities response (or a documented subset used consistently in code). Use these for “which matrix rows carry evidence for this prerequisite.” |
| `blocking_gaps` | Human-readable gaps — still not validation output. |

**Direction:** prerequisite → capability `feature` strings.

### 3. Dry-run readiness blockers (`DryRunReadinessBlocker`)

Rendered under `dry_run_readiness.blockers`.

| Field | Role |
| --- | --- |
| `blocker` | `ReadinessBlockerName`. |
| `category`, `severity`, `evidence_basis` | Classification for operator discussion only. |
| `blocked_readiness_scopes` | Which `WorkflowReadinessScope` values remain **unsafe to treat as satisfied** for future workflow-grade work while this blocker exists. |
| `related_prerequisites` | `PrerequisiteName` values **causally tied** to this blocker in copy — explanatory, not a full dependency closure. |
| `notes` | Bounded narrative. |

**Direction:** blocker → prerequisites; blocker → blocked scopes.

### 4. Aggregates (`DryRunReadinessSummary`)

Rollup counts and `strongest_blockers` support **dashboards and metrics**; they **summarize** the same model and must not introduce new semantics beyond the lists above.

## Product navigation semantics

- **Prerequisite → capabilities:** use `related_capabilities` to jump to matrix rows (`feature`).
- **Blocker → prerequisites / scopes:** use `related_prerequisites` and `blocked_readiness_scopes`.
- **Capability row → blockers:** use `related_readiness_blockers`.

All navigation remains **read-only** and **interpretive**.

## Observability

Prometheus metrics derived from readiness posture (e.g. prerequisite/blocker counts) are **observability mirrors** of this contract — see `platform/docs/data-flows.md` and `app-api` metrics help text. Grafana does **not** define product semantics.

## Versioning

Any additive change to the closed identifier sets or relationship rules should be reflected in this document and in `schemas/capabilities.py` in the same change set so Phase 2 decision support stays reviewable.
