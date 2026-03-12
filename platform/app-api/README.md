# app-api (Backend)

## Purpose
The platform brain. Owns all business logic, application state coordination, vendor-neutral model management, workflow orchestration, and the REST API consumed by the WebUI.

## Why it exists
The platform requires a single authoritative source of business logic. The backend owns that role and prevents business concerns from leaking into the collector, ODL, or the WebUI.

## What it owns
- REST API for the WebUI and external consumers
- business logic and orchestration
- normalized model management
- Postgres writes and reads
- ODL integration adapter
- workflow and validation logic (future phases)
- audit and event log
- Prometheus metrics endpoint

## What it does not own
- gNMI collection (that is `gnmi-collector`)
- protocol-layer signaling (that is ODL)
- dashboard rendering (that is Grafana)
- operator UI (that is `app-web`)

## Runtime details
- image: `python:3.12-slim` in the current topology skeleton, pending a service-specific Dockerfile
- startup: the current topology bootstraps dependencies at container start, applies Alembic migrations, warms the bounded read-side cache, and runs `uvicorn app_api.main:app` from the mounted source tree until a service Dockerfile exists
- ports: 8000 for the versioned API and `/metrics`
- env vars: `API_PORT`, `DATABASE_URL`, `ODL_URL`, `ODL_USERNAME`, `ODL_PASSWORD`, `ODL_TIMEOUT_SECONDS`, and `PROMETHEUS_URL` placeholders in the current topology skeleton
- mounts: `./app-api:/app`, `./shared:/app/shared`, `./schemas:/app/schemas`
- persistence: writes bounded normalized inventory, topology, and policy snapshots, bounded policy candidate-path records, and sync-run records to Postgres
- dependencies: Postgres, `gnmi-collector`, and optional ODL integration

## Integration points
- receives normalized state pushes from `gnmi-collector`
- queries ODL for SR topology/policy data
- serves versioned REST API to `app-web`
- exposes `/metrics` for Prometheus

## Current status
Initial backend skeleton exists with a FastAPI application entrypoint, a versioned `/api/v1/...` route structure, typed read-only `/api/v1/health`, `/api/v1/platform/status`, `/api/v1/devices`, `/api/v1/topology`, `/api/v1/policies`, and `/api/v1/capabilities` endpoints, consistent error response scaffolding, live bounded collector-backed inventory, topology, and policy read paths, one bounded ODL-backed platform-status enrichment path, a more operational capability matrix that now distinguishes current supported, partially-supported, unknown, and not-implemented states across the delivered Nokia-first read-only slice, bounded in-memory HTTP request and latency metrics at `/metrics`, package structure for routers, services, repositories, models, schemas, integrations, adapters, metrics, and config, plus the first real Alembic-managed persistence slice for normalized inventory snapshots, normalized topology snapshots, normalized policy snapshots, bounded policy candidate-path records, and sync-run history.

Current comparison-friendly API reality:

- `/api/v1/devices` now distinguishes live collector reads, persisted fallback inventory reads, and bounded current-versus-latest-persisted inventory comparison when the backend has both sources available
- `/api/v1/topology` now distinguishes live collector reads, persisted fallback topology reads, inferred topology evidence, and bounded current-versus-latest-persisted topology comparison where persisted support exists
- `/api/v1/policies` now distinguishes live collector reads, persisted fallback policy reads, bounded current-versus-latest-persisted policy comparison, and bounded persisted-versus-previous policy snapshot comparison support
- `/api/v1/workflow-history` and `/api/v1/audit-history` now expose bounded persisted snapshot context and immediate previous-snapshot comparison evidence for inventory, topology, and policy where those sync-derived records exist
- those comparison views are explanatory read models only; they are not drift decisions, validation outcomes, or action recommendations

## Planned evolution
- refine read-only inventory, topology, capability, and policy-oriented APIs from current scaffolds into deeper collector-backed, controller-backed, and model-backed endpoints
- deepen the bounded persistence layer from the initial inventory/topology snapshot slice into broader read-side and intent history where justified
- bounded ODL integration module

## Notes and caveats
The backend is the only service that writes to Postgres. Keep it as the single source of truth for application state.
The current inventory, topology, and policy read models are intentionally bounded and honest: they provide stable product-owned contracts, but they do not yet claim live operational completeness, deep path computation, intended-state reconciliation, or workflow-grade policy semantics.
Inventory, topology, and policy now persist normalized snapshot records and sync-run history in Postgres, and the API may fall back to the latest persisted snapshot when the live collector path is temporarily unavailable.
Live collector-backed reads remain the primary source for current observed state; persistence strengthens bounded fallback behavior and sync-derived history rather than replacing those live reads.
Serving-mode fields explain whether the current response is live-backed, persisted fallback, or effectively empty because neither live nor persisted state is available.
Comparison summaries explain bounded normalized current-versus-persisted or persisted-versus-previous differences only where the backend already has the necessary persisted evidence.
Topology may still include inferred truth within the current normalized slice, especially for link interpretation, while workflow-history and audit-history may label sync-derived evidence as recent, aging, stale, or unavailable in the product view without claiming a verified network mismatch.
The current backend metrics path remains transient and in-memory for scrape safety. Those metrics are observability signals, not durable product records.
The current ODL enrichment is intentionally narrow: the backend probes bounded RESTCONF capability signals for platform health, but ODL still does not own topology truth, policy truth, or workflow logic.
The current capability matrix is still intentionally bounded: it reflects the delivered Nokia-first read-only product slice and planned Juniper direction, not full multi-vendor parity or deep per-version capability discovery.
Workflow-history and audit-history are currently bounded views derived from persisted sync-run activity, not separate durable workflow or user-action audit domains.
The current topology does not yet mount a host-backed Postgres data directory, so persisted read-side state is durable within the running deployment but not yet hardened across full platform reprovisioning.
