# Postgres

## Purpose
Provides durable relational storage for all platform application state — inventory, topology, policy, workflow history, audit logs, and capability registry.

## Why it exists
The platform requires persistent, queryable application state that is separate from time-series metrics. Postgres is the durable application database.

## What it owns
- inventory records
- topology snapshots and state
- SR policy records
- workflow and audit history
- capability registry
- integration health records

## What it does not own
- time-series metrics (that is Prometheus)
- real-time scrape data (that is the gNMI collector)
- configuration rendering (that is the backend or ODL)

## Runtime details
- image: `platform-postgres:0.1.0`, built from the pinned upstream `postgres:16` base with a small startup validator
- ports: 5432
- env vars: `PGDATA`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- mounts: `./postgres/init:/docker-entrypoint-initdb.d`, `./postgres/data:/var/lib/postgresql/data`
- persistence: the current topology binds init scripts and a host-backed Postgres data directory, with Postgres initialized under the `pgdata/` subdirectory of that mount for portable startup safety
- startup posture: the local image now validates the required database env vars, the mounted data root, the `PGDATA` subdirectory contract, and the presence of the init-script mount before delegating to the upstream entrypoint
- health visibility: the packaged runtime now also exposes a bounded Docker health check using `pg_isready` against the configured database contract
- dependencies: none

## Integration points
- `app-api` is the only service that reads from and writes to Postgres
- Postgres does not expose state directly to Grafana or any other service

## Current status
Initial database direction exists, including a minimal init SQL bootstrap script under `init/`, platform-level migration notes under `migrations/`, Alembic ownership under `app-api`, and the first bounded application schema for normalized inventory snapshots, normalized topology snapshots, normalized policy snapshots, candidate-path records, and sync-run history under `platform_app`.

## Planned evolution
- expand `init/` only where database bootstrap concerns belong there
- manage schema evolution through Alembic under `platform/app-api/alembic/`
- deepen the current bounded read-side snapshot schema only where it improves durable product usefulness
- add explicit migrations for additional core platform domains as models become real

## Notes and caveats
Postgres is the application state store. It is not a metrics database. Keep schema normalized and migration-managed from the start.
Current durability is bounded: persisted inventory/topology/policy snapshots, sync-run history, and deduplicated readiness-support snapshots now survive normal service replacement within the same platform workspace through the host-backed Postgres data mount, but broader backup, secret-management, and lifecycle hardening are still pending.
The current history views exposed by `app-api` are still derived mainly from persisted sync-run activity. They should not yet be read as proof that full workflow or user-action audit domains are durably modeled in Postgres.
The local runtime image is intentionally narrow: it does not replace the upstream initialization logic, but it does fail fast when the required bind-mounted runtime contract is broken.
If the Postgres data directory is preserved, bounded read-side fallback and history anchors can survive restart or `clab deploy -t topology.clab.yml -c`; if that directory is replaced or lost, the backend can recreate schema and recollect live data, but previous snapshot anchors, sync-derived history, and readiness-support records do not recover from repo files alone.
The Docker health check proves packaged database readiness only. Backup automation, restore drills, secret lifecycle hardening, and multi-node durability remain outside the current runtime contract.
