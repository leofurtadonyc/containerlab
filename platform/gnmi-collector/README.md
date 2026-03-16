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
- image: `platform-gnmi-collector:0.1.0`, built from the local service Dockerfile
- startup: the packaged runtime now validates required env, validates the mounted runtime config by building the typed collector runtime document, waits for `app-api` health, and only then starts the collector service
- ports: 9804 for metrics; additional runtime ports are TBD
- env vars: `COLLECTOR_METRICS_PORT`, `APP_API_URL`, and optional `GNMI_CONFIG_PATH` override
- mounts: `./gnmi-collector/configs:/app/configs` for runtime config overrides
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
When `GNMI_CONFIG_PATH` is not set, source-based runs resolve the committed repo-local `configs/config.example.yaml`; the container topology still sets `GNMI_CONFIG_PATH=/app/configs/config.example.yaml` explicitly so packaged runtime behavior stays deterministic.
The current policy-detail slice reads Nokia SR policy counters from the `nokia-state` subtree and bounded static-policy detail from the `nokia-conf` subtree. The mounted lab runtime therefore uses the built-in `admin` gNMI credential until a narrower profile is proven to expose that config subtree correctly.
The startup contract is now less fragile for the packaged topology runtime, but it is still bootstrap-grade beyond that narrow scope: target reachability, collector scheduling depth, retry orchestration after downstream outages, and broader delivery resilience remain intentionally limited.
