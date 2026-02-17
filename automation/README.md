# netlab automation

Python source-of-truth automation framework for containerlab EVPN labs.

## Install

```bash
cd automation
python -m venv .venv
source .venv/bin/activate
pip install -e .[test]
```

## Commands

```bash
netlab validate --lab ceos-4s4l --mode all --json-out artifacts/ceos-4s4l.json --md-out artifacts/ceos-4s4l.md
netlab baseline --lab ceos-4s4l --out baselines/ceos-4s4l.golden.json
netlab drift --lab ceos-4s4l --baseline baselines/ceos-4s4l.golden.json --json-out artifacts/drift.json --md-out artifacts/drift.md
```

## Behavior

- gNMI-first evidence collection policy.
- Per-datapoint CLI fallback when gNMI is unavailable.
- Lab details loaded from `../<lab>/intent/intent.yml`.
- JSON and Markdown reports are produced.
