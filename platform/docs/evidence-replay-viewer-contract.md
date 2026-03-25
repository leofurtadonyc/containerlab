# Evidence replay viewer v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for an **evidence replay viewer v1**: a **read-only in-product surface** where an operator can **open**, **inspect**, and **navigate from** a **previously downloaded** [`evidence_export_v1`](./evidence-export-contract.md) artifact—**without** treating the replayed file as **live** platform truth, **without** re-executing collectors or workflows, and **without** implying tamper evidence or compliance authority.

**Evidence replay viewer v1** is **presentation and navigation glue** over **frozen snapshot bytes**—not a new indexer, not a second source of truth, and **not** a substitute for **Grafana**, **Postgres**, **live** dossier APIs, or **authoritative** per-domain `GET` responses.

Stable product vocabulary (for implementation and tests when the viewer ships): **`evidence_replay_viewer_v1`**

**Relationship to adjacent contracts:**

| Contract | Role |
| --- | --- |
| [`evidence-export-contract.md`](./evidence-export-contract.md) (`evidence_export_v1`) | Defines **what** may be exported, **envelope** shape, **formats**, and **non-claims** |
| This document (`evidence_replay_viewer_v1`) | Defines **how** an operator **re-opens** those exports **inside the WebUI** for review and **pivot** to live workspaces |

---

## Supported export kinds for replay (v1)

Replay **must** support exactly the same **`export_kind`** values and subject semantics as **evidence export v1**. A conforming viewer **must** reject or clearly label **unknown** `export_kind` values (see [Malformed and partial inputs](#malformed-and-partial-inputs)).

| `export_kind` | `subject_ref` expectations (from envelope) | Live analogue |
| --- | --- | --- |
| **`policy_dossier`** | **`policy_id`** (path identity in export) | [`GET /api/v1/policies/{policy_id}/dossier`](./policy-dossier-contract.md) |
| **`topology_object_dossier`** | **`object_id`** (and kind from nested dossier identity) | [`GET /api/v1/topology/objects/{object_id}/dossier`](./topology-object-dossier-contract.md) |
| **`situation_room`** | **`sync_runs_limit`** (or equivalent window in `subject_ref`) | [`GET /api/v1/evidence-pack/situation`](./evidence-pack-contract.md) |
| **`investigation_workspace`** | **`sync_runs_limit`** (or equivalent window in `subject_ref`) | [`GET /api/v1/investigation-workspace/context`](./investigation-workspace-contract.md) |

**Out of scope for v1 replay:** unified interactive replay of a full **[`briefing_export_bundle_v1`](./briefing-export-bundle-contract.md)** file as **one** viewer session (operators replay **individual** embedded **`evidence_export_v1`** members per [`briefing-export-bundle-contract.md`](./briefing-export-bundle-contract.md) §Live vs replay); **[`impact_report_v1`](./impact-report-contract.md)** JSON from **`GET /api/v1/reports/...`** and **[`change_safety_case_v1`](./change-safety-case-contract.md)** JSON from **`GET /api/v1/reports/change-safety-case/...`** (different envelopes and routes from **`GET /api/v1/exports/...`**—use the **Impact Report** or **Change safety case** views, or export dossier/situation/investigation snapshots for frozen evidence instead); ad-hoc file types; encrypted or opaque blobs without a parseable **`evidence_export_v1`** envelope; exports generated outside **`GET /api/v1/exports/...`**; or replay of **non-export** JSON (e.g. raw `curl` dumps of arbitrary APIs).

**Repository regression (app-web vitest):** **`evidence-replay-parse.test.ts`** pins **`parseEvidenceExportJson`** rejection of root **`impact_report_v1`** and **`change_safety_case_v1`** (including **`safety_case_context`** variants); **`replay-report-export-route-honesty.test.ts`** pins **report** download builders to **`/api/v1/reports/...`** and **export** builders to **`/api/v1/exports/...`** with no cross-family URLs.

---

## Accepted formats for replay (v1)

| Format | Status | Requirements |
| --- | --- | --- |
| **JSON** | **Required** for full viewer fidelity | Body **must** parse as an object that includes the **`evidence_export_v1`** envelope fields defined in [`evidence-export-contract.md`](./evidence-export-contract.md) (**`contract_id`**, **`export_kind`**, **`subject_ref`**, **`generated_at`**, nested payload, **`source_contract_ids`** where applicable). UTF-8. |
| **Markdown** | **Optional** display path | May be offered as **read-only rendered** text when the operator opens a **`.md`** export; **structured** pivots and **nested contract** fidelity **should** be **weaker** than JSON (headings and prose only—**no** requirement to reconstruct interactive panels from Markdown alone). Implementations **must** label Markdown replay as **companion / human summary** when JSON is not loaded. |

**Disallowed as v1 authoritative replay sources:** PDF-only, screenshots, or binaries without an accompanying **JSON** export for the same snapshot when **structured** replay is promised.

---

## Rendering expectations (v1)

A conforming **evidence replay viewer** **must**:

1. **Surface mode** — Show a persistent **Replay** (or equivalent) **banner** or **eyebrow** so the operator **never** confuses the page with a **live** workspace fed by current API calls.
2. **Envelope first** — Display **export metadata** before or beside the body: **`export_kind`**, **`subject_ref`**, **`generated_at`** (export generation time), and **nested** source timestamps when present (**`dossier_assembled_at`**, **`metadata.generated_at`**, etc.) **without** collapsing them into a single unlabeled “timestamp.”
3. **Honest body** — Render **nested sections** that correspond to the **exported payload** (tables, lists, caveat blocks) using **read-only** presentation—**no** inline editing, **no** “apply” or “remediate” affordances.
4. **Caveats preserved** — **Explicit non-claims**, **merged caveats**, **missing_evidence_notes**, and **evidence_confidence** / **serving_mode** echoes **must** remain **visible** in replay when present in the file; trimming **must** be called out as **truncation**, not silence.
5. **No refresh-as-truth** — **Reload file** may re-read the **local** artifact only; **must not** imply that the **file** updated from the platform unless the operator performs a **separate** live action.

**Should** (recommended):

- Offer **expand/collapse** for large nested blocks **without** hiding caveat sections by default.
- Show **`source_contract_ids`** (or equivalent) as a **provenance strip** linking to contract docs—not execution hooks.

---

## Live vs replayed evidence framing

| Mode | Meaning | Operator obligation |
| --- | --- | --- |
| **Live workspace** | WebUI routes fed by **current** `GET` responses (and shell **`view=`** / query params) | Subject to **staleness**, **collector**, and **read_path** semantics of each **live** API |
| **Replayed export** | **Frozen** bytes from **`generated_at`** (export time) plus nested source times in the payload | **Point-in-time** review; **not** current inventory/topology/policy truth; **not** a live feed |

Implementations **must**:

- **Not** label replay as **“Live”**, **“Current”**, or **“Authoritative now”** without a **separate** explicit control that navigates to the **live** surface.
- **Not** merge replay content into **Prometheus**, **Grafana**, or **workflow** state.
- Prefer copy such as **“Replay of exported evidence (not live product data)”** in the **primary** framing region.

---

## Pivot rules back to live workspaces (v1)

Replay exists to **review** a snapshot, then **jump** to the **same bounded subject** in **live** Phase **2** product routes. Pivots **must** use **existing** shell navigation helpers and **preserve** **read-side** query conventions where applicable.

| From `export_kind` | Live pivot target (shell) | Parameters to preserve |
| --- | --- | --- |
| **`policy_dossier`** | **`view=policies`** with **`policy_id`**, optional **`policy_workspace=dossier`** | **`policy_id`** from `subject_ref` / envelope |
| **`topology_object_dossier`** | **`view=topology`** with **`topology_object`**, **`topology_object_kind`**, optional **`topology_workspace=dossier`** | **Object id** and **kind** from nested **`object_identity`** or envelope |
| **`situation_room`** | **`view=situation-room`** | **`sync_runs_limit`** aligned to export window when present |
| **`investigation_workspace`** | **`view=investigation`** | **`sync_runs_limit`**; optional **`inv_from`** may be set to a client hint such as **`evidence-replay`** only if the shell documents it—**not** authority for app-api |

**Non-claims for pivots:**

- **Open live …** navigates to **today’s** **`GET`** results; **IDs** may **no longer exist** or may **differ** in posture—**not** a guarantee of parity with the file.
- Pivots **must not** silently **POST**, **PATCH**, or **trigger** workflows.

---

## Explicit non-claims

Evidence replay viewer v1:

- is **not** **live** platform truth and **must not** be marketed as a **substitute** for **live** **Policies**, **Topology**, **Situation room**, or **Investigation** views
- is **not** **tamper detection**, **integrity verification**, or **signature validation** of the file
- is **not** **compliance**, **legal hold**, or **audit signing**
- is **not** a **backup restore**, **disaster recovery** view, or **database** inspection
- is **not** **validation**, **drift verdict**, **safe-to-change**, or **incident command**
- is **not** **complete** if the **source export** was truncated, partial, or from an **older** `evidence_export_v1` revision
- is **not** **Grafana** or **metrics** truth—replay **must not** embed or refresh time-series panels from the file as if they were **current**

---

## Malformed and partial inputs

| Situation | Required behavior |
| --- | --- |
| **Not JSON** / parse failure | **Blocking error** with a clear message; **no** partial pretend-success. |
| **JSON but missing `contract_id` or not `evidence_export_v1`** | **Blocking error** or **unsupported file** state; **must not** guess subject. |
| **Unknown `export_kind`** | **Unsupported export kind** message; **no** generic tree viewer that implies authority. |
| **Missing nested payload** | **Partial replay**: show envelope + **honest** “body missing or incomplete” copy; **must not** fabricate sections. |
| **Schema drift** (unexpected fields / older nested `contract_id`) | **Best-effort** display of known sections; **must** surface **parse warnings** (e.g. “some sections could not be mapped”) **without** dropping caveat blocks that **did** parse. |
| **Markdown-only open** | **Read-only** prose rendering; **pivot** actions **may** be **limited** to “open live workspace” using **parsed** or **manually entered** ids from header—**must** label uncertainty if ids are ambiguous. |

---

## Relationship to other documents

| Topic | Document |
| --- | --- |
| Export routes, envelope, formats | [`evidence-export-contract.md`](./evidence-export-contract.md) |
| Operator briefing (export framing, not replay UI) | [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) |
| Policy dossier | [`policy-dossier-contract.md`](./policy-dossier-contract.md) |
| Topology object dossier | [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) |
| Situation / evidence pack | [`evidence-pack-contract.md`](./evidence-pack-contract.md) |
| Investigation workspace | [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) |

---

## Revision policy

Adding **new** replayable **`export_kind`** values, **trusted** / **signed** replay, or **server-side** stored replay sessions requires **`evidence_replay_viewer_v2`** (or explicit minor version) and updated non-claims.
