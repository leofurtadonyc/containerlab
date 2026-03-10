# gNMI Collector

## Purpose
Collects observed state from network devices using gNMI and normalizes it into vendor-neutral internal models for the platform.

## Why it exists
The platform must observe live device state without hard-coding vendor assumptions into the core. The collector provides a clean gNMI-first abstraction layer with vendor-specific logic isolated in adapters.

## What it owns
- gNMI subscription management
- raw-to-normalized model transformation
- per-vendor adapter implementations
- inventory-oriented observed-state collection scaffolding
- metrics endpoint for collector health

## What it does not own
- application state persistence (that is Postgres via `app-api`)
- product business logic (that is `app-api`)
- dashboard rendering (that is Grafana)
- SR policy workflow decisions (that is `app-api`)

## Runtime details
- image: `python:3.12-slim` in the current topology skeleton, pending a service-specific Dockerfile
- ports: 9804 for metrics; additional runtime ports are TBD
- env vars: `COLLECTOR_METRICS_PORT`, `APP_API_URL`, and `GNMI_CONFIG_PATH` placeholders in the current topology skeleton
- mounts: `./gnmi-collector/configs:/app/configs`, `./shared:/app/shared`
- persistence: none — stateless observer; all durable read-side storage is owned by `app-api` through Postgres
- dependencies: `app-api`

## Integration points
- subscribes to gNMI streams on lab device management interfaces
- sends normalized outputs to `app-api` through bounded inventory, topology, and policy snapshot routes
- exposes `/metrics` for Prometheus scraping

## Current status
The collector now exposes bounded live normalized inventory, topology, and policy snapshot routes for `app-api`, a Python application entrypoint, explicit adapter and mapping package layout, a Nokia-first gNMI collection path, and a bounded metrics endpoint exposing inventory, topology, and policy collection health plus backend-readiness signals.

## Planned evolution
- explicit normalization layers for inventory, topology, and policy-adjacent state
- backend delivery contract implementation for normalized collector outputs
- Juniper adapter structure later

## Notes and caveats
The collector is Nokia-first but must not be Nokia-bound. All vendor-specific normalization logic must live in named adapter modules. The core collector pipeline must remain vendor-neutral.
The collector is intentionally transient. It provides current observed-state slices and observability signals, but it does not become the durable system of record.
