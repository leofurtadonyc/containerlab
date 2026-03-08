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
- ports: 8000 for the versioned API; metrics exposure details are TBD
- env vars: `API_PORT`, `DATABASE_URL`, `ODL_URL`, and `PROMETHEUS_URL` placeholders in the current topology skeleton
- mounts: `./app-api:/app`, `./shared:/app/shared`, `./schemas:/app/schemas`
- persistence: uses Postgres
- dependencies: Postgres, `gnmi-collector`, and optional ODL integration

## Integration points
- receives normalized state pushes from `gnmi-collector`
- queries ODL for SR topology/policy data
- serves versioned REST API to `app-web`
- exposes `/metrics` for Prometheus

## Current status
Initial backend skeleton exists with a FastAPI application entrypoint, a versioned `/api/v1/...` route structure, typed read-only `/api/v1/health`, `/api/v1/platform/status`, `/api/v1/devices`, `/api/v1/topology`, `/api/v1/policies`, and `/api/v1/capabilities` endpoints, consistent error response scaffolding, a bounded collector inventory integration placeholder feeding the devices read path through normalized inventory-shaped records, a backend-owned normalized topology read model feeding the topology API with explicit partial and unknown states, a backend-owned normalized policy inventory read model feeding the policies API with explicit support and unknown states, bounded in-memory HTTP request and latency metrics at `/metrics`, package structure for routers, services, repositories, models, schemas, integrations, adapters, metrics, and config, plus Alembic migration scaffolding for future schema evolution and a bounded ODL integration skeleton location.

## Planned evolution
- refine read-only inventory, topology, capability, and policy-oriented APIs from current scaffolds into deeper collector-backed, controller-backed, and model-backed endpoints
- normalized internal model and schema scaffolding
- bounded ODL integration module

## Notes and caveats
The backend is the only service that writes to Postgres. Keep it as the single source of truth for application state.
The current topology and policy read models are intentionally honest scaffolds: they provide stable product-owned contracts, but they do not yet claim live operational completeness, deep path computation, or workflow-grade policy semantics.
