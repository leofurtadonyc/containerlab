# Change intelligence contract (Phase 2)

## Purpose

This document is the **backend-owned bounded contract** for **recent change intelligence**: summarizing **what appears to have changed recently** across **existing** read-side and persisted evidence, without inventing validation engines, drift detection, safe-to-change recommendations, or workflow authority.

Implementation references:

- `platform/app-api/src/app_api/schemas/change_intelligence.py` — Pydantic types, stable vocabulary, and safety framing model
- Future week **24** product/API work will consume this vocabulary; this task establishes **contract only** (no new persistence domains or collector models).

## Classification: new lane vs weeks 19–23

| Area | Role |
| --- | --- |
| Weeks **19–20** | Per-domain **persisted snapshot history** and **comparison** semantics on devices and policies (honest bounds per inventory/policy truth depth). |
| Weeks **21–23** | Read-side **contract consistency**, **query ergonomics**, **readiness/capability decision-support** navigation and snapshot-history **inspection** (interpretation-only). |

**Change intelligence** is a **new aggregation-and-interpretation layer**: it sits **above** those per-domain APIs and combines **visible, already-defined signals** into a **single operator-facing recent-change summary**. It does **not** re-specify per-record comparison math, replace `comparison_to_latest_persisted`, or duplicate readiness prerequisite graphs. Where a domain has no rows or degraded evidence, the summary states partiality—it does not infer missing truth.

## Explicit non-authorization

This contract supports **read-only visibility and explanation** only. A change-intelligence summary must **never** imply:

- **Validation** pass/fail, intent verification, or policy conformance verdicts
- **Drift** detection, configuration drift engines, or “expected vs actual” authority
- **Safe to change**, risk scores, or approval to execute operations
- **Workflow execution**, eligibility, dry-run **execution**, or authorization
- A **new** durable domain, new collector models, or broader live truth than existing reviews prove (e.g. policy beyond proven **`static_local`** where that limit still applies)

**Naming:** future surfaces may use words like “change” or “recent activity.” Those words mean **observed read-side/persisted activity and deltas**, not operational approval.

## What counts as “recent change” (bounded)

**Recent change** means **backend-selected, bounded windows over evidence the platform already exposes or persists**, for example:

- **Devices (inventory):** new or moved snapshot anchors, bounded history entries, and `comparison_to_latest_persisted` when present—subject to inventory history gates and Postgres row availability
- **Topology:** persisted topology snapshots and coverage/posture cues—subject to topology partiality axes (`inference_posture`, `endpoint_pairing_posture`, `collection_posture`, `node_participation_posture`) and honest incomplete graphs
- **Policies:** persisted policy snapshots and history within the **honest policy envelope** (including proven **`static_local`** limits where applicable)
- **Readiness:** persisted readiness-support snapshots and **`readiness-snapshot-history`** inspection semantics—**planning-support** only (same as `readiness-capability-decision-support-contract.md`)
- **Workflow-history:** read-side sync-derived records, baseline summaries, and evidence drilldown anchors—**not** workflow lifecycle execution history
- **Audit-history:** audit events (e.g. read-side sync and readiness snapshot events)—**not** operator action logs for change control

**Windowing:** “Recent” is **`backend_defined_bounded_lookback`** and/or **`visible_signals_in_request_budget`** (see schema literals). It is **not** a guarantee of global completeness across all tables or a single unified “last changed” timestamp for the network.

## What does **not** count

- Inferred or hypothetical changes **without** a persisted or API-visible anchor
- Controller-authored **ground truth** (OpenDaylight remains a **bounded** probe; gNMI/collector paths carry observed-state limits as already documented)
- **Grafana** or **Prometheus** as sources of business truth for change summaries (metrics may **mirror** ages or counts; summaries remain **backend-owned**)

## Completeness and honesty

Summaries use **`bounded_partial`** / **`best_effort_visible_signals_only`** completeness posture. Empty domains, new baselines after redeploy, and collector timeouts must be **visible** in summary metadata—not hidden to pretend a greener posture.

## Safety rules (hard to misread)

1. **Backend-owned:** contracts and summaries live in **`app-api`**; Grafana does not implement change intelligence semantics.
2. **Evidence-backed:** every bullet in a summary must trace to an allowed **signal family** (see `BoundedChangeSignalFamily` in code)—no fabricated confidence.
3. **Non-authoritative:** `ChangeIntelligenceAuthorityPosture` stays **`summarization_only`** or **`evidence_aggregated_non_authoritative`** in Phase 2; never “approved” or “validated.”
4. **Explicit non-claims:** structured metadata may repeat `ChangeIntelligenceExplicitNonClaim` literals so clients and operators see the same denial vocabulary everywhere.
5. **Phase 2:** `phase_2_read_only_foundation` remains explicit in framing objects until a future phase authorizes richer semantics.

## Domain contribution matrix (bounded signals)

| Domain | May contribute (examples) | Honest limits (reminders) |
| --- | --- | --- |
| `devices` | Snapshot deltas, history anchors, comparison readiness | History depth gated by persisted rows; not full CMDB truth |
| `topology` | Snapshot deltas, coverage/posture changes | Partial graphs; inference and pairing limits |
| `policies` | Snapshot deltas, static_local-bounded detail | Broader families unproven off-lab |
| `readiness` | Readiness snapshot sequence | Planning-support only; not dry-run execution |
| `workflow_history` | Sync runs, baseline posture | Sync-derived, not workflow execution |
| `audit_history` | Audit events | Bounded event types; not full SOC audit |

## Related documents

- `readiness-capability-decision-support-contract.md`
- `topology-truth-depth-review.md`, `policy-truth-depth-review.md`
- `agent/sdn/03-CURRENT-STATUS.md` (operational verdict and closed slices)
