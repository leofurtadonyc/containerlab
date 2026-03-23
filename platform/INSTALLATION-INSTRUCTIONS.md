# Platform Installation Instructions

This document explains how to recreate the current platform on another host.

For the bounded operator-facing deployment and troubleshooting flow after initial bring-up, see `docs/deployment-runbook.md`.

It is written for the current implementation reality:

- `Phase 2 — read-only product foundation`
- platform and labs are deployed separately
- the platform is a peer project, not a child of any lab
- the platform is rebuilt from local repository source into local container images

## Quick Validation Rule

For future context windows and normal operator use, keep this rule explicit:

- do not default to host-side `npm` for frontend validation
- do not default to host-side `pytest` for routine platform validation
- validate through `./scripts/build-images.sh`, `clab deploy -t topology.clab.yml -c`, `./scripts/verify-core-runtime.sh`, and `./scripts/verify-odl-auth.sh`

The current packaged platform treats that rebuild, redeploy, and verify flow as the primary documented validation boundary.

## Scope

These instructions cover:

- preparing a compatible host
- cloning the repository
- building the current platform images from source
- deploying the platform topology with Containerlab
- verifying the bounded runtime contract
- understanding the current portability limits

These instructions do not cover:

- production hardening
- TLS setup
- offline artifact mirroring
- backup and restore procedures
- advanced workflow or action automation

## Durability And Recovery Boundary

The repository can rebuild the software and topology shape, but not every runtime artifact.

Current durable state depends on the host-backed data directories under `platform/`:

- `platform/postgres/data` preserves bounded normalized inventory, topology, and policy snapshots, sync-run history, and deduplicated readiness-support snapshots
- `platform/prometheus/data` preserves Prometheus TSDB history
- `platform/grafana/data` preserves Grafana local state

Current repo-only rebuildable state includes:

- service images rebuilt from local Dockerfiles
- startup validators and topology wiring
- app-api schema migration path
- Prometheus config and rules
- Grafana datasource and dashboard provisioning files
- app-web build output regenerated during image build

Current recovery matrix:

| Scenario | What survives | What must be recollected or starts from a new baseline |
| --- | --- | --- |
| first deploy, or deploy after the host-backed data directories were removed or replaced | repo-built images, topology wiring, migrations, Prometheus config, Grafana provisioning, app-web build output | Postgres read-side snapshots, sync-run history, readiness-support snapshots, Prometheus TSDB history, and Grafana local state all start from a new baseline |
| normal container restart in the same workspace | host-backed Postgres data under `platform/postgres/data`, Prometheus TSDB under `platform/prometheus/data`, and Grafana local state under `platform/grafana/data` | live inventory, topology, and policy evidence must be recollected; transient in-memory metrics and warm-up state are regenerated |
| `clab deploy -t topology.clab.yml -c` in the same workspace with the data directories preserved | the same host-backed Postgres, Prometheus, and Grafana state survives container replacement | current live collector-backed evidence and transient in-memory state are recollected or regenerated after the new containers start |
| recreate on another host from repo files alone without copying the data directories | software, topology shape, migrations, Prometheus config, Grafana provisioning, and app-web assets are rebuilt from the repository | previous Postgres read-side history, Prometheus TSDB history, and Grafana local state do not recover automatically |

If you recreate the platform on another host from repository files alone and do not carry over those host-backed data directories, the platform will still come up, but persisted snapshots, readiness-support history, Prometheus TSDB history, and Grafana local state start from a new baseline.

## Safeguards And Boundaries

Before recreating the platform elsewhere, preserve these rules:

- deploy the platform from `platform/`, not from a lab folder
- deploy labs separately from the platform
- keep the default integration model management-plane-first
- do not treat OpenDaylight as the product or the source of truth
- do not treat Grafana as the product UI
- do not treat Prometheus as the application database
- do not assume multi-vendor parity that is not implemented
- treat the current build as a Phase 2 read-only foundation, not as a workflow platform

## Host Requirements

Current tested assumptions:

- Linux host
- Docker installed and working for the current user
- Containerlab installed and working
- outbound access to the required upstream image and package registries unless you already mirror or cache those artifacts internally

The standard recreate flow does not require host-installed Node.js, `npm`, or `pytest`.
For the current Phase 2 platform workflow, those toolchains run inside the service image builds or are replaced by the bounded post-deploy verification scripts.

Treat this as the current validation boundary as well:

- do not default to host-side `npm` for frontend validation
- do not default to host-side `pytest` for routine platform validation
- prefer the repo-owned `./scripts/build-images.sh` then `clab deploy -t topology.clab.yml -c` flow
- verify the resulting runtime with `./scripts/verify-core-runtime.sh` and `./scripts/verify-odl-auth.sh`

Current external dependencies still required during a fresh rebuild:

- Docker image registries for the pinned base images
- Python package index for `app-api` and `gnmi-collector` dependency downloads
- npm registry for `app-web` dependency downloads captured by `package-lock.json`

The repository is now substantially more reproducible host-to-host, but it is still not a fully offline or hermetic build.

## Recommended Host Preparation

On the target Linux host, verify at minimum:

- `docker version`
- `docker info`
- `clab version`

You should also ensure the current user can run Docker commands without `sudo`, because the platform build and deployment flow assumes direct access to the container runtime.

## Clone The Repository

Clone the repository onto the target host and move into the platform directory:

```bash
git clone <your-repository-url> labs
cd labs/platform
```

If you are transferring a local working copy instead of cloning, preserve the full repository layout so the platform remains a peer project to the labs.

## Build The Platform Images

Build the current platform images from the local repository source:

```bash
./scripts/build-images.sh
```

This builds the current local images:

- `platform-app-api:0.1.0`
- `platform-gnmi-collector:0.1.0`
- `platform-app-web:0.1.0`
- `platform-odl:0.1.0`
- `platform-postgres:0.1.0`
- `platform-prometheus:0.1.0`
- `platform-grafana:0.1.0`

Current reproducibility protections in this build flow:

- service Dockerfiles pin upstream base images by digest
- `app-web` builds with `npm ci` against the committed lock file
- `app-api` and `gnmi-collector` build from committed `requirements.lock.txt` files with pinned `pip` and `setuptools`

Operationally, this means a host without local `npm` can still rebuild `app-web`, because the Node toolchain runs inside the Docker build for that image.
Likewise, routine recreate-time validation does not depend on host-installed `pytest`; the current bounded validation path is to rebuild the images, redeploy the topology, and rerun the verification scripts below.

If a future context window needs only one rule to stay aligned here, it should remember this: validate platform changes through the repo-owned image-build, topology-redeploy, and verification-script flow first, not through ad hoc host-side `npm` or `pytest` commands.

### Optional: run `app-web` Vitest without host Node.js

The `app-web` Dockerfile runs `npm run build` but does not run `npm test`. Routine packaged validation remains **build images → deploy → verify scripts**. If you still need **Vitest** on a Linux host that has **Docker** but no local Node toolchain, run the test suite inside a throwaway Node container from `platform/`:

```bash
docker run --rm -v "$(pwd)/app-web:/app" -w /app node:22-alpine sh -c "npm ci --no-fund --no-audit && npm test"
```

This matches the same pinned major line as the `app-web` build stage (Node 22) without installing Node on the host.

### Optional: run `app-api` pytest without host Python tooling

The `app-api` Dockerfile installs the service package from `pyproject.toml` but does not run `pytest` during the image build. Routine packaged validation remains **build images → deploy → verify scripts**. If you still need **`pytest`** for repository contract tests on a Linux host that has **Docker** but no local Python toolchain aligned to `app-api` (or you choose not to install `pytest` on the host per the Quick Validation Rule above), build the **`platform-app-api`** image first, then run tests inside a **throwaway** container that reuses the same image dependency set:

```bash
docker build -t platform-app-api:0.1.0 app-api
docker run --rm -u root -v "$(pwd)/app-api:/app" -w /app platform-app-api:0.1.0 \
  sh -c "python3 -m pip install -q pytest httpx && PYTHONPATH=src python3 -m pytest tests/ -q"
```

The production image does not include **`httpx`**, but repository **`pytest`** uses **`fastapi.testclient`**, which requires it. Install **`httpx`** alongside **`pytest`** as shown (or `pip install -q -e '.[dev]'` from the mounted `app-api` tree to pull the full dev extra from `pyproject.toml`).

To run a **single** test module (for example bounded contract tests only), replace the final `tests/` path with that file. This exercises the same Python dependency set as the shipped image without relying on host-side `pytest`.

## Deploy The Platform Topology

From `platform/`, deploy the current topology:

```bash
clab deploy -t topology.clab.yml
```

If you need to replace an existing deployment after a rebuild or configuration change, use:

```bash
clab deploy -t topology.clab.yml -c
```

The platform topology is separate from the labs. Do not merge the platform services into a lab topology as part of installation.

## Verify The Deployment

After the topology comes up, run the bounded runtime verification scripts:

```bash
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

If you changed source files on a host that does not have local frontend or Python test tooling installed, use this rebuild-and-verify path rather than trying to validate the services with host-side `npm` or `pytest` commands.

This is not just a fallback for limited hosts; it is the preferred documented validation path for the current packaged platform runtime.

These checks currently validate:

- Postgres readiness and expected schema presence
- `app-api` health, packaged startup contract readiness, and metrics availability
- `app-web` packaged startup contract readiness
- Prometheus readiness and the current real scrape targets
- read-side API contract sanity for platform status, devices, topology, policies, and capabilities
- **Week 27 (when `python3` is available and lists are non-empty):** structural sampling of **`GET /api/v1/policies/{policy_id}/path-analysis`** and **`GET /api/v1/topology/objects/{node_id}/related-policies`**, plus **`degraded_policy_v1`** **`contract_id`** on policy items—skipped with a notice when `python3` is absent or the sampled lists are empty
- workflow-history and audit-history contract presence for the persisted read-side slice
- persisted Postgres snapshot, sync-run, and readiness-snapshot table presence, plus API exposure of the corresponding bounded history and anchor surfaces when those rows already exist
- when those persisted tables are non-empty, platform `recovery.baseline_posture` and both histories' `baseline_summary.baseline_posture` must read `preserved_same_workspace_baseline` (skipped with a notice when tables are empty)
- **Devices inventory history** (parity with topology and policy history checks): (1) **No rows in `inventory_snapshots`:** snapshot-level devices history assertions are **skipped** with an honest **fresh-baseline** notice—**not** a verifier failure. (2) **Postgres has inventory snapshot rows** but `/api/v1/devices` returns an empty `history.recent_snapshots` list: snapshot-level assertions are **skipped** with a **notice** (API/backend mismatch vs persisted rows)—**not** a failure. (3) **Non-empty `recent_snapshots`** (detected via **`[{"snapshot_id"`** prefix in compact JSON so `comparison_to_previous` ids cannot fake snapshot-level intent): asserts per-snapshot keys such as `device_count`, `collector_status_counts`, `capability_summary_counts`. (4) When **`history.comparison_to_previous`** includes **`current_snapshot_id`**, asserts `current_device_count`, `previous_device_count`, and `device_count_delta`
- dashboard-critical metric family availability from the current `app-api` and `gnmi-collector` metrics contracts
- bounded degraded-state warnings for persisted-fallback, blocked, or otherwise degraded-but-honest read-side responses
- Grafana datasource and dashboard provisioning
- ODL credential rotation and bounded controller reachability through `app-api`

After restart or redeploy, operators should also confirm whether the platform came back with live recollection or persisted fallback where relevant by checking `serving_mode`, `data_status`, `served_persisted_at`, and readiness timestamps through the product-owned API paths.

`./scripts/verify-core-runtime.sh` distinguishes preserved versus new baseline using Postgres row presence: when persisted snapshot/sync/readiness rows exist, it requires matching API history surfaces and **`recovery.baseline_posture` / workflow-history and audit-history `baseline_summary.baseline_posture` = `preserved_same_workspace_baseline`**; when those tables are empty (first deploy or data directories replaced), it skips those assertions and emits an honest notice—**losing `platform/postgres/data` (and the other host-backed dirs) starts a new baseline**, not a preserved one.

## Same-workspace restart drill

Use `./scripts/drill-same-workspace-restart.sh` from `platform/` for a **repeatable** proof that **container replacement** in the same workspace still leaves bounded persisted read-side state visible through the APIs after redeploy.

**Prerequisites:** Docker, Containerlab (`clab`), prior successful `./scripts/build-images.sh` and `clab deploy` as in this guide, and the host-backed directories **`platform/postgres/data`**, **`platform/prometheus/data`**, and **`platform/grafana/data`** left intact (the script never deletes them).

**What it runs:** `clab destroy` (containers only) → `clab deploy` → `./scripts/verify-core-runtime.sh` → `./scripts/verify-odl-auth.sh`. Override the topology file with **`TOPOLOGY_FILE=/path/to/topology.clab.yml`** if needed.

**Success:** script exits `0` and both verifiers pass. **Failure:** fix the reported verifier or deploy error before treating the stack as healthy; the script uses `set -e` and does not ignore verification failures.

**What it does not prove:** disaster recovery, backup/restore automation, cross-host migration, HA, or recovery after deleting the data directories above. Same-workspace only.

Full operator context: `docs/deployment-runbook.md` (Same-Workspace Restart Drill).

## Access The Running Services

The current host port bindings are:

- WebUI: `http://localhost:8088`
- App API: `http://localhost:8000`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- ODL REST/RESTCONF: `http://localhost:8181`
- ODL Karaf: `localhost:8101`
- Postgres: `localhost:5432`
- gNMI collector metrics: `http://localhost:9804/metrics`

Current default credentials and development-time values remain repository-local development settings. Treat them as local-only defaults, not production-ready secrets.

## Optional Lab Recreation

If you want the platform to observe a lab, deploy the relevant lab separately after the platform is up.

Example principle:

- deploy the platform from `platform/`
- deploy a lab from its own lab directory
- let the platform reach the lab over management connectivity

Do not treat lab deployment as part of the platform installation itself.

## Supported Lab Example: Nokia SR MPLS Full Lab

The current Nokia-first example that best matches the platform's default collector target set is the full Nokia SR MPLS lab:

- lab directory: `nokia-sr-mpls/`
- topology file: `nokia-sr-mpls-lab3-full.clab.yml`
- topology name: `nokia-sr-mpls`

Why this is the right example for the current platform:

- the platform remains Nokia-first in the current phase
- `platform/gnmi-collector/configs/config.example.yaml` is already aligned to the Nokia management-plane address set used by this lab
- the lab exposes device management addresses in the shared `clab` management network using the same `172.20.20.0/24` space that the platform uses for management-plane reachability
- the device configs in this lab enable gNMI and related management interfaces that the current read-only platform depends on

### Additional Lab-Specific Requirements

Before deploying this lab on another host, make sure the Nokia lab prerequisites are present in `nokia-sr-mpls/`:

- the Nokia SR Sim image referenced by the topology: `localhost/nokia/srsim:25.10.R2`
- the lab license file expected by the topology: `./license.txt`

These are lab-specific prerequisites, not platform prerequisites.

### Deployment Order

Keep the platform and the lab separate even when deploying both on the same host.

Recommended order:

1. Build and deploy the platform from `platform/`.
2. Verify the platform with `./scripts/verify-core-runtime.sh` and `./scripts/verify-odl-auth.sh`.
3. Deploy the Nokia full lab from `nokia-sr-mpls/`.

### Example Commands

From the repository root on the target host:

```bash
cd platform
./scripts/build-images.sh
clab deploy -t topology.clab.yml
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh

cd ../nokia-sr-mpls
clab deploy -t nokia-sr-mpls-lab3-full.clab.yml
```

This preserves the intended model:

- one platform topology under `platform/`
- one lab topology under `nokia-sr-mpls/`
- management-plane-first integration between them

### What To Expect

After both topologies are up:

- platform containers should appear under the `clab-platform-...` naming prefix
- lab nodes should appear under the `clab-nokia-sr-mpls-...` naming prefix
- the platform should reach the Nokia nodes over their management IPs such as `172.20.20.101` through `172.20.20.134`

The platform and the lab should coexist on the shared `clab` management network without being merged into one topology.

### Lab-Side Verification

To confirm the platform is actually seeing the Nokia nodes after both topologies are up, use the product-owned read APIs first:

```bash
curl -s http://localhost:8000/api/v1/devices | python -m json.tool
curl -s http://localhost:8000/api/v1/topology | python -m json.tool
curl -s http://localhost:8000/api/v1/platform/status | python -m json.tool
```

What to look for:

- `/api/v1/devices` should return Nokia inventory items instead of an effectively empty response
- `/api/v1/topology` should return observed or inferred topology evidence for the deployed lab
- `/api/v1/platform/status` should show the bounded platform services as reachable rather than indicating a disconnected collector-side view

If you want one extra scrape-side check, open Prometheus at `http://localhost:9090/targets` and confirm the current collector and backend scrape targets are up. That does not prove full network correctness by itself, but it does confirm the platform-side telemetry path is alive while you validate the Nokia inventory and topology through the API.

### Safeguards For This Example

Keep these limits explicit:

- do not move lab nodes into `platform/topology.clab.yml`
- do not rename the platform topology to match the lab
- do not assume the platform automatically supports every Nokia lab variant equally
- do not claim Juniper or broader multi-vendor parity from this Nokia example

### Important Current Limitation

The current default collector example config is aligned to the full Nokia address set.

That means:

- `nokia-sr-mpls-lab3-full.clab.yml` is the safest current example for a first recreate-and-observe workflow
- if you deploy a smaller Nokia topology such as `nokia-sr-mpls-lab1-ipaddr.clab.yml` or `nokia-sr-mpls-lab2-srospf.clab.yml`, you should also adjust the collector target list to match the lab you actually started instead of pretending the full target set exists

That is a configuration alignment task, not a reason to collapse the platform and lab into one deployment.

## Teardown

To destroy the running platform topology:

```bash
clab destroy -t topology.clab.yml
```

If you intentionally want to remove persisted state under the bind-mounted local data directories, do that explicitly and carefully after the topology is down.

## Troubleshooting

### Image build fails

Check:

- Docker is working
- the host can reach the required registries
- the local user can build Docker images

### Deployment fails early

Check:

- `clab version`
- Docker daemon health
- host ports are not already occupied

### A stateful service restarts immediately

Check container logs first:

```bash
docker logs clab-platform-grafana
docker logs clab-platform-prometheus
docker logs clab-platform-postgres
```

The current images already normalize bind-mounted writable state for Grafana and Prometheus at startup, but host-level container runtime issues can still affect deployment.

### Verification fails immediately after deploy

The stack may still be warming up.

Re-run:

```bash
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

after the services have had time to settle.

## Current Portability Statement

Current honest status:

- yes, you can rebuild and deploy this platform from the local repository source on another compatible Linux host
- no, the repository alone is still not enough for a truly offline or fully hermetic rebuild

What still prevents a fully self-contained host-to-host build:

- pinned upstream base images still need to be pulled unless mirrored locally
- Python and npm dependencies still need package sources unless mirrored or pre-cached
- the target host still needs Docker and Containerlab installed and working

## Suggested Next Steps

If you want stronger portability than the current Phase 2 posture, the next practical steps are:

1. Add a host preflight script that validates Docker, Containerlab, registry reachability, and basic runtime prerequisites before build and deploy.
2. Mirror or pre-cache the pinned base images so the build does not depend on public image registry availability.
3. Mirror or pre-cache the Python wheels required by `app-api` and `gnmi-collector`.
4. Mirror or pre-cache the npm packages behind `app-web/package-lock.json`.

Those steps would improve reproducibility further without changing the platform architecture or violating the current Phase 2 boundaries.