# Prometheus

## Purpose
Collects, stores, and serves time-series metrics for all platform components and observed network devices.

## Why it exists
The platform requires a dedicated metrics layer that is decoupled from the application database. Prometheus is the standard time-series store for this role.

## What it owns
- scrape configuration for all platform services
- recording rules and alerting rules
- time-series retention
- metrics endpoint aggregation

## What it does not own
- application state (that is Postgres)
- dashboard rendering (that is Grafana)
- business logic
- workflow state

## Runtime details
- image: `prom/prometheus:latest`
- ports: 9090
- env vars: `PLATFORM_ENV` placeholder in the current topology skeleton
- mounts: `./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml`, `./prometheus/rules:/etc/prometheus/rules`, `./prometheus/recording-rules:/etc/prometheus/recording-rules`
- persistence: container-local TSDB in the current topology skeleton; host persistence can be added later with an explicit write-permissions strategy
- dependencies: all platform services exposing `/metrics` endpoints

## Integration points
- currently scrapes metrics from `app-api` and `gnmi-collector`, plus Prometheus itself
- keeps ODL, Grafana, and Postgres exporter targets as documented future placeholders rather than active scrape jobs
- scraped by nothing — Grafana queries Prometheus directly

## Current status
Initial configuration exists, including `prometheus.yml` plus `rules/`, `recording-rules/`, and `data/` directory structure, and the active scrape jobs now align with the currently real metrics endpoints in `app-api` and `gnmi-collector`.

## Planned evolution
- refine `prometheus.yml` scrape jobs as service metrics endpoints become real
- recording rules for platform health
- alerting rules for service degradation

## Notes and caveats
Prometheus is metrics-only. Do not store operational topology or policy state here.
