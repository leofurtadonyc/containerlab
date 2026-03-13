# Minimum Viable Service Hardening Plan

## Purpose

This document proposes the minimum viable hardening sequence for the current platform topology.

It is intentionally bounded to Phase 2 runtime reliability work. It does not introduce service rewrites, architecture changes, or a broader productionization program.

## Current status note

The first bounded runtime-hardening slice described here has now been partially completed:

- Postgres, Prometheus, and Grafana now run as repo-built local images derived from their pinned upstream bases
- those three services now have small startup validators for their mounted runtime contracts
- `./scripts/verify-core-runtime.sh` now provides the broader post-deploy verification pass that was still missing when this plan was first drafted

The remaining sections are kept as the bounded plan baseline and stop line for the next hardening steps, not as a claim that the full hardening sequence is already complete.

## Runtime audit baseline

The current topology already has a mixed maturity profile:

- `app-api`, `gnmi-collector`, `app-web`, and `odl` now run as local images built from repo-owned Dockerfiles.
- `postgres`, `prometheus`, and `grafana` now also run as repo-built local images derived from pinned upstream bases, while still preserving repo-mounted config and data directories.
- Postgres, Prometheus, and Grafana now have host-backed persistence, but backup discipline, credential hardening, and broader lifecycle hardening are still pending.
- ODL now has one bounded hardening measure for the RESTCONF credential path, but it still remains a helper service rather than a durable system of record.
- `./scripts/build-images.sh`, `./scripts/verify-core-runtime.sh`, and `./scripts/verify-odl-auth.sh` now provide reproducible builds plus bounded post-deploy regression checks for the core runtime and the ODL credential path.

This means the next cycle should focus on closing the most important runtime-reliability gaps without broadening scope.

## Hardening principles

- Keep the current architecture and service ownership unchanged.
- Prefer reproducible packaging, explicit startup behavior, and scripted verification over new orchestration layers.
- Harden stateful services before stateless services.
- Treat pinned upstream images as acceptable when they already meet the current need; a custom image is only justified where repo-owned runtime behavior must be enforced.
- Use "good enough for current phase" criteria rather than production-grade targets.

## Proposed service order

1. `postgres`
2. `prometheus` and `grafana`
3. `app-api` and `gnmi-collector`
4. `app-web`
5. `odl`

## Step 1: Harden Postgres first

### Why first

Postgres has the highest platform blast radius. It backs the bounded durable read side for inventory, topology, policy, and sync history, and the backend cannot provide its current fallback behavior without it.

### Minimum viable hardening work

- preserve the current pinned upstream `postgres:16` base rather than introducing a custom database image
- tighten the documented bind-mount contract for `./postgres/data` and `PGDATA`
- add one bounded deploy-time verification that proves database startup, schema migration, and restart persistence all work from repo state alone
- document the expected reset and recovery path for a clean workspace versus a reused workspace

### Acceptance criteria

- a fresh deploy succeeds without manual container edits or host-side cleanup beyond the documented reset path
- `app-api` can apply migrations and start cleanly against the mounted Postgres data directory
- recreating the Postgres container within the same workspace preserves the bounded persisted records already expected in Phase 2
- one scripted smoke check confirms database reachability and persistence behavior

### Can remain bootstrap-grade temporarily

- backup automation
- secret rotation
- high availability
- cross-workspace restore tooling

## Step 2: Harden Prometheus and Grafana together

### Why second

They are the persistent observability pair for the current platform. They already use pinned upstream images and repo-managed mounts, so the immediate need is reproducible startup and provisioning verification rather than redesign.

### Minimum viable hardening work

- preserve the current pinned upstream images unless a repo-owned startup requirement appears
- verify mount layout, permissions expectations, and provisioning inputs from repo state alone
- add one bounded deploy-time verification for Prometheus config load, active scrape targets, Grafana datasource provisioning, and dashboard provisioning
- document what state is expected to survive container replacement and what can be safely reset

### Acceptance criteria

- Prometheus starts with the repo-managed config and keeps TSDB data across normal container replacement within the same workspace
- Grafana starts with repo-managed provisioning and loads the expected datasource and dashboard families without manual UI setup
- both services can be restarted without breaking current platform observability for `app-api` and `gnmi-collector`
- one scripted smoke check confirms endpoint availability and successful provisioning

### Can remain bootstrap-grade temporarily

- alert routing
- SSO or external auth
- backup automation
- long-term retention tuning

## Step 3: Tighten app-api and gNMI collector runtime contracts

### Why third

These services already have local Dockerfiles and are the main read-only product path. The next hardening step should validate and stabilize their packaged runtime behavior, not redesign them.

### Minimum viable hardening work

- keep the current local images and build flow centered on `./scripts/build-images.sh`
- add bounded startup validation for required environment and config inputs
- add one post-deploy verification pass for backend health, backend metrics, collector metrics, and the collector-to-backend delivery path
- document the expected dependency order and failure posture when Postgres or collector inputs are temporarily unavailable

### Acceptance criteria

- both images build reproducibly from repo state alone
- `app-api` starts, applies its packaged migration path, and serves `/api/v1/health` plus `/metrics`
- `gnmi-collector` starts from the packaged runtime and serves `/metrics` with the configured port and config path
- one scripted smoke check confirms the bounded collector-to-backend read path is functioning after deploy

### Can remain bootstrap-grade temporarily

- horizontal scaling
- queue-backed delivery
- advanced retry orchestration
- deeper runtime self-healing

## Step 4: Keep app-web simple, but verify it

### Why fourth

`app-web` is already the least risky service in runtime terms: it is stateless, packaged, and served through Nginx. It still needs a smoke check, but it should not drive the hardening sequence.

### Minimum viable hardening work

- preserve the current packaged frontend image and static serving model
- add one bounded smoke check for WebUI availability and `/api` proxy behavior to `app-api`
- keep the runtime mount-free and avoid adding server-side business logic or extra delivery layers

### Acceptance criteria

- the packaged image serves the production build on port `8088`
- the `/api` proxy path reaches `app-api` successfully after deploy
- the container can be replaced without requiring runtime rebuild steps inside the container

### Can remain bootstrap-grade temporarily

- CDN integration
- external auth integration
- advanced caching or asset delivery controls

## Step 5: Stop after bounded ODL hardening

### Why last

ODL is a bounded helper, not the platform brain and not the durable store. Its current highest-risk regression has already been addressed by the local image and credential verification script, so the next cycle should not let ODL pull the topology into a controller-first hardening effort.

### Minimum viable hardening work

- keep the current local ODL image and startup credential provisioning approach
- retain `./scripts/verify-odl-auth.sh` as the bounded regression guard
- add only small follow-up checks if needed for restart behavior and expected bounded platform-health integration
- explicitly defer controller persistence, broader controller feature enablement, and deep ODL customization

### Acceptance criteria

- the configured `ODL_ADMIN_PASSWORD` works after rebuild and redeploy
- the upstream default credential is rejected when the configured password differs
- `app-api` reports the bounded ODL platform-health probe as healthy when ODL is reachable
- no new dependency is introduced that would make ODL the source of truth for topology, policy, or workflow state

### Can remain bootstrap-grade temporarily

- persistent ODL controller data
- advanced controller feature enablement
- controller high availability

## Cross-cutting stop line

The following items are explicitly out of the minimum viable hardening cycle:

- phase changes
- service rewrites
- secret-management platform work
- HA or clustering work
- backup and restore automation across all services
- TLS and identity redesign
- new platform services or orchestration layers

## Good enough for current phase

The hardening cycle is successful if it produces the following outcome:

- every stateful service either has a verified repo-owned persistence contract or an explicit reason it remains intentionally non-durable
- every packaged service starts reproducibly from repo state alone
- the topology has a small set of scripted post-deploy verifications for the main dependency chain
- current Phase 2 read-only product behavior becomes more restart-safe and easier to recover without broadening architecture scope

That is the minimum viable stop point for the next cycle.