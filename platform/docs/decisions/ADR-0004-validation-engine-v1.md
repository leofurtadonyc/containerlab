# ADR-0004 — Validation engine v1 (backend-owned; separated from preview and evidence artifacts)

## Status

Accepted — Phase 2 foundation (2026-03-27).

## Context

The platform already exposes strong **read-only** evidence (inventory, topology, policy), **preview/diff v1** for bounded static-local intent reasoning, workflow **lifecycle records**, and many audit/history/export surfaces.

Operators still need a durable **validation-result** domain that can answer: *given explicit checks and explicit evidence, what pass/fail/unknown/not-applicable verdict applies* — distinct from **preview diffs**, **evidence deltas**, **replay exports**, or **sync history**.

## Decision

1. **Backend owns validation truth** — persisted `validation_requests` + `validation_events`, synchronous evaluation in `app-api`, no UI-local verdict authority.
2. **Capability gating is mandatory** — every run evaluates the capability matrix (`static_policy_detail` for the v1 policy scope) before claiming pass/fail.
3. **Explicit separation from preview** — `preview_requests` remain intent/diff artifacts; `validation_requests` are verdict/check/evidence artifacts. Linkage is optional via foreign keys and hints.
4. **Explicit separation from evidence/history/replay** — validation evidence items are summaries of read-model evaluation, not replay payloads or delta timelines.
5. **Truth-depth honesty** — validation responses include `truth_scope_summary` and per-check unknown reasons when collector or detail mode is insufficient.
6. **Verdict aggregation** — documented fail-first, then unknown, then pass / not_applicable rules (see `validation-result-contract-v1.md`).
7. **Phase 2 unchanged** — validation v1 does **not** assert execution, approval, rollback, or phase transition.

## Consequences

- New Postgres tables and Alembic migration (`validation_requests`, `validation_events`).
- New Prometheus counters for validation outcomes.
- WebUI **Validation workspace** for bounded requests against live API.
- Future workflow approval, execution, and rollback programs can attach without redesigning the backbone.

## Deferred

- Async workers, multi-vendor validation, dataplane proof, SLA validation, approval policy engines, and execution hooks (placeholders only in `extension_hints`).
