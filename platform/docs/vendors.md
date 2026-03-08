# Vendor Support

## Purpose

This document describes the platform's current vendor stance, adapter philosophy, and the rules that keep the architecture Nokia-first without becoming Nokia-bound.

## Current Status

At this stage:

- Nokia is the first practical focus
- Juniper is the first planned next expansion
- broader vendor support is future-facing, not currently implemented

This means the platform can document multi-vendor direction now, but it must not claim multi-vendor parity.

## Current Vendor Scope

### Nokia

Current role:

- first practical implementation focus
- initial adapter placeholder area in the collector
- initial bounded ODL-related thinking where Nokia-first lab needs make that reasonable

### Juniper

Current role:

- planned next expansion after Nokia
- architecture target, not implemented support

### Broader vendors

Current role:

- future architecture direction only

## Adapter Philosophy

Vendor-specific logic must live behind explicit adapter boundaries.

That applies to:

- collector-side gNMI handling
- capability interpretation
- normalization details
- future policy and workflow mapping
- error shaping where vendor differences matter

The core platform model must remain vendor-neutral.

## Capability Honesty

Support differences must be explicit.

The platform should represent states such as:

- `supported`
- `partially_supported`
- `unsupported`
- `unknown`
- `not_implemented_in_platform`

This rule prevents fake feature parity and keeps both APIs and UI behavior honest.

## Current Vs Future

### Current

- Nokia-first direction is documented
- vendor-neutral model families exist as scaffolding
- capability schemas exist as scaffolding
- Nokia adapter placeholder exists in the collector

### Future

- Juniper adapter structure
- richer capability discovery logic
- broader vendor support over time

## Boundary Reminder

Vendor support direction must never override the core architecture.

That means:

- backend remains the brain
- WebUI remains the product
- ODL remains bounded
- vendor-native payloads do not become the product contract
