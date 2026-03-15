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
- image: `platform-grafana:0.1.0`, built from the pinned upstream `grafana/grafana:11.2.2` base with a small startup validator and a narrow root-owned mount-permission repair step before dropping back to the `grafana` user
- ports: 3000
- env vars: `GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD`, `GF_PATHS_PROVISIONING`, `GRAFANA_DASHBOARDS_PATH`, and `GRAFANA_DATA_PATH`
- mounts: `./grafana/provisioning:/etc/grafana/provisioning`, `./grafana/dashboards:/etc/grafana/dashboards`, `./grafana/data:/var/lib/grafana`
- persistence: host-backed Grafana state under `./grafana/data`
- startup posture: the local image now validates the mounted provisioning files and dashboards directory, repairs ownership and write access on the mounted Grafana data path when the container starts as root, verifies that the `grafana` user can write that path, and then delegates to the upstream runtime as `grafana`
- health visibility: the packaged runtime now also exposes a bounded Docker health check against `/api/health`
- dependencies: Prometheus

## Integration points
- queries Prometheus as its primary datasource
- does not query the backend or Postgres directly

## Current status
Provisioning from files is in place, and real platform, topology, and SR policy dashboards now exist. They visualize Prometheus scrape health plus real `app-api` and `gnmi-collector` metrics, while the remaining dashboard families still stay as clearly marked placeholders. The topology and platform overview dashboards now also surface bounded topology coverage observability through paired-link counts, single-sided-link counts, derived shares, and backend-owned pairing-posture labels projected from metrics rather than invented in dashboard logic. `../scripts/verify-core-runtime.sh` now provides one bounded post-deploy regression check for Grafana API health, datasource provisioning, and provisioned overview dashboard discovery.

## Planned evolution
- refine provisioned Prometheus datasource settings as observability needs grow
- add real change-validation and vendor dashboards as those underlying metrics become real
- deepen the platform, topology, and SR policy dashboards with broader service metrics only when the services expose honest observability signals

## Notes and caveats
Grafana is observability-only. The product UI is `app-web`. Do not build operator workflows or product pages in Grafana.
Topology coverage panels now exist to help operators see numeric endpoint-pairing posture faster, but those panels still do not imply protocol adjacency validation, controller agreement, or workflow meaning.
The local runtime image is intentionally narrow: it keeps repo-managed provisioning as the source of truth, but fails fast when the provisioning contract is broken.
The local runtime now also normalizes ownership on the bind-mounted data directory so a fresh clone on another Linux host does not depend on pre-created host-side `grafana` UID ownership just to start.
When provisioning or dashboard files change, reconfigure the platform topology and rerun `../scripts/verify-core-runtime.sh` to confirm the mounted provisioning contract still loads cleanly.
The Docker health check proves packaged API readiness only. Provisioning drift recovery, backup automation, external auth integration, and broader dashboard-lifecycle hardening remain outside the current runtime contract.
