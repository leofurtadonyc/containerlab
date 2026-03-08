# Shared

This directory holds shared utilities, base types, or cross-service contracts that cannot cleanly belong to any single service.

## Current status

Initial shared model scaffolding exists under `shared/models/` for the platform's vendor-neutral model families.

## Notes

Shared artifacts in this area should remain:

- vendor-neutral
- product-facing rather than raw-vendor-native
- explicit about supported, unsupported, degraded, and unknown states
