# Investigation workspace contract (Phase 2)

## Purpose

This document is the **backend-owned bounded contract** for an **operator investigation workspace**: a **read-only assembly** of **existing** evidence—recent change signals, current platform posture, and supporting per-domain context—so operators can reason in **one coherent place** without inventing validation engines, execution authority, or safe-to-change recommendations.

Implementation references:

- `platform/app-api/src/app_api/schemas/investigation_workspace.py` — stable literals, safety framing, explicit non-claims, and **`InvestigationContextAssemblyResponse`**
- **`GET /api/v1/investigation-workspace/context`** — backend-owned assembly of nested **existing** responses (change-intelligence recent summary, platform status, capabilities matrix); optional **`sync_runs_limit`** query (forwarded to the nested change-intelligence assembly only); includes **`next_inspection_framing`** and **`next_inspection_suggestions`** (evidence-derived navigation prompts only—no scoring or execution authority)
- **WebUI** **`view=investigation`** — dedicated read-only **Investigation workspace** product surface (`InvestigationWorkspaceProduct`) that renders safety framing, domain-level recent-change rows with navigation, platform recovery/read-paths/components, capabilities matrix preview, bounded next-inspection hints, and hub navigation—**no** client-side scoring or workflow semantics
- `platform/app-api/src/app_api/services/investigation_workspace.py` — composition only; **no** new collection or scoring

Services and routes assemble **only** allowed sources; this document does **not** prescribe UI layout.

## Classification: new lane vs week 24 change intelligence vs weeks 19–23

| Layer | Role |
| --- | --- |
| Weeks **19–20** | Per-domain **persisted history** and **comparison** on devices and policies. |
| Weeks **21–23** | **Query ergonomics**, **readiness/capability decision-support** navigation (interpretation-only). |
| Week **24** | **Change intelligence** — **cross-domain recent-change summary** over existing signals (`change-intelligence-contract.md`). |

**Investigation workspace** is a **broader assembled investigation layer**: it is **not** a duplicate of change-intelligence aggregation math, and **not** a second readiness graph. It **may reference** change intelligence as **one** context source alongside **current posture** (e.g. platform status / recovery) and **direct** per-domain APIs. The workspace **assembles visibility** for interpretation; it does **not** unify truth depth beyond each domain’s own contracts.

## What an investigation workspace **is** (bounded)

- A **backend-defined** read-only **assembly** of pointers, summaries, and **honest partiality** across **allowed context domains** (see matrix below).
- A place to **correlate** “what changed recently” (including change intelligence), “what the platform says about posture now,” and “where to read richer evidence” on existing product surfaces.
- **Suggestion-shaped** copy is allowed **only** when framed as **optional next read-only surfaces** or **evidence-backed prompts**, never as approvals or execution steps.

## What an investigation workspace **is not**

- **Not** workflow execution, dry-run **execution**, change approval, or rollback.
- **Not** a validation verdict, intent verification, or conformance engine.
- **Not** drift detection, risk scoring, or “safe to change” authority.
- **Not** a new persistence domain, new collector model, or Grafana-owned business semantics.
- **Not** a guarantee of completeness across all tables, all targets, or all time ranges.

## Context domains that may contribute (read-only)

These name **where** assembly may pull **existing** API-visible or persisted evidence. Each domain keeps its **own** honesty limits from prior contracts and reviews.

| Domain | Typical investigation role | Honest limits (reminders) |
| --- | --- | --- |
| `devices` | Inventory snapshots, history, comparison anchors | History gated by persisted rows; not full CMDB |
| `topology` | Live/persisted topology, coverage/posture cues | Partial graphs; inference and pairing bounds |
| `policies` | Policy snapshots, history, static_local-bounded detail | Broader families unproven off-lab |
| `readiness` | Readiness snapshots, planning-support posture | Planning-support only; not dry-run execution |
| `workflow_history` | Sync-derived records, baseline summaries | Not workflow lifecycle execution history |
| `audit_history` | Audit-style events from persisted sync substrate | Not SOC-grade change control |
| `change_intelligence` | Cross-domain **recent change** summary (`recent-summary`) | Aggregation only; same non-goals as change intelligence |
| `platform_status` | Recovery, read paths, component posture — **current** slice | Bounded probes; ODL remains helper probe |
| `capabilities` | Capability matrix, dry-run readiness excerpt | Interpretation and planning-support only; not dry-run execution |

**Naming:** words like “investigate,” “suggest,” or “next read” mean **read-only navigation and interpretation support**, not operational authorization.

## Suggestion rules (bounded, non-authoritative)

1. **Evidence-backed:** any “next place to look” must map to an **allowed context domain** and **existing** product route or API family already in Phase **2**.
2. **Non-preferential:** suggestions do **not** rank operator actions or imply a single correct next step for the network.
3. **Explicit opt-out language:** copy must remain easy to read as **interpretation support**, not instruction to execute.
4. **No scoring:** no numeric “confidence,” “risk,” or “readiness to execute” synthesized across domains.

## Explicit non-authorization

An investigation workspace response or document using this contract must **never** imply:

- **Validation** pass/fail or policy conformance verdicts
- **Drift** authority or “expected vs actual” ground truth
- **Safe to change**, blast-radius approval, or execution eligibility
- **Workflow** execution, **dry-run** execution, or **authorization**
- **Cross-domain completeness** guarantees or hidden green posture when evidence is partial

## Safety rules (hard to misread)

1. **Backend-owned:** contracts and any future assembly responses live in **`app-api`**; Grafana does not implement investigation semantics.
2. **Read-only Phase 2:** `phase_2_read_only_foundation` stays explicit in safety framing until a future phase authorizes richer semantics.
3. **Structured non-claims:** use `InvestigationWorkspaceExplicitNonClaim` literals in metadata so clients and operators see a stable denial vocabulary.
4. **Authority posture:** remains non-authoritative (`interpretation_support_only` / `read_only_assembly_non_authoritative`); never “approved” or “validated.”

## Related documents

- `INSTALLATION-INSTRUCTIONS.md` — primary packaged validation is **build → deploy → verify scripts**; optional **`app-api`** **`pytest`** (including contract tests for this module) runs **in Docker** after **`docker build`** for **`platform-app-api`**, not as default host-side `pytest`
- `change-intelligence-contract.md` — recent change **summary** layer (may be **one input** to investigation assembly)
- `readiness-capability-decision-support-contract.md` — readiness/capability **interpretation** links
- `topology-truth-depth-review.md`, `policy-truth-depth-review.md`
- `post-week-24-bounded-phase2-recommendation.md` — scheduling guardrails after change intelligence
