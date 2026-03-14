# Platform Installation Instructions

This document explains how to recreate the current platform on another host.

It is written for the current implementation reality:

- `Phase 2 — read-only product foundation`
- platform and labs are deployed separately
- the platform is a peer project, not a child of any lab
- the platform is rebuilt from local repository source into local container images

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

These checks currently validate:

- Postgres readiness and expected schema presence
- `app-api` health and packaged startup contract readiness
- `app-web` packaged startup contract readiness
- Prometheus readiness and the current real scrape targets
- Grafana datasource and dashboard provisioning
- ODL credential rotation and bounded controller reachability through `app-api`

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