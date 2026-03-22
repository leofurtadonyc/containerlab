# Evidence pack contract (Phase 2)

## Purpose

This document is the **backend-owned bounded contract** for an **operator evidence pack** (also described as a **situation-room style** read-only artifact): a **composed** view that may bring together **current posture**, **recent change** signals, **bounded history context**, and **honest known gaps** from **existing** API-visible evidence—so operators can orient in one place **without** inventing validation engines, execution authority, safe-to-change recommendations, or incident/runbook command semantics.

Implementation references:

- `platform/app-api/src/app_api/schemas/evidence_pack.py` — stable literals, **`EVIDENCE_PACK_CONTRACT_ID`**, **`EvidencePackContentDomain`**, **`EvidencePackSafetyFraming`**, **`EvidencePackExplicitNonClaim`**, **`EvidencePackGuidanceRule`**, **`SituationPackAssemblyResponse`**
- `platform/app-api/src/app_api/services/situation_pack.py` — **`build_situation_pack_assembly_response`** (existing read-side builders only)
- **`GET /api/v1/evidence-pack/situation`** — bounded situation pack (week **26** task **02**); optional **`sync_runs_limit`** (aligned with nested change intelligence and workflow/audit sync-run windows)

Services and routes that adopt this contract must remain **read-only** and **backend-owned**; Grafana does not implement evidence-pack semantics.

## Classification: evidence pack vs week 24–25 lanes

| Layer | Role |
| --- | --- |
| Week **24** | **Change intelligence** — cross-domain **recent-change** summary (`change-intelligence-contract.md`). |
| Week **25** | **Investigation workspace** — nested **assembly** of change intelligence, platform status, and capabilities, plus bounded next-inspection hints (`investigation-workspace-contract.md`). |
| Week **26** | **Evidence pack** — **broader composed** operator artifact: may **reference** the same domains plus **explicit gap/history framing** and **workflow/audit history** context as **allowed content domains**—still **interpretation support only**; **not** a replacement for per-domain contracts or a second copy of aggregation math. |

**Evidence pack** is **not** a duplicate implementation of change-intelligence **`recent-summary`** aggregation or investigation-workspace **composition** logic. It names **which evidence families** may appear in a **single coherent pack** when a future assembly exists. **`investigation_context`** in this contract means the **investigation workspace assembly** (same backend family as `GET /api/v1/investigation-workspace/context`), not a separate truth domain.

## What an evidence pack **is** (bounded)

- A **backend-defined** read-only **assembly** (or document-shaped contract) of **pointers, summaries, and honest partiality** across **allowed content domains** (see matrix below).
- A **situation-room style** lens for correlating “what changed recently,” “what posture looks like now,” “what history surfaces show,” and “where evidence is missing or partial”—using **only** fields already allowed by Phase **2** APIs.
- **Guidance-shaped** or **gap-shaped** copy is allowed **only** when framed as **interpretation support** or **evidence-backed prompts**, never as approvals, execution steps, or command authority.

## What an evidence pack **is not**

- **Not** workflow execution, dry-run **execution**, change approval, rollback, or incident command.
- **Not** a validation verdict, intent verification, or conformance engine.
- **Not** drift detection, synthetic severity, risk scoring, or “safe to change” authority.
- **Not** a new persistence domain, new collector model, or Grafana-owned business semantics.
- **Not** a guarantee of completeness across all tables, all targets, or all time ranges.
- **Not** a unified forensic timeline or workflow chronology unless each domain’s own contract already exposes comparable timestamps.

## Content domains that may contribute (read-only)

These name **where** a pack may pull **existing** API-visible or persisted evidence. Each domain keeps its **own** honesty limits from prior contracts and reviews.

| Domain | Typical evidence-pack role | Honest limits (reminders) |
| --- | --- | --- |
| `devices` | Inventory snapshots, history, comparison anchors | History gated by persisted rows; not full CMDB |
| `topology` | Live/persisted topology, coverage/posture cues | Partial graphs; inference and pairing bounds |
| `policies` | Policy snapshots, history, static_local-bounded detail | Broader families unproven off-lab |
| `readiness` | Readiness snapshots, planning-support posture | Planning-support only; not dry-run execution |
| `capabilities` | Capability matrix, dry-run readiness excerpt | Interpretation only; not dry-run execution |
| `workflow_history` | Sync-derived records, baseline summaries | Not workflow lifecycle execution history |
| `audit_history` | Audit-style events from persisted sync substrate | Not SOC-grade change control |
| `change_intelligence` | Cross-domain **recent change** summary (`recent-summary`) | Aggregation only; same non-goals as change intelligence |
| `platform_status` | Recovery, read paths, component posture — **current** slice | Bounded probes; ODL remains helper probe |
| `investigation_context` | Investigation-workspace **assembly** (nested existing responses) | **Not** a separate truth domain; same limits as investigation workspace |

**Naming:** words like “pack,” “situation room,” or “gap” mean **read-only interpretation and visibility**, not operational authorization.

## Guidance rules (bounded, non-authoritative)

1. **Evidence-backed:** any “gap” or “next read” must map to an **allowed content domain** and **existing** product route or API family already in Phase **2**.
2. **Non-preferential:** packs do **not** rank operator actions or imply a single correct next step for the network unless a **single-domain** contract already exposes that explicitly.
3. **Explicit opt-out language:** copy must remain easy to read as **interpretation support**, not instruction to execute.
4. **No scoring:** no numeric “confidence,” “risk,” or “readiness to execute” synthesized across domains.

## Explicit non-authorization

An evidence pack response or document using this contract must **never** imply:

- **Validation** pass/fail or policy conformance verdicts
- **Drift** authority or “expected vs actual” ground truth
- **Safe to change**, blast-radius approval, or execution eligibility
- **Workflow** execution, **dry-run** execution, or **authorization**
- **Incident command**, runbook **authority**, or **approval** to act
- **Cross-domain completeness** guarantees or hidden green posture when evidence is partial

## Safety rules (hard to misread)

1. **Backend-owned:** contracts and any future pack responses live in **`app-api`**; Grafana does not implement evidence-pack semantics.
2. **Read-only Phase 2:** `phase_2_read_only_foundation` stays explicit in safety framing until a future phase authorizes richer semantics.
3. **Structured non-claims:** use `EvidencePackExplicitNonClaim` literals in metadata so clients and operators see a stable denial vocabulary.
4. **Authority posture:** remains non-authoritative (`interpretation_support_only` / `read_only_assembly_non_authoritative`); never “approved” or “validated.”

## Related documents

- `INSTALLATION-INSTRUCTIONS.md` — primary packaged validation is **build → deploy → verify scripts**; optional **`app-api`** **`pytest`** (including contract tests for schema modules) runs **in Docker** after **`docker build`** for **`platform-app-api`**, not as default host-side `pytest`
- `investigation-workspace-contract.md` — week **25** investigation workspace assembly (**`investigation_context`** domain here)
- `change-intelligence-contract.md` — recent change **summary** layer ( **`change_intelligence`** domain)
- `readiness-capability-decision-support-contract.md` — readiness/capability **interpretation** links
- `topology-truth-depth-review.md`, `policy-truth-depth-review.md`
- `post-week-25-bounded-phase2-recommendation.md` — scheduling guardrails after investigation workspace
