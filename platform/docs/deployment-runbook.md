# Phase 2 Deployment Runbook

## Purpose

This runbook documents how to build, deploy, verify, and troubleshoot the current bounded `Phase 2 — read-only product foundation` platform slice.

It reflects the **week 16 operational checkpoint**: preserved-baseline checks in
`verify-core-runtime` when Postgres holds artifacts, explicit recovery fields on
`/api/v1/platform/status`, workflow-history and audit-history baseline summaries,
and the optional **same-workspace restart drill** (`./scripts/drill-same-workspace-restart.sh`) that reproves same-workspace recovery—not backup, restore, or HA.

It is written for repeatable operator use on a compatible Linux host.

It is intentionally practical rather than aspirational:

- it follows the repo-owned build and deploy path exactly
- it treats the platform as a separate Containerlab topology under `platform/`
- it keeps workflow, dry-run, and action semantics explicitly out of scope
- it describes the current operational stop line honestly

## Quick Validation Rule

For normal platform frontend or backend changes, this runbook is the preferred validation path:

- rebuild with `./scripts/build-images.sh`
- replace with `clab deploy -t topology.clab.yml -c`
- rerun `./scripts/verify-core-runtime.sh` and `./scripts/verify-odl-auth.sh`

Do not default to host-side `npm` or `pytest` for routine validation of the packaged platform runtime.

For the current packaged platform runtime, this runbook is also the preferred validation path.
Do not default to host-side `npm` or `pytest` commands when validating normal frontend or backend changes; rebuild the repo-owned images, replace the topology, and rerun the verification scripts.

Use this runbook for day-0 and day-1 style platform bring-up, rebuild, and first-response troubleshooting.

## What This Runbook Covers

- building the repo-owned platform images
- deploying or replacing the current platform topology
- verifying the current bounded runtime contract, including preserved-baseline checks when persisted artifacts exist
- the same-workspace restart drill for bounded recovery validation
- checking the expected healthy state of the core services
- troubleshooting common startup and verification failures
- stating what the platform is and is not safe to rely on right now

## What This Runbook Does Not Cover

- architecture redesign
- workflow execution or approvals
- dry-run or preview workflows
- TLS enablement
- secret rotation outside the bounded ODL admin-password path
- HA, clustering, or production backup automation
- offline artifact mirroring or fully hermetic rebuilds

## Current Operational Boundary

Treat the current platform honestly:

- safe for bounded read-only visibility, bounded persisted fallback, platform metrics, and current operator-facing WebUI views
- not safe to describe as a workflow platform, dry-run platform, or action-automation platform
- not safe to describe as full topology truth, full policy truth, or a multi-vendor parity claim
- not hardened yet for broader production controls such as TLS, external identity, secret lifecycle, HA, backup automation, or full recovery automation

## Preconditions

Before you start, confirm the host meets the current real requirements:

- Linux host
- Docker installed and usable by the current user
- Containerlab installed and usable by the current user
- outbound access to the pinned upstream image registries and package registries, unless your environment already mirrors them

Minimum preflight commands:

```bash
docker version
docker info
clab version
```

From the repository root, operate from `platform/` for platform lifecycle work:

```bash
cd platform
```

## Standard Deployment Procedure

### 1. Build The Repo-Owned Images

Always build from repository source before a fresh deploy or replacement deploy:

```bash
./scripts/build-images.sh
```

This produces the current local images:

- `platform-app-api:0.1.0`
- `platform-gnmi-collector:0.1.0`
- `platform-app-web:0.1.0`
- `platform-odl:0.1.0`
- `platform-postgres:0.1.0`
- `platform-prometheus:0.1.0`
- `platform-grafana:0.1.0`

For the current stack, this image-build step is part of the normal validation path, not just packaging.
Frontend toolchain execution belongs inside the `app-web` image build, and routine backend/frontend validation should continue through the packaged runtime plus the verification scripts below.

### 2. Deploy Or Replace The Topology

For the first deploy in a workspace:

```bash
clab deploy -t topology.clab.yml
```

For the normal rebuild-and-replace path after changes or to recover a drifted runtime:

```bash
clab deploy -t topology.clab.yml -c
```

Use `-c` for the standard replacement path. It matches the documented host-recreation flow already used to verify the current bounded runtime.

### 3. Run The Required Verification Scripts

After deployment, run both verification steps before treating the platform as usable:

```bash
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

These are required, not optional, for the current bounded operational slice.
If either script fails, stop there and treat the deployment as not yet usable until the failing runtime contract is understood.

This is the current documented replacement for ad hoc host-side validation of normal platform changes.

## What The Verification Scripts Prove

### `verify-core-runtime.sh`

This now validates:

- Postgres readiness and expected schema presence
- bounded persisted read-side table presence for sync runs, inventory snapshots, topology snapshots, policy snapshots, and readiness snapshots
- Postgres Docker health visibility for the packaged runtime
- Prometheus Docker health visibility and readiness
- Grafana Docker health visibility and API readiness
- `gnmi-collector` startup-contract readiness and metrics availability
- `app-api` startup-contract readiness, HTTP health, and metrics availability
- `app-web` startup-contract readiness, static HTTP availability, and `/api` proxy reachability to `app-api`
- Prometheus live scrape target posture for the current real targets
- read-side API contract sanity for platform status, devices, topology, policies, and capabilities, now including bounded `read_paths` coverage and freshness fields plus capability vendor-posture and roadmap rollups
- workflow-history and audit-history contract sanity for the current persisted read-side slice
- backend-owned topology coverage contract presence in both `/api/v1/platform/status` and `/api/v1/topology`, including endpoint-pairing posture, paired-link and single-sided-link counts, per-link pairing state, and per-link endpoint-evidence counts
- when Postgres reports persisted topology snapshot rows and `/api/v1/topology` returns a non-empty `history.recent_snapshots` array, the verifier asserts history snapshot and (when present) `history.comparison_to_previous` coverage posture keys (`inference_posture`, `collection_posture`, `node_participation_posture`, paired/single-sided/isolated counts, and current-versus-previous fields); on a fresh baseline with no topology snapshot rows it skips those checks and emits an honest notice instead
- dashboard-critical metric family availability from the current `app-api` and `gnmi-collector` metrics contracts, now including backend and collector paired-link, single-sided-link, pairing-posture, collector observation-age, policy detail-ready signals, and the backend collector-boundary latest duration, timeout budget, and latest timeout or failure posture signals used by the current dashboards
- bounded persisted-state exposure checks: when Postgres already holds snapshot, sync-run, or readiness rows, the API must still expose the matching history windows, comparison anchors, workflow-history, audit-history, and readiness anchor surfaces after restart or replacement
- preserved-baseline contract checks: when persisted artifacts exist, platform status `recovery.baseline_posture`, workflow-history `baseline_summary.baseline_posture`, and audit-history `baseline_summary.baseline_posture` must report `preserved_same_workspace_baseline`
- bounded warnings and notices when current read-side responses fall back to persisted data, become blocked, expose non-ok read-path posture, surface other degraded-but-honest states such as partial topology, partially-paired or single-sided topology coverage, and aggregate-only policy evidence, or show that fallback was triggered by a bounded collector-boundary timeout posture rather than ordinary degraded live collection
- Grafana provisioned datasource presence and provisioned overview dashboards

### `verify-odl-auth.sh`

This now validates:

- the configured ODL admin password works
- the upstream default password is rejected when a different configured password is expected
- `app-api` reports the bounded ODL platform-health probe as healthy

## Expected Healthy State

After a successful rebuild, deploy, and verification pass, the platform should look like this.

### Container State

Run:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep 'clab-platform-'
```

Expected current posture:

- `clab-platform-app-api` should be `Up ... (healthy)`
- `clab-platform-gnmi-collector` should be `Up ... (healthy)`
- `clab-platform-app-web` should be `Up ... (healthy)`
- `clab-platform-postgres` should be `Up ... (healthy)`
- `clab-platform-prometheus` should be `Up ... (healthy)`
- `clab-platform-grafana` should be `Up ... (healthy)`
- `clab-platform-odl` should be `Up ...`

`app-api`, `gnmi-collector`, `app-web`, `postgres`, `prometheus`, and `grafana` now expose bounded Docker health checks. `odl` remains outside that contract and is still validated by `./scripts/verify-odl-auth.sh` plus the bounded platform-health probe surfaced through `app-api`.

### HTTP Endpoints

Expected service endpoints:

- WebUI: `http://localhost:8088`
- App API: `http://localhost:8000`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- ODL RESTCONF: `http://localhost:8181`
- gNMI collector metrics: `http://localhost:9804/metrics`

Useful spot checks:

```bash
curl -s http://localhost:8000/api/v1/health | python -m json.tool
curl -s http://localhost:8088/api/v1/health | python -m json.tool
curl -s http://localhost:8000/api/v1/platform/status | python -m json.tool
curl -s http://localhost:8000/api/v1/devices | python -m json.tool
curl -s http://localhost:8000/api/v1/topology | python -m json.tool
curl -s http://localhost:8000/api/v1/policies | python -m json.tool
curl -s http://localhost:8000/api/v1/capabilities | python -m json.tool
curl -s http://localhost:9090/-/ready
curl -s http://localhost:3000/api/health
curl -s http://localhost:9804/metrics | head
```

### Product Sanity Checks

For the current Phase 2 slice, these are the most useful first checks after deploy:

```bash
curl -s http://localhost:8000/api/v1/devices | python -m json.tool
curl -s http://localhost:8000/api/v1/topology | python -m json.tool
curl -s http://localhost:8000/api/v1/policies | python -m json.tool
curl -s http://localhost:8000/api/v1/capabilities | python -m json.tool
```

What healthy means here:

- the API responds consistently
- the response shape matches the current bounded contracts
- live versus persisted-fallback posture is explicit where relevant
- empty or partial data remains possible and may still be healthy if it is honest about current evidence limits
- topology may still report `completeness=partial` and may honestly report `endpoint_pairing_posture=partially_paired` or `endpoint_pairing_posture=single_sided`; those are bounded evidence-depth cues, not validation failures

### Verification Warnings

`./scripts/verify-core-runtime.sh` now distinguishes between hard failures and bounded warnings.

- hard failures still stop the deployment from being treated as usable
- warnings call out degraded-but-honest current postures such as persisted fallback, blocked read-side evidence, or bounded policy and topology limits that remain visible by design
- notices now also call out bounded read-path attention states such as partially-paired or single-sided topology endpoint coverage and zero policy detail-ready targets when those conditions are real
- collector-boundary timeout warnings mean the backend hit the bounded latency budget and chose fail-fast fallback; they do not mean workflow semantics or a generic dependency-dashboard verdict
- topology pairing notices mean the inferred topology slice still mixes stronger and weaker endpoint evidence; they do not mean the platform has proven an adjacency fault or protocol failure
- a warning does not imply workflow semantics, remediation intent, or automatic rollback; it is an operator cue to inspect current truth posture more carefully

### Collector-Boundary Latency Posture

The current platform now exposes one small additional observability slice for collector-boundary latency posture.

These signals are intentionally bounded:

- `platform_app_api_collector_boundary_latest_fetch_duration_seconds` records the latest bounded collector-boundary fetch duration by model family
- `platform_app_api_collector_boundary_timeout_budget_seconds` records the configured timeout budget by model family
- `platform_app_api_collector_boundary_latest_fetch_posture` records whether the latest bounded fetch stayed live, remained partial, or ended in a timeout or other classified boundary failure outcome

Interpret them this way:

- `timeout_budget_exceeded` means persisted fallback or unreachable posture was triggered by the bounded fail-fast timeout path
- `collector_connection_error`, `collector_http_error`, `invalid_response_payload`, and `unknown_error` mean the boundary failed for a reason other than slowness alone
- `partial_live_feed` means the fetch completed within the current timeout budget but still returned bounded degraded live coverage
- these metrics remain observability signals only; the product-facing truth still lives in the backend contracts and the WebUI trust cues

## What Remains Bootstrap-Grade

The current hardening is still intentionally bounded. Keep these limits explicit:

- Docker health checks prove packaged startup and local readiness, not deep semantic correctness or full recovery behavior
- Postgres, Prometheus, and Grafana remain single-instance services backed by host-mounted workspace data rather than backup-managed or HA-managed storage
- verification still assumes the documented Linux, Docker, and Containerlab path with repo-managed bind mounts
- TLS, external identity, secret lifecycle hardening, backup automation, and disaster recovery remain outside the current runtime contract

Failures that still remain outside current coverage:

- semantic validation of every Grafana panel query, threshold, or operator interpretation path
- protocol-complete topology truth, path-computation truth, or controller-grade topology verification
- deep per-policy operational truth beyond the current bounded aggregate and static-policy-aware slice
- backup, restore, disaster recovery, or restart-orchestration validation
- automatic diagnosis or remediation of degraded collector, backend, or controller states

## Standard Replacement Workflow

Use this sequence whenever you need to replace the current running stack after repo changes:

```bash
cd platform
./scripts/build-images.sh
clab deploy -t topology.clab.yml -c
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

Do not substitute ad hoc container restarts for this documented path when you are trying to validate a repo change or reproduce a host recreation flow.

## Optional Lab Attachment Workflow

If you want the platform to observe the Nokia SR MPLS full lab, keep the lab lifecycle separate.

Recommended order:

1. Build and deploy the platform from `platform/`.
2. Verify the platform with both repo verification scripts.
3. Deploy the lab from `nokia-sr-mpls/`.
4. Validate inventory and topology through the product-owned API paths.

Example:

```bash
cd platform
./scripts/build-images.sh
clab deploy -t topology.clab.yml
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh

cd ../nokia-sr-mpls
clab deploy -t nokia-sr-mpls-lab3-full.clab.yml
```

## Common Failure Signals And First Checks

### Build Fails In `./scripts/build-images.sh`

Typical signals:

- Docker build exits non-zero
- Python dependency install fails in `app-api` or `gnmi-collector`
- `npm ci` or `npm run build` fails in `app-web`

First checks:

- confirm Docker is working for the current user
- confirm outbound registry access exists
- confirm the workspace contains the committed lock files
- rerun the build and inspect the failing image stage directly in the build output

### `clab deploy -t topology.clab.yml -c` Succeeds But `app-api` Never Becomes Healthy

Typical signals:

- `docker ps` shows `clab-platform-app-api` stuck in `starting`
- `verify-core-runtime.sh` times out waiting for `app-api`

First checks:

```bash
docker logs clab-platform-app-api --tail 200
docker logs clab-platform-postgres --tail 200
```

What to look for:

- Postgres connection failures
- migration failures
- invalid env assumptions
- warm-up failures that point to a bounded read-side dependency problem

### `postgres` Never Becomes Healthy

Typical signals:

- `docker ps` shows `clab-platform-postgres` stuck in `starting` or restarting
- `verify-core-runtime.sh` fails before schema verification

First checks:

```bash
docker logs clab-platform-postgres --tail 200
docker inspect clab-platform-postgres --format '{{json .State.Health}}'
```

What to look for:

- missing `POSTGRES_DB`, `POSTGRES_USER`, or `POSTGRES_PASSWORD`
- broken or unwritable bind-mounted `platform/postgres/data`
- broken `PGDATA` subdirectory contract under the mounted data root
- missing init mount content under `platform/postgres/init`

### `gnmi-collector` Never Becomes Healthy

Typical signals:

- `docker ps` shows `clab-platform-gnmi-collector` stuck in `starting` or restarting
- Prometheus target for `gnmi-collector` is not up

First checks:

```bash
docker logs clab-platform-gnmi-collector --tail 200
```

What to look for:

- missing or unreadable `GNMI_CONFIG_PATH`
- invalid mounted config structure
- `app-api` health wait timing out

### `app-web` Never Becomes Healthy

Typical signals:

- `docker ps` shows `clab-platform-app-web` stuck in `starting`
- `verify-core-runtime.sh` times out waiting for `app-web`

First checks:

```bash
docker logs clab-platform-app-web --tail 200
```

What to look for:

- missing built assets under `/usr/share/nginx/html`
- Nginx config validation errors
- unexpected runtime image mismatch after a partial rebuild

### The WebUI Loads But `/api` Fails Through The Proxy

Typical signals:

- `http://localhost:8088/` loads static UI assets
- `http://localhost:8088/api/v1/health` fails or returns a gateway-style error
- `verify-core-runtime.sh` fails on the app-web API proxy health step

First checks:

```bash
docker logs clab-platform-app-web --tail 200
docker logs clab-platform-app-api --tail 200
curl -s http://localhost:8000/api/v1/health | python -m json.tool
curl -s http://localhost:8088/api/v1/health | python -m json.tool
```

What to look for:

- `app-api` is not actually healthy even though the WebUI static container is up
- Nginx cannot resolve or reach `app-api:8000` on the platform topology network
- a partial rebuild left the WebUI runtime current but the backend runtime stale or broken

### `verify-core-runtime.sh` Fails On Prometheus Or Grafana

Typical signals:

- Prometheus readiness endpoint does not return successfully
- Grafana datasource or dashboard checks fail

First checks:

```bash
docker logs clab-platform-prometheus --tail 200
docker logs clab-platform-grafana --tail 200
curl -s http://localhost:9090/api/v1/targets | python -m json.tool
curl -s -u admin:change_me http://localhost:3000/api/datasources | python -m json.tool
```

What to look for:

- missing or broken mounted config under `platform/prometheus/`
- broken Grafana provisioning files or dashboard discovery
- target scrape failures for `app-api` or `gnmi-collector`

If the container health check is failing before the HTTP checks, inspect the packaged health state directly:

```bash
docker inspect clab-platform-prometheus --format '{{json .State.Health}}'
docker inspect clab-platform-grafana --format '{{json .State.Health}}'
```

### `verify-odl-auth.sh` Fails

Typical signals:

- configured ODL credential does not authenticate
- default credential still authenticates unexpectedly
- `app-api` does not report bounded ODL health as `ok`

First checks:

```bash
docker logs clab-platform-odl --tail 200
docker logs clab-platform-app-api --tail 200
curl -s http://localhost:8000/api/v1/platform/status | python -m json.tool
```

What to look for:

- slow ODL startup
- failed ODL password rotation
- bounded ODL probe errors inside `app-api`

### The WebUI Loads But Data Looks Empty Or Partial

Typical signals:

- WebUI is reachable
- API responses are valid
- one or more product pages show empty, partial, degraded, or fallback states

First checks:

```bash
curl -s http://localhost:8000/api/v1/devices | python -m json.tool
curl -s http://localhost:8000/api/v1/topology | python -m json.tool
curl -s http://localhost:8000/api/v1/policies | python -m json.tool
curl -s http://localhost:8000/api/v1/capabilities | python -m json.tool
```

Interpret those results honestly:

- empty or partial policy data may still be expected in the current Nokia-first bounded slice
- persisted-fallback responses may still be healthy if live collector delivery is temporarily unavailable
- current topology remains bounded and partially inferred rather than protocol-complete truth

## First-Response Operator Commands

These are the most useful commands to keep nearby for first-response triage:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep 'clab-platform-'
docker logs clab-platform-app-api --tail 200
docker logs clab-platform-gnmi-collector --tail 200
docker logs clab-platform-app-web --tail 200
docker logs clab-platform-postgres --tail 200
docker logs clab-platform-prometheus --tail 200
docker logs clab-platform-grafana --tail 200
docker logs clab-platform-odl --tail 200
curl -s http://localhost:8000/api/v1/health | python -m json.tool
curl -s http://localhost:8000/api/v1/platform/status | python -m json.tool
curl -s http://localhost:9090/api/v1/targets | python -m json.tool
```

## Same-Workspace Restart Drill

A repo-owned restart drill script exercises the bounded same-workspace recovery boundary without mutating or deleting host-backed data directories.

### When to use the drill

Use the drill when you want to:

- validate that the platform recovers correctly after container replacement
- prove the preserved-baseline contract when Postgres data survives in the same workspace
- rerun the drill on another Linux host with the repo and required tools (Docker, Containerlab)

### What the drill does

```bash
cd platform
./scripts/drill-same-workspace-restart.sh
```

The drill:

1. destroys the current topology (containers only; host-backed data directories are preserved)
2. deploys the topology again
3. runs `./scripts/verify-core-runtime.sh`
4. runs `./scripts/verify-odl-auth.sh`

When Postgres already holds persisted snapshots, sync runs, or readiness rows, the verifier asserts that platform status, workflow-history, and audit-history report `preserved_same_workspace_baseline`.

### What the drill does NOT prove

- disaster recovery (data-directory loss, cross-host migration)
- backup or restore automation
- HA or clustering behavior
- workflow or actuation behavior

This is a same-workspace restart drill only. It proves that when the host-backed data directories remain in place, the platform recovers from them after container replacement.

## Reset And Recovery Posture

The current platform is only partially durable.

Current reality:

- Postgres, Prometheus, and Grafana use host-backed data directories inside the workspace
- normal container replacement within the same workspace preserves that bounded state
- this is not the same thing as a full backup-and-restore story

## Durability Boundary

Treat recovery by data class rather than by container name.

### Recovery Matrix

| Scenario | What survives | What must be recollected or starts from a new baseline |
| --- | --- | --- |
| first deploy, or redeploy after `platform/postgres/data`, `platform/prometheus/data`, or `platform/grafana/data` was removed or replaced | repo-built images, topology wiring, Alembic migrations, Prometheus config, Grafana provisioning, and app-web build output | persisted Postgres snapshots, sync-derived history, readiness-support anchors, Prometheus TSDB history, and Grafana local state all start from a new baseline |
| normal service restart in the same workspace | host-backed Postgres data, Prometheus TSDB, and Grafana local state survive because the bind mounts remain in place | live inventory, topology, and policy evidence must be recollected; in-memory metrics and warm-up state are regenerated |
| `clab deploy -t topology.clab.yml -c` in the same workspace with preserved data directories | the same host-backed Postgres, Prometheus, and Grafana state survives container replacement | current live collector-backed evidence and transient in-memory state are recollected or regenerated after the new containers start |
| recreate on another host from repo files alone without carrying over the data directories | software, topology shape, migrations, provisioning, and generated app-web assets are rebuilt from the repository | prior Postgres read-side history, Prometheus TSDB history, and Grafana local state do not recover automatically |

### What survives normal restart or replacement in the same workspace

- Postgres keeps the bounded application-state records stored under `platform/postgres/data/pgdata`
- those Postgres records include persisted normalized inventory, topology, and policy snapshots, sync-run history, and deduplicated readiness-support snapshots
- Prometheus keeps its local TSDB under `platform/prometheus/data`
- Grafana keeps its local state under `platform/grafana/data`
- repo-owned build inputs, startup scripts, provisioning files, migrations, and dashboard JSON remain rebuildable from the repository itself

### What is rebuilt from the repository on redeploy

- all local service images rebuilt by `./scripts/build-images.sh`
- the platform topology definition and container wiring under `topology.clab.yml`
- app-api schema migration behavior through Alembic on startup
- app-web static assets through the containerized frontend build
- Grafana provisioning and dashboard definitions from repo files
- Prometheus scrape configuration and rules from repo files

### What must be re-collected or regenerated after restart

- current live collector-backed inventory, topology, and policy evidence must be recollected from the lab or network targets
- app-api in-memory metrics and warm-up state are regenerated on process restart
- collector in-memory metrics snapshots are regenerated when the collector runs new inventory, topology, and policy collection flows

### What does not recover automatically from repo files alone

- persisted Postgres read-side history if `platform/postgres/data` is missing or replaced
- Prometheus time-series history if `platform/prometheus/data` is missing or replaced
- Grafana local state if `platform/grafana/data` is missing or replaced
- any broader backup, restore-point, cross-host, HA, or disaster-recovery guarantees

If you rebuild the environment from repository files on a new host without carrying over those host-backed data directories, the platform can be recreated, but the bounded persisted snapshots, readiness-support history, Prometheus TSDB, and Grafana local state start from a new empty baseline.

## Recovery Semantics For Current Read-Side Data

The current read-side recovery model is intentionally narrow.

- persisted inventory, topology, and policy snapshots can serve as bounded fallback after restart only if the Postgres data directory is still present
- sync-derived workflow-history and audit-history views recover only from the sync-run and readiness-snapshot records that already exist in Postgres
- current-versus-latest-persisted and persisted-versus-previous comparison surfaces recover only when the required persisted snapshots still exist; they do not recreate older comparisons from Prometheus or Grafana state
- readiness-support visibility recovers from the latest persisted readiness snapshot reference in Postgres, while current readiness metrics are regenerated by `app-api` during runtime
- if Postgres data is lost, the platform can recollect live read-side data from the collector path, but earlier persisted comparison anchors, sync history, and readiness snapshot references are gone

## After Restart Or Redeploy

After a container restart, `clab deploy -t topology.clab.yml -c`, or other bounded recovery action, verify recovery in this order:

1. run `./scripts/verify-core-runtime.sh`
2. run `./scripts/verify-odl-auth.sh`
3. confirm `/api/v1/platform/status` exposes the expected `recovery.baseline_posture`, `recovery.read_side_posture`, and per-slice `recovery.persisted_artifacts` values for the current restart or redeploy case
4. confirm `serving_mode`, `data_status`, and any `served_persisted_at` fields on `/api/v1/devices`, `/api/v1/topology`, and `/api/v1/policies`
5. confirm `/api/v1/capabilities` still exposes the latest `readiness_snapshot_id` and `readiness_persisted_at` when Postgres state was expected to survive
6. confirm workflow-history and audit-history still show the expected bounded persisted evidence if Postgres state was expected to survive

Useful checks:

```bash
curl -s http://localhost:8000/api/v1/devices | python -m json.tool
curl -s http://localhost:8000/api/v1/topology | python -m json.tool
curl -s http://localhost:8000/api/v1/policies | python -m json.tool
curl -s http://localhost:8000/api/v1/capabilities | python -m json.tool
curl -s http://localhost:8000/api/v1/workflow-history | python -m json.tool
curl -s http://localhost:8000/api/v1/audit-history | python -m json.tool
```

Interpret the results honestly:

- `recovery.baseline_posture=preserved_same_workspace_baseline` means at least one bounded persisted application artifact survived in Postgres; use `recovery.persisted_artifacts` to see which slices still have preserved anchors
- `recovery.baseline_posture=new_baseline` means the current runtime is rebuilding persisted anchors from the current environment rather than exposing a preserved same-workspace baseline
- `recovery.read_side_posture=live_recollection_ready` means the bounded live inventory, topology, and policy read paths are currently recollecting usable live evidence
- `recovery.read_side_posture=degraded_with_persisted_baseline` means one or more live read paths are degraded while preserved persisted anchors still exist for the runtime
- `recovery.read_side_posture=degraded_without_persisted_baseline` means one or more live read paths are degraded and the runtime does not currently have a preserved same-workspace baseline to lean on
- `live_collector` means current recollection succeeded
- `persisted_fallback` means restart succeeded but live recollection is not currently available
- `empty_scaffold` means neither live evidence nor a persisted fallback record is available
- older `served_persisted_at` or readiness timestamps may be acceptable after restart, but they prove persisted fallback or persisted support rather than fresh live truth

`./scripts/verify-core-runtime.sh` now automates the bounded persistence check behind those manual API inspections:

- if Postgres still contains persisted inventory, topology, policy, sync-run, or readiness rows, the script requires the matching API history or anchor surfaces to remain visible after restart or replacement
- if those persisted tables are empty, the script emits a notice that the runtime is on a new baseline instead of pretending prior history survived
- this remains a recovery-contract check only; it is not a backup validator or a restore drill

When the running stack drifts or you want to validate the repo-owned state again, prefer the documented replacement flow:

```bash
cd platform
./scripts/build-images.sh
clab deploy -t topology.clab.yml -c
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

## Safe Use Versus Unsafe Claims

### Safe To Say Right Now

- the platform provides bounded read-only visibility
- the platform provides bounded persisted fallback for current read-side slices where implemented
- the platform provides bounded sync-derived and readiness-derived history support where documented
- the platform provides bounded observability through Prometheus and Grafana
- the current rebuild, deploy, and verification path is repeatable on a compatible host

### Safe To Expect After Restart

- the platform containers can be rebuilt and redeployed from repository source on a compatible Linux host
- bounded persisted read-side state survives normal replacement only when the host-backed data directories are preserved
- live inventory, topology, and policy may need to be recollected even when persisted fallback survives
- sync-derived history and readiness-support history are only as durable as the retained Postgres data directory

### Not Safe To Say Right Now

- that the platform executes workflows
- that the platform supports dry-run or preview workflows
- that the platform provides full production hardening
- that the platform provides full topology truth, full policy truth, or full multi-vendor parity
- that the platform has complete recovery automation, complete backup discipline, or HA behavior
- that repo files alone recreate prior persisted snapshots, prior Prometheus history, or prior Grafana local state without the matching data directories

## Related Documents

- `INSTALLATION-INSTRUCTIONS.md` for host recreation and initial bring-up
- `docs/services.md` for service ownership boundaries
- `docs/data-flows.md` for current data movement and integration posture
- `docs/service-hardening-plan.md` for the bounded runtime-hardening stop line
- service READMEs under each service directory for service-specific runtime details