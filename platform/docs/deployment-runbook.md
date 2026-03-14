# Phase 2 Deployment Runbook

## Purpose

This runbook documents how to build, deploy, verify, and troubleshoot the current bounded `Phase 2 — read-only product foundation` platform slice.

It is written for repeatable operator use on a compatible Linux host.

It is intentionally practical rather than aspirational:

- it follows the repo-owned build and deploy path exactly
- it treats the platform as a separate Containerlab topology under `platform/`
- it keeps workflow, dry-run, and action semantics explicitly out of scope
- it describes the current operational stop line honestly

Use this runbook for day-0 and day-1 style platform bring-up, rebuild, and first-response troubleshooting.

## What This Runbook Covers

- building the repo-owned platform images
- deploying or replacing the current platform topology
- verifying the current bounded runtime contract
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

## What The Verification Scripts Prove

### `verify-core-runtime.sh`

This now validates:

- Postgres readiness and expected schema presence
- `app-api` startup-contract readiness and HTTP health
- `app-web` startup-contract readiness and HTTP availability
- Prometheus readiness and live scrape target posture
- Grafana API health, provisioned datasource presence, and provisioned overview dashboards

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
- `clab-platform-postgres` should be `Up ...`
- `clab-platform-prometheus` should be `Up ...`
- `clab-platform-grafana` should be `Up ...`
- `clab-platform-odl` should be `Up ...`

Only `app-api`, `gnmi-collector`, and `app-web` currently expose Docker health checks. The other services are validated through bounded startup scripts and the repo verification flow instead.

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
curl -s http://localhost:8000/api/v1/platform/status | python -m json.tool
curl -s http://localhost:9090/-/ready
curl -s http://localhost:3000/api/health
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

## Reset And Recovery Posture

The current platform is only partially durable.

Current reality:

- Postgres, Prometheus, and Grafana use host-backed data directories inside the workspace
- normal container replacement within the same workspace preserves that bounded state
- this is not the same thing as a full backup-and-restore story

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

### Not Safe To Say Right Now

- that the platform executes workflows
- that the platform supports dry-run or preview workflows
- that the platform provides full production hardening
- that the platform provides full topology truth, full policy truth, or full multi-vendor parity
- that the platform has complete recovery automation, complete backup discipline, or HA behavior

## Related Documents

- `INSTALLATION-INSTRUCTIONS.md` for host recreation and initial bring-up
- `docs/services.md` for service ownership boundaries
- `docs/data-flows.md` for current data movement and integration posture
- `docs/service-hardening-plan.md` for the bounded runtime-hardening stop line
- service READMEs under each service directory for service-specific runtime details