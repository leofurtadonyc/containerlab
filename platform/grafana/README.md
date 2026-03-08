# Grafana

## Purpose
Provides the observability dashboard layer for the platform — visualising platform health, topology state, SR policy state, and vendor adapter health.

## Why it exists
Operators need a time-series and event dashboard view that is decoupled from the product WebUI. Grafana fills that role via provisioned dashboards backed by Prometheus.

## What it owns
- dashboard definitions (provisioned from repo)
- datasource provisioning
- observability panels and operator-question dashboards
- alert visualisation

## What it does not own
- operator workflows or product actions (that is `app-web`)
- application state (that is Postgres)
- metrics storage (that is Prometheus)
- business logic

## Runtime details
- image: `grafana/grafana:latest`
- ports: 3000
- env vars: `GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD`, `GF_PATHS_PROVISIONING`
- mounts: `./grafana/provisioning:/etc/grafana/provisioning`, `./grafana/dashboards:/var/lib/grafana/dashboards`
- persistence: container-local Grafana state in the current topology skeleton; host persistence can be added later with an explicit write-permissions strategy
- dependencies: Prometheus

## Integration points
- queries Prometheus as its primary datasource
- does not query the backend or Postgres directly

## Current status
Initial provisioning skeleton exists, including datasource provisioning, dashboard provisioning, and clearly marked placeholder dashboards for the required dashboard families.

## Planned evolution
- refine provisioned Prometheus datasource settings as observability needs grow
- replace placeholder dashboard files with real platform, topology, SR policy, change-validation, and vendor dashboards
- add operationally meaningful panels as service metrics and normalized platform views become real

## Notes and caveats
Grafana is observability-only. The product UI is `app-web`. Do not build operator workflows or product pages in Grafana.
