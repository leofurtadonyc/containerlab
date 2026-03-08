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
- image: `postgres:16`
- ports: 5432
- env vars: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- mounts: `./postgres/init:/docker-entrypoint-initdb.d`
- persistence: the current topology skeleton only binds init scripts; durable data storage is still to be refined
- dependencies: none

## Integration points
- `app-api` is the only service that reads from and writes to Postgres
- Postgres does not expose state directly to Grafana or any other service

## Current status
Initial database direction exists, including a minimal init SQL bootstrap script under `init/`, platform-level migration notes under `migrations/`, and Alembic scaffolding owned by `app-api`.

## Planned evolution
- expand `init/` only where database bootstrap concerns belong there
- manage schema evolution through Alembic under `platform/app-api/alembic/`
- add explicit migrations for core platform domains as models become real

## Notes and caveats
Postgres is the application state store. It is not a metrics database. Keep schema normalized and migration-managed from the start.
