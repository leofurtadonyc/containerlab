# Platform Services

## Purpose

This document describes the major platform services, what each one owns, what each one must not own, and how the services fit together in the current Phase 1 architecture.

## Current Status

The platform now has service directories, service READMEs, a platform topology skeleton, observability scaffolding, a backend skeleton, a collector skeleton, and Postgres migration direction.

What still remains incomplete:

- the frontend application skeleton
- normalized shared model and schema scaffolding
- read-only domain APIs beyond health
- real collector-to-backend delivery
- bounded ODL-backed data handling

This document therefore focuses on boundaries and intended roles more than deep implementation detail.

## Service Set

The initial platform service set is:

- `odl`
- `prometheus`
- `grafana`
- `postgres`
- `gnmi-collector`
- `app-api`
- `app-web`

These services are deployed as part of the platform topology under `platform/`, separate from any lab topology.

## Service Boundaries

### `app-api`

Role:

- the platform brain
- owner of application logic
- owner of product-facing APIs
- owner of normalized internal model coordination
- owner of durable state coordination with Postgres

What it owns:

- versioned REST APIs
- health and metrics exposure for the backend
- integration boundaries to collector outputs
- bounded integration boundaries to ODL
- future workflow, audit, and reconciliation logic

What it must not own:

- direct device collection
- protocol-controller duties that belong to ODL
- dashboard rendering
- frontend interaction logic

Current state:

- FastAPI skeleton exists
- typed health endpoint exists
- placeholder metrics endpoint exists
- Alembic scaffolding exists

### `gnmi-collector`

Role:

- gNMI-first observed-state engine
- source of normalized collection inputs for the backend
- owner of vendor adapter boundaries for collection

What it owns:

- device collection over gNMI
- vendor-specific collection adapters
- raw-to-normalized mapping stages
- collector metrics exposure

What it must not own:

- durable application state
- business logic
- workflow decisions
- Grafana dashboards

Current state:

- Python skeleton exists
- metrics placeholder exists
- Nokia-first adapter placeholder exists
- mapping and config scaffolding exist

### `postgres`

Role:

- durable application data store

What it owns:

- persistent application-state direction
- future storage for inventory, topology, policy, workflow, audit, and capability records

What it must not own:

- metrics storage
- raw telemetry as the main design
- direct product logic

Current state:

- init SQL bootstrap exists
- migration direction is documented
- Alembic scaffolding is owned by `app-api`

### `prometheus`

Role:

- metrics and time-series engine

What it owns:

- scrape configuration
- recording rules
- alert-rule evaluation
- time-series retention

What it must not own:

- durable business state
- workflow history
- topology inventory as product truth

Current state:

- `prometheus.yml` exists
- `rules/`, `recording-rules/`, and data directory scaffolding exist

### `grafana`

Role:

- observability and dashboard layer

What it owns:

- provisioned datasources
- provisioned dashboards
- observability drilldowns
- dashboard family organization

What it must not own:

- product navigation
- workflow actions
- approvals
- durable application data

Current state:

- datasource provisioning exists
- dashboard provisioning exists
- placeholder dashboards exist for all required dashboard families

### `odl`

Role:

- bounded controller-side and protocol-side support component

What it owns:

- future controller-side integration where ODL adds real value
- future BGP-LS, BMP, and PCEP-related support areas

What it must not own:

- platform business logic
- workflow ownership
- product APIs
- normalized product truth by itself

Current state:

- topology-level service presence exists
- README and runtime boundary documentation exist
- no substantive integration module is implemented yet

### `app-web`

Role:

- operator-facing product UI

What it owns:

- product pages
- navigation
- API client behavior
- capability-aware presentation

What it must not own:

- business logic
- direct database access
- direct collector integration
- Grafana responsibilities

Current state:

- service directory and README exist
- implementation skeleton is still pending

## Service Relationship Summary

At a high level:

- `gnmi-collector` observes device state
- `app-api` becomes the product brain and contract layer
- `postgres` persists durable application data
- `prometheus` stores metrics
- `grafana` visualizes observability data
- `odl` contributes bounded controller-side inputs where useful
- `app-web` becomes the operator-facing experience

## Boundary Rules To Preserve

The following boundaries are non-negotiable:

- `app-api` remains the brain
- `app-web` remains the product
- `gnmi-collector` remains the preferred observed-state collection path
- `prometheus` remains metrics-only
- `grafana` remains observability-only
- `postgres` remains durable application storage
- `odl` remains bounded

## Current Vs Future

### Current

- service topology is defined
- runtime expectations are documented
- backend and collector skeletons exist
- observability scaffolding exists
- database direction is explicit

### Future

- richer backend domain modules
- shared normalized model families
- real collector-to-backend delivery
- frontend product skeleton and read-only pages
- bounded ODL-backed enrichment where useful
- later workflow and validation logic
