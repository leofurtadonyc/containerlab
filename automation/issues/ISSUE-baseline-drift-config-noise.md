# Baseline/Drift Config Drift Is Noisy Due to Strict Text Comparison

As per https://github.com/leofurtadonyc/containerlab/issues/2

Status: Open

## Summary

`netlab baseline` followed by immediate `netlab drift` can report `config_drift` even when no intentional changes are made between runs.

The root cause is strict text/hash comparison between:

- desired config in repo (`<lab>/configs/*.cfg`)
- device running config (`show running-config`)

For EOS-based labs, these two representations can differ in formatting/order/expanded defaults while still being semantically equivalent.

---

## Problem Statement

Current config drift logic treats any textual difference as drift. In practice:

- running config is often rendered differently by device CLI
- startup/repo text may not match running text byte-for-byte
- drift reports can show widespread node-level changes even in stable labs

This creates false positives and reduces trust in drift outputs.

---

## What Was Observed

After:

1. running `netlab baseline`
2. running `netlab drift` immediately after with no deliberate config changes

results can show:

- `state drift`: pass (after timestamp normalization fix)
- `config drift`: fail across many/all EOS nodes
- per-node hash mismatch with valid running-config retrieval

Example symptom pattern:

- desired line count significantly differs from running line count
- unique running hashes per node (so collection works)
- still marked as config drift because text is not identical

---

## Reproduction Steps

```bash
netlab baseline --lab ceos-4s4l --out baselines/ceos-4s4l.golden.json
netlab drift --lab ceos-4s4l --baseline baselines/ceos-4s4l.golden.json --json-out artifacts/ceos-4s4l-drift.json --md-out artifacts/ceos-4s4l-drift.md
```

---

## Current Behavior

- Baseline stores state fingerprints and intent hash.
- Drift computes config drift by hashing:
  - repo config file text
  - running-config command output
- Any text mismatch => drift entry.

---

## Expected Behavior

Config drift should represent **meaningful semantic drift**, not pure text rendering differences.

Desired outcome:

- stable lab with no real config change should not produce broad false config drift
- drift output should focus operator attention on actionable differences

---

## Why This Matters

- Produces operator noise and false alerts
- Makes drift less useful for day-2 confidence
- Creates friction for lab growth and future multi-vendor support
- Encourages manual config normalization workflows that are expensive and brittle

---

## Proposed Direction

Introduce configurable config-drift modes (intent-driven), for example:

1. `repo_vs_running` (current strict mode; diagnostic)
2. `startup_vs_running` (same-device representation)
3. `feature_fingerprint` (canonical normalized model; preferred long-term)
4. `disabled` (state-only drift workflows)

Short-term recommendation:

- make mode configurable per lab in `intent.yml`
- default to less noisy mode for operational runs

Long-term recommendation:

- compare vendor-neutral canonical feature fingerprints (interfaces/BGP/VLAN/VRF/VNI/etc.) instead of whole config text

---

## Additional Context

Recent improvements already made:

- state drift now ignores volatile timestamp-only difference
- running-config retrieval now retries privileged mode (`enable`) to reduce command failures
- invalid running-config output now surfaces as collection errors

Remaining gap:

- semantic quality of config drift comparison strategy

---

## Suggested Acceptance Criteria

- [ ] Baseline + immediate drift with unchanged lab does not produce bulk false config drift
- [ ] Config drift mode is configurable per lab intent
- [ ] Drift report clearly indicates comparison mode used
- [ ] Documentation explains trade-offs of each mode
- [ ] Backward compatibility for existing workflows is maintained

---