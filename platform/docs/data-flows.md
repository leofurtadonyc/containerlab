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

- real collector-to-backend ingestion
- read-only inventory or topology APIs beyond health
- real frontend pages
- substantive ODL integration logic

This document therefore explains the intended Phase 1 flow direction honestly, including which paths are only scaffolded today.

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
- delivery to `app-api` is still a placeholder

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
- frontend implementation is still pending

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
- metrics endpoints currently exist only as placeholders in the backend and collector skeletons

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
- real domain persistence logic is still pending

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
- observability scaffolding exists
- persistence direction is explicit

### Future

- real normalized ingestion from collector to backend
- backend persistence of inventory, topology, and policy-oriented records
- read-only frontend product pages
- ODL-backed enrichment where justified
- later dry-run and workflow-related data paths
