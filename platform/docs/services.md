# Platform Services

## Purpose

This document describes the major platform services, what each one owns, what each one must not own, and how the services fit together in the current read-only foundation phase.

## Current Status

The platform now has service directories, service READMEs, a platform topology skeleton, a Prometheus and Grafana observability stack with provisioned dashboards, a backend and collector delivering bounded live read paths, bounded Postgres-backed read-side persistence for inventory, topology, and policy snapshots, and repo-built local runtime images for the initial service set.

The current runtime posture is no longer skeleton-only:

- all initial platform services now run as repo-built local images
- Postgres, Prometheus, and Grafana now have small startup validators that fail fast when the mounted runtime contract is broken
- `verify-core-runtime` and `verify-odl-auth` now provide bounded post-deploy verification for the current live stack

What still remains incomplete:

- deeper workflow and audit semantics beyond the current bounded sync-visibility product views
- deeper normalized shared model and schema implementation beyond the current scaffolding
- read-only domain APIs beyond the current health, platform status, devices, topology, policies, workflow history, audit history, and capabilities slice
- durable persistence for every intended product domain
- broader ODL-backed data handling beyond the current bounded platform-health probe

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

- FastAPI application with bounded read-only APIs
- typed health endpoint exists
- bounded HTTP request and latency metrics now exist at `/metrics`
- live bounded inventory, topology, and policy integrations now exist from the collector boundary into backend read paths
- `/api/v1/topology` and the topology row in `/api/v1/platform/status` now expose backend-owned endpoint-pairing posture plus paired-versus-single-sided inferred-link counts as bounded topology coverage semantics
- Alembic-managed persistence now exists for normalized inventory snapshots, normalized topology snapshots, normalized policy snapshots, candidate-path records, and sync-run history
- devices, topology, and policy can fall back to the latest persisted normalized snapshot when the collector boundary is temporarily unavailable
- workflow-history and audit-history currently expose bounded views derived from persisted sync-run activity rather than full workflow or audit tables
- `/api/v1/platform/status` now includes one bounded ODL-backed controller capability probe derived from RESTCONF YANG-library and operations discovery, while the backend remains the owner of the normalized product response
- `/api/v1/capabilities` now exposes a bounded capability matrix that makes supported, partially-supported, unknown, and not-implemented states explicit across the current Nokia-first read-only product slice without implying Juniper parity
- **week 27:** **`GET /api/v1/policies/{policy_id}/path-analysis`** (**`path_analysis_phase2_v1`**) assembles bounded path hints from existing policy/topology/inventory signals—**not** dataplane or controller path authority; **`GET /api/v1/topology/objects/{object_id}/related-policies`** and **`GET /api/v1/policies/{policy_id}/topology-impact`** implement the topology↔policy **string-equality** pivots documented in `topology-related-policies-contract.md`—**not** graph impact simulation; each **`PolicyRecord`** includes **`degraded_policy_v1`** per `degraded-policy-v1-contract.md`—bounded classification from normalized fields, **not** SLA or validation verdicts
- **week 28:** **`GET /api/v1/topology/objects/{object_id}/failure-impact`** (**`failure_impact_v1`**, `failure-impact-contract.md`) rolls up related-policy counts, **`degraded_policy_v1`** posture breakdown scoped to that related set, and path-analysis support tallies from existing read-side evidence—**not** blast-radius simulation, **not** dependency truth; **WebUI** **Topology** exposes **`TopologyFailureImpactPanel`** beside related policies when a node or link is selected

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
- bounded live inventory, topology, and policy snapshot delivery now exists for `app-api`
- bounded inventory, topology, and policy collection and backend-readiness metrics now exist at `/metrics`
- topology snapshot delivery and topology metrics now also expose explicit endpoint-pairing posture plus paired-versus-single-sided inferred-link counts for the current bounded inference path
- Nokia-first adapter path exists
- mapping and config scaffolding exist
- the **Vendor / adapter** Grafana dashboard (`vendor-overview`; **Nokia-first**, folder name organizational only) surfaces a bounded subset of **`platform_gnmi_collector_*`** and related **`app-api`** collector-boundary metrics (duration, timeout budget, posture, alongside collector ages and topology/policy gauges) for observability only; see **`platform/docs/dashboards.md`** (Vendor) for scope and non-claims

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
- Alembic ownership lives in `app-api`
- the first bounded persisted schema now exists for inventory snapshots, topology snapshots, policy snapshots, candidate-path records, and sync-run records
- the current topology now uses a repo-built local Postgres image plus a host-backed data directory, and the startup path validates the env and mount contract before delegating to the upstream database runtime

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
- the current topology now runs a repo-built local Prometheus image that validates the mounted config and TSDB path before startup
- `verify-core-runtime` now checks Prometheus readiness and discovery of the currently real scrape targets after deploy or reconfigure

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
- real platform, topology, and SR policy dashboards now exist for current `app-api`, `gnmi-collector`, and Prometheus-backed observability
- those dashboards now surface richer current evidence such as sync freshness, persisted sync results, topology agreement signals, bounded persisted policy sync evidence, and honest live-empty policy context where available
- the topology and platform overview dashboards now also surface paired-link counts, single-sided-link counts, derived shares, and backend-owned topology pairing-posture labels projected from metrics only, while keeping Grafana observability-only
- the current topology now runs a repo-built local Grafana image that validates provisioning and writable data-path mounts before startup
- `verify-core-runtime` now checks Grafana API health, Prometheus datasource provisioning, and provisioned overview dashboard discovery after deploy or reconfigure
- placeholder dashboards still exist for the remaining required dashboard families

### `odl`

Role:

- bounded controller-side and protocol-side **helper** component (`app-api` pulls; ODL does not push product APIs)

What it owns:

- future controller-side integration where ODL adds real value (still **backend-mediated**)
- future BGP-LS, BMP, and PCEP-related support areas (not implied by the current probe)

What it must not own:

- platform business logic
- workflow ownership
- product APIs
- normalized product truth by itself
- **default** authority for SR topology or policy correctness (collector-backed read models remain primary for those slices today)

Current state:

- topology-level service presence exists
- README and runtime boundary documentation exist
- **one** bounded RESTCONF-backed controller capability probe exists for the Platform Health path (reachability + capability hints; not controller-owned topology or policy truth)
- broader topology, policy, and workflow-oriented controller integration remains intentionally out of scope

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
- useful read-only pages now exist for overview, platform health, devices, topology, policies, workflow history, audit history, and capabilities
- a typed API client layer now consumes stable backend contracts
- topology, Overview, and Platform Health now surface backend-owned endpoint-pairing posture and paired-versus-single-sided inferred-link counts as bounded topology trust cues without turning the WebUI into a validation surface
- workflow and audit views now surface bounded platform-side sync visibility rather than remaining placeholders
- **week 27:** **Policies** detail includes **Path analysis** and **Topology impact** panels; **Topology** and **Devices** include **related policies** where object ids align; **Overview** / **Platform Health** include degraded-policy v1 drill-downs; **Investigation** supports optional **`inv_from`** breadcrumb context— all **read-only** product consumption of the same **`app-api`** contracts; Grafana does not implement these surfaces (see `dashboards.md`)

## Service Relationship Summary

At a high level:

- `gnmi-collector` observes device state
- `app-api` becomes the product brain and contract layer
- `postgres` persists durable application data
- `prometheus` stores metrics
- `grafana` visualizes observability data
- `odl` contributes bounded controller-side **inputs** where useful; those inputs are optional enrichment—**not** the product brain
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
- runtime packaging now includes repo-built local images for all initial services, with bounded startup validation for the currently most important stateful services
- backend and collector skeletons exist
- backend read-only APIs and frontend read-only pages now exist as a useful initial product slice
- observability scaffolding exists
- live collector-to-backend read delivery is real for the current bounded slices
- database direction is explicit and partially implemented, with host-backed Postgres persistence and bounded post-deploy runtime verification now in place

### Future

- richer backend domain modules
- shared normalized model families
- broader durable domain persistence
- workflow and audit-oriented frontend views
- bounded ODL-backed enrichment where useful
- later workflow and validation logic
