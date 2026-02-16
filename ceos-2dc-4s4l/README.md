# Author
Leonardo Furtado https://github.com/leofurtadonyc

# Lab credentials
User: clab
Password: clab

# Topology

![cEOS-2DC-4S4L Topology](https://github.com/leofurtadonyc/containerlab/blob/main/ceos-2dc-4s4l/ceos-2dc-4s4l.png)

<a href="https://github.com/leofurtadonyc/containerlab/blob/main/ceos-2dc-4s4l/ceos-2dc-4s4l.pdf" target="_blank">Open cEOS-2DC-4S4L topology PDF</a>

# Executive Summary
We are building a training-grade digital twin of a two–data-center network that must behave like a modern production environment: predictable under failure, fast to provision, observable by design, and automation-friendly. The chosen architecture is an EVPN-VXLAN fabric in each data center (DC1 and DC2), interconnected by a minimal DCI consisting of two inter-DC links that transport EVPN services using MPLS semantics. The topology intentionally creates constraints that mirror real-world operating conditions: limited DCI capacity and limited physical diversity, while still requiring high availability, multi-tenancy, dual-homed servers, and clean failure domains.

Three architecture families were evaluated. A controller-driven SDN fabric (ACI-like) provided strong day-0 ergonomics but imposed platform coupling and a control-plane operating model that did not match our multi-domain ownership needs. A traditional VLAN-centric design or L3-only fabric reduced conceptual complexity but produced unacceptable blast radius, slow troubleshooting, and weak service agility under a two-DC active/active goal. EVPN-VXLAN per DC with an EVPN-MPLS DCI was selected because it makes the network behave like a set of explicit services with explicit policy boundaries, while remaining standards-based, scalable, and suitable for Infrastructure-as-Code and continuous validation.

This lab is the “practice field” where engineers can reproduce, break, observe, and fix failure modes in a deterministic way before those patterns exist in production.

# Overview
The topology models two separate data centers, each with a four-spine, four-leaf Clos fabric. Each leaf has uplinks to all spines, and each data center hosts four dual-homed Linux endpoints using LACP bonding, representing servers attached redundantly across two ToR switches. Each data center also includes two additional routers connected only to spine1 and spine3, representing border/aggregation elements where DC fabric services are handed off into a transport domain. Finally, the two DCs are interconnected by exactly two links: `dc1-router1 <-> dc2-router1` and `dc1-router2 <-> dc2-router2`. This is not an accidental simplification; it is the defining constraint. The lab is built to show how a modern architecture behaves when the DCI is intentionally small, bounded, and easy to reason about.

Within each DC, EVPN-VXLAN is the service fabric. It provides scalable L2 and L3 multi-tenant services over an L3 underlay, and it supports dual-homing and Anycast Gateway patterns that are standard in modern data centers. Between DCs, the DCI is modeled as two router pairs capable of transporting EVPN services using MPLS service constructs. In practical terms, this allows us to treat inter-DC connectivity as a portfolio of services that can be policy-controlled (which tenants, which VNIs/VRFs, which prefixes) rather than as “one big stretched domain.”

This lab is intentionally “topology-only” in the YAML file, with device configuration injected by startup-config binds. That separation is a design feature: the topology is stable; the intent, policy, and services evolve through configuration and automation.

# Audience
This README is written for two groups at once. The first group is technical: data center network engineers, service provider/transport engineers, NetDevOps engineers, and reliability engineers who need a realistic platform to practice design decisions, understand failure behavior, and build automation workflows. The second group is business-oriented decision makers: infrastructure leaders, operations leaders, and risk/compliance stakeholders who need a coherent story for why a specific architecture family was selected, what tradeoffs it implies, and how it reduces operational risk while enabling faster delivery.

Because this is a training artifact, the story and the requirements are fictional, but the tradeoffs and engineering principles are real.

# The Challenges We’re Solving
The business goal is an active/active two-DC posture without turning the interconnect into a shared failure domain. The engineering goal is to deliver that posture with predictable behavior, high change velocity, and troubleshooting that scales with the organization rather than relying on a small number of experts.

The problem we are avoiding is the legacy pattern where two data centers are “connected” by stretching VLANs everywhere and hoping the network remains stable. That approach often creates one giant failure domain with complex interactions between L2 flooding, MAC churn, and partial failures. In those environments, the DCI becomes the most fragile element of the system, and every incident becomes a cross-team coordination problem because the network lacks explicit service boundaries.

We are also avoiding the opposite extreme: forcing every application to be rewritten to tolerate hard L3 boundaries overnight. A successful migration needs a steady-state architecture that is L3-first, but it must still support a limited set of L2 extension use cases under tight governance.

In parallel, we must solve for operational reality. Troubleshooting must be deterministic, and the system must be observable by default. A design that “works” but does not produce explainable signals under failure is not acceptable. Similarly, a design that requires manual, device-by-device changes is not compatible with the scale and reliability expectations of modern services.

The topology reflects these challenges. Dual-homed hosts using LACP represent a world where server teams expect redundancy and stable gateway semantics. The spine/leaf fabric represents a world where ECMP is non-negotiable. The two-link DCI represents a world where transport is constrained and must be treated as a set of intentional services rather than a giant shared broadcast domain.

# Business Requirements and Technical Requirements
From a business perspective, we require two data centers that can both serve traffic, tolerate component failures, and enable rapid service provisioning without increasing outage risk. We want onboarding and training to be fast and repeatable, and we want change management to be grounded in evidence rather than heroics. The organization must retain vendor optionality where practical and avoid designs that force a single proprietary operational model unless the benefits are overwhelming.

From a technical perspective, each DC must run a modern Clos fabric with an L3 underlay and an overlay capable of multi-tenant segmentation. The network must support dual-homed servers, Anycast Gateway, and scalable L2/L3 services without relying on spanning-tree. Inter-DC connectivity must support both L3 services for the majority of applications and selective L2 extension for explicitly approved use cases. The DCI must allow clear policy control over what is transported across DCs, and it must behave predictably when one of the two inter-DC links fails.

The lab must be compatible with automation workflows. Topology is declarative in Containerlab. Device configurations are injected from files. This naturally enables Git-driven change, config rendering, validation, drift detection, and repeatable test runs.

# Options Considered
## Option 1: EVPN-VXLAN per DC + EVPN-MPLS for DCI (Selected)
This design treats each data center as its own EVPN-VXLAN domain. Leafs act as VTEPs and provide tenant services. The underlay is an L3 ECMP fabric. Tenant segmentation is implemented as VRFs and VNIs, with EVPN providing the control plane for MAC/IP reachability and integrated L2/L3 service semantics.

The DCI is treated as a service transport domain. Instead of “stretching the fabric,” we transport explicitly selected services between DC1 and DC2 using EVPN over MPLS constructs on the router pairs. The key idea is that inter-DC connectivity is not a single thing; it is a portfolio of services with explicit import/export policy.

This architecture aligns with how hyperscalers and modern large enterprises scale operations: clear domains, explicit services, predictable failure behavior, and automation hooks everywhere.

## Option 2: Controller-driven SDN Fabric (ACI-like Multi-Site)
This design shifts a significant portion of fabric behavior into a controller-based model. Day-0 operations are often excellent: consistent configuration generation, policy abstraction, and centralized visibility. Multi-site features can provide a unified way to connect data centers, sometimes with built-in guardrails.

However, this approach introduces a strong dependency on the controller ecosystem and its operational model. The organization must accept that fabric lifecycle, policy semantics, troubleshooting workflows, and sometimes even integrations are tied to the controller platform. For teams that want or need multi-vendor interoperability across domains, or for organizations that operate DC and transport as separate ownership domains, the coupling can become an ongoing constraint.

## Option 3: Traditional Designs (VLAN-centric stretch or non-EVPN L3-only)
This option includes the familiar patterns many organizations start with: VLAN-based segmentation, MLAG pairs, spanning-tree control, and some form of L2 DCI, possibly augmented with manual routing and ACL policy. A variant of this option is L3-only leaf/spine without EVPN, where VRFs and routing policies are manually stitched and L2 extension is either avoided entirely or implemented with ad-hoc mechanisms.

These designs can work at smaller scales or stable environments, but they tend to fail the “two-DC active/active under change” test. Failure domains are difficult to control, service provisioning becomes slow and error-prone, and troubleshooting becomes deeply stateful and hard to automate.

# Pros and Cons
## Option 1 (Selected): EVPN-VXLAN + EVPN-MPLS DCI
The primary advantage is that it is service-oriented by construction. Within a DC, EVPN-VXLAN scales tenant services while preserving a clean L3 underlay. Between DCs, EVPN-MPLS allows us to export only what we intend to export. That explicitness becomes the foundation for governance, security posture, and automation. The architecture is also inherently aligned with continuous validation: if services are explicit, they can be tested and monitored explicitly.

The primary cost is complexity. Engineers must understand EVPN semantics, underlay/overlay interactions, route-target policy, and the operational signals that appear under failure. The system has more moving parts than a small traditional network. In exchange, the complexity is structured, repeatable, and automatable.

## Option 2: Controller-driven SDN (ACI-like)
The primary advantage is operational cohesion within the ecosystem. Teams often deliver outcomes faster early in the lifecycle, and standardized workflows can reduce configuration drift and inconsistency. For organizations that are willing to standardize on a single vendor fabric and operating model, the productivity gains can be significant.

The primary downside is dependency. When the controller model is the network, the organization’s ability to evolve, integrate, and sometimes even troubleshoot is mediated by that platform. Cross-domain boundaries (DC vs transport vs security) can also become more rigid than desired, and “non-standard” use cases may force awkward solutions.

## Option 3: Traditional
The primary advantage is familiarity and a lower barrier to entry. Many teams can build and operate such networks with existing skills, and initial deployments may be straightforward.

The primary downside is that the operating model does not scale to active/active two-DC ambitions. L2 extension increases blast radius, and manual policy stitching increases change risk. Troubleshooting becomes costly because the system does not naturally encode intent; it encodes state, and state is hard to reason about after failures.

# Decision and Why this Current Containerlab Setup Won
We selected EVPN-VXLAN per DC with an EVPN-MPLS DCI because it makes the network’s behavior explicit and governable under the constraints that matter: dual-homed endpoints, multi-tenant segmentation, and a limited inter-DC transport surface consisting of two links.

The topology expresses a deliberate separation of concerns. The Clos fabrics in DC1 and DC2 provide scalable east-west connectivity and local service delivery. The router pairs are the boundary where services are intentionally exported across DCs. The DCI is deliberately small so that its failure behavior is easy to test and so that service selection and policy become the primary mechanism, not bandwidth brute force.

This choice is also aligned with the engineering culture we want. It is an architecture that can be expressed as code, validated continuously, and observed with precision. It provides a platform where engineers can practice failures, understand the signals, and build runbooks that work because the system behaves predictably.

# How the Solution Works (High-Level Design)
## Topology and Roles
Each DC contains four spines and four leaves. Each leaf connects to all four spines, producing ECMP-rich forwarding paths and isolating failures to a small subset of links or devices. Two “router” nodes per DC connect only to spine1 and spine3, which intentionally models limited aggregation diversity. This creates a meaningful design constraint: not every spine is a border spine, and not every failure is gracefully absorbed by full mesh diversity.

Each DC hosts four Linux endpoints. Every endpoint is dual-homed into a pair of leaves, using LACP bonding in 802.3ad mode. Each host also creates VLAN subinterfaces (for example VLAN 10 and VLAN 20/30) and assigns IP addresses within those subnets. This forces the fabric to provide both L2 adjacency semantics and L3 gateway semantics in a way that mimics real workloads.

Between DC1 and DC2, there are only two DCI links. These links connect router-to-router. No leaf-to-leaf or spine-to-spine inter-DC shortcuts exist. This means the DCI is a controlled chokepoint by design, forcing correct service modeling and correct policy.

## Intra-DC Behavior: EVPN-VXLAN
Inside each DC, leaves act as VTEPs for VXLAN encapsulation. EVPN distributes endpoint reachability so that the fabric does not rely on flooding for correctness beyond what is necessary. Tenant segmentation is implemented using VRFs and VNIs, enabling multiple isolated routing domains to coexist across the same physical fabric. Anycast gateway behavior on the leaves allows hosts to use stable default gateways even when attached to different ToRs.

Because hosts are dual-homed using LACP, the design expects the leaf pair to provide a consistent attachment domain for each server. In production EVPN designs, this is often implemented with EVPN multihoming (ESI-LAG) rather than classical MLAG. The topology file explicitly states that leaf-to-leaf links are for ops/keepalive and are not MLAG for ESI, which implies that the intended learning path includes exploring EVPN multihoming semantics rather than falling back to traditional MLAG behavior. We are not using this inter-leaf links in the lab as multihoming will work through EVPN ESI.

## Inter-DC Behavior: EVPN-MPLS Service Transport
The router pairs represent the handoff between the DC service fabric and the inter-DC transport domain. The interconnect is modeled as two independent links between the router pairs. In an EVPN-MPLS DCI approach, these routers provide a mechanism to carry EVPN services across DCs as explicit services. This is conceptually different from simply stretching a VLAN or bridging the two DCs together. The service transport can carry L3 services (preferred steady-state) and can carry selective L2 services when explicitly required, with clear control over what is imported and exported.

This is the core architectural principle of the story: inter-DC connectivity is not “the network.” Inter-DC connectivity is a set of services that must be named, governed, monitored, and validated.

# Expected Outcomes in the Lab
The lab should demonstrate that endpoints within the same DC and same tenant can communicate with stable gateway behavior, that failures in a single spine or a subset of uplinks do not break connectivity, and that inter-DC reachability depends on explicit service export across the routers and the two DCI links. It should also demonstrate that the failure of one DCI link degrades capacity and possibly convergence timing but does not destroy correctness if services are modeled properly.

# Limitations and Caveats
This topology is a high-fidelity training environment but not a hardware-accurate replica of ASIC behavior. Convergence timing, buffering, and some data-plane corner cases will differ from physical deployments. The lab is designed to teach the architecture and the operating model, not to benchmark performance.

The topology file does not include the actual configurations, and many design choices (underlay protocol, BGP ASN plan, EVPN route-target scheme, VXLAN VNI mapping, gateway IP addressing, and DCI service model) live in the bound config files. This README describes the intended architecture family. The truth of the implementation is in configs/*.cfg, and any mismatch should be treated as a validation gap, not as a documentation problem.

The leaf-to-leaf links are labeled as “ops/keepalive; NOT MLAG for ESI.” This is an important caveat. If the lab uses LACP on the host side, then the network side must support a compatible multihoming model. If the intent is EVPN multihoming (ESI-LAG), the configuration must reflect that explicitly. If the intent is MLAG, then the narrative must change and the topology comment would be misleading. The topology strongly suggests the lab is intended to explore EVPN multihoming, and therefore the configs should be aligned with that goal.

Finally, the DCI is intentionally minimal. With only two links and two router pairs, some failure scenarios will create sharp edges. That is desirable for training: it forces policy discipline and service modeling. It also means that the lab is not claiming to represent a fully diverse, carrier-grade DCI. It is representing the common real-world case where the DCI starts constrained and must be engineered carefully.

# Lab Instructions
This lab is built for Containerlab. You bring the topology (`ceos-2dc-evpn-dci.clab.yml`) and the device configs (`configs/*.cfg`), and Containerlab wires everything together into a reproducible two–data-center EVPN environment.

Prerequisites:
- You need a working container runtime and Containerlab itself.
- A container runtime: Docker Desktop, OrbStack, or any Docker-compatible engine.
- `containerlab` installed on your machine.

The cEOS image available locally (this lab expects `ceos:4.35.1F`).

If you’re on macOS, OrbStack can be a great fit because it abstracts a lot of the typical Docker-on-Mac friction (networking, filesystem performance, VM management) while still presenting a Docker-compatible CLI experience.

1) Install a container runtime

Choose one:
- OrbStack (recommended on macOS): install OrbStack, then ensure the docker CLI works in your terminal.
- Docker Desktop: install Docker Desktop, start it, and confirm Docker is running.

Verify:
```
docker version
docker ps
```

You should see a valid client/server version and an empty (or existing) container list.

2) Install Containerlab

On macOS (Homebrew):
```
brew install containerlab
```

Verify:
```
containerlab version
```

If you’re on Linux, you can use your package manager or install from the official release instructions for your distro. The success criteria is simply that `containerlab` runs locally and can talk to your container runtime.

3) Clone this repository
```
git clone <REPO_URL>
cd <REPO_DIR>
```

You should see:

- `ceos-2dc-evpn-dci.clab.yml`
- `configs/ with all node startup configs`
- `scripts/` with validation and failure drills (optional but recommended)

4) Provide the Arista cEOS image

This lab references:
```
kinds:
  arista_ceos:
    image: ceos:4.35.1F
```

You must have that image available in your local container runtime.

Typical approaches:

Load the image from a tarball you already have:

`docker import cEOS64-lab-4.35.1F.tar.xz`

Or tag an existing image to match what the lab expects:
```
docker tag <existing-image> ceos:4.35.1F
```

Validate the image exists:
```
docker images | grep -E "^ceos\s+4\.35\.1F"
```
5) Deploy the lab

From the lab folder:
```
clab deploy -t ceos-2dc-evpn-dci.clab.yml
```

Containerlab will:
1. Create the containers
2. Wire all links exactly as declared
3. Mount your startup configs into each cEOS node

When it finishes, you should see the lab listed:
```
clab inspect -t ceos-2dc-evpn-dci.clab.yml
```
6) Access nodes (interactive)

To open a shell/CLI on a node, you can SSH directly to the devices' names.

Alternatively:
```
containerlab exec -t ceos-2dc-evpn-dci.clab.yml --name dc1-leaf1 --cmd "Cli"
```

Or use Docker directly (Containerlab names containers like clab-labname-node):
```
docker exec -it clab-ceos-2dc-evpn-dci-dc1-leaf1 Cli
```
Linux hosts can be accessed similarly:
```
docker exec -it clab-ceos-2dc-evpn-dci-dc1-host1 bash
```

7) Validate the lab (recommended)

If you’re using the provided scripts:
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

8) Tear down the lab

When you’re done:
```
clab destroy
```

Common issues

If deployment fails or nodes come up without the expected config, the fastest checks are:

1. Confirm Docker runtime is healthy: `docker ps`
2. Confirm the cEOS image exists: `docker images | grep ceos`
3. Confirm the config binds exist on disk: `ls -l configs/`
4. Confirm the lab name matches what scripts expect (default is `ceos-2dc-evpn-dci`)

If you’re on macOS and you keep running into Docker Desktop resource limits or networking oddities, OrbStack is often the simplest way to remove that overhead and keep the lab setup “boring.”

# Appendix A: What This Topology Encodes (Directly From the YAML)
Each DC has four spines and four leaves, with each leaf connected to all spines. Each DC has four dual-homed hosts attached to leaf pairs. Each DC has two additional routers connected to spine1 and spine3 (both routers connect to both of those spines). The two DCs are connected only by two links: router1-to-router1 and router2-to-router2.

The host attachment model uses Linux bonding in 802.3ad mode with VLAN subinterfaces. Hosts in DC1 use subnets 192.168.10.0/24 plus VLAN-specific subnets like 192.168.20.0/24 and 192.168.30.0/24. Hosts in DC2 use 192.168.10.0/24 plus 192.168.120.0/24 and 192.168.130.0/24. This asymmetry is intentional training material: it forces the design to prove which services are local and which must be transported across DCs, and it prevents accidental “it works because everything is the same VLAN everywhere” outcomes.

# Appendix B: Bring-Up and Day-2 Workflows
This lab is designed to feel like a production network in one critical way: topology is stable, and behavior is driven by configuration and intent. The YAML file declares physical reality—devices, links, endpoints, and host attachment mechanics. The `configs/` directory declares network intent—underlay, overlay, tenants, policies, and inter-DC service exports. When those two are cleanly separated, you can operate the lab the same way you would operate a real network: review changes, apply changes, validate outcomes, and treat drift as a bug.

A practical bring-up sequence follows the same discipline used in large environments. We start by validating the physical graph (links, interfaces, LACP state), then validate the underlay reachability, then validate the overlay control plane, then validate tenant services, and finally validate inter-DC service transport. The key is to avoid “ping-driven engineering” where we jump straight to endpoint tests without proving control plane adjacency and service-state correctness first.

## Repository layout expectations
This README assumes the repository uses the following structure:
- `ceos-2dc-evpn-dci.clab.yml` as the topology source of truth.
- `configs/` containing startup configs for every cEOS node referenced by binds.
- Optional `scripts/` for validation and failure injection helpers.
- Optional `docs/` for deeper protocol notes and design decisions.

If the lab expands, resist the urge to put everything into the topology YAML. Keep topology declarative and minimal. Keep intent and service definitions in the config or an intent layer that renders config.

## Bring-up flow: the path from “wires” to “services”
The most reliable way to bring up a Clos + EVPN lab is to prove each layer before moving up the stack.

First, deploy the topology and ensure that every node is alive, reachable, and running the correct startup configuration. The binds in the YAML mount a startup config for each cEOS device. If a device boots without the intended config, every downstream test becomes noisy and misleading. Treat “wrong config loaded” as a first-class failure.

Second, validate link-state and port mapping. Containerlab will build links correctly, but operational mistakes are usually semantic: the config expects eth1 to be a spine uplink, but the topology wires eth1 differently, or the underlay IP plan assumes a port ordering that doesn’t match reality. In a Clos, a single miswired uplink can create asymmetric reachability that looks like a routing bug. You want to eliminate that class of failure early.

Third, validate host LACP and VLAN subinterfaces. The Linux hosts build bond0 with 802.3ad, then create VLAN subinterfaces and assign IPs. If LACP is down, host connectivity becomes intermittent in ways that mimic MTU, ECMP hashing, or EVPN issues. You need to know that the server-facing attachment is correct before you blame the overlay.

Fourth, validate the underlay routing. Regardless of whether the underlay is eBGP, OSPF, or IS-IS, the success criterion is the same: every leaf must have reliable IP reachability to every spine loopback and to every other leaf loopback through ECMP paths, and spines must have reliable reachability to leaf loopbacks. Without underlay correctness, EVPN will fail in ways that are hard to interpret.

Fifth, validate the overlay control plane. EVPN is not a “feature you enable”; it’s a distributed system. The success criterion is that BGP EVPN adjacencies are established and stable, the EVPN tables have the expected routes, and the VTEP reachability (Vxlan tunnel endpoints) is correct. When EVPN is healthy, service behavior becomes predictable and debugging becomes a matter of checking which service is missing which advertisement.

Sixth, validate tenant services inside a DC. Start with one tenant and one VLAN/VNI. Prove that ARP/ND, MAC learning, and Anycast Gateway behave as expected. Then expand to multiple VLANs and VRFs. This lab intentionally uses VLAN 10 everywhere, but uses distinct second VLANs per host group (20/30 in DC1 and 120/130 in DC2). That asymmetry is an advantage: it forces you to articulate which services are local and which are exported across DCs, instead of “everything works because the same VLAN exists everywhere.”

Finally, validate inter-DC service transport. The DCI here is intentionally minimal: two links, router-to-router only. That constraint forces discipline. Inter-DC reachability should exist only for the services you explicitly export and import. If “everything can talk to everything” across DCs, that’s almost certainly a policy failure, not a success.

## Day-2 workflows: how you keep this sane at scale
This lab is most valuable when you operate it like a real environment. Day-2 is where most networks fail—not because the initial design was wrong, but because change became unsafe.

Configuration changes must be reviewable. This lab already encourages that: configs are files under version control. Your default operating model should be “propose → review → apply → validate,” not “SSH → edit → hope.”

Service changes must be expressed as intent. Even if you don’t yet have a formal intent engine, you can behave as if you do. Treat “tenant = VRF + VNIs + RT policy + gateway behavior + export rules” as a bundle. When you add a tenant, you add the whole bundle. When you export a service across DCI, you do it explicitly and document it.

Validation must be repeatable. A working network is not a feeling; it is a set of invariants. The lab becomes truly useful when you can run the same validations after every change and get the same results. If validation is manual and ad-hoc, you will drift toward a fragile system—even in a lab.

Drift must be detectable. Even in Containerlab, drift happens: someone modifies a node interactively, or the wrong startup-config loads. Treat drift as a failure. The correct response is not “fix it live,” but “make the repository the truth again.”

# Appendix C: Validation and Failure Drills
This section defines what “good” looks like and how to prove it. The goal is not to produce a pile of ping commands; the goal is to produce confidence. Confidence comes from layered validation: you prove physical adjacency, then control plane, then service plane, then end-to-end experience. When something fails, you want the failure to map cleanly to one layer.

## Validation philosophy: invariants over anecdotes
A ping is an anecdote. It tells you one packet got through at one moment. In a distributed system, anecdotes are not enough. Invariants are stronger: “every leaf has four equal-cost paths to the spines,” “every EVPN session is established,” “every tenant VRF has the expected route-target policy,” “the DCI exports only these services.”

The lab is structured specifically so these invariants can be checked. The Clos is symmetrical. Hosts are dual-homed with LACP. DCI is constrained. If you build the right checks, you can detect miswires, policy leaks, and partial failures quickly.

## Layer 1: Physical and attachment validation
At the base, you validate that links are up where they should be up and down where they should be down. This is especially important for leaf uplinks and host dual-homing. If a leaf has one missing uplink, you might still get reachability, but you will get asymmetric ECMP and failure behavior that is indistinguishable from routing bugs later.

On the host side, the bond must be up and actively distributing, and VLAN subinterfaces must exist and be up. Each host config in the topology creates bond0.10 and either bond0.20 or bond0.30 (DC1) and similarly for DC2 with bond0.20 mapped to 192.168.120.0/24 and bond0.30 mapped to 192.168.130.0/24. That is not a cosmetic detail; it is the core of your service tests.

## Layer 2/3 underlay: reachability and ECMP validation
Underlay validation proves the transport that EVPN rides on. The exact routing protocol depends on the configs you mounted, but the invariants are stable across protocols: leaf loopbacks must be reachable from spines, spine loopbacks must be reachable from leaves, and failures must cause predictable reconvergence.

In this topology, every leaf connects to all four spines, so a single spine failure should not break leaf-to-leaf connectivity. If it does, the underlay is either misconfigured or the failure exposed a hidden coupling (for example, a route-reflection design mistake or an incorrect next-hop policy).

## Overlay control plane: EVPN correctness validation
When EVPN is working, it provides a clean truth source: which MACs and IPs are known where, how they were learned, and which VTEPs advertise them. Overlay validation should focus on control-plane state first, then move to dataplane behavior.

A healthy overlay means EVPN routes exist for the endpoints you expect, and the VTEP list is consistent. If an endpoint is reachable but not advertised, you have a learning/flooding artifact that will break under load or failure. If an endpoint is advertised but not reachable, you have a dataplane path issue or underlay reachability issue. Those are different problems and should be treated differently.

## Service plane: tenant and gateway behavior validation
Here, you validate what applications actually experience: stable default gateway, proper segmentation, and correct reachability within and across tenants.

VLAN 10 is shared across all hosts in both DCs, but the second VLAN differs. In DC1, hosts use VLAN 20 or 30 with 192.168.20.0/24 and 192.168.30.0/24. In DC2, hosts use VLAN 20 or 30 interfaces but with 192.168.120.0/24 and 192.168.130.0/24. That difference forces you to make intentional choices about inter-DC services. If you want an “app tier” to be stretched, you must define what that means. If you want only L3 reachability between specific VRFs, you must export only those routes.

This topology is an excellent place to teach the “L3-first, L2-when-justified” rule. VLAN 10 can represent shared services that exist in both DCs. VLAN 20/30 (or 120/130) can represent tenants that should not automatically be bridged across the DCI.

## Inter-DC validation: export/import discipline
The DCI consists only of router pairs connected by two links. This forces an explicit service model: which VRFs/VNIs/routes are allowed to traverse the DCI. Inter-DC validation should focus on preventing accidental success. A classic failure mode is that an overly permissive policy exports everything and creates unintended reachability.

A correct DCI in this model is one where reachability across DCs exists only for the declared services and disappears when a service is revoked. That is the difference between “connectivity” and “architecture.”

## Failure drills: the minimum set that makes you operationally competent
The point of failure drills is to make failures unsurprising. In a well-designed network, failure is not a special event; it is a known mode with known signals.

A practical set of drills for this topology includes:

*Single uplink failure on a leaf*. You should see ECMP reduce by one path, minimal convergence impact, and no endpoint outage. If endpoints flap, you likely have a hashing or LACP attachment issue masquerading as a routing problem.

*Single spine failure*. The fabric should continue to forward. Control plane should reconverge, ECMP should reduce, and EVPN should remain stable. If EVPN collapses, you likely coupled EVPN control-plane to a single spine or made a route-reflection mistake.

*Leaf failure in a dual-homed pair*. Hosts should remain reachable via the surviving leaf if multihoming is implemented correctly. This is where the “NOT MLAG for ESI” caveat becomes a test: the design intent must match the implementation. If the implementation relies on MLAG but the topology suggests otherwise, this drill will expose it.

*Single DCI link failure*. Inter-DC services should remain up if the DCI is built with redundancy across router pairs and appropriate failover. If services collapse, you likely pinned transport to a single path or failed to build a resilient service model.

*Complete loss of one router pair*. This is where the constrained design matters. If the DCI service model uses both router pairs actively, the system should degrade but continue. If it fails entirely, you have accidental coupling.

For each drill, the lab’s value increases dramatically if you can describe, in advance, what you expect to observe: which BGP sessions drop, which EVPN routes withdraw, which counters spike, which logs appear, and what the recovery timeline should be. That expectation becomes your runbook.

# Appendix D: Extras

## DC1 devices
- clab-ceos-2dc-evpn-dci-dc1-leaf1
- clab-ceos-2dc-evpn-dci-dc1-leaf2
- clab-ceos-2dc-evpn-dci-dc1-leaf3
- clab-ceos-2dc-evpn-dci-dc1-leaf4
- clab-ceos-2dc-evpn-dci-dc1-spine1
- clab-ceos-2dc-evpn-dci-dc1-spine2
- clab-ceos-2dc-evpn-dci-dc1-spine3
- clab-ceos-2dc-evpn-dci-dc1-spine4
- clab-ceos-2dc-evpn-dci-dc1-router1
- clab-ceos-2dc-evpn-dci-dc1-router2

Hosts:
- clab-ceos-2dc-evpn-dci-dc1-host1
- clab-ceos-2dc-evpn-dci-dc1-host2
- clab-ceos-2dc-evpn-dci-dc1-host3
- clab-ceos-2dc-evpn-dci-dc1-host4

## DC2 devices
- clab-ceos-2dc-evpn-dci-dc2-leaf1
- clab-ceos-2dc-evpn-dci-dc2-leaf2
- clab-ceos-2dc-evpn-dci-dc2-leaf3
- clab-ceos-2dc-evpn-dci-dc2-leaf4
- clab-ceos-2dc-evpn-dci-dc2-spine1
- clab-ceos-2dc-evpn-dci-dc2-spine2
- clab-ceos-2dc-evpn-dci-dc2-spine3
- clab-ceos-2dc-evpn-dci-dc2-spine4
- clab-ceos-2dc-evpn-dci-dc2-router1
- clab-ceos-2dc-evpn-dci-dc2-router2

Hosts:
- clab-ceos-2dc-evpn-dci-dc2-host1
- clab-ceos-2dc-evpn-dci-dc2-host1
- clab-ceos-2dc-evpn-dci-dc2-host1
- clab-ceos-2dc-evpn-dci-dc2-host1

## IP addressing proposal for services (used in host exec blocks)

VLAN 10 (stretched L2 across both DCs, all leaves)
- Subnet: 192.168.10.0/24
- Anycast GW (later, on leaves): 192.168.10.1/24

Hosts:
- clab-ceos-2dc-evpn-dci-dc1-host1 192.168.10.11/24
- clab-ceos-2dc-evpn-dci-dc1-host2 192.168.10.12/24
- clab-ceos-2dc-evpn-dci-dc1-host3 192.168.10.13/24
- clab-ceos-2dc-evpn-dci-dc1-host4 192.168.10.14/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.21/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.22/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.23/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.24/24

“VLAN 20” service group A (dc*-host1 + dc*-host3 L2 within each DC; routed between DCs)
- DC1 subnet: 192.168.20.0/24 (GW 192.168.20.1)
- dc1-host1 192.168.20.11/24
- dc1-host3 192.168.20.13/24

DC2 subnet: 192.168.120.0/24 (GW 192.168.120.1)
- dc2-host1 192.168.120.21/24
- dc2-host3 192.168.120.23/24

“VLAN 30” service group B
This matches the following intent: “host2 + host4 L2 within DC; routed between DCs”.

DC1 subnet: 192.168.30.0/24 (GW 192.168.30.1)
- dc1-host2 192.168.30.12/24
- dc1-host4 192.168.30.14/24

DC2 subnet: 192.168.130.0/24 (GW 192.168.130.1)
- dc2-host2 192.168.130.22/24
- dc2-host4 192.168.130.24/24