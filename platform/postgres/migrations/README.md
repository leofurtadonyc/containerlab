# Postgres Migration Direction

This directory documents the database migration direction for the platform.

## Current approach

The durable application database is PostgreSQL.

Migration ownership lives with the backend service under `platform/app-api/alembic/`, where Alembic scaffolding now exists.

This `platform/postgres/migrations/` directory remains useful for:

- documenting database direction
- holding database-specific notes
- keeping platform-level persistence intent visible

## Phase 1 status

At this stage:

- the database direction is established
- a minimal init SQL script exists under `platform/postgres/init/`
- Alembic scaffolding exists under `platform/app-api/alembic/`
- no production schema has been fully implemented yet

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
