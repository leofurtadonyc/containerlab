# Author
Leonardo Furtado https://github.com/leofurtadonyc

# Lab credentials

User: clab

Password: clab 

## Disclaimer
I do NOT provide Arista images for this lab, so you must bring your own image. See the "Lab instructions" section in this document for details on how to import your image. 

# Topology

![cEOS-4S4L Topology](https://github.com/leofurtadonyc/containerlab/blob/main/ceos-4s4l/ceos-4s4l.png)

<a href="https://github.com/leofurtadonyc/containerlab/blob/main/ceos-4s4l/ceos-4s4l.pdf" target="_blank">Open cEOS-4S4L topology PDF</a>

# Executive Summary
We are building a training-grade digital twin of a single data center Clos fabric (4 spines, 4 leaves) that behaves like a production EVPN environment: deterministic under failure, fast to provision, observable by design, and automation-friendly. The topology includes four dual-homed Linux endpoints using LACP bonding, representing servers attached redundantly across ToR pairs (leaf1/leaf2 as “Rack A” and leaf3/leaf4 as “Rack B”).

This lab is intentionally designed around a common “service boundary” problem that shows up early in real networks: one VLAN must be available everywhere (shared services), while another VLAN must stay rack-local (blast-radius and governance). Concretely, this lab models VLAN 10 as stretched (192.168.10.0/24) and VLAN 20 as rack-local, implemented as 192.168.20.0/24 in Rack A and 192.168.30.0/24 in Rack B. This creates an environment where success is not “everything can talk to everything,” but rather “only the intended services are globally reachable.”

Three architecture families were evaluated. A controller-driven SDN fabric (ACI-like) can improve day-0 ergonomics but imposes platform coupling and a control-plane operating model that does not match teams that want standards-first workflows and Git-driven change. A traditional VLAN-centric or L3-only fabric reduces conceptual complexity but tends to either expand the failure domain (VLAN sprawl / STP-era patterns) or shift too much complexity to applications (hard L3 boundaries everywhere). We select EVPN-VXLAN because it makes L2/L3 services explicit, supports dual-homing and anycast gateway patterns, scales operationally with ECMP, and is naturally compatible with Infrastructure-as-Code and continuous validation.

This lab is the “practice field” where engineers can reproduce, break, observe, and fix failure modes in a deterministic way before those patterns exist in production. 

# Overview
The topology models a four-spine, four-leaf Clos fabric. Each leaf has uplinks to all spines, creating an ECMP-rich underlay that forces correct routing behavior and avoids single-path illusions. There are four dual-homed Linux hosts using LACP bonding (802.3ad) with VLAN subinterfaces, representing production-like server attachment and the realities of “redundancy is expected at the edge.”

The key learning mechanic is the service split:
- VLAN 10 is stretched across the entire fabric (192.168.10.0/24), representing shared services such as management reachability, shared tooling, or common platform dependencies.
- VLAN 20 is intentionally not stretched as a single L2 domain. Rack A uses 192.168.20.0/24; Rack B uses 192.168.30.0/24. This models rack-local services (or tenant slices) that must not accidentally become global broadcast domains.

The YAML is intentionally “topology-only,” with cEOS startup configurations mounted by binds. That separation is a design feature: topology stays stable, while intent (underlay, overlay, tenants, policies) evolves through config and automation.

# Audience
This README is written for two groups at once. The first group is technical: data center network engineers, NetDevOps engineers, and reliability engineers who want a realistic platform to practice design decisions, validate failure behavior, and build automation workflows around EVPN and service boundaries. The second group is business-oriented decision makers: infrastructure leaders, operations leaders, and risk/compliance stakeholders who need a coherent story for why a specific architecture family was selected, what tradeoffs it implies, and how it reduces operational risk while enabling faster delivery. 

Because this is a training artifact, the story and the requirements are fictional, but the tradeoffs and engineering principles are real. 

# The Challenges We’re Solving
The business goal is to deliver a modern fabric that can onboard services quickly without turning the entire data center into a single shared failure domain. The engineering goal is to make that outcome predictable: failures should be unsurprising, changes should be reviewable, and troubleshooting should scale beyond “the one person who knows the magic incantations.” 

This lab focuses on a very common early-stage failure pattern: the network starts small, and teams “temporarily” stretch VLANs everywhere because it makes connectivity easy. Over time, that temporary decision becomes permanent architecture, and the blast radius grows. Flooding, MAC churn, partial failures, and change coupling follow. The lab makes that failure mode visible by forcing you to justify which services are global (VLAN 10) and which must remain bounded (rack-local VLAN 20 modeled as distinct subnets per rack).

In parallel, the lab forces correct edge behavior. Dual-homed LACP hosts are included because they are where a lot of “it’s probably the underlay” debugging goes wrong. If the attachment domain is incorrect, you can generate symptoms that look like EVPN bugs, MTU problems, or ECMP hashing issues. This topology lets you practice proving the layers in order, instead of doing ping-driven engineering.

# Business Requirements and Technical Requirements
From a business perspective, we need a network that supports fast provisioning and safe change. Shared services must remain reachable across the fabric, but rack-local services must not become global by accident. Operations must be able to validate intent after every change, and new engineers must be able to learn the system without relying on tribal knowledge. 

From a technical perspective:
- The fabric must be L3 underlay with ECMP characteristics consistent with Clos designs (each leaf uplinks to all spines). 
- The edge must support dual-homed servers using LACP (802.3ad) while providing stable gateway semantics. 
- The overlay must support scalable L2/L3 services without spanning-tree assumptions.
- The design must allow service scoping: one service domain is global (VLAN 10), another is intentionally bounded per rack (VLAN 20 modeled as 20/30 subnets).
- The lab must be automation-friendly: topology declared in YAML, configs injected from files, validations repeatable.

# Options Considered
## Option 1: EVPN-VXLAN Fabric (Selected)
This design treats the data center as an L3 ECMP underlay with an EVPN control plane for tenant/service semantics. Leafs act as VTEPs and provide L2 and L3 services (including anycast gateway patterns), while spines provide scalable ECMP transport.

Most importantly for this lab’s use-case, EVPN gives you explicit, inspectable control-plane state for “what is reachable and why.” That makes it compatible with continuous validation: you can assert invariants like “VLAN 10 is present everywhere” and “rack-local VLAN 20 does not accidentally leak as a single global domain,” and then prove it with control-plane and service-plane checks.

## Option 2: Controller-driven SDN Fabric (ACI-like)
A controller-driven approach can deliver strong day-0 workflows and centralized policy expression. In exchange, it introduces platform coupling and a specific operational model (controller availability, controller upgrades, policy compilation behavior) that may not align with teams that want standards-first EVPN workflows and Git-driven config/intent pipelines.

For training, this option also reduces the learner’s exposure to the underlying distributed-system mechanics. That can be good for some audiences, but it is explicitly not the objective of this lab.

## Option 3: Traditional VLAN-centric design or L3-only fabric
A VLAN-centric approach optimizes for initial simplicity: VLANs, trunks, and “it pings.” Over time, it tends to expand the failure domain and makes troubleshooting nondeterministic under partial failures.

An L3-only fabric pushes segmentation and reachability policy into routing and applications. That can be a valid end-state, but as a training target it often hides the real-world transitional state: most organizations still need selective L2 semantics for specific services, and they need a disciplined operating model to avoid accidental sprawl.

#Pros and Cons
## Option 1: EVPN-VXLAN (Selected)
Pros: standards-based, scalable, and observable; supports dual-homing patterns; makes service boundaries explicit; compatible with IaC and repeatable validation; aligns with modern Clos + ECMP underlay designs. 

Cons: requires correct conceptual model (distributed control plane); misconfigurations can create “accidental success” unless you validate invariants; dual-homing semantics must match the intended model (EVPN multihoming vs MLAG). 

## Option 2: Controller-driven SDN
Pros: strong centralized workflows and policy abstraction; potentially faster initial provisioning for teams fully bought into the platform.

Cons: platform coupling; different failure modes (controller dependencies); may not match multi-team ownership or standards-first automation pipelines.

## Option 3: VLAN-centric / L3-only
Pros: easy to start; fewer moving parts initially.

Cons: VLAN-centric expands failure domain and becomes hard to reason about; L3-only can force premature application changes and doesn’t naturally represent selective L2 semantics when you still need them.

# How the Solution Works
Containerlab instantiates the topology and wires links exactly as declared. cEOS nodes boot with startup configurations mounted via binds, making the lab deterministic and Git-friendly. Linux hosts execute bonding and VLAN subinterface setup at container start, which produces a realistic server attachment model without manual steps.

Conceptually, the fabric is built and validated in layers:
- Physical graph is correct (containers up, interfaces up, expected link mapping).
- Host attachment is correct (bond0 exists, LACP is stable, VLAN subinterfaces exist).
- Underlay routing is correct (ECMP reachability among loopbacks/VTEPs).
- Overlay control plane is correct (EVPN adjacencies stable, expected routes present).

Service intent is correct:
- VLAN 10 behaves as “global shared service.”
- VLAN 20 behaves as “rack-local bounded service,” with rack-local reachability and explicit L3 policy governing anything beyond rack scope.

# Expected Outcomes in the Lab

The lab should demonstrate that:
- A host can lose one uplink (or one leaf in its pair) without losing connectivity, if multihoming is implemented correctly.
- A spine failure reduces ECMP capacity but does not break correctness.
- VLAN 10 reachability works across the entire fabric as a deliberately shared service.
- VLAN 20 does not behave like “one big L2 domain everywhere.” Rack A and Rack B are intentionally distinct for the second VLAN/subnet, and any cross-rack communication should be governed by explicit design choices rather than default flooding behavior.

# Limitations and Caveats
This topology is a high-fidelity training environment but not a hardware-accurate replica of ASIC behavior. Convergence timing, buffering, and some data-plane corner cases will differ from physical deployments. The lab is designed to teach the architecture and operating model, not to benchmark performance. 

The topology file does not include the actual device configurations. Many design choices (underlay protocol, BGP ASN plan, EVPN route-target scheme, VXLAN VNI mapping, and gateway behavior) live in the bound config files. Treat any mismatch between intent and config as a validation gap to fix.

The topology includes leaf-to-leaf links labeled “for ops / keepalive usage.” If the lab uses LACP on the host side, the network side must implement a compatible multihoming model. If your intent is EVPN multihoming (ESI-LAG), configs must reflect that explicitly. If you choose MLAG instead, update the story accordingly.

# Lab Instructions
This lab is built for Containerlab. You bring the topology (ceos-4s4l.clab.yml) and the device configs (configs/*.cfg), and Containerlab wires everything together into a reproducible EVPN training environment.

Prerequisites:
- You need a working container runtime and Containerlab itself.
- A container runtime: Docker Desktop, OrbStack, or any Docker-compatible engine.
- `containerlab` installed on your machine.

*Arista image is not available locally; you must bring your own.* This lab expects `ceos:4.35.1F`.

If you’re on macOS, OrbStack can be a great fit because it abstracts a lot of the typical Docker-on-Mac friction (networking, filesystem performance, VM management) while still presenting a Docker-compatible CLI experience. 

## Install a container runtime
Choose one:
- OrbStack (recommended on macOS): install OrbStack, then ensure the docker CLI works in your terminal.
- Docker Desktop: install Docker Desktop, start it, and confirm Docker is running. 

Verify:
```
docker version
docker ps
```
## Install Containerlab
On macOS (Homebrew):
```
brew install containerlab
```
Verify:
```
containerlab version
```
Clone this repository
```
git clone <REPO_URL>
cd <REPO_DIR>
```
You should see:
- `ceos-4s4l.clab.yml`
- `configs/` with all node startup configs
- `scripts/` with validation and failure drills (optional but recommended)

## Provide the Arista cEOS image
This lab references:
```
kinds:
  arista_ceos:
    image: ceos:4.35.1F
```
Typical approaches:
1. Load the image from a tarball you already have:
```
docker import cEOS64-lab-4.35.1F.tar.xz
```
Or tag an existing image to match what the lab expects:
```
docker tag <existing-image> ceos:4.35.1F
```
Validate the image exists:
```
docker images | grep -E "^ceos\s+4\.35\.1F"
```
## Deploy the lab
From the lab folder:
```
clab deploy -t ceos-4s4l.clab.yml
```
When it finishes, you should see the lab listed:
```
clab inspect -t ceos-4s4l.clab.yml
```
## Access nodes (interactive)
To open a CLI on a node:
```
containerlab exec -t ceos-4s4l.clab.yml --name leaf1 --cmd "Cli"
```
Or use Docker directly (Containerlab names containers like clab-labname-node):
```
docker exec -it clab-ceos-4s4l-leaf1 Cli
```
Linux hosts:
```
docker exec -it clab-ceos-4s4l-l4h1 bash
```
## Validate the lab (recommended)
If you’re using provided scripts:
```
chmod +x scripts/*.sh
scripts/validate-underlay.sh
scripts/validate-evpn.sh
scripts/validate-tenants.sh
scripts/validate-intent.sh
```
Or run everything:
```
scripts/validate.sh
```
## Tear down the lab
When you’re done:
```
clab destroy
```
##  Common issues

If deployment fails or nodes come up without the expected config, the fastest checks are:
- Confirm Docker runtime is healthy: `docker ps`
- Confirm the cEOS image exists: `docker images | grep ceos`
- Confirm the config binds exist on disk: `ls -l configs/`
- Confirm the lab name matches what scripts expect (default is `ceos-4s4l`)

# Appendix A: What This Topology Encodes
This lab models a 4x4 Clos fabric: four spines and four leaves, with each leaf connected to all spines. It also includes four dual-homed Linux hosts connected to leaf pairs, plus leaf-to-leaf links intended for ops/keepalive usage.

The host attachment model uses Linux bonding in 802.3ad mode with VLAN subinterfaces. VLAN 10 uses 192.168.10.0/24 across all hosts. The second VLAN is intentionally rack-scoped: hosts in the leaf1/leaf2 pair use 192.168.20.0/24, while hosts in the leaf3/leaf4 pair use 192.168.30.0/24.

# Appendix B: Bring-Up and Day-2 Workflows

This lab is designed to feel like a production network in one critical way: topology is stable, and behavior is driven by configuration and intent. The YAML file declares physical reality—devices, links, endpoints, and host attachment mechanics. The `configs/` directory declares network intent—underlay, overlay, tenants, policies.

A practical bring-up sequence follows the same discipline used in large environments. Start by validating the physical graph, then validate host LACP and VLAN subinterfaces, then validate the underlay reachability, then validate the EVPN control plane, and only then validate service behavior. The key is to avoid “ping-driven engineering” where we jump straight to endpoint tests without proving control plane adjacency and service-state correctness first.

## Repository layout expectations
This README assumes the repository uses the following structure:
- `ceos-4s4l.clab.yml` as the topology source of truth.
- `configs/` containing startup configs for every cEOS node referenced by binds.
- Optional `scripts/` for validation and failure injection helpers.
- Optional `docs/` for deeper protocol notes and design decisions.

## Bring-up flow: the path from “wires” to “services”
The most reliable way to bring up a Clos + EVPN lab is to prove each layer before moving up the stack. Start with “containers and interfaces,” then “host bonding,” then “underlay,” then “EVPN,” then “services.” Treat drift as failure and return truth to the repository.

##  Day-2 workflows: how you keep this sane at scale
Configuration changes must be reviewable. Your default operating model should be “propose → review → apply → validate,” not “SSH → edit → hope.” Validation must be repeatable, and invariants should be explicit (“VLAN 10 global; rack-local VLAN 20 bounded”).

# Appendix C: Validation and Failure Drills
This section defines what “good” looks like and how to prove it. The goal is not a pile of ping commands; the goal is confidence from layered validation: physical adjacency, control plane, service plane, and end-to-end experience. 

A practical minimum drill set for this topology includes:
- Single uplink failure on a leaf (ECMP reduces, no outage).
- Single spine failure (fabric continues, EVPN remains stable).
- Leaf failure in a dual-homed pair (host remains reachable via surviving leaf if multihoming is correct).
- Service-boundary checks (VLAN 10 works globally; rack-local VLAN 20 stays bounded unless explicitly routed).

# Appendix D: Extras
Devices:
- clab-ceos-4s4l-spine1
- clab-ceos-4s4l-spine2
- clab-ceos-4s4l-spine3
- clab-ceos-4s4l-spine4
- clab-ceos-4s4l-leaf1
- clab-ceos-4s4l-leaf2
- clab-ceos-4s4l-leaf3
- clab-ceos-4s4l-leaf4 

Hosts:
- clab-ceos-4s4l-l4h1
- clab-ceos-4s4l-l4h2
- clab-ceos-4s4l-l4h3
- clab-ceos-4s4l-l4h4 
- ceos-4s4l.clab

## IP addressing proposal for services (used in host exec blocks)
VLAN 10 (stretched L2 across both racks)
- Subnet: 192.168.10.0/24
- Anycast GW (later, on leaves): 192.168.10.1/24

Rack A second VLAN (modeled as “VLAN 20”)
- Subnet: 192.168.20.0/24 (GW 192.168.20.1)
- l4h1: 192.168.20.11/24
- l4h2: 192.168.20.12/24 

Rack B second VLAN (also modeled as “VLAN 20,” but intentionally different subnet for rack scoping)
- Subnet: 192.168.30.0/24 (GW 192.168.30.1)
- l4h3: 192.168.30.13/24
- l4h4: 192.168.30.14/24

##  Default credentials to Arista switches
- User: clab
- Password: clab

# Extras: “Two racks, two tenants, L2 stretch + L3 gateways everywhere”

- We’ll treat (leaf1, leaf2) as Rack A and (leaf3, leaf4) as Rack B.
- Each rack has a dual-homed server pair (our hosts), and each server is dual-homed via ESI-LAG to the rack leaf pair (all-active).

# Host placement
**Rack A (leaf1 + leaf2):**
- host1 dual-homed to leaf1/leaf2
- host2 dual-homed to leaf1/leaf2

**Rack B (leaf3 + leaf4):**
- host3 dual-homed to leaf3/leaf4
- host4 dual-homed to leaf3/leaf4

# “Two VLANs per host”
Each host gets two logical networks:
- VLAN 10 = “App” (L2VNI 10100)
- VLAN 20 = “DB” (L2VNI 10200)

On the hosts, we’ll present these as either:
- Two VLAN subinterfaces (e.g., bond0.10, bond0.20) over a single ESI-LAG, or
- Two separate bonds (less common in real DCs; I’d stick with one bond + VLAN tags)

This gives us a clean way to test L2/L3 behavior per segment while keeping the "physical" Containerlab topology wiring identical.

# What we’ll build in the fabric (services we can explore)
##  1) L2 bridging across racks (same VLAN, different rack)

- Goal: prove EVPN L2 reachability and all-active multi-homing behavior.
- VLAN 10 is stretched across both racks
- host1 (Rack A) ↔ host3 (Rack B) same subnet, same VLAN 10
- Traffic should traverse VXLAN between VTEPs (leafs) and MACs should be learned via EVPN

What we’ll explore:
- EVPN Type-2 MAC/IP routes
- split-horizon and DF election behavior per ESI
- What happens to MAC learning when we shut one leaf link vs the other vs the whole leaf

##  2) L3 routing within a VRF (inter-VLAN routing)
- Goal: route between VLAN 10 and VLAN 20 for the same tenant.
- Create VRF TENANT1
- Put VLAN10 SVI + VLAN20 SVI in the VRF on all leaves
- Use distributed anycast gateway (same GW IP per VLAN everywhere)
- Route VLAN10 ↔ VLAN20 locally at the ingress leaf (common DC behavior)

What we’ll explore:
- EVPN Type-5 routes (IP prefixes) if we advertise tenant prefixes that way
- or integrated routing and bridging (symmetric IRB) where the VRF uses an L3VNI
- How “default gateway” works under EVPN with multi-homed hosts

# 3) Dual-homed host behavior: all-active forwarding + failure domains
This is the “why ESI exists” part.

We can deliberately test:
- Single link failure (host ↔ leaf link down): should keep forwarding, minimal disruption
- One leaf down (leaf1 shutdown): host1/host2 still up via leaf2
- DF changes (if we use EVPN MH for bridging): verify who becomes DF for BUM replication
- Traffic hashing across both uplinks (LACP) from host perspective

4) Multi-tenant policy separation (optional but very educational)

Keep it simple but powerful:
- VLAN10 and VLAN20 are in TENANT1

Add TENANT2 later with VLAN110/VLAN120 and confirm:
- MAC/IP routes and ARP suppression separation per VRF
- No L2 leakage, no L3 route leaking unless configured

# Suggested addressing (so we can run meaningful tests)
##  VLAN 10 (“App”): stretched L2 across both racks
- Subnet: 192.168.10.0/24
- GW (anycast): 192.168.10.1

Example hosts:
- host1: 192.168.10.11
- host2: 192.168.10.12
- host3: 192.168.10.13
- host4: 192.168.10.14

##  VLAN 20 (“DB”): also stretched or kept local depending on what we want
Two good variants:

**Variant A (stretched too): good for pure L2 learning exercises**
- Subnet 192.168.20.0/24, GW 192.168.20.1

**Variant B (rack-local): better to explore L3 + EVPN Type-5 routing**
- Rack A VLAN20: 192.168.20.0/24 (host1/2 live here)
- Rack B VLAN20: 192.168.30.0/24 (host3/4 live here)

Then we route between racks using EVPN Type-5 (or use connected redistribution + overlay)

If our goal is “best explore L2 and L3,” Variant B gives us more signal:
- VLAN10 tests L2 stretching and EVPN MAC behavior
- VLAN20 tests L3 routing across the fabric (prefix routing)

A simple “lab storyline” (what we do step-by-step)

1) Bring up EVPN + VXLAN + ESI-LAG on hosts and leaves
2) Validate host bond/LACP: host sees both links active
3) Ping within VLAN10 across racks: host1 ↔ host3
4) Generate BUM: ARP, broadcast ping, watch EVPN behavior
5) Route VLAN10 ↔ VLAN20 inside TENANT1 (host1 to host1’s VLAN20 IP)
6) Route across racks on VLAN20 (Variant B) and confirm EVPN prefix distribution
7) Fail one link, then fail one leaf—observe reconvergence and traffic continuity

# Why this scenario matches EVPN all-active ESI (and not EVPN-MLAG)
Our dual-homed hosts are the multi-homing use case. We avoid the “single logical VTEP” MLAG abstraction and instead exercise:

a) EVPN Ethernet Segment (ES)
b) DF election
c) split-horizon
d) all-active load-sharing

# Regarding the BGP design of this topology
And why I put each leaf in its own ASN (65101–65104) while all spines share one ASN (65000).

That pattern is a very common eBGP Clos choice:

Spines share one ASN (e.g., 65000) so they look like a single “core AS” for the pod. Each leaf (or each leaf pair / rack) gets its own ASN so every leaf–spine session is true eBGP, and we get BGP’s native loop-prevention and clearer troubleshooting.

Several Arista’s ATD EVPN labs also describe spines as EVPN “Route Servers” that receive EVPN routes from leaves and naturally propagate them across the fabric in an eBGP design. So the intent was:

- Underlay: leaf↔spine eBGP for loopbacks and p2p
- Overlay: leaf↔spine eBGP EVPN, with spines acting as route servers (not VTEPs)

This Multi-AS (unique leaf ASNs; spines share one ASN) has the following pros and cons:

a) Pros
- Clean eBGP loop prevention (no special knobs).
- Easy to see where routes originate (AS-path tells us which leaf/rack).
- Scales cleanly; matches how many operators run eBGP Clos.

b) Cons / gotcha
- If we use route-target … auto, we can accidentally generate different RTs per leaf (because “auto” often derives from ASN), which will break EVPN import/export across leaves — which may lead us to no imported MAC/IP routes.
- In multi-AS we should either:
    - set RTs explicitly, or
    - Use an RT scheme that’s not tied to varying ASNs.

# Verifying the lab
##  IP addresses on hosts (i.e., host1)
```
~/labs/ceos-4s4l$ docker exec -it clab-ceos-4s4l-l4h1 bash
bash-5.0# 
bash-5.0# ifconfig
bond0     Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          inet6 addr: fe80::a8c1:abff:fe74:353a/64 Scope:Link
          UP BROADCAST RUNNING MASTER MULTICAST  MTU:1500  Metric:1
          RX packets:364 errors:0 dropped:10 overruns:0 frame:0
          TX packets:50 errors:0 dropped:1 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:45336 (44.2 KiB)  TX bytes:4740 (4.6 KiB)

bond0.10  Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          inet addr:192.168.10.11  Bcast:0.0.0.0  Mask:255.255.255.0
          inet6 addr: fe80::a8c1:abff:fe74:353a/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:3 errors:0 dropped:0 overruns:0 frame:0
          TX packets:11 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:168 (168.0 B)  TX bytes:866 (866.0 B)

bond0.20  Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          inet addr:192.168.20.11  Bcast:0.0.0.0  Mask:255.255.255.0
          inet6 addr: fe80::a8c1:abff:fe74:353a/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:1 errors:0 dropped:0 overruns:0 frame:0
          TX packets:11 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:56 (56.0 B)  TX bytes:866 (866.0 B)

eth0      Link encap:Ethernet  HWaddr 22:F1:E6:5E:61:86  
          inet addr:172.20.20.8  Bcast:172.20.20.255  Mask:255.255.255.0
          inet6 addr: 3fff:172:20:20::8/64 Scope:Global
          inet6 addr: fe80::20f1:e6ff:fe5e:6186/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:216 errors:0 dropped:63 overruns:0 frame:0
          TX packets:17 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:28490 (27.8 KiB)  TX bytes:1330 (1.2 KiB)

eth1      Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          UP BROADCAST RUNNING SLAVE MULTICAST  MTU:1500  Metric:1
          RX packets:148 errors:0 dropped:0 overruns:0 frame:0
          TX packets:17 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:18225 (17.7 KiB)  TX bytes:1784 (1.7 KiB)

eth2      Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          UP BROADCAST RUNNING SLAVE MULTICAST  MTU:1500  Metric:1
          RX packets:216 errors:0 dropped:0 overruns:0 frame:0
          TX packets:34 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:27111 (26.4 KiB)  TX bytes:3046 (2.9 KiB)

lo        Link encap:Local Loopback  
          inet addr:127.0.0.1  Mask:255.0.0.0
          inet6 addr: ::1/128 Scope:Host
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)
```
##  Ping tests
```
bash-5.0# ping 192.168.10.12
PING 192.168.10.12 (192.168.10.12) 56(84) bytes of data.
64 bytes from 192.168.10.12: icmp_seq=1 ttl=64 time=10.9 ms
64 bytes from 192.168.10.12: icmp_seq=2 ttl=64 time=0.582 ms
64 bytes from 192.168.10.12: icmp_seq=3 ttl=64 time=0.485 ms
^C
--- 192.168.10.12 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2045ms
rtt min/avg/max/mdev = 0.485/3.972/10.850/4.863 ms
```
```
bash-5.0# ping 192.168.10.13
PING 192.168.10.13 (192.168.10.13) 56(84) bytes of data.
64 bytes from 192.168.10.13: icmp_seq=1 ttl=64 time=7.72 ms
64 bytes from 192.168.10.13: icmp_seq=2 ttl=64 time=3.94 ms
64 bytes from 192.168.10.13: icmp_seq=3 ttl=64 time=2.62 ms
^C
--- 192.168.10.13 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 2.622/4.763/7.724/2.161 ms
```
```
bash-5.0# ping 192.168.10.14
PING 192.168.10.14 (192.168.10.14) 56(84) bytes of data.
64 bytes from 192.168.10.14: icmp_seq=1 ttl=64 time=7.03 ms
64 bytes from 192.168.10.14: icmp_seq=2 ttl=64 time=2.10 ms
64 bytes from 192.168.10.14: icmp_seq=3 ttl=64 time=2.13 ms
^C
--- 192.168.10.14 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
```
```
bash-5.0# ping 192.168.20.12
PING 192.168.20.12 (192.168.20.12) 56(84) bytes of data.
64 bytes from 192.168.20.12: icmp_seq=1 ttl=64 time=1.52 ms
64 bytes from 192.168.20.12: icmp_seq=2 ttl=64 time=0.542 ms
^C
--- 192.168.20.12 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1004ms
rtt min/avg/max/mdev = 0.542/1.031/1.520/0.489 ms
```
```
bash-5.0# ping 192.168.30.13
PING 192.168.30.13 (192.168.30.13) 56(84) bytes of data.
64 bytes from 192.168.30.13: icmp_seq=1 ttl=64 time=27.2 ms
64 bytes from 192.168.30.13: icmp_seq=2 ttl=64 time=3.70 ms
64 bytes from 192.168.30.13: icmp_seq=3 ttl=64 time=3.01 ms
^C
--- 192.168.30.13 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 3.013/11.312/27.228/11.257 ms
```
```
bash-5.0# ping 192.168.30.14
PING 192.168.30.14 (192.168.30.14) 56(84) bytes of data.
64 bytes from 192.168.30.14: icmp_seq=1 ttl=64 time=22.9 ms
64 bytes from 192.168.30.14: icmp_seq=2 ttl=64 time=4.48 ms
64 bytes from 192.168.30.14: icmp_seq=3 ttl=64 time=6.42 ms
^C
--- 192.168.30.14 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 4.476/11.268/22.906/8.267 ms
```
##  Switch interfaces (i.e., leaf1)
```
ssh lfurtado@clab-ceos-4s4l-leaf1

leaf1#show interfaces description 
Interface                      Status         Protocol           Description
Et1                            up             up                 to-spine1
Et2                            up             up                 to-spine2
Et3                            up             up                 to-spine3
Et4                            up             up                 to-spine4
Et5                            up             up                 to-host1 (l4h1)
Et6                            up             up                 to-host2 (l4h2)
Et7                            up             up                 
Lo0                            up             up                 
Lo1                            up             up                 
Ma0                            up             up                 
Po11                           up             up                 ESI-LAG to-host1 (l4h1) on leaf1/leaf2
Po12                           up             up                 ESI-LAG to-host2 (l4h2) on leaf1/leaf2
Vl10                           up             up                 
Vl20                           up             up                 
Vl4094                         down           lowerlayerdown     
Vl4097                         up             up                 
Vx1                            up             up                 
```
```
leaf1#show ip interface brief 
                                                                                      Address
Interface         IP Address            Status       Protocol                  MTU    Owner  
----------------- --------------------- ------------ -------------------- ----------- -------
Ethernet1         10.0.0.0/31           up           up                       1500           
Ethernet2         10.0.0.2/31           up           up                       1500           
Ethernet3         10.0.0.4/31           up           up                       1500           
Ethernet4         10.0.0.6/31           up           up                       1500           
Loopback0         10.255.1.1/32         up           up                      65535           
Loopback1         10.255.2.1/32         up           up                      65535           
Management0       172.20.20.10/24       up           up                       1500           
Vlan10            192.168.10.1/24       up           up                       1500           
Vlan20            192.168.20.1/24       up           up                       1500           
Vlan4094          10.255.10.1/32        down         lowerlayerdown           1500           
Vlan4097          unassigned            up           up                       9164
```
```
leaf1#show port-channel detailed 
Port Channel Port-Channel11 (Fallback State: Unconfigured):
Minimum links: unconfigured
Maximum links: unconfigured
Minimum speed: unconfigured
Current weight/Max weight: 1/16
  Active Ports:
       Port            Time Became Active       Protocol       Mode         Weight    State
    --------------- ------------------------ -------------- ------------ ------------ -----
       Ethernet5       2:13:18                  LACP           Active         1       Rx,Tx

Port Channel Port-Channel12 (Fallback State: Unconfigured):
Minimum links: unconfigured
Maximum links: unconfigured
Minimum speed: unconfigured
Current weight/Max weight: 1/16
  Active Ports:
       Port            Time Became Active       Protocol       Mode         Weight    State
    --------------- ------------------------ -------------- ------------ ------------ -----
       Ethernet6       2:13:19                  LACP           Active         1       Rx,Tx
```
##  BGP sessions and routes (i.e., leaf1)
```
leaf1#show bgp summary
BGP summary information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Neighbor            AS Session State AFI/SAFI                AFI/SAFI State   NLRI Rcd   NLRI Acc   NLRI Adv
---------- ----------- ------------- ----------------------- -------------- ---------- ---------- ----------
10.0.0.1         65000 Established   IPv4 Unicast            Negotiated              7          7          5
10.0.0.3         65000 Established   IPv4 Unicast            Negotiated              7          7         11
10.0.0.5         65000 Established   IPv4 Unicast            Negotiated              7          7         11
10.0.0.7         65000 Established   IPv4 Unicast            Negotiated              7          7         11
10.255.0.1       65000 Established   L2VPN EVPN              Negotiated             49         49         43
10.255.0.2       65000 Established   L2VPN EVPN              Negotiated             49         49         62
10.255.0.3       65000 Established   L2VPN EVPN              Negotiated             49         49         54
10.255.0.4       65000 Established   L2VPN EVPN              Negotiated             49         49         56
```
```
leaf1#show bgp evpn 
BGP routing table information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Route status codes: * - valid, > - active, S - Stale, E - ECMP head, e - ECMP
                    c - Contributing to ECMP, % - Pending best path selection
Origin codes: i - IGP, e - EGP, ? - incomplete
AS Path Attributes: Or-ID - Originator ID, C-LST - Cluster List, LL Nexthop - Link Local Nexthop

          Network                Next Hop              Metric  LocPref Weight  Path
 * >      RD: 10.255.1.1:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.2.1:1 auto-discovery 0000:0000:0000:0011:1111
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.1:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.2.1:1 auto-discovery 0000:0000:0000:0012:2222
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10 mac-ip aac1.ab34.3328
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 mac-ip aac1.ab34.3328
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:10 mac-ip aac1.ab74.353a
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 mac-ip aac1.ab74.353a
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.1:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10 imet 10.255.2.1
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 imet 10.255.2.1
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.2.1:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.1
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.2.1:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.1
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.10.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.20.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
```
##  Overall functioning of the EVPN-VXLAN
```
leaf1#show vxlan vni 
VNI to VLAN Mapping for Vxlan1
VNI         VLAN       Source       Interface            802.1Q Tag
----------- ---------- ------------ -------------------- ----------
10100       10         static       Port-Channel11       10        
                                    Port-Channel12       10        
                                    Vxlan1               10        
10200       20         static       Port-Channel11       20        
                                    Port-Channel12       20        
                                    Vxlan1               20        


VNI to dynamic VLAN Mapping for Vxlan1
VNI         VLAN       VRF           Source       
----------- ---------- ------------- ------------ 
10000       4097       TENANT1       evpn         
```
```
leaf1#show vxlan vtep detail 
Remote VTEPS for Vxlan1:

VTEP             Learned Via         MAC Address Learning       Tunnel Type(s)
---------------- ------------------- -------------------------- --------------
10.255.2.2       control plane       control plane              flood         
10.255.2.3       control plane       control plane              unicast, flood
10.255.2.4       control plane       control plane              unicast, flood

Total number of remote VTEPS:  3
```
```
leaf1# show vxlan address-table 
          Vxlan Mac Address Table
----------------------------------------------------------------------

VLAN  Mac Address     Type      Prt  VTEP             Moves   Last Move
----  -----------     ----      ---  ----             -----   ---------
  10  aac1.abcf.ee07  EVPN      Vx1  10.255.2.3       1       0:07:02 ago
                                     10.255.2.4     
  10  aac1.abd4.c664  EVPN      Vx1  10.255.2.3       2       0:07:30 ago
                                     10.255.2.4     
Total Remote Mac Addresses for this criterion: 2
```
```
leaf1#show bgp evpn route-type mac-ip vni 10300
BGP routing table information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Route status codes: * - valid, > - active, S - Stale, E - ECMP head, e - ECMP
                    c - Contributing to ECMP, % - Pending best path selection
Origin codes: i - IGP, e - EGP, ? - incomplete
AS Path Attributes: Or-ID - Originator ID, C-LST - Cluster List, LL Nexthop - Link Local Nexthop

          Network                Next Hop              Metric  LocPref Weight  Path
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
```
```
leaf1#show mac address-table vlan 20
          Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports      Moves   Last Move
----    -----------       ----        -----      -----   ---------
  20    001c.7300.0001    STATIC      Cpu
  20    aac1.ab34.3328    DYNAMIC     Po12       3       0:05:31 ago
  20    aac1.ab74.353a    DYNAMIC     Po11       3       0:05:44 ago
Total Mac Addresses for this criterion: 3

          Multicast Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       ----        -----
Total Mac Addresses for this criterion: 0
```
```
leaf1#show mac address-table vlan 10
          Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports      Moves   Last Move
----    -----------       ----        -----      -----   ---------
  10    001c.7300.0001    STATIC      Cpu
  10    aac1.ab34.3328    DYNAMIC     Po12       3       0:05:51 ago
  10    aac1.ab74.353a    DYNAMIC     Po11       3       0:05:59 ago
  10    aac1.abcf.ee07    DYNAMIC     Vx1        1       0:05:02 ago
  10    aac1.abd4.c664    DYNAMIC     Vx1        2       0:05:29 ago
Total Mac Addresses for this criterion: 5

          Multicast Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       ----        -----
Total Mac Addresses for this criterion: 0
```
```
leaf1#show bgp evpn route-type ip-prefix
BGP routing table information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Route status codes: * - valid, > - active, S - Stale, E - ECMP head, e - ECMP
                    c - Contributing to ECMP, % - Pending best path selection
Origin codes: i - IGP, e - EGP, ? - incomplete
AS Path Attributes: Or-ID - Originator ID, C-LST - Cluster List, LL Nexthop - Link Local Nexthop

          Network                Next Hop              Metric  LocPref Weight  Path
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.10.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.20.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
```
```
leaf1#show ip route vrf TENANT1 192.168.20.0/24

VRF: TENANT1
Source Codes:
       C - connected, S - static, K - kernel,
       O - OSPF, O IA - OSPF inter area, O E1 - OSPF external type 1,
       O E2 - OSPF external type 2, O N1 - OSPF NSSA external type 1,
       O N2 - OSPF NSSA external type2, O3 - OSPFv3,
       O3 IA - OSPFv3 inter area, O3 E1 - OSPFv3 external type 1,
       O3 E2 - OSPFv3 external type 2,
       O3 N1 - OSPFv3 NSSA external type 1,
       O3 N2 - OSPFv3 NSSA external type2, B - Other BGP Routes,
       B I - iBGP, B E - eBGP, R - RIP, I L1 - IS-IS level 1,
       I L2 - IS-IS level 2, A B - BGP Aggregate,
       A O - OSPF Summary, NG - Nexthop Group Static Route,
       V - VXLAN Control Service, M - Martian,
       DH - DHCP client installed default route,
       DP - Dynamic Policy Route, L - VRF Leaked,
       G  - gRIBI, RC - Route Cache Route,
       CL - CBF Leaked Route

 C        192.168.20.0/24
           directly connected, Vlan20
```
```
leaf1#show ip route vrf TENANT1 192.168.30.0/24

VRF: TENANT1
Source Codes:
       C - connected, S - static, K - kernel,
       O - OSPF, O IA - OSPF inter area, O E1 - OSPF external type 1,
       O E2 - OSPF external type 2, O N1 - OSPF NSSA external type 1,
       O N2 - OSPF NSSA external type2, O3 - OSPFv3,
       O3 IA - OSPFv3 inter area, O3 E1 - OSPFv3 external type 1,
       O3 E2 - OSPFv3 external type 2,
       O3 N1 - OSPFv3 NSSA external type 1,
       O3 N2 - OSPFv3 NSSA external type2, B - Other BGP Routes,
       B I - iBGP, B E - eBGP, R - RIP, I L1 - IS-IS level 1,
       I L2 - IS-IS level 2, A B - BGP Aggregate,
       A O - OSPF Summary, NG - Nexthop Group Static Route,
       V - VXLAN Control Service, M - Martian,
       DH - DHCP client installed default route,
       DP - Dynamic Policy Route, L - VRF Leaked,
       G  - gRIBI, RC - Route Cache Route,
       CL - CBF Leaked Route

 B E      192.168.30.0/24 [200/0]
           via VTEP 10.255.2.4 VNI 10000 router-mac 00:1c:73:0a:07:ed local-interface Vxlan1
```