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
- env vars: `COLLECTOR_METRICS_PORT`, `APP_API_URL`, optional `GNMI_CONFIG_PATH` override, and `COLLECTOR_GNMI_REQUEST_TIMEOUT_SECONDS` for the per-target gNMI request budget used by live inventory, topology, and policy reads
- mounts: `./gnmi-collector/configs:/app/configs` for runtime config overrides
- persistence: none — stateless observer; all durable read-side storage is owned by `app-api` through Postgres
- dependencies: `app-api`

## Integration points
- subscribes to gNMI streams on lab device management interfaces
- sends normalized outputs to `app-api` through bounded inventory, topology, and policy snapshot routes
- exposes `/metrics` for Prometheus scraping

## Current status
The collector now exposes bounded live normalized inventory, topology, and policy snapshot routes for `app-api`, a Python application entrypoint, explicit adapter and mapping package layout, a Nokia-first gNMI collection path, and a bounded metrics endpoint exposing inventory, topology, and policy collection health plus backend-readiness signals. The current live Nokia policy path now also proves one narrow detail-ready record family: 4 normalized live `static_local` policy records across 4 PE targets, while the remaining 30 targets stay explicit as `no_policies_observed` rather than being overread as missing detail.

## Planned evolution
- explicit normalization layers for inventory, topology, and policy-adjacent state
- backend delivery contract implementation for normalized collector outputs
- Juniper adapter structure later

## Notes and caveats
The collector is Nokia-first but must not be Nokia-bound. All vendor-specific normalization logic must live in named adapter modules. The core collector pipeline must remain vendor-neutral.
The collector is intentionally transient. It provides current observed-state slices and observability signals, but it does not become the durable system of record.
When `GNMI_CONFIG_PATH` is not set, source-based runs resolve the committed repo-local `configs/config.example.yaml`; the container topology still sets `GNMI_CONFIG_PATH=/app/configs/config.example.yaml` explicitly so packaged runtime behavior stays deterministic.
The packaged topology now also sets `COLLECTOR_GNMI_REQUEST_TIMEOUT_SECONDS=2` so one dead target fails fast enough for the collector to keep returning bounded partial-live snapshots before `app-api` exhausts its 3 second collector-boundary timeout.
The current policy-detail slice reads Nokia SR policy counters and runtime `sr-path` state from the `nokia-state` subtree, then correlates that live status with bounded static-policy detail from the `nokia-conf` subtree. The current live lab now proves that this collector-first path can derive bounded normalized detail for Nokia `static_local` policies only; broader static-non-local, BGP-signaled, Juniper, or multi-vendor policy truth remains unproven and must not be implied.
The startup contract is now less fragile for the packaged topology runtime, but it is still bootstrap-grade beyond that narrow scope: target reachability, collector scheduling depth, retry orchestration after downstream outages, and broader delivery resilience remain intentionally limited.
