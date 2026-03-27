# Postgres Migration Direction

This directory documents the database migration direction for the platform.

## Current approach

The durable application database is PostgreSQL.

Migration ownership lives with the backend service under `platform/app-api/alembic/`, where the first real bounded migration now exists.

This `platform/postgres/migrations/` directory remains useful for:

- documenting database direction
- holding database-specific notes
- keeping platform-level persistence intent visible

## Current status

At this stage:

- the database direction is established
- a minimal init SQL script exists under `platform/postgres/init/`
- Alembic migrations exist under `platform/app-api/alembic/`
- the first bounded production schema now exists for normalized inventory snapshots, normalized topology snapshots, and sync-run records
- policy persistence is implemented; **workflow lifecycle** (`workflow_lifecycles`, `workflow_lifecycle_events`) is implemented under `platform/app-api/alembic/`; audit-event persistence beyond sync/readiness merge remains future work

## Expected schema domains

Future migrations are expected to cover domains such as:

- devices
- vendors
- capabilities
- topology_nodes
- topology_links
- policies
- workflows
- audit_events
- integration_status
- sync_runs

## Boundaries

Postgres stores durable application state.

It must not become:

- the metrics store
- a raw vendor blob dump
- a replacement for Prometheus

Current caveat:

- the current topology does not yet mount a host-backed Postgres data directory, so persistence is real within the running deployment but not yet hardened across full platform reprovisioning
