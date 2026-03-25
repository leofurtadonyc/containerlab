# Week 32 verifier parity contract

## Purpose

This document is an **audit contract** for **verification honesty**: it defines what **week 32 verifier parity** means, which evidence layers support which claims, and what operator-facing docs **must not** overstate.

It is **documentation and scheduling discipline only**. It does **not**:

- change **Service Dossier v1** or **Change Safety Case v1** product contracts, APIs, or WebUI semantics
- modify `verify-core-runtime.sh` (follow-on tasks may; this file precedes those changes)
- reopen [`week-32-friday-task-02-week32-docs-roadmap-rollup-and-posture.md`](../../agent/sdn-tasks/completed/week-32-friday-task-02-week32-docs-roadmap-rollup-and-posture.md) **Week 32 closure** as incomplete product work—closure remains valid; this file clarifies **verification** wording vs **live shell** behavior

**Integrity framing:** parity work is about **alignment between docs and scripts**, not about second-guessing shipped read-side assemblies.

## Overlap with Week 32 closure and post–week 32 guidance

- **Week 32 closure** ([`week-32-friday-task-02-week32-docs-roadmap-rollup-and-posture.md`](../../agent/sdn-tasks/completed/week-32-friday-task-02-week32-docs-roadmap-rollup-and-posture.md)) records that **Service Dossier v1**, **Change Safety Case v1**, cockpit/search integration, and **structural** `verify-core-runtime.sh` + repository tests form the paired verification story—**shell asserts presence only, not business logic**.
- [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) lists **`verify-core-runtime.sh`** bundle checks alongside **pytest** / **vitest** for week 32 surfaces.

This contract **narrows** what “structural **`verify-core-runtime.sh`**” means for **week 32** specifically, so planning does not treat the **live** script as proving more than it does.

## Definition: week 32 verifier parity

**Week 32 verifier parity** means:

1. **Documented claims** about what the **packaged runtime verification** (`./scripts/verify-core-runtime.sh`) proves for week **32** features match the **actual branches** in the script **as committed**.
2. Where docs combine **bundle marker** checks with **API** behavior, the **split** is explicit: which part is **live structural HTTP/JSON** from `app-api`, which part is **substring presence** in **app-web** ` /assets/*.js`, and which part is **repository** `pytest` / `vitest` only.
3. **No layer** is described as validating **assembly rules** or **business logic** in shell—consistent with the platform’s long-standing verifier rule: **structural presence**, not duplication of app logic.

Parity is **not** “the verifier must `GET` every week 32 route on every deploy.” It is “**what we say** the verifier does **is what it does**,” and optional follow-on work to add `GET` branches is **explicit** and **scoped**, not implied by existing roadmap language.

## Evidence layers (what proves what)

### A — Live `verify-core-runtime.sh` (packaged topology)

| Week 32 topic | What the script proves today | What it does *not* prove today |
| --- | --- | --- |
| **Service Dossier v1** | **app-web only:** the downloaded **`/assets/*.js`** chunk contains the literal substring **`service_dossier_v1`** (same structural marker family as other shipped contract-id strings). | **Does not** call **`GET /api/v1/services/{service_id}/dossier`** on the live stack. **Does not** prove a particular **`service_id`** returns a non-error body. |
| **Change Safety Case v1** | **app-web only:** the downloaded **`/assets/*.js`** chunk contains the literal substring **`change_safety_case_v1`**. | **Does not** call **`GET /api/v1/reports/change-safety-case/...`** on the live stack. **Does not** prove policy/service/maintenance report JSON shape at runtime. |

**Contrast (same script, different strength):** for **Impact Report v1** (week **31**), when **`python3`** and sampled **`policy_id`** / **`node_id`** exist, the script performs **compact JSON `GET`s** to **`/api/v1/reports/policy-impact`** and **`/api/v1/reports/maintenance-impact`** and asserts **`impact_report_v1`** (and related substrings). That pattern is **stronger** than the week **32** dossier/CSC **app-web marker-only** checks.

### B — Repository `pytest` (app-api)

| Topic | Representative artifacts |
| --- | --- |
| **Service Dossier** | `platform/app-api/tests/test_service_dossier.py` — HTTP/API contracts for **`GET /api/v1/services/{service_id}/dossier`** in CI or developer runs. |
| **Change Safety Case** | `platform/app-api/tests/test_change_safety_case.py` — report routes and **`change_safety_case_v1`** JSON shape. |

These prove **backend** behavior **in test environments**, not automatic proof on a specific lab **unless** the same checks are run there.

### C — Repository `vitest` (app-web)

| Topic | Representative areas |
| --- | --- |
| Navigation, URL setup, hubs | `service-dossier-navigation.test.ts`, `change-safety-case-navigation.test.ts`, download helpers, evidence replay parse rejecting **`change_safety_case_v1`** roots |
| Cockpit / search integration | `global-operator-search-week31.test.ts`, `overview-view.test.tsx` (and related overview/NOC tests) |

These prove **client** wiring and **strings** used in navigation—not that **`app-api`** on a given host returns full payloads.

### D — Optional host / Docker validation

[`INSTALLATION-INSTRUCTIONS.md`](../INSTALLATION-INSTRUCTIONS.md) documents optional **`npm test`** / **`npm run build`** for **app-web** and Docker flows for **pytest**—**additional** confidence, not a substitute for A unless operators actually run them on the stack under test.

## What docs must not overstate

- **Do not** imply that **`verify-core-runtime.sh` “proves”** **`GET /api/v1/services/{service_id}/dossier`** or **`GET /api/v1/reports/change-safety-case/...`** on the **live** deployment **unless** the script contains explicit **`fetch_compact_json`** (or equivalent) branches for those URLs and documented assertions—**currently it does not** for those routes.
- **Do** state clearly that **`service_dossier_v1`** / **`change_safety_case_v1`** checks in the verifier are **shipped frontend bundle markers** unless/until parity follow-on adds live **`app-api`** branches.
- **Do not** conflate **bundle substring** checks with **Grafana** or **Prometheus** proof—product semantics remain **app-api** + **app-web** per contracts.
- **Do not** use parity gaps to **reopen** week **32** product design; use them only to **tighten verification language** or to **schedule** optional script/doc follow-on.

## Non-goals

- Changing **`01-CURRENT-PHASE.md`** (remains **Phase 2 — read-only product foundation** unless explicit evidence elsewhere says otherwise).
- Replacing [`service-dossier-contract.md`](./service-dossier-contract.md) or [`change-safety-case-contract.md`](./change-safety-case-contract.md).

## References

| Artifact | Role |
| --- | --- |
| `platform/scripts/verify-core-runtime.sh` | Live packaged-runtime structural checks (source of truth for **A**) |
| `platform/app-api/tests/test_service_dossier.py`, `test_change_safety_case.py` | Backend contract tests (**B**) |
| `platform/app-web/tests/*` (dossier, change safety case, search, overview) | Frontend tests (**C**) |
| [`post-week-32-bounded-phase2-recommendation.md`](./post-week-32-bounded-phase2-recommendation.md) | Post–week **32** scheduling and anti-reopen posture |
| [`deployment-runbook.md`](./deployment-runbook.md) | Operator path: rebuild → deploy → verify |
