# OpenDaylight (ODL)

## Purpose
Provides bounded controller-side and protocol-side support for the platform where OpenDaylight offers useful leverage.

## Why it exists
Some SR policy and topology interactions may benefit from a purpose-built SDN controller. ODL fills that bounded role where it provides real leverage instead of forcing the whole platform architecture through controller logic.

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
- image: `opendaylight/opendaylight:latest` in the current topology skeleton
- ports: 8181 for northbound API access and 8101 for Karaf shell access
- env vars: `ODL_ADMIN_PASSWORD` placeholder in the current topology skeleton
- mounts: `./odl/config:/opt/opendaylight/etc`, `./odl/data:/opt/opendaylight/data`
- persistence: bounded controller data only; ODL is not the platform system of record
- dependencies: none at platform layer; integrates with lab topologies over the management plane

## Integration points
- `app-api` queries ODL through bounded integration modules
- ODL-derived records are treated as observed inputs, not the only source of truth
- ODL does not call the backend; the backend pulls from ODL

## Current status
Topology-level service presence exists and the backend now has an explicit ODL integration skeleton location. No substantive controller integration is implemented yet.

## Planned evolution
- documented bounded role in the platform topology
- Nokia-first controller-side integration where it adds real value
- bounded adapter in `app-api` for ODL queries
- normalized translation of ODL-derived data before exposure elsewhere

## Notes and caveats
ODL must remain a bounded helper. All operator-facing product logic lives in the backend and WebUI. If ODL capabilities are unavailable, the platform degrades gracefully.
