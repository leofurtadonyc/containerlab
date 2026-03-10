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
- the platform and SR policy dashboards now surface bounded persisted policy sync evidence where those backend metrics honestly exist
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
- the platform, topology, and SR policy families now include real Prometheus-backed dashboards for the services that expose meaningful metrics today, with the platform and SR policy families now also surfacing bounded persisted policy sync evidence
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
