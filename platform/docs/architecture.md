# Platform Architecture

## Purpose

This document describes the high-level platform architecture, deployment model, and major component boundaries for the current read-only foundation stage.

## Current Status

The platform now has:

- a separate platform repository structure
- a separate Containerlab topology for platform services
- service READMEs and topology scaffolding
- Prometheus and Grafana provisioning skeletons
- backend, collector, frontend, and database-direction scaffolding
- a first bounded persistence-backed read-side slice for inventory, topology, and policy snapshots

What remains incomplete:

- broad or deeper ODL-backed enrichment beyond the current bounded platform-health capability probe
- durable persistence for every intended product domain
- richer live-backed read-only domain APIs beyond the current health, platform status, devices, topology, policies, and capabilities slice
- deeper read-only product pages backed by more live operational evidence

This document therefore focuses on architectural shape and service boundaries rather than final implementation depth.

## Deployment Model

The platform is deployed separately from the labs.

That means:

- lab topologies live under `labs/`
- the platform topology lives under `platform/topology.clab.yml`
- labs and the platform are started independently
- the default integration model is management-plane-first

The platform is intended to observe and later orchestrate across labs without being embedded inside any single lab folder.

## Layer Model

### Network Plane

This is the actual lab topology:

- devices
- links
- routing and transport behavior
- SR-related forwarding behavior

### Controller And Protocol Plane

This is where ODL may help.

It is responsible only for bounded controller-side and protocol-side support where that support is genuinely useful.

### Observability Plane

This includes:

- `prometheus`
- `grafana`
- service metrics endpoints
- future exporters and alert rules

### Product And Orchestration Plane

This is centered on `app-api`.

It owns normalized product models, API contracts, durable-state coordination, and later workflow and reconciliation logic.

### Experience Plane

This is centered on `app-web`.

It owns the operator-facing product experience, not the underlying business logic.

## Component Roles

### `app-api`

The backend is the platform brain.

It owns:

- normalized model coordination
- durable state coordination with Postgres
- API contracts
- bounded integration with collector outputs
- bounded integration with ODL outputs

Current read-model reality:

- `/api/v1/devices` is backed by a bounded normalized live collector inventory path
- `/api/v1/topology` is backed by a backend-owned normalized live topology model that explicitly marks partial and unknown knowledge
- `/api/v1/policies` is backed by a backend-owned normalized live policy inventory model that explicitly marks support, observed, and unknown states
- live collector-backed reads remain the primary path for devices, topology, and policy
- inventory, topology, and policy snapshots are now persisted in Postgres along with sync-run records, and the API can fall back to the latest persisted normalized snapshot when the collector path is temporarily unavailable
- policy persistence remains intentionally bounded to normalized snapshot history and candidate-path records rather than a broader durable policy domain model
- workflow-history and audit-history remain bounded views derived from persisted sync-run activity rather than independently persisted workflow or audit domains
- backend metrics remain transient in-memory service state for Prometheus scraping; they are not durable application records
- these are stable product-owned contracts, but they remain bounded read-side slices rather than mature operational truth

### `app-web`

The WebUI is the product.

It owns:

- product navigation
- operator views
- API-driven presentation
- future workflow-oriented UX

It does not own business logic.

### `gnmi-collector`

The collector is the preferred observed-state engine.

It owns:

- gNMI collection
- vendor adapter boundaries for collection
- mapping from raw records into platform-friendly normalized forms
- collector metrics

### `postgres`

Postgres is the durable application data store.

It is for business and product state, not time-series metrics.

Current persistence boundary:

- normalized inventory snapshots are persisted
- normalized topology snapshots are persisted
- normalized policy snapshots and candidate-path records are persisted
- sync-run history for those persisted read-side writes is persisted
- workflow-history and audit-history are currently derived from persisted sync-run activity rather than separate workflow or audit tables
- workflow, audit, and broader intent/history domains are not yet independently persisted in this phase
- the current topology still lacks a host-mounted Postgres data directory, so persisted state is durable within the running deployment but not yet hardened across full reprovisioning

### `prometheus`

Prometheus is the metrics and time-series layer.

It scrapes service metrics and supports alerting and recording rules. It is not the application database.

### `grafana`

Grafana is the observability layer.

It provides dashboards and operational drilldowns. It is not the product UI and it must not absorb workflow or business logic.

### `odl`

ODL is a bounded helper, not the center of the system.

It may contribute:

- controller-side state
- future BGP-LS, BMP, or PCEP-related leverage
- useful protocol-adjacent inputs for the backend
- bounded controller capability discovery for the platform status path

It must not become:

- the product brain
- the workflow engine
- the normalized API layer
- the only source of truth

The backend remains responsible for deciding how ODL-derived records are translated and used.

## ODL Boundary

The ODL boundary is especially important.

The intended pattern is:

1. ODL exposes controller-side or protocol-side data.
2. `app-api` queries ODL through explicit integration modules.
3. `app-api` translates ODL-derived data into platform-friendly structures.
4. ODL-derived records are combined with other evidence rather than treated as the whole truth.

Current bounded reality:

- `app-api` now performs one small RESTCONF read against ODL's YANG library and operations inventory
- that controller result is normalized into platform-owned platform-status fields
- the enrichment is limited to controller reachability and capability hints; it does not replace collector-backed topology or policy views

This architecture preserves:

- backend ownership of business logic
- vendor-neutral product models
- flexibility to grow beyond ODL-centric thinking

## Core Architectural Rules

These boundaries remain non-negotiable:

- backend as brain
- WebUI as product
- Prometheus as metrics layer
- Grafana as observability layer
- Postgres as durable application data store
- gNMI-first observed-state collection
- ODL as bounded helper
- vendor-neutral product models
- vendor-specific behavior behind adapters

## Current Vs Future

### Current

- service topology exists
- runtime boundaries are documented
- backend and collector skeletons exist
- read-only devices, topology, policies, capabilities, and platform status APIs now exist as backend-owned normalized bounded live contracts
- useful read-only frontend pages now consume those stable backend contracts
- observability scaffolding exists
- database direction is established and bounded persistence is now real for inventory/topology/policy snapshots plus sync-run history
- ODL integration is documented and now implemented only as one bounded platform-health enrichment path

### Future

- richer live-backed read-only product APIs
- broader durable read-side coverage beyond the current inventory/topology/policy snapshot slice
- richer frontend read views backed by deeper backend data and future history-oriented endpoints
- bounded ODL-backed enrichment beyond the current platform-health probe where useful
- dry-run and validation flows later
- one safe bounded action workflow only after read/validate maturity
