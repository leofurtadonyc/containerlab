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
- image: `platform-prometheus:0.1.0`, built from the pinned upstream `prom/prometheus:v2.54.1` base with a small startup validator and a narrow root-owned mount-permission repair step before dropping back to `nobody`
- ports: 9090
- env vars: `PLATFORM_ENV`, `PROMETHEUS_CONFIG_FILE`, `PROMETHEUS_RULES_DIR`, `PROMETHEUS_RECORDING_RULES_DIR`, and `PROMETHEUS_STORAGE_PATH`
- mounts: `./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml`, `./prometheus/rules:/etc/prometheus/rules`, `./prometheus/recording-rules:/etc/prometheus/recording-rules`, `./prometheus/data:/prometheus`
- persistence: host-backed TSDB under `./prometheus/data`
- startup posture: the local image now validates the mounted config and rules directories, repairs ownership and write access on the mounted TSDB path when the container starts as root, verifies that `nobody` can write that path, then runs `promtool check config` before starting Prometheus as `nobody`
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
The local runtime image is intentionally narrow: it keeps the repo-managed bind-mounted config model, but fails fast when the runtime config contract is broken.
The local runtime now also normalizes ownership on the bind-mounted TSDB directory so a fresh clone on another Linux host does not depend on pre-created host-side Prometheus-compatible ownership just to start.
