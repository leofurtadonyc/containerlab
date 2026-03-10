# Platform Data Flows

## Purpose

This document describes the major data flows in the platform and the boundaries that shape them.

The goal is to make it clear:

- how the platform integrates with lab topologies
- how observed state is expected to move through the system
- how product APIs and UI flows are separated from observability flows
- where ODL fits without taking over the architecture

## Current Status

The current repository state includes:

- a separate platform topology
- a backend skeleton
- a collector skeleton
- Prometheus and Grafana scaffolding
- Postgres bootstrap and migration direction

It does not yet include:

- durable persistence for every intended product domain
- workflow and audit-oriented frontend views beyond the current read-only product pages
- substantive ODL integration logic

This document therefore explains the current flow direction honestly, including which paths are useful today and which remain scaffolded.

## Persisted Vs Transient

At the current stage, the platform uses both durable and transient read-side behavior.

Persisted today:

- normalized inventory snapshots written by `app-api` to Postgres
- normalized topology snapshots, node records, and link records written by `app-api` to Postgres
- sync-run records for those bounded inventory and topology persistence writes

Transient today:

- live collector responses fetched over HTTP from `gnmi-collector`
- policy inventory served from the current bounded live collector slice
- in-memory metrics caches inside `app-api` and `gnmi-collector`
- frontend UI state in `app-web`

Important current limitation:

- the Postgres service does not yet have a host-mounted data directory in the current topology, so persisted state survives normal in-deployment reads and fallback behavior, but it is not yet hardened across full reprovisioning of the platform lab

## Deployment And Integration Model

The platform and the labs are deployed separately.

The default integration model is management-plane-first:

- lab devices expose management reachability
- platform services connect over that management path
- no direct data-plane coupling is assumed
- no lab-specific direct wiring is treated as the default design

This keeps the platform reusable across multiple lab scenarios.

## Core Flow Categories

The main platform flow categories are:

- collector-to-backend observed-state flow
- backend-to-frontend product flow
- metrics flow
- bounded ODL integration flow
- database persistence flow

## Collector To Backend Flow

This is the primary observed-state path for the platform.

Intended flow:

1. `gnmi-collector` connects to devices over gNMI on the management plane.
2. Vendor-specific collection logic runs inside named adapter boundaries.
3. Raw records are mapped into normalized platform-friendly shapes.
4. The collector delivers normalized outputs to `app-api` through a bounded integration path.
5. `app-api` becomes responsible for product-facing interpretation and future persistence decisions.

Boundary rules:

- raw vendor payloads must not become the product API
- adapter logic must stay inside the collector or explicit backend integration boundaries
- the collector does not become the product brain

Current state:

- collector package structure exists
- adapter and mapping scaffolding exist
- narrow normalized inventory, topology, and policy delivery shapes now exist between the collector and the backend
- live transport from the collector process into `app-api` now exists for those bounded read-side slices

## Backend To Frontend Flow

This is the primary product flow.

Intended flow:

1. `app-api` exposes versioned APIs.
2. `app-web` consumes those APIs.
3. The frontend renders product pages, navigation, and operator-facing views.
4. Business logic stays in `app-api`, not in the frontend.

Boundary rules:

- `app-web` does not talk directly to Postgres
- `app-web` does not talk directly to `gnmi-collector`
- `app-web` does not talk directly to ODL
- the frontend is API-driven

Current state:

- backend health and metrics endpoints exist
- versioned read-only inventory, topology, policy, capability, and platform status endpoints now exist as bounded live product contracts
- the current inventory API is fed by a bounded normalized live collector contract
- the current topology API is fed by a backend-owned normalized live read model that explicitly marks partial and unknown state
- the current policy API is fed by a backend-owned normalized live read model that explicitly marks support, observed, and unknown state
- inventory and topology may be served from the latest persisted normalized snapshot if the live collector boundary is temporarily unavailable
- policy remains a transient read-side view at the backend boundary today and is not yet backed by Postgres persistence
- useful frontend read-only pages now consume those stable contracts for overview, platform health, devices, topology, policies, and capabilities

## Topology Read-Model Limitations

The current topology read model is intentionally conservative.

What is real today:

- the topology API returns a stable platform-owned structure for nodes, links, source, sync status, completeness, timestamps, and notes
- partial and unknown states are explicit in the contract
- the backend owns the read model rather than exposing collector or controller-native shapes
- the backend now persists bounded normalized topology snapshots and can fall back to the latest persisted snapshot when live collection is unavailable

What remains partial:

- the topology does not yet represent full adjacency discovery
- the graph remains a bounded live slice rather than comprehensive operational truth
- persisted topology support is intentionally limited to normalized snapshot history rather than a final topology database design

## Policy Read-Model Limitations

The current policy read model is also intentionally conservative.

What is real today:

- the policies API returns a stable platform-owned structure for policy inventory
- intended, observed, support, and health states are explicit
- candidate paths are represented in a normalized form rather than as vendor-native payloads
- the backend exposes current live policy observations, but it does not yet persist policy inventory to Postgres

What remains partial:

- the policy inventory is backed only by a bounded live SR policy counter slice rather than full per-policy or controller-derived state
- support states such as `unknown` and `not_implemented_in_platform` are expected and honest in the current phase
- candidate path data remains absent or bounded rather than validated operational path computation
- no policy details, editing, validation, or workflow execution flows exist yet

## Metrics Flow

This is the observability flow, not the product data flow.

Intended flow:

1. platform services expose `/metrics` endpoints where appropriate
2. `prometheus` scrapes those endpoints
3. Prometheus stores and evaluates time-series data
4. `grafana` queries Prometheus
5. Grafana presents dashboard views and observability drilldowns

Expected metric sources over time:

- `app-api`
- `gnmi-collector`
- ODL where useful
- Prometheus itself
- Grafana where useful
- future exporters such as a Postgres exporter

Boundary rules:

- Prometheus is not the application database
- Grafana is not the product UI
- observability data must not replace normalized product models

Current state:

- Prometheus scrape configuration exists
- Grafana provisioning exists
- placeholder dashboard families exist
- `app-api` now exposes bounded HTTP request and latency metrics
- `gnmi-collector` now exposes bounded inventory collection, normalization, and backend-readiness metrics
- Prometheus should actively scrape only the currently real service metrics targets and keep the remaining service targets documented as future placeholders

## ODL Integration Flow

ODL is a bounded input path, not the system center.

Intended flow:

1. ODL collects or exposes controller-side state where it adds genuine value.
2. `app-api` queries ODL through explicit integration modules.
3. ODL-derived records are translated into internal platform-friendly structures.
4. ODL becomes one observed input among several, not the only truth source.

Boundary rules:

- ODL does not own product APIs
- ODL does not own workflow logic
- ODL does not replace collector-based observed state
- ODL outputs must not leak directly into product contracts

Current state:

- service presence and topology-level role exist
- substantive integration code is still pending

## Database Persistence Flow

Postgres is the durable application-state path.

Intended flow:

1. `app-api` decides what durable records should exist.
2. `app-api` persists those records to Postgres.
3. Alembic migrations evolve the schema over time.

Boundary rules:

- Postgres is not the metrics store
- the collector does not write durable product state directly to Postgres
- Grafana and Prometheus do not become persistence owners for business records

Current state:

- init SQL bootstrap exists
- Alembic scaffolding exists
- the backend now persists bounded normalized inventory snapshots, normalized topology snapshots, and sync-run records
- devices and topology can fall back to the latest persisted normalized snapshot if the live collector boundary is temporarily unavailable
- the current persisted slice is deployment-local because the topology has not yet added a host-mounted Postgres data directory
- policy inventory, workflow history, audit history, and broader intent models remain transient or unimplemented rather than durably stored
- broader domain persistence logic is still pending

## Flow Summary By Consumer

### For product views

- source of truth direction: `app-api`
- durable state direction: `postgres`
- UI consumer: `app-web`

### For observability

- metrics source direction: service `/metrics` endpoints
- time-series store: `prometheus`
- dashboard consumer: `grafana`

### For controller-side enrichment

- bounded protocol/controller component: `odl`
- consuming service: `app-api`

## Current Vs Future

### Current

- flow directions are documented
- platform topology and service boundaries exist
- backend and collector skeleton endpoints exist
- bounded normalized inventory, topology, and policy integrations now connect the collector shape to the backend read paths
- backend-owned normalized topology and policy read models now exist as stable live API slices with explicit partial and unknown states
- observability scaffolding exists
- bounded persistence direction is explicit and now partially implemented for inventory and topology snapshots, while policy remains transient at the current read-side boundary

### Future

- backend persistence of inventory, topology, and policy-oriented records
- harder durability across full platform reprovisioning
- richer frontend product pages for workflow history, audit history, and deeper read-oriented exploration
- ODL-backed enrichment where justified
- later dry-run and workflow-related data paths
