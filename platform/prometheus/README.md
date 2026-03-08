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
- persistence: `./prometheus/data:/prometheus`
- dependencies: all platform services exposing `/metrics` endpoints

## Integration points
- scrapes metrics from `app-api`, `gnmi-collector`, ODL, Grafana, Postgres exporter
- scraped by nothing — Grafana queries Prometheus directly

## Current status
Initial configuration skeleton exists, including `prometheus.yml` plus `rules/`, `recording-rules/`, and `data/` directory structure.

## Planned evolution
- refine `prometheus.yml` scrape jobs as service metrics endpoints become real
- recording rules for platform health
- alerting rules for service degradation

## Notes and caveats
Prometheus is metrics-only. Do not store operational topology or policy state here.
