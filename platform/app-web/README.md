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
- image: `node:22-alpine` in the current topology skeleton, pending a service-specific Dockerfile
- ports: 8088 for the published WebUI endpoint
- env vars: `APP_WEB_PORT` and `VITE_APP_API_BASE_URL` placeholders in the current topology skeleton
- mounts: `./app-web:/app`
- persistence: none — stateless frontend
- dependencies: `app-api`

## Integration points
- consumes `app-api` REST endpoints exclusively
- does not talk to Prometheus, Postgres, ODL, or the gNMI collector directly

## Current status
Initial frontend skeleton exists with a Vite + React + TypeScript scaffold, a feature-oriented `src/` layout, an API client placeholder, and placeholder product views for overview, devices, topology, policies, workflows, audit, capabilities, and platform health.

## Planned evolution
- richer read-oriented pages backed by real backend APIs
- stronger API client and route structure for a real product UI
- later workflow-oriented views only after the read-only foundation is solid

## Notes and caveats
`app-web` is the product. Grafana is for observability. Do not duplicate dashboard logic in the WebUI and do not build product workflows into Grafana.
