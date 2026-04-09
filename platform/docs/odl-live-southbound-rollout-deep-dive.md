# ODL live southbound rollout deep dive

This document captures the current repo-owned implementation for the live ODL southbound rollout plan. It extends the bounded controller work already documented in `controller-southbound-session-truth-v2.md` and `deeper-topology-truth-implementation-deep-dive.md`; it does not replace those contracts or promote ODL into product truth.

## Scope and overlaps

- The backend still owns truth. ODL remains a bounded controller-side helper.
- `01-CURRENT-PHASE.md` stays unchanged: this work remains inside `phase_2_read_only_foundation`.
- The rollout overlaps existing controller work in two narrow ways:
  - `controller_southbound_session_truth_v2` now treats placeholder or config-only controller trees conservatively.
  - `topology_truth_v1` keeps optional ODL enrichment bounded and separate from device-backed topology truth.

## Phase-0 inventory now generated from topology truth

The repository now derives the rollout inventory from `nokia-sr-mpls/nokia-sr-mpls-lab3-full.clab.yml` instead of maintaining a hand-built southbound target list.

- Topology file: `nokia-sr-mpls/nokia-sr-mpls-lab3-full.clab.yml`
- Controller northbound/admin address: `192.168.0.232`
- Controller southbound/protocol address: `10.90.0.10/24`
- Southbound bridge: `br-odl-sb`
- Controller ASN: `64990`
- Inventory totals: 34 total nodes, 8 BGP-LS/PCEP PE targets, 24 NETCONF P/PE targets

Repo-owned config and generated artifacts:

- `platform/odl/config/southbound-rollout.yaml`
- `platform/odl/config/generated/southbound-inventory.json`
- `platform/odl/config/generated/protocol-peer-specs.json`
- `platform/odl/config/generated/netconf-node-specs.json`
- `platform/odl/config/generated/inventory-summary.md`
- `platform/odl/config/generated/configure-odl-southbound.sh`
- `platform/odl/config/generated/configure-odl-bgp-peer-acceptor.sh`
- `platform/odl/config/generated/apply-netconf-onboarding.sh`

Generation command:

```sh
cd platform/app-api
PYTHONPATH=src python3 scripts/generate-odl-southbound-artifacts.py
```

## Backend hardening added in this rollout

The rollout exposed a concrete honesty problem: stock ODL example trees and config-only lane scopes were being interpreted too optimistically.

The repo now hardens that behavior in four places:

- BGP-LS placeholder example topologies are ignored instead of being interpreted as live session-backed evidence.
- PCEP config-only rows are downgraded to scope-only evidence.
- Empty `topology-netconf` placeholders are ignored until mounted nodes actually exist.
- Generic native-session hint scanning now requires real positive session-state signals instead of treating config-shaped trees as live sessions.

An additional runtime regression was found during live NETCONF onboarding: once `topology-netconf` gained mounted nodes, the BGP-LS parser initially started misclassifying those rows as BGP-LS controller objects. The parser is now conservative when `topology-types` is absent: the topology must still look like link-state, otherwise it is ignored.

The latest live investigation proved the management-plane/Base-router mismatch, and the repo now codifies the corrective design:

- the platform host at `192.168.0.232` can reach device management addresses and SSH into the Nokia containers
- the Nokia SR OS `management-interface` address exists on the Docker `clab` network, but it is not usable as a `router "Base"` protocol source for the current BGP/PCEP configuration
- the repo now defines an explicit bridge `br-odl-sb`, lands ODL on `10.90.0.10/24`, and attaches every PE / CSC-PE southbound protocol target to that bridge on `1/1/c10/1`
- BGP-LS sources from real router-owned system loopbacks, and PCEP peers must explicitly prefer `inband` routing so SR OS does not default to the management plane first and ignore the configured Base-router `local-address`

That means the repo no longer depends on the management plane for Base-router BGP-LS/PCEP design. Northbound/admin stays on `192.168.0.232`; the intended southbound controller peer address is `10.90.0.10/24` on the explicit bridge.

## Current live runtime outcome

After rebuilding the platform and reapplying the generated NETCONF onboarding script to the live controller:

- ODL `topology-netconf` exposes 24 mounted node objects derived from the topology YAML.
- The current lab still reports those NETCONF nodes as `connecting`, not established.
- `GET /api/v1/controller/evidence` now keeps:
  - `bgp_ls` honest when only placeholder/example BGP trees exist
  - `pcep` at scope-only when only config-shaped `pcep-topology` data exists
  - `netconf` object-visible once mounted nodes exist, without claiming established session posture

This is the current honest interpretation:

- **Repo-owned NETCONF onboarding exists and works**: the controller receives the full P/PE mount set.
- **Live NETCONF transport is not yet proven**: mounted nodes remain `connecting`.
- **Repo-owned BGP-LS and PCEP pathing is now codified**: the repo carries the bridge topology, ODL southbound interface bootstrap, a runtime BGP peer-acceptor bootstrap that moves ODL from the packaged default listener port `1790` to `179`, and router-owned source addresses.
- **Live BGP-LS is now established controller-side**: after clearing stale SR OS ARP entries for the redeployed ODL MAC, all eight configured BGP-LS neighbors appear `ESTABLISHED` from ODL's `lab-bgp-rib`, and the backend now reports `bgp_ls.session_posture=established` with `session_backed` evidence.
- **Live PCEP root cause is now identified**: SR OS defaults PCEP peers to `route-preference both`, which tries out-of-band management reachability first. In that mode the PCC uses the management IP as its local address and ignores the configured Base-router `local-address`, so peers toward `10.90.0.10` never initiate on the southbound bridge. Setting `route-preference inband` on each PE / CSC-PE PCEP peer immediately forces loopback-sourced in-band reachability and brings the session up.

## Verification workflow

Base packaged-runtime verification remains:

```sh
cd platform
./scripts/prepare-odl-southbound-bridge.sh
./scripts/build-images.sh
containerlab deploy -t topology.clab.yml -c
./scripts/verify-core-runtime.sh
./scripts/verify-odl-auth.sh
```

Southbound-specific follow-up verification:

```sh
cd platform/odl/config/generated
./apply-netconf-onboarding.sh

cd ../../..
./scripts/verify-odl-southbound.sh
```

`verify-odl-southbound.sh` checks that:

- direct ODL `topology-netconf` node count matches the generated inventory target count
- the app-api NETCONF lane matches the direct ODL node count
- `bgp_ls` never reuses `topology-netconf` as BGP-LS evidence
- placeholder-only BGP-LS or config-only PCEP state cannot be misreported as established/session-backed
- NETCONF cannot be marked established/session-backed when all direct ODL mount rows are still non-connected

## Remaining gaps

Remaining work is concentrated in three places:

- device-side confirmation that NETCONF on port 830 is truly reachable and accepted, not merely mounted in ODL
- router-side PCEP bring-up now that the controller is listening correctly on `4189` and BGP-LS is up
- repeatable operator handling for stale SR OS ARP entries after ODL container redeploys, since the controller MAC on `10.90.0.10` changes with the container interface; the repo now exposes this as an explicit helper script (`platform/scripts/refresh-odl-southbound-peers.py`) rather than as an implicit side effect of deploy

Until those are implemented, `03-CURRENT-STATUS.md` should not claim a fully live ODL southbound rollout. The repo now has deterministic inventory generation, honest controller evidence, live BGP-LS establishment, and live NETCONF object onboarding, but not a completed end-to-end PCEP and NETCONF session rollout.