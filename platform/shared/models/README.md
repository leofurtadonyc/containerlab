# Shared Model Families

This directory describes the platform's vendor-neutral model families.

These model families are shared architecture artifacts, not raw vendor payload definitions.

## Current families

- `inventory`
- `topology`
- `capability`
- `policy`
- `workflow`
- `audit`
- `integration-health`

## Modeling rules

All shared model families should preserve the following direction:

- vendor-neutral product terminology
- explicit support and unsupported states
- explicit unknown and degraded states where appropriate
- separation between intended and observed state where relevant
- no raw vendor-native payloads as the primary product contract
