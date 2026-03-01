# containerlab
Author: Leonardo Furtado
GitHub: https://github.com/leofurtadonyc/
LinkedIn: https://www.linkedin.com/in/leofurtadonyc/

## Disclaimer
Lab images, vendor software, and licenses are not distributed in this repo.
You must provide any required images, bring your own licenses as needed, and comply with vendor licensing terms.
Also, read the "**What You Need to Run These Labs**" section below to get started.

## Stay up to date!

**This repository moves fast.** New labs, architecture updates, configuration changes, automation improvements, fixes, and documentation refinements are added regularly.

To avoid drift and ensure you are working from the latest state of the project, pull updates frequently:

`git pull`

If you are using this repository actively, staying current is strongly recommended.

---

# Leonardo Furtado's Containerlab Labs

**A flagship network engineering lab platform for serious service provider, data center, transport, observability, and automation work**

This is not a throwaway lab repo.

**Leonardo Furtado's Containerlab Labs** is a growing, production-minded network engineering repo/platform built for engineers who want to go far beyond toy topologies, isolated protocol demos, and certification-style exercises.

It is a place to design, deploy, validate, observe, troubleshoot, and evolve realistic network environments across multiple architectures, vendors, and operational models.

From **service provider transport** to **EVPN-VXLAN Clos fabrics**, from **telemetry and dashboards** to **automation and drift-aware validation**, this repository is built to help engineers treat labs the way serious teams treat real systems: as environments for evidence, experimentation, and engineering judgment.

---

## What You Need to Run These Labs

These labs are built on **Containerlab**, so before you begin, it helps to understand the basic stack.

### What is Containerlab?

**Containerlab** is a CLI tool for building and managing **container-based network labs**. It deploys lab nodes, creates the virtual links between them, and manages the lab lifecycle from a topology file, which makes it a strong fit for repeatable, automation-friendly network topologies.

### Why Docker matters here

Containerlab needs a **container runtime** to run lab nodes. The most common runtime is **Docker**. Docker Engine is Docker’s open-source container runtime, and it is the layer that actually runs the containers used by the lab. Containerlab sits on top of that runtime and orchestrates those containers into a network topology.

Put simply:

- **Docker** runs the containers
- **Containerlab** turns those containers into a network lab

### Setup Guides

Before using this repository, make sure your local environment is ready:

- **Containerlab installation:** Follow the official install guide: https://containerlab.dev/install/
- **Containerlab quick start:** Useful if you are new to the workflow: https://containerlab.dev/quickstart/
- **Docker installation:** Follow Docker’s official install documentation for your platform: https://docs.docker.com/engine/install/
- **Docker post-install steps (Linux):** Recommended for permissions and usability after install.
- **macOS users — OrbStack (recommended):** OrbStack includes a Docker engine and is a strong option for running containers on Mac: https://orbstack.dev/
- **OrbStack quick start / install:** Use the official docs to get started: https://docs.orbstack.dev/quick-start

### Images, Vendor Software, and Licenses

**This repository does not provide lab images, vendor software, or licenses.**

That means:

- You must provide any required container images yourself
- You must bring your own vendor licenses where needed
- You must comply with all vendor and third-party licensing terms

This repository provides the **lab definitions, supporting assets, documentation, and automation/workflow material** — but not the proprietary software required to run vendor-specific nodes.

### Practical Expectations

At a minimum, most users will need:

- A machine capable of running containers
- A working Docker-compatible runtime
- Containerlab installed
- Access to the required lab images
- Any required vendor licenses (Arista, Juniper, Cisco, Nokia, etc.)
- Enough CPU, memory, disk, and networking capacity for the topology they want to run

**Very important**: Some labs are quite resource-intensive and will use a significant amount of RAM. Make sure your physical setup (computer) can handle these labs. Load and capacity requirements will be provided in the **README.md** file for each lab.

If you are new to this ecosystem, start by installing Docker (or OrbStack on macOS), then install Containerlab, then return to this repository and choose a lab to deploy.

## Why This Repo / Project Exists

Too many labs stop at “it came up.”

To me, that is not enough.

Real networks are shaped by tradeoffs, failure domains, visibility gaps, tooling constraints, architectural evolution, and the constant tension between speed and safety. Protocol knowledge matters, but protocol knowledge alone is not what builds engineering maturity.

This repository exists to close that gap.

It is built to help engineers:

* Understand how systems behave beyond happy-path demos
* Test architecture in context, not in isolation
* Validate assumptions with evidence
* Explore how observability changes troubleshooting
* Use automation to reduce guesswork and increase confidence
* Build deeper intuition across technologies, vendors, and operational patterns

The goal is simple:
**To make labs feel more like engineering, and engineering more intentional.**

---

## What This Repository / Project Is

This repository is a living collection of high-value network engineering labs and supporting assets built around realism, modularity, and operational depth.

It is designed to support:

* **Service provider and carrier-grade scenarios**
* **Data center and EVPN-based fabric architectures**
* **Transport, routing, and traffic-engineering experimentation**
* **Multi-vendor learning and comparison**
* **Observability-first workflows**
* **Python-driven automation, validation, and drift analysis**

It is not tied to a single protocol, a single vendor, or a single architectural style.

It is intended to grow into a broader engineering lab platform that supports focused technical experiments, architecture studies, operational drills, validation pipelines, and reusable learning paths across different network domains.

---

## Who This Is For

This repository is for engineers who want more.

It is built for:

* Network engineers who are tired of shallow labs
* Service provider engineers exploring transport and service behavior
* Data center engineers working with Clos, EVPN, and multi-site patterns
* Automation-minded infrastructure engineers who want repeatable validation
* Reliability-minded operators who care about evidence, visibility, and safe change
* Advanced learners who want to sharpen real engineering instincts
* Builders who see labs as systems, not as screenshots for social media

If you value depth, realism, and technical honesty, this repo is for you.

---

## What You Can Explore Here

### Service Provider and Transport Engineering

Build and study provider-style topologies, transport systems, service layers, routing interactions, and operational design patterns that reflect more realistic network behavior.

### Segment Routing and Modern Forwarding Models

Explore modern transport evolution, policy-driven path control, SR-oriented thinking, and the architectural shift beyond legacy-only approaches.

### BGP and Advanced Control Plane Behavior

Test route distribution, policy interactions, service signaling patterns, and more advanced control-plane scenarios across richer topologies.

### Data Center Fabrics and EVPN-VXLAN

Work with Clos-based designs, EVPN-VXLAN models, underlay/overlay interactions, multi-site patterns, and fabric-centric operational thinking.

### Observability and Operational Visibility

Integrate telemetry, monitoring, metrics, dashboards, and evidence-driven workflows so the lab becomes something you can see, not just configure.

### Automation and Validation

Use Python and automation-oriented workflows to validate state, detect drift, reduce repetitive checking, and make experimentation safer and more repeatable.

---

## What Makes This Repo / Project Different

A lot of repositories give you files. This one is being built to give you **engineering leverage**.

That means:

* **Realism over neatness**
  Labs should reflect system behavior, not just clean diagrams.

* **Architectures over isolated features**
  Technologies matter more when they interact.

* **Evidence over intuition alone**
  If you cannot validate it, you do not fully understand it.

* **Observability built in**
  Visibility is part of the design, not an afterthought.

* **Automation with purpose**
  Scripts are not decoration; they should reduce uncertainty and improve trust.

* **Vendor-aware, concept-first learning**
  Vendors matter, but principles matter more.

* **Built to evolve**
  This is not a static archive. It is a growing engineering platform.

---

## Architectural Breadth

This repository is intentionally broad and will continue expanding.

It already supports — or is designed to support — a mix of scenarios such as:

* service provider and carrier-grade transport environments
* MPLS and label-switched architectures
* Segment Routing and SRv6-oriented labs
* BGP-centric routing and service models
* EVPN-VXLAN data center fabrics
* Clos architectures
* Multi-site and interconnect patterns
* L2 and L3 service scenarios
* Telemetry and metrics collection workflows
* Monitoring and dashboard integrations
* Python-based validation and automation pipelines
* Multi-vendor topologies and architecture comparisons

This is meant to become a serious lab library, not a single-topic sandbox.

---

## Current Direction and Future Expansion

This repository already includes meaningful work across multiple technical domains, including:

* **Arista-based EVPN-VXLAN Clos labs**
* **Fabric and multi-DC experimentation**
* **Nokia-heavy service provider and transport scenarios**
* **Automation-driven validation workflows**

And it is built to keep growing.

Future directions include:

* Broader multi-vendor coverage
* Deeper service provider service models
* Richer traffic-engineering scenarios
* Stronger observability stacks
* gNMI-first validation where possible
* Larger automation frameworks
* More architecture-driven walkthroughs
* More reusable learning paths

The long-term vision is to make this repository increasingly valuable as both a **learning platform** and a **serious engineering reference**.

---

## What You Can Do With It

Use this repository to:

* Build realistic labs that go beyond isolated features
* Study how transport, routing, and services interact
* Practice EVPN-VXLAN and Clos behavior in meaningful topologies
* Experiment with multi-site and interconnect patterns
* Validate control-plane and data-plane expectations
* Observe the impact of changes through telemetry and monitoring
* Practice troubleshooting under realistic conditions
* Replace ad hoc testing with repeatable validation
* Compare design and operational patterns across vendors
* Treat a lab as a programmable system

---

## Getting Started

### What You Will Need

You will typically need:

* A Docker-compatible container runtime
* `containerlab`
* Access to any required container or vendor images
* Python 3.10+ for automation workflows
* Any required licenses for vendor-specific software (aka "images")

### Basic Flow

1. Select a lab scenario
2. Prepare the required images and environment
3. Deploy the topology with `containerlab`
4. Verify baseline reachability and service state
5. Run automation and validation checks where applicable
6. Introduce changes, tests, or failure drills
7. Observe the results
8. Re-validate and learn from the outcome

### The Right Mindset

The best results come when you use this repository like an engineering platform: define expectations first, validate deliberately, observe everything you can, keep changes controlled, and learn from broken states, not only working ones.

---

## Suggested Paths Through the Repository

### Path 1 — Data Center Fabric Engineering

Start with Clos and EVPN-VXLAN labs to understand underlay/overlay behavior, segmentation, reachability, and fault domains.

### Path 2 — Service Provider and Transport Foundations

Work through provider-style labs to understand service layering, transport behavior, and operational design patterns.

### Path 3 — Multi-Site and Interconnect Patterns

Study larger-scope behavior across multi-DC and interconnect scenarios where architecture becomes more interesting.

### Path 4 — Observability and Operational Evidence

Bring in telemetry, dashboards, and monitoring so your lab becomes visible and measurable.

### Path 5 — Automation and Drift-Aware Validation

Use the automation framework to move from manual CLI spot checks toward repeatable evidence and confidence-based workflows.

---

## Repository Structure

The exact layout will continue evolving, but the intent is clear:

* **Lab directories** contain topologies, configs, and architecture-specific assets
* **Automation/** contains Python-based validation, source-of-truth, and drift-aware workflows
* **Documentation assets** provide explanations, design notes, and learning material
* **Observability-related assets** support telemetry, monitoring, dashboards, and visibility-oriented integrations
* **Supporting files** provide scenario-specific helpers, references, and project structure

As the repository grows, you can expect more labs, architectures, vendors, and reusable engineering components. I’ll also be adding more containerized environments with customized observability and telemetry capabilities, expanding the automation and telemetry experience across all labs in this repository.

---

## Important Boundaries

### Vendor Images and Licensed Software

As mentioned earlier, vendor images, licensed NOS artifacts, and proprietary software are **NOT** included in this repository unless explicitly stated otherwise.

You are responsible for:

* Supplying required images
* Supplying required licenses
* Complying with all vendor-specific terms and restrictions

### Third-Party Software

This repository may reference, pull, or integrate with third-party tools and platforms such as monitoring systems, dashboards, and containerized services. Those components remain under their own licenses and rights. Examples here include Grafana, Prometheus, and others.

### Advanced Scope

Some labs are intentionally deep and assume a baseline understanding of networking, fabrics, routing, transport, or automation. This is by design.

---

## Roadmap

This project is actively expanding.

Expected growth areas include:

* More architecture variants
* Broader multi-vendor support
* Deeper provider and transport scenarios
* Richer EVPN and DCI patterns
* Stronger telemetry and observability coverage
* Improved automation abstraction
* More robust drift semantics
* Better CI-friendly validation patterns
* Larger, higher-quality engineering walkthroughs
* Clearer progression paths for learning and experimentation

The ambition is not small:
**To build a lab platform that remains genuinely useful to serious network engineers over time.**

---

## Contributing

Thoughtful, technically grounded contributions are very much welcome!

Valuable contributions include:

* Extending lab scenarios
* Improving validation workflows
* Documenting real failure modes
* Refining operational clarity
* Strengthening observability
* Improving modularity and reuse
* Adding depth without adding noise

### Before You Open a Pull Request

Before creating or submitting a Pull Request, please do the following:

1. **Understand the existing lab or workflow first**
   Make sure you understand the purpose of the lab, the intended behavior, and how your change fits into the broader design of the repository.

2. **Validate the change locally**
   Test your changes in your own environment whenever possible. Do not submit untested modifications to topologies, configs, automation, dashboards, or documentation that affects technical accuracy.

3. **Check for overlap**
   Review existing folders, files, and documentation to avoid duplicating work, introducing conflicting approaches, or creating unnecessary drift.

4. **Open an issue first for significant changes**
   If your contribution is large, architectural, cross-cutting, or changes the intended direction of a lab, open an issue first to explain the idea before investing time in a Pull Request.

5. **Make sure you have the right to contribute the content**
   Only submit material you wrote yourself or are clearly allowed to contribute. Do not submit vendor-proprietary content, licensed images, restricted software, or third-party assets that cannot be redistributed.

### Git / GitHub Collaboration Workflow

Please follow a clean Git/GitHub workflow:

1. **Fork the repository** to your own GitHub account

2. **Create a dedicated branch** for your work
   Use a clear branch name, for example:

   * `fix/evpn-bgp-neighboring`
   * `feat/add-sr-lab-validation`
   * `docs/improve-readme-clarity`

3. **Keep changes focused**
   A Pull Request should solve one clear problem or add one clear improvement. Avoid bundling unrelated changes into the same PR.

4. **Use clear commit messages**
   Prefer commit messages that explain intent, for example:

   * `Fix EVPN leaf-spine BGP peering in dc1 lab`
   * `Add validation checks for Nokia SR MPLS lab`
   * `Improve observability setup instructions`

5. **Sync with upstream before submitting**
   Rebase or merge the latest upstream changes into your branch before opening your PR so your contribution is based on the current state of the repository.

### Pull Request Expectations

A good Pull Request should clearly explain:

* **What behavior is expected**
* **What behavior was observed**
* **What changed**
* **How it was validated**
* **Why the change improves the repository**

Where applicable, include:

* Affected lab or folder name
* Relevant topology or scenario
* Validation output, screenshots, logs, or brief evidence
* Any assumptions, caveats, or limitations

### Pull Request Rules

Please keep these rules in mind:

* **Do not submit untested technical changes** unless the PR is explicitly documentation-only
* **Do not include unrelated refactors** in the same PR
* **Do not remove existing functionality** without clearly explaining why
* **Do not introduce breaking changes silently**
* **Do not commit secrets, credentials, private keys, or licensed vendor artifacts**
* **Do not add images, binaries, or large files unless they are necessary and justified**

### Quality Standard

Contributions should aim to preserve the spirit of this repository:

* Realistic
* Useful
* Modular
* Technically honest
* Operationally meaningful

This project values clarity, rigor, usefulness, engineering judgment, and technical honesty.

### Branch Naming Convention

Use branch names that are short, descriptive, and scoped to the type of change being made.

Recommended prefixes:

* `feat/` for new functionality or new lab additions
* `fix/` for bug fixes or technical corrections
* `docs/` for documentation-only changes
* `refactor/` for structural improvements that do not intentionally change behavior
* `test/` for validation or test-related additions
* `chore/` for repository maintenance or housekeeping work

Examples:

* `feat/add-evpn-multisite-lab`
* `fix/nokia-mpls-label-validation`
* `docs/improve-containerlab-setup-section`
* `refactor/cleanup-automation-layout`

Keep branch names:

* Lowercase
* Hyphen-separated
* Specific to one change set

### Pull Request Checklist

Before submitting a Pull Request, confirm that:

* [ ] I reviewed the existing repository structure and avoided unnecessary duplication
* [ ] I tested the change locally, or this is a documentation-only change
* [ ] My change is focused on one clear improvement or fix
* [ ] My branch is up to date with the latest upstream changes
* [ ] My commits are clear and relevant to the change
* [ ] I did not include secrets, credentials, private keys, or licensed vendor artifacts
* [ ] I explained what changed and why
* [ ] I described how the change was validated
* [ ] I documented any important caveats, assumptions, or limitations
* [ ] I preserved the technical quality and intent of the repository

### Preferred Pull Request Style

A strong Pull Request is easy to review, narrow in scope, technically justified, supported by evidence, and consistent with the repository’s direction.

If your contribution is large, consider splitting it into smaller PRs so review is easier and safer.

---

## Licensing

### Code

Unless otherwise noted, source code, scripts, automation, telemetry, monitoring, validation, and other software components in this repository are licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See: `LICENSE`

### Content

Unless otherwise noted, non-code materials in this repository — including documentation, diagrams, lab guides, walkthroughs, architecture explanations, and other educational materials — are licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license.

See: `LICENSE-CONTENT`

### Third-Party Software and Assets

Third-party software, container images, vendor operating systems, trademarks, logos, and external assets referenced by this repository remain subject to their own licenses and rights.

See: `THIRD-PARTY.md`

---

## About the Author

**Leonardo Furtado**

This repository reflects an engineering-first philosophy: one that values realism, architecture, operational depth, observability, and automation as parts of the same discipline.

It is built by someone who believes labs should do more than demonstrate syntax.

Labs should sharpen judgment, expose tradeoffs, and make better engineers.

---

## Final Word

This repository is being built for engineers who want their labs to mean something.

Not just to launch containers.
Not just to memorize commands.
Not just to say a protocol “works.”

But to understand how systems behave, how designs hold up, how tooling changes outcomes, and how disciplined engineering creates confidence.

If that is the kind of work you care about, this repository was built with you in mind.