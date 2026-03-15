# Platform Dashboards

## Purpose

This document describes the observability dashboard families for the platform, the operator questions they are meant to answer, and how Grafana fits into the platform without becoming the product UI.

## Current Status

The platform currently has:

- Grafana provisioning-from-files scaffolding
- a provisioned Prometheus datasource
- dashboard folder structure for the required dashboard families
- a real platform overview dashboard backed by Prometheus scrape health plus current `app-api` and `gnmi-collector` metrics
- real topology and SR policy overview dashboards backed by current Prometheus metrics for those bounded live slices
- the platform, topology, and SR policy dashboards now surface bounded persisted sync evidence plus clearer aggregate freshness, agreement, and evidence-gap cues where those backend and collector metrics honestly exist
- the platform overview dashboard now also surfaces collector-backed target coverage, observation-age, and policy detail-gap cues for inventory, topology, and policy, using real numeric signals rather than trying to serialize product-facing degraded-scope prose into Grafana
- the topology overview dashboard now also surfaces paired-link counts, single-sided-link counts, paired-link share, and backend-owned topology pairing-posture labels as bounded observability projections for the current topology coverage slice
- the platform overview dashboard now also mirrors the narrower topology read-path coverage posture through paired-versus-single-sided link counts and backend-owned pairing-posture labels without turning Grafana into the product contract
- a bounded post-deploy core-runtime regression check that now validates Grafana API health, the provisioned Prometheus datasource, and the provisioned overview dashboards alongside Postgres and Prometheus readiness
- clearly marked placeholder dashboard files for the dashboard families that do not yet have real backing metrics

What does not exist yet:

- fully implemented operational dashboards across all required families
- complete service metrics across the platform
- workflow-complete change validation dashboards

This document therefore describes the current dashboard architecture and near-term follow-on work, while staying honest about the current implementation depth.

## Role Of Grafana

Grafana is the observability and dashboard layer.

It is responsible for:

- visualizing platform metrics
- presenting observability-oriented drilldowns
- showing health, topology-adjacent, and validation-oriented evidence
- surfacing service degradation and adapter health

Grafana is not responsible for:

- product navigation
- workflow submission
- approvals
- reconciliation logic
- audit-system ownership
- business logic

Those responsibilities belong to the backend and the WebUI.

## Provisioning As Code

Dashboards and datasources must be provisioned from files stored in the repository.

The current file-based approach is:

- datasource provisioning under `platform/grafana/provisioning/datasources/`
- dashboard provider provisioning under `platform/grafana/provisioning/dashboards/`
- dashboard JSON files under `platform/grafana/dashboards/`

This approach is required because it keeps observability delivery:

- reviewable
- reproducible
- environment-friendly
- aligned with the platform topology and repository structure

Manual dashboard creation in the Grafana UI must not be the primary delivery model.

## Dashboard Change Workflow

Grafana dashboard delivery is now expected to follow one small repo-owned regression workflow.

When a change touches:

- `platform/grafana/provisioning/datasources/`
- `platform/grafana/provisioning/dashboards/`
- `platform/grafana/dashboards/`

the expected follow-on steps are:

1. redeploy or reconfigure the platform topology so the mounted provisioning files are re-read
2. run `./scripts/verify-core-runtime.sh` from `platform/`
3. treat any failure in Grafana API health, Prometheus datasource provisioning, or provisioned overview dashboard discovery as a regression that must be fixed before considering the observability change complete

This is intentionally narrow.

It does not claim full semantic validation of every panel query or every dashboard family.
It does ensure that the current repo-owned Grafana provisioning contract still loads cleanly after observability changes.

More specifically, `./scripts/verify-core-runtime.sh` currently validates only that:

- Grafana's health API responds
- the provisioned Prometheus datasource is present
- provisioned overview dashboards can be discovered through the Grafana API
- the current `app-api` and `gnmi-collector` metrics contracts still expose the metric families the platform overview dashboard depends on most directly

It does not yet validate:

- every panel query result across the platform, topology, and SR policy dashboards
- placeholder dashboard families such as change-validation and vendor views
- visual correctness, folder presentation details, or operator interpretation quality
- deeper Prometheus query semantics beyond the current readiness and target-discovery checks

## Dashboard Families

The platform currently organizes dashboards into five required families.

### Platform

This family answers questions such as:

- are the core platform services healthy?
- is Prometheus scraping the expected targets?
- is the backend reachable and responsive?
- is the collector healthy?
- is ODL reachable when that integration path is in use?

Expected emphasis over time:

- `app-api` health
- `gnmi-collector` health
- ODL health
- Prometheus health
- Grafana health where useful
- scrape target state
- platform request and latency indicators as they become real
- persisted inventory, topology, and policy sync freshness and result posture where those metrics exist
- bounded cross-slice freshness and agreement cues where those aggregate metrics exist
- collector-backed read-path coverage percentages, observation age, and target/detail gaps where those collector metrics exist

### Topology

This family answers questions such as:

- what topology-oriented data is visible right now?
- when was topology-related state last refreshed?
- are node and link views healthy or degraded?
- is the platform receiving enough evidence to trust the topology view?

Expected emphasis over time:

- node graph or topology-friendly visualization
- node state summaries
- link state summaries
- sync timestamps
- integration quality signals
- bounded backend-versus-collector aggregate agreement cues where those metrics exist
- explicit paired-versus-single-sided inferred-link counts and shares where those bounded collector metrics exist
- backend-owned topology pairing-posture labels only as observability projections from real metrics, not as dashboard-authored business logic
- operators should interpret paired-versus-single-sided topology panels as endpoint-evidence depth only, not as protocol adjacency validation or controller-backed topology truth

### SR Policy

This family answers questions such as:

- how many policies are active, degraded, or down?
- where are validation or drift signals appearing?
- which headends and endpoints are most affected?
- what policy state looks unstable or inconsistent?

Expected emphasis over time:

- policy counts by state
- degraded, active, and down summaries
- headend and endpoint breakdowns
- validation-related metrics
- drift or mismatch indicators
- persisted policy sync freshness and result posture where that evidence exists
- bounded target-coverage and observed-versus-detailed evidence-gap cues where those aggregate metrics exist
- bounded detail-ready target gaps where collector metrics honestly expose that narrower policy detail posture

## Product Versus Observability Split

The current read-path coverage improvement is intentionally split across layers.

In `app-web`:

- operators see backend-owned read-path summaries
- degraded-scope explanations are shown as product trust cues
- coverage and freshness remain tied to the bounded platform-status contract
- topology endpoint-pairing posture should be shown as backend-owned product language, not as a Grafana-derived label
- `paired`, `partially_paired`, and `single_sided` remain bounded topology trust cues about inferred-link endpoint evidence, not workflow or validation language

In Grafana:

- operators see numeric observability signals only
- coverage is represented through observed-versus-configured targets
- freshness is represented through observation age from collector timestamps
- degraded scope is approximated through numeric gaps such as missing targets, paired-versus-single-sided topology link counts or shares, and policy detail-ready gaps
- topology endpoint-pairing observability should stay numeric as paired-link counts, single-sided-link counts, and derived shares rather than becoming a product-owned status vocabulary inside dashboards
- backend-owned topology pairing-posture labels may appear only as metric-backed label projections that support those numeric panels; Grafana still does not own that vocabulary

Grafana does not attempt to reproduce the backend's human-readable degraded-scope summaries verbatim, because those are product semantics rather than durable metric labels.

Week 14 topology coverage rule:

- backend and WebUI may use the bounded topology pairing vocabulary defined in `platform/schemas/topology/topology-read-path-coverage-semantics.md`
- Grafana should not become the surface that defines whether the topology slice is `paired`, `partially_paired`, `single_sided`, or `unknown`
- Grafana may only project the numeric counts and derived ratios that support that product interpretation

### Change Validation

This family answers questions such as:

- how often are dry-runs being requested?
- which validations are failing?
- how long do validation paths take?
- are rollback-related signals being observed?

This family must remain observability-oriented.

It may visualize workflow evidence and validation outcomes, but it must not become the workflow control surface. The actual action flow belongs in the backend and WebUI.

Expected emphasis over time:

- dry-run counts
- workflow outcome summaries
- validation failures
- rollback-related visibility
- timing and duration insights

### Vendor

This family answers questions such as:

- which vendor adapter paths are healthy?
- where are normalization errors occurring?
- what requests are unsupported for a given capability set?
- how honest is the current platform support picture by vendor?

Expected emphasis over time:

- per-vendor adapter health
- unsupported request counts
- normalization errors
- support and capability visibility

This family must stay explicit about partial implementation. It must never imply full multi-vendor parity before that exists.

## Dashboard Quality Rules

Every dashboard should answer real operator questions.

That means:

- no cosmetic empty dashboards
- no panels that exist only to look impressive
- meaningful titles and descriptions
- caveats called out when the underlying implementation is partial
- readable queries that can be maintained

As real metrics become available, dashboards should become denser with useful evidence, not noisier with vanity panels.

## Relationship To Prometheus

Prometheus is the metrics and time-series source for Grafana in this platform.

That separation matters:

- Prometheus stores and evaluates metrics
- Grafana visualizes and organizes them
- neither replaces the backend as the application brain
- neither replaces Postgres as the durable application data store

Dashboard design should therefore assume Prometheus-backed metrics first, with any future additional observability sources introduced intentionally rather than casually.

## Current Vs Future

### Current

- provisioning files exist
- dashboard family folders exist
- the platform, topology, and SR policy families now include real Prometheus-backed dashboards for the services that expose meaningful metrics today, with those dashboards now also surfacing bounded freshness, agreement, and evidence-gap cues where the supporting signals are real
- the platform overview dashboard now also uses the newer collector coverage and observation-age metrics to make read-path gaps faster to interpret without turning Grafana into a product-status surrogate
- the topology and platform dashboards now also use the newer topology paired-link, single-sided-link, share, and backend-owned pairing-posture metrics to make endpoint-coverage gaps faster to interpret without inventing dashboard-only semantics
- placeholder dashboards still exist for families whose underlying metrics are not yet real
- the platform observability shape is documented

### Future

- service-backed health dashboards
- topology-aware visual panels backed by real normalized state and metrics
- SR policy health and drift dashboards backed by real product signals
- change-validation observability backed by actual dry-run and validation metrics
- vendor capability and adapter health dashboards backed by real platform evidence

## Boundary Reminder

Grafana is a powerful observability surface, but it is not the product.

The operator-facing product remains `app-web`, backed by `app-api`.

Grafana should help operators answer:

- what is healthy?
- what is failing?
- what is degraded?
- what evidence supports that conclusion?

It should not own:

- what action should be submitted
- what workflow should run
- what intent should be persisted
- what approval decision should be made
