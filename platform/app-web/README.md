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
The frontend now has a Vite + React + TypeScript scaffold, a feature-oriented `src/` layout, a typed API client layer for stable read-only backend contracts, and useful read-oriented product pages for overview, platform health, devices, topology, policies, workflow history, audit history, and capabilities. Those pages handle loading, error, empty, partial, unsupported-support, and mixed-version states explicitly, while execution workflow controls and richer audit semantics remain out of scope for the current phase.

Current load-strategy posture:

- the Overview page now starts its core product queries (`devices`, `topology`, `policies`, `platform/status`, `capabilities`) in parallel rather than chaining them behind one another
- cockpit-only secondary previews such as delta digest, evidence consistency, stability, and evidence quality still remain gated behind the core-slice readiness posture so the heavier composed assemblies do not delay the first usable Overview render
- refresh of Overview slices should stay parallel for independent API calls; do not reintroduce serial query gating for unrelated read-only slices unless a later contract creates a real dependency

## Planned evolution
- richer read-oriented pages backed by deeper backend APIs as those contracts become real
- stronger route structure and shared UI primitives for a fuller product experience
- later workflow-oriented views only after the read-only foundation is solid

## Notes and caveats
`app-web` is the product. Grafana is for observability. Do not duplicate dashboard logic in the WebUI and do not build product workflows into Grafana.
The packaged runtime is now stricter about local startup validation and container health visibility, but it is still bootstrap-grade in broader platform terms: it remains a single Nginx-served static build without TLS termination, runtime config reload orchestration, or broader frontend-serving hardening.
Readiness trust cues stay bounded: the persisted readiness snapshot anchor is the strongest stable reference for that response, while any per-item readiness identifiers are optional descriptive cues only and must not be treated as workflow handles or execution objects.
Capability trust cues stay bounded as well: the capabilities page now treats the existing vendor-platform-domain-feature tuple, plus version scope when present, as the current UI identity posture for a capability record. That helps operators distinguish version-scoped records without implying a stronger backend capability-item ID contract.
Device capability posture remains intentionally coarser than the capabilities matrix. The devices page shows bounded support summaries only, while delivery tier, evidence basis, roadmap posture, and future-vendor direction remain explained on the dedicated capabilities page.
Independent product queries should stay independent in the WebUI. Serializing unrelated backend calls in the shell or Overview layer makes the UI look broken under bounded slow-read conditions and can hide whether the underlying issue is backend latency, collector timeout posture, or a genuine page-specific failure.
