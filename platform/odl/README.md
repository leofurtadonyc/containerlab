# OpenDaylight (ODL)

## Purpose
Provides **bounded** controller-side and protocol-side **helper** support for the platform where OpenDaylight offers useful leverage—**not** a second product brain and **not** the default source of SR topology or policy truth.

## Why it exists
Some SR policy and topology interactions may benefit from a purpose-built SDN controller. ODL fills that **optional** bounded role where it adds real leverage **without** centralizing the platform architecture on controller logic. **Product truth stays in `app-api` and gNMI-backed read paths; ODL inputs are observed and translated by the backend.**

## What it owns
- bounded controller-layer protocol handling
- controller-side state that may be useful to the backend
- future BGP-LS, BMP, and PCEP-related support where justified

## What it does not own
- platform business logic
- operator-facing product features
- metrics or time-series storage
- application state persistence
- workflow orchestration
- normalized product APIs
- final product truth by itself

## Runtime details
- image: `platform-odl:0.1.0`, built from `opendaylight/opendaylight:0.18.2` with a small startup wrapper for bounded credential provisioning
- ports: 8181 for northbound API access and 8101 for Karaf shell access
- env vars: `ODL_ADMIN_PASSWORD` for the bounded RESTCONF admin credential used by the backend capability probe
- mounts: none in the current topology skeleton; host config and data mounts can be added later with an explicit image-compatible layout and write-permissions strategy
- persistence: container-local controller state in the current topology skeleton; ODL is not the platform system of record
- dependencies: none at platform layer; integrates with lab topologies over the management plane

## Integration points
- `app-api` queries ODL through bounded integration modules
- ODL-derived records are treated as observed inputs, not the only source of truth
- ODL does not call the backend; the backend pulls from ODL
- `../scripts/verify-odl-auth.sh` provides a deploy-time regression check for the bounded RESTCONF credential path and the backend's ODL platform-health observation

## Current status
Topology-level service presence exists and the backend has a **single** bounded live ODL read enrichment on the Platform Health path: `app-api` performs a small RESTCONF capability probe against the controller's YANG library and operations inventory, then exposes that result as **backend-owned** platform status data. **Operator interpretation:** this probe is **reachability and capability hints only**—it does **not** validate SR paths, replace collector-backed topology or policy APIs, or imply that the controller adjudicates product correctness.

ODL still does not own topology, policy, or workflow truth.

The platform builds ODL as a local image so the controller's bounded RESTCONF admin credential is rotated at startup to the topology-configured `ODL_ADMIN_PASSWORD` value. This keeps the backend ODL probe authenticated without falling back to the upstream image default credential.

## Planned evolution
- documented bounded role in the platform topology
- Nokia-first controller-side integration where it adds real value
- bounded adapter in `app-api` for ODL queries
- normalized translation of ODL-derived data before exposure elsewhere

## Deeper topology truth (RESTCONF `ietf-network-topology`)

`app-api` may read **`GET /rests/data/ietf-network-topology:network-topologies`** (RFC 8345) for optional merge enrichment.

**Automated Karaf features:** at **image build** time, **`append-features-boot.sh`** appends every name in **`karaf-features.list`** to **`etc/org.apache.karaf.features.cfg`** **`featuresBoot`** (after the stock ODL bootstrap UUID). Karaf **installs and starts** those features on **every** process start, so redeploys are not dependent on a fragile `feature:install` client session (which previously hit **idle timeouts** and left most features uninstalled).

First boot after a new image can take **several minutes** while features resolve. If Karaf **fails to start**, remove or rename the offending feature in **`karaf-features.list`**, rebuild **`platform-odl`**, and redeploy.

Optional **runtime** `feature:install` (same list, long client timeout): set **`ODL_RUNTIME_KARAF_FEATURES_INSTALL=1`** on the ODL container (debug / recovery only).

If **`ietf-yang-library:modules-state`** still does not list **`ietf-network-topology`**, check that installs succeeded (**`docker logs clab-platform-odl`**) and that feature names match your OpenDaylight **release** (edit **`karaf-features.list`**, rebuild the image).

## Notes and caveats
ODL must remain a bounded helper. All operator-facing product logic lives in the backend and WebUI. If ODL capabilities are unavailable, the platform degrades gracefully.
The current bounded read enrichment is intentionally narrow: it only checks controller reachability and exposed capability hints. It does not treat ODL as the primary source for topology, policy, or reconciliation decisions.
