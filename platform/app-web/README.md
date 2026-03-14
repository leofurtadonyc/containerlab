# app-web (WebUI)

## Purpose
The operator-facing product interface. It is intended to provide the platform's device, topology, policy, workflow, audit, and health views by consuming the `app-api` REST API.

## Why it exists
Operators need a product UI that is purpose-built for network operations workflows. Grafana provides observability dashboards; `app-web` provides the product experience with actions, workflows, and structured views.

## What it owns
- all operator-facing product pages and interactions
- feature-oriented frontend structure
- API client layer (`app-api` only)
- UI state management

## What it does not own
- business logic (that is `app-api`)
- dashboard rendering (that is Grafana)
- application state persistence
- any direct database or gNMI access

## Runtime details
- image: `platform-app-web:0.1.0`, built from the local service Dockerfile
- startup: the packaged runtime now validates that the built frontend assets exist, validates the Nginx config, and then serves the production Vite build through Nginx while proxying `/api` requests to `app-api`
- ports: 8088 for the published WebUI endpoint
- env vars: none required in the packaged topology runtime; `VITE_APP_API_BASE_URL` remains available for development builds
- mounts: none required for the packaged runtime
- persistence: none — stateless frontend
- dependencies: `app-api`

## Integration points
- consumes `app-api` REST endpoints exclusively
- does not talk to Prometheus, Postgres, ODL, or the gNMI collector directly

## Current status
The frontend now has a Vite + React + TypeScript scaffold, a feature-oriented `src/` layout, a typed API client layer for stable read-only backend contracts, and useful read-oriented product pages for overview, platform health, devices, topology, policies, workflow history, audit history, and capabilities. Those pages handle loading, error, empty, partial, and unsupported-support states explicitly, while execution workflow controls and richer audit semantics remain out of scope for the current phase.

## Planned evolution
- richer read-oriented pages backed by deeper backend APIs as those contracts become real
- stronger route structure and shared UI primitives for a fuller product experience
- later workflow-oriented views only after the read-only foundation is solid

## Notes and caveats
`app-web` is the product. Grafana is for observability. Do not duplicate dashboard logic in the WebUI and do not build product workflows into Grafana.
The packaged runtime is now stricter about local startup validation and container health visibility, but it is still bootstrap-grade in broader platform terms: it remains a single Nginx-served static build without TLS termination, runtime config reload orchestration, or broader frontend-serving hardening.
