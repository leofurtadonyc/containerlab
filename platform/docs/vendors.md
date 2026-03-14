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

## Capability Identity Posture

The current capability matrix is a bounded product-trust surface, not a durable capability-item
registry.

At this stage, capability records are identified in the product by their existing backend tuple:

- vendor
- platform
- domain
- feature
- version scope when relevant

That tuple is sufficient for current Phase 2 operator interpretation and UI selection, but it is
not a standalone backend capability-item ID, workflow handle, or cross-surface entitlement token.

If stronger item identity becomes necessary later, it must be justified by a concrete consumer.
Until then, the UI should expose the current tuple-scoped posture clearly rather than implying a
stronger contract than the backend actually provides.

## Current Vs Future

### Current

- Nokia-first direction is documented
- vendor-neutral model families exist as scaffolding
- the capability matrix now makes current Nokia-first supported, partially-supported, unknown, and not-implemented states explicit in backend contracts and the WebUI
- Nokia adapter placeholder exists in the collector

### Future

- Juniper adapter structure
- richer capability discovery logic
- broader vendor support over time

Juniper-target capability records may still appear in the matrix before implementation exists.
Those records are roadmap-only direction and must not be interpreted as delivered Juniper support,
device eligibility, or cross-vendor parity.

## Boundary Reminder

Vendor support direction must never override the core architecture.

That means:

- backend remains the brain
- WebUI remains the product
- ODL remains bounded
- vendor-native payloads do not become the product contract
