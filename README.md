# containerlab
Author: Leonardo Furtado (https://github.com/leofurtadonyc/)

Hands-on network labs for engineers who want to **build, break, validate, and learn** modern Carrier Ethernet and Data Center networking with `containerlab`.

This repository is a collaborative playground to:

- Simulate realistic topologies
- Experiment with protocols and features
- Validate architectural intent
- Practice troubleshooting and failure drills
- Evolve automation workflows over time

The repo is intentionally built as a living lab platform and will continue growing with new:

- Topologies
- Architectures and technology stacks
- Environments and operating models
- Vendors and NOS variants

---

## Why This Repo Exists

Most network learning material shows final-state diagrams and ideal outputs. Real engineering work is messier:

- Designs evolve
- Features interact in unexpected ways
- Drift appears
- Tests fail for surprising reasons
- Automation assumptions break

This repo embraces that reality. The objective is not only to get to "green checks", but to understand:

- **Why** checks pass or fail
- **How** protocols behave under stress
- **What** operating model scales

---

## Who This Is For

- Network engineers learning EVPN/VXLAN and Clos designs
- NetDevOps practitioners building repeatable validations
- Platform/reliability engineers validating change safety
- Curious engineers who want a lab where experimentation is expected

---

## Repository Layout

Note: more labs will come with time!
```text
containerlab/
├── ceos-4s4l/               # single-DC Clos + EVPN-VXLAN lab
├── ceos-2dc-4s4l/           # two-DC EVPN/DCI-focused lab
├── automation/              # Python source-of-truth automation framework
└── README.md
```

### Important convention

- Python automation under `automation/` is the **source of truth** for validation and drift workflows.
- Shell scripts inside individual lab folders are retained as **legacy / quick checks**.

---

## Labs Available Today

## `ceos-4s4l`

Single data center Clos fabric:

- 4 spines, 4 leaves
- Dual-homed Linux hosts
- EVPN-VXLAN service model
- Intent-driven validations and drift workflows

## `ceos-2dc-4s4l`

Two data center scenario:

- DC1 and DC2 Clos fabrics
- Inter-DC routing/DCI experimentation
- EVPN-focused control/data-plane checks
- Intent-driven expansion for multi-site patterns

---

## Quick Start

## 1) Prerequisites

- Docker-compatible runtime
- `containerlab`
- cEOS image available locally (for Arista-based labs) as well as other images for future labs with different NOSes
- Python 3.10+ for automation tooling

## 2) Deploy a lab

Examples:

```bash
clab deploy -t ceos-4s4l/ceos-4s4l.clab.yml
# or
clab deploy -t ceos-2dc-4s4l/ceos-2dc-4s4l.clab.yml
```

## 3) Run automation

```bash
cd automation
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[test]

netlab validate --lab ceos-4s4l --mode all
netlab baseline --lab ceos-4s4l --out baselines/ceos-4s4l.golden.json
netlab drift --lab ceos-4s4l --baseline baselines/ceos-4s4l.golden.json
```

For full automation docs, see:

- `automation/README.md`
- `automation/README-AUTOMATION.md`

---

## How To Use This Repo Effectively

Recommended workflow:

1. Deploy topology
2. Validate intent/underlay/control-plane/dataplane
3. Run failure drills
4. Observe protocol/system behavior
5. Adjust config or intent
6. Re-validate and capture drift signals

Treat each lab like a small production system:

- Document assumptions
- Keep changes reviewable
- Prefer reproducible evidence over anecdotal pings

---

## Engineering Principles

- **Intent over guesswork**: checks should reflect desired behavior.
- **Evidence over intuition**: validate with data from devices/hosts.
- **Automation-first operations**: avoid one-off manual workflows.
- **Safe experimentation**: break things deliberately, learn quickly.
- **Portable design mindset**: prepare for multi-vendor and future labs.

---

## Current Status and Evolution

This repository is actively evolving. Some components are intentionally pragmatic and will be refined over time (for example, config drift strategy and multi-platform abstraction depth).

Planned growth areas:

- Additional topologies and vendor combinations
- Richer protocol and failure-drill scenarios
- Stronger portability of collectors/validators
- Improved drift semantics for heterogeneous environments
- CI-friendly validation pipelines

---

## Contributing

Contributions and ideas are welcome.

Good contribution patterns:

- Add or improve lab intent files
- Add new validation checks with clear purpose
- Improve troubleshooting clarity and report quality
- Document real failure modes and lessons learned
- Keep changes modular and testable

When proposing changes, include:

- What behavior is expected
- What was observed
- How it was validated

---

## Disclaimer

Lab images and vendor software are not distributed in this repo.  
You must provide any required images and comply with vendor licensing terms.

---

## Final Note

This project is meant to be practical, educational, and collaborative.  
If you are a network engineer who likes learning by building and testing real behavior, you are in the right place.
