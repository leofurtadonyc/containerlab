# Platform Architecture

## Purpose

This document describes the high-level platform architecture, deployment model, and major component boundaries for the current read-only foundation stage.

## Current Status

The platform now has:

- a separate platform repository structure
- a separate Containerlab topology for platform services
- service READMEs and topology scaffolding
- Prometheus and Grafana with repo-managed provisioning, real overview dashboards, and bounded startup validation
- backend, collector, and frontend implementing bounded live read paths and WebUI surfaces; Postgres-backed persistence for the current read-side slice
- a bounded persistence-backed read-side slice for inventory, topology, and policy snapshots plus sync-run and readiness-support history
- repo-built local images for all initial platform services, with the current runtime-hardening slice now adding bounded startup validation for Postgres, Prometheus, and Grafana plus ODL credential provisioning
- bounded post-deploy verification scripts for the core runtime contract and the ODL credential path

What remains incomplete:

- broad or deeper ODL-backed enrichment beyond the current bounded platform-health capability probe
- durable persistence for every intended product domain
- richer live-backed read-only domain APIs beyond the current health, platform status, devices, topology, policies, capabilities, workflow-history, and audit-history slice
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
- `/api/v1/topology` and `/api/v1/platform/status` now also expose bounded endpoint-pairing posture plus paired-versus-single-sided inferred-link counts so operators can interpret topology coverage depth without treating that slice as full topology truth
- `/api/v1/policies` is backed by a backend-owned normalized live policy inventory model that explicitly marks support, observed, and unknown states
- live collector-backed reads remain the primary path for devices, topology, and policy
- inventory, topology, and policy snapshots are now persisted in Postgres along with sync-run records, and the API can fall back to the latest persisted normalized snapshot when the collector path is temporarily unavailable
- `/api/v1/devices`, `/api/v1/topology`, and `/api/v1/policies` now expose explicit serving-mode and bounded comparison semantics so operators can distinguish live collector reads, persisted fallback responses, and current-versus-latest-persisted comparison-ready responses without implying a drift engine
- policy persistence remains intentionally bounded to normalized snapshot history and candidate-path records rather than a broader durable policy domain model
- a **path-analysis** read-side **contract** (`path_analysis_phase2_v1`) exists for follow-on work: see `docs/path-analysis-contract.md` and `docs/decisions/ADR-0002-path-analysis-phase2-read-only-contract.md`—policy-anchored intended vs observed **hints**, candidate-path summaries, evidence attribution, and explicit non-claims (**not** dataplane or TE resolution truth)
- workflow-history and audit-history remain bounded views derived from persisted sync-run activity rather than independently persisted workflow or audit domains
- backend metrics remain transient in-memory service state for Prometheus scraping; they are not durable application records
- these are stable product-owned contracts, but they remain bounded read-side slices rather than mature operational truth

Current truth and comparison semantics:

- `live` means the current response is primarily backed by the active collector-to-backend read path
- `persisted_fallback` means the live collector path is currently unavailable and the response is serving the latest persisted normalized snapshot instead
- `inferred` currently applies most directly to parts of topology, where normalized links are derived from bounded interface-state interpretation rather than protocol-derived adjacency truth
- `partial` means the contract is intentionally exposing bounded platform knowledge rather than claiming complete operational truth
- `paired`, `partially_paired`, and `single_sided` now describe only how much endpoint evidence supports the emitted inferred links in the current topology response; they do not mean validated adjacency, controller agreement, or workflow readiness
- `unavailable` means the backend does not currently have the additional persisted evidence required to produce a bounded comparison view
- comparison-ready summaries describe current normalized state against the latest persisted normalized snapshot, or one persisted snapshot against the immediately previous persisted snapshot, but they do not express validation conclusions, drift decisions, or action recommendations
- `stale` is currently a product-facing interpretation used mainly by the workflow-history and audit-history pages to describe recency of persisted sync-derived evidence; it is not a claim that the platform has proven a configuration or protocol mismatch

### `app-web`

The WebUI is the product.

It owns:

- product navigation
- operator views
- API-driven presentation
- future workflow-oriented UX

It does not own business logic.

Current truth-presentation reality:

- the WebUI surfaces backend-owned serving-mode, comparison, recency, and evidence-boundary semantics
- the WebUI now also surfaces backend-owned topology endpoint-pairing posture and paired-versus-single-sided counts as bounded trust cues on the dedicated topology page and in coarser summary form on Overview and Platform Health
- the WebUI may describe evidence as recent, aging, stale, partial, inferred, or unavailable where the backend contract and timestamps support that interpretation
- those labels remain explanatory operator cues rather than workflow decisions, policy validation outcomes, or drift verdicts

### `gnmi-collector`

The collector is the preferred observed-state engine.

It owns:

- gNMI collection
- vendor adapter boundaries for collection
- mapping from raw records into platform-friendly normalized forms
- collector metrics

Current observed-topology reality:

- the collector emits explicit per-link `endpoint_pairing_state` and `endpoint_evidence_count` plus aggregate `endpoint_pairing_posture`, `paired_link_count`, and `single_sided_link_count` for the current bounded inferred topology slice
- those signals remain collector-owned observed-input semantics only; they do not replace backend-owned product language or imply protocol-derived topology truth

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
- the current topology now mounts a host-backed Postgres data directory and the local Postgres image validates that mount contract at startup, but backup, restore, and broader lifecycle hardening are still intentionally out of scope

### `prometheus`

Prometheus is the metrics and time-series layer.

It scrapes service metrics and supports alerting and recording rules. It is not the application database.

Current runtime posture:

- the current topology runs Prometheus as a repo-built local image derived from the pinned upstream base
- the image validates the mounted config, rules paths, and writable TSDB path before Prometheus starts
- current post-deploy verification remains intentionally bounded to readiness plus discovery of the currently real scrape targets

### `grafana`

Grafana is the observability layer.

It provides dashboards and operational drilldowns. It is not the product UI and it must not absorb workflow or business logic.

Current runtime posture:

- the current topology runs Grafana as a repo-built local image derived from the pinned upstream base
- the image validates the mounted provisioning files, dashboard directory, and writable data path before startup
- `verify-core-runtime` now checks Grafana health, datasource provisioning, and overview dashboard discovery after deploy or reconfigure, but it does not yet validate every panel query or dashboard family semantically

### `odl`

ODL is a **bounded helper**, not the center of the system and **not** the owner of operator-facing product truth.

It may contribute:

- controller-side state (as **input** to the backend, not as the product contract)
- future BGP-LS, BMP, or PCEP-related leverage (only when honestly integrated—still backend-mediated)
- useful protocol-adjacent inputs for the backend
- **one** bounded RESTCONF capability discovery path on platform status (reachability + YANG/operations hints)

It must not become:

- the product brain
- the workflow engine
- the normalized API layer
- the only source of truth
- the authority for SR topology or policy correctness (those remain **gNMI/collector-backed read models** in `app-api` unless a future phase explicitly changes that with honest evidence)

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
- **operators should read the ODL row on Platform Health as “helper probe OK/degraded,” not as proof of controller-validated forwarding or policy intent**

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
- all initial platform services now run from repo-built local images rather than a mixed local-image versus direct-upstream deployment posture
- the current runtime-hardening slice adds bounded startup-contract validation for Postgres, Prometheus, and Grafana plus one bounded post-deploy verification path for the core runtime and one for ODL auth
- backend and collector skeletons exist
- read-only devices, topology, policies, capabilities, and platform status APIs now exist as backend-owned normalized bounded live contracts
- those read APIs now also expose clearer live-versus-persisted and comparison-friendly semantics where honest persisted support exists, especially for inventory, topology, and policy
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
