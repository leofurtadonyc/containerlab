# API Contract Governance

## Purpose

This document defines the current lightweight guardrail that keeps backend route families, frontend client coverage, frontend contracts, and explicit backend-only exceptions from silently drifting apart.

The platform intentionally does not use OpenAPI code generation yet. Runtime contracts are implemented in `platform/app-api/src/app_api/schemas/`, while the WebUI maintains hand-written TypeScript contracts in `platform/app-web/src/api/contracts.ts` and typed request methods in `platform/app-web/src/api/client.ts`.

That manual model is acceptable only if the repository detects missing coverage early.

## Checker

Run from `platform/`:

```bash
python3 scripts/check-api-contract-drift.py
```

The checker is standard-library Python and reads both backend and frontend source trees from the platform root.

It inspects:

- `app-api/src/app_api/api/v1/router.py`
- `app-web/src/api/client.ts`
- `app-web/src/api/contracts.ts`
- `app-web/src/**/*.ts`
- `app-web/src/**/*.tsx`

It verifies:

- every `router.include_router(...)` in the v1 backend router has a governance entry
- every governance entry still maps to a registered backend router
- product-facing route families have expected frontend client/source markers
- expected frontend response contract names exist in `contracts.ts`
- backend-only route families are explicitly allowlisted
- every backend-only allowlist entry has a specific reason

This is a route-family guardrail, not full schema equivalence.

## Current Backend-Only Allowlist

The allowlist is intentionally small and lives in `scripts/check-api-contract-drift.py`.

Current backend-only route families:

| Route family | Reason |
| --- | --- |
| `GET /api/v1/readiness-snapshot-history` | Support endpoint. Readiness snapshot context is currently surfaced through capabilities/readiness assemblies rather than a dedicated WebUI client method. |
| `GET /api/v1/health` | Runtime health endpoint consumed by proxy/runtime checks and `verify-core-runtime.sh`, not by the typed product API client. |

Adding a backend-only route without a reason should fail the checker. Do not use the allowlist to hide unfinished product work.

## Evidence Weakness Explanation Posture

`GET /api/v1/evidence-weakness-explanation` is the known week 40 governance case.

Current posture:

- implemented in `app-api/src/app_api/routers/evidence_weakness_explanation.py`
- contract model in `app-api/src/app_api/schemas/evidence_weakness_explanation.py`
- documented by `platform/docs/evidence-weakness-explanation-contract.md`
- represented by `getEvidenceWeaknessExplanation` in `app-web/src/api/client.ts`
- typed by `EvidenceWeaknessExplanationResponse` and related interfaces in `app-web/src/api/contracts.ts`
- consumed inside the existing Evidence Quality Workspace as a bounded explanation and read-only next-best-pivot section

The route is no longer backend-only allowlisted. The checker now requires frontend client markers and contract markers for this route family. The UI posture remains advisory: it shows bounded explanation categories, affected evidence domains, read-only pivots, confidence/limitation language, and explicit non-claims without assigning root cause or safe-to-change authority.

## Action Safety Case Posture

`GET /api/v1/actions/{action_id}/safety-case` is covered by the existing `/api/v1/actions` route family governance.

Current posture:

- implemented in `app-api/src/app_api/routers/safe_actions.py`
- contract model in `app-api/src/app_api/schemas/action_safety_case.py`
- documented by `platform/docs/action-safety-case-contract-v1.md`
- represented by `getActionSafetyCase` in `app-web/src/api/client.ts`
- typed by `ActionSafetyCaseResponse` and related interfaces in `app-web/src/api/contracts.ts`
- consumed inside the existing Safe Action Workspace, not a new workspace

The checker requires the frontend client marker and contract marker for this route family. This route is a bounded operator review assembly only; it does not authorize production actuation, safe-to-execute claims, ODL authority, or rollback device-restore proof.

## Adding Or Changing A Backend Route Family

When adding a backend route family:

1. Add or update the FastAPI router under `app-api/src/app_api/routers/`.
2. Register it in `app-api/src/app_api/api/v1/router.py`.
3. Add or update Pydantic schemas under `app-api/src/app_api/schemas/`.
4. Decide its WebUI posture:
   - product-facing route with typed `ApiClient` coverage
   - frontend source coverage outside `ApiClient`, such as download helpers
   - backend-only support route with explicit reason
5. Add a governance entry in `scripts/check-api-contract-drift.py`.
6. If product-facing, update `app-web/src/api/contracts.ts` and `app-web/src/api/client.ts`.
7. Add or update feature-level API modules under `app-web/src/features/` when a view consumes it.
8. Add backend and/or frontend tests appropriate to the change.
9. Run the focused contract drift check.

Do not change public API behavior only to satisfy the checker. The checker should describe product intent; it should not drive architecture shortcuts.

## Coverage Modes

The checker currently uses three coverage modes:

- `frontend_client`: expects markers in `app-web/src/api/client.ts` and response interfaces in `contracts.ts`.
- `frontend_source`: expects markers somewhere under `app-web/src/`, useful for download helpers that intentionally do not use `ApiClient`.
- `backend_only_allowlisted`: requires a reason and does not require frontend client/source markers.

Use `frontend_client` for normal product-facing JSON APIs.

Use `frontend_source` only for deliberate browser/download flows where `ApiClient` is not the local pattern, such as evidence export downloads.

Use `backend_only_allowlisted` sparingly.

## What This Checker Does Not Prove

The checker does not prove:

- response schema field-by-field equivalence
- runtime reachability
- OpenAPI correctness
- frontend rendering behavior
- semantic product truth
- safe-action or rollback execution correctness
- production readiness

It only prevents route-family coverage drift.

Runtime behavior remains verified through the packaged platform flow:

```bash
./scripts/build-images.sh
./scripts/prepare-odl-southbound-bridge.sh
clab deploy -t topology.clab.yml -c
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

## Current Focused Validation

For a contract-governance-only change, run:

```bash
python3 scripts/check-api-contract-drift.py
```

If the task also changes frontend code, use the approved Dockerized app-web Vitest path from `platform/INSTALLATION-INSTRUCTIONS.md`, scoped to the affected tests where possible.

If the task changes backend route behavior or schemas, use the approved Dockerized app-api pytest path or the full packaged runtime validation path, depending on blast radius.
