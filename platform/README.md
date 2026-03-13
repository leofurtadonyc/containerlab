# Platform

This directory contains the reusable platform project for this repository.

It is a peer project to the lab directories, not a child of any single lab. The initial practical target is the Nokia SR MPLS lab, but the platform is being designed from the start to remain Nokia-first without becoming Nokia-bound.

## What This Platform Is

This platform is intended to become a serious network control, observability, and workflow foundation that can integrate with one or more lab topologies.

At a high level, it is responsible for:

- collecting observed device state
- normalizing platform-facing inventory, topology, capability, and policy views
- exposing product APIs through a custom backend
- presenting operator workflows and product views through a custom WebUI
- delivering metrics and dashboards through Prometheus and Grafana
- using OpenDaylight only where bounded controller and protocol support is genuinely useful

## What This Platform Is Not

This platform is not:

- a subproject under a single lab folder
- a Grafana-only dashboard bundle
- an OpenDaylight-centric product
- a pile of one-off scripts
- a claim of finished multi-vendor parity

## Relationship To The Labs

The labs in this repository represent network scenarios.

The platform represents reusable product infrastructure that can observe, model, and later orchestrate across those scenarios.

That separation is intentional:

- labs define and run network topologies
- the platform defines and runs platform services
- labs can come and go without changing the basic platform shape
- the platform must not encode one lab as its permanent architecture

## Deployment Model

The platform is deployed as its own Containerlab topology.

That means:

- the platform topology lives under `platform/`
- lab topologies remain under `labs/`
- the platform and labs are started separately
- the default integration model is management-plane-first

The platform should be able to run alongside one or more lab topologies rather than being fused into a single combined deployment.

Custom platform services now build as local container images before topology deployment.

Run `./scripts/build-images.sh` from `platform/` before deploying `topology.clab.yml`.
After deployment, run `./scripts/verify-odl-auth.sh` from `platform/` to catch bounded ODL credential regressions before relying on the WebUI platform-health view.

## Architecture Direction

The platform is being built with clear component boundaries.

### `app-api`

The backend is the brain of the platform.

It owns normalized internal models, application logic, API contracts, future workflow orchestration, reconciliation logic, capability awareness, and durable application-state coordination.

### `app-web`

The WebUI is the operator-facing product.

It owns the product experience: views, navigation, workflow pages, history, and explanation surfaces. It consumes backend APIs and does not own business logic.

### `gnmi-collector`

The gNMI collector is the preferred observed-state collection path.

It is responsible for gathering device state, mapping vendor-specific data into platform-friendly normalized structures, and exposing metrics about collection health. Vendor-specific logic must stay behind adapter boundaries.

### `odl`

OpenDaylight is a bounded support component.

It may provide controller-side and protocol-side leverage for areas such as BGP-LS, BMP, PCEP, and related topology or policy-adjacent inputs. It is not the product brain, not the workflow engine, and not the global source of truth.
The local ODL image now includes a narrow startup-time credential rotation so the controller's bounded RESTCONF admin password actually matches the topology-configured `ODL_ADMIN_PASSWORD` value used by `app-api`.

### `prometheus`

Prometheus is the metrics and time-series layer.

It owns scraping, metric storage, recording rules, and alert rule evaluation. It must not become the application database or the source of durable business state.

### `grafana`

Grafana is the observability and dashboard layer.

It owns provisioned dashboards for platform health, topology visibility, SR policy visibility, change-validation visibility, and vendor-adapter visibility. It is not the primary workflow surface and it is not the product UI.

### `postgres`

Postgres is the durable application database.

It is intended to store platform state such as normalized records, workflow history, audit history, capability records, and other application data that should not live in Prometheus.

Current bounded reality:

- normalized inventory snapshots are now persisted
- normalized topology snapshots and sync-run history are now persisted
- normalized policy snapshots and bounded candidate-path records are now persisted
- workflow-history and audit-history currently derive from persisted sync-run activity rather than separate durable workflow or audit domains
- broader durable workflow, audit, and intent state remain partial or unimplemented
- the current topology now mounts host-backed Postgres, Prometheus, and Grafana data directories, but backup discipline, credential hardening, and broader durable workflow/audit state are still pending

## Vendor Strategy

The current architecture stance is:

- Nokia is the first practical focus
- Juniper is the first planned expansion
- broader vendor support may follow over time

The platform must therefore keep:

- vendor-neutral internal models
- explicit vendor adapter boundaries
- honest capability reporting
- no false claims of cross-vendor parity

## Current Status

The project is currently in `Phase 2 — read-only product foundation`.

Right now, the emphasis is on:

- repository structure
- service boundaries
- architecture documents
- topology skeletons
- provisioning skeletons
- backend, frontend, collector, and schema scaffolding
- honest distinction between durable read-side truth and transient read-side behavior

At this stage, contributors should assume:

- the architecture direction is defined
- the platform structure is established enough to support a read-only product foundation
- several services still expose bounded live slices and partial persistence rather than mature end-state behavior
- read-only visibility comes before advanced workflows
- broad action automation is intentionally deferred

## Current Vs Planned

### Current

- separate `platform/` project structure
- service directories and README skeletons
- documentation scaffolding
- dashboard folder structure and provisioning layout scaffolding, with an initial real platform dashboard
- schema and shared-directory scaffolding
- read-only inventory, topology, policy, capability, and platform status APIs
- read-only WebUI pages backed by stable backend contracts
- bounded Postgres-backed persistence for inventory, topology, and policy snapshots plus sync-run history

### Planned Later

- broader durable read-side persistence beyond the current inventory/topology/policy snapshot slice
- bounded ODL integration paths
- dry-run workflow support
- one narrowly scoped safe action workflow only after the read/validate foundation is solid

## Why This README Exists

This README exists to make the platform shape hard to misunderstand.

Future contributors should be able to tell immediately that:

- the platform is separate from the labs
- the backend is the brain
- the WebUI is the product
- Prometheus is the metrics layer
- Grafana is the observability layer
- ODL is bounded
- gNMI-first observed-state collection is a core principle
- the design is Nokia-first but prepared for later vendor expansion

## Additional Docs

Supporting documents live under `platform/docs/`:

- `docs/architecture.md`
- `docs/services.md`
- `docs/data-flows.md`
- `docs/dashboards.md`
- `docs/workflows.md`
- `docs/workflow-lifecycle-vocabulary.md`
- `docs/phase2-workflow-foundations.md`
- `docs/workflow-planning-gate.md`
- `docs/service-hardening-plan.md`
- `docs/vendors.md`
- `docs/roadmap.md`

Workflow-related conceptual contract docs also live under `platform/schemas/workflows/`.

That directory now includes lifecycle-adjacent design docs for:

- workflow entity modeling
- preview contracts
- diff contracts
- preview/diff semantics
- validation-result contracts
- blocker contracts
- validation/blocker semantics
- workflow audit relationship design
