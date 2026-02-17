# README-AUTOMATION

This document explains the automation framework under `automation/` in practical terms:

- What it does
- How to run it day-to-day
- How to add new labs/checks
- What its current limitations are

It is intended for lab learners, operators and maintainers, not only developers.

## 1) What This Automation Is

`netlab` is a Python CLI framework that validates containerlab network labs and reports drift.

Design goals:

- Python is the source of truth for validation workflows
- gNMI-first evidence strategy, with CLI fallback where required
- Intent-driven checks (lab specifics in `intent/intent.yml`)
- Multi-lab support without lab-name hardcoding in runtime logic
- Structured results in console + JSON + Markdown

## 2) High-Level Architecture

### CLI entrypoint

- `src/netlab/cli.py`
- Commands:
  - `validate`
  - `baseline`
  - `drift`

### Intent layer

- `src/netlab/intent/schema.py`
- `src/netlab/intent/loader.py`
- Each lab provides:
  - `../<lab>/intent/intent.yml`

Intent currently defines:

- Inventory (nodes/roles/groups)
- Services metadata
- Declarative checks by phase/kind
- gNMI defaults

### Adapter + evidence

- `src/netlab/adapters/containerlab.py`
- `src/netlab/evidence/*`

Responsibilities:

- Discover topology and node kinds
- Execute commands against EOS/Linux containers
- Apply gNMI-first collection strategy with fallback

### Validation engine

- `src/netlab/validators/engine.py`

Checks are executed from intent definitions, not hardcoded per lab.

Supported check kinds today:

- `config_contains`
- `interfaces_up`
- `bgp_established`
- `evpn_routes_present`
- `ping_targets`
- `l2_neighbor_absent`
- `intent_distinct`

### Drift and reporting

- `src/netlab/drift/*`
- `src/netlab/render/*`

Outputs:

- Machine-readable JSON report
- Operator-friendly Markdown report

## 3) Typical Use Cases

### Validate a lab after bring-up

Run full validation for a deployed lab:

```bash
netlab validate --lab ceos-4s4l --mode all --json-out artifacts/ceos-4s4l.json --md-out artifacts/ceos-4s4l.md
```

### Validate specific layer only

```bash
netlab validate --lab ceos-4s4l --mode underlay
netlab validate --lab ceos-4s4l --mode control-plane
netlab validate --lab ceos-4s4l --mode dataplane
```

### Establish and compare baseline

```bash
netlab baseline --lab ceos-4s4l --out baselines/ceos-4s4l.golden.json
netlab drift --lab ceos-4s4l --baseline baselines/ceos-4s4l.golden.json --json-out artifacts/ceos-4s4l-drift.json --md-out artifacts/ceos-4s4l-drift.md
```

## 4) Operator Workflow

## A) One-time setup

```bash
cd automation
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[test]
```

## B) Daily run flow

1. Ensure lab is deployed/running in containerlab.
2. Activate venv.
3. Run `validate --mode all`.
4. If needed, run baseline + drift.
5. Inspect Markdown report first, then JSON for details.

## C) Exit code behavior

- exit `0`: no `ERROR`-severity failures
- non-zero: one or more `ERROR` failures

## 5) Working With Intent Files

Lab behavior should be controlled via:

- `ceos-4s4l/intent/intent.yml`
- `ceos-2dc-4s4l/intent/intent.yml`

Note: This repo currently contains two labs, but more will be added soon. The automation framework should either support them seamlessly or allow for new modules and extensions.

For each check, define:

- `name`
- `phase`
- `kind`
- `params`

Examples:

- Check only interfaces relevant to topology intent using regex/description filters
- Define explicit ping probes for data plane behavior
- Assert intended distinct values in intent (e.g., two VNIs differ)

This is the preferred path for adapting logic per lab.

## 6) Extending to New Labs

To add a new lab without core refactor:

1. Create `../new-lab/intent/intent.yml` with inventory/services/checks.
2. Reuse existing check kinds when possible.
3. Add new check kind in `validators/engine.py` only if behavior is truly new.
4. Keep protocol/platform specifics in collectors/adapters, not in intent loader.

Guidelines:

- Avoid lab-name branching in runtime code
- Avoid fixed node naming assumptions
- Keep check selection role/group based

## 7) Reports and Artifacts

Common output folders:

- `artifacts/` for validation/drift reports
- `baselines/` for baseline snapshots

Suggested `.gitignore` (project-level):

- `.venv/`
- `artifacts/`
- `baselines/`
- `**/__pycache__/`
- `*.pyc`
- `.pytest_cache/`

Source code under `src/` should remain tracked by git.

## 8) Current Limitations (Important)

### 8.1 Platform coupling

Core workflow is currently optimized for:

- containerlab + Docker runtime
- EOS CLI command paths
- Linux host tools (`ping`, `ip neigh`)

This is extensible, but non-EOS/non-containerlab labs need adapter/collector additions.

### 8.2 Config drift is strict and can be noisy

Current config drift compares:

- Desired config from repo file: `../<lab>/configs/<node>.cfg`
- Against device running-config output

Even with no operational change, text representation differences can cause mismatches.
This is expected for many NOS workflows where startup/repo/running text is not byte-identical.

Recent improvements:

- Privileged mode retry for EOS `show running-config`
- Explicit collection error reporting when output is invalid
- Timestamp excluded from state-drift comparison

Still, config drift can remain noisy due to canonicalization differences.
I'll work on it; optimize and fix it soon. This is WIP.

### 8.3 Recommended interpretation today

- Treat `validate` (intent/state outcomes) as primary quality signal
- Treat `config_drift` as strict diagnostic signal, not always semantic truth

### 8.4 Future improvement path

For broader multi-vendor reliability, move config drift toward:

- Canonical feature fingerprints (vendor-neutral model)
- Optional vendor plugins for extraction
- Intent-scoped config assertions instead of full-text file equality

## 9) Troubleshooting

### Command says module missing

Activate venv and install extras:

```bash
source .venv/bin/activate
pip install -e .[test]
```

### Drift reports collection errors

Check EOS command execution manually:

```bash
docker exec -it <container> Cli -c "show running-config"
```

If privilege is required, ensure CLI path enters enable mode.

### Underlay interface checks fail unexpectedly

Use scoped interface selection in intent (`required_description_regex`, etc.)
so unused/down interfaces do not fail checks.

### L2 isolation checks are unclear

Inspect `matched_lines` and `learned_lines` in report evidence for each failing probe.

## 10) Quick Command Reference

```bash
# validate full lab
netlab validate --lab ceos-4s4l --mode all --json-out artifacts/ceos-4s4l.json --md-out artifacts/ceos-4s4l.md

# baseline
netlab baseline --lab ceos-4s4l --out baselines/ceos-4s4l.golden.json

# drift
netlab drift --lab ceos-4s4l --baseline baselines/ceos-4s4l.golden.json --json-out artifacts/ceos-4s4l-drift.json --md-out artifacts/ceos-4s4l-drift.md
```
---
