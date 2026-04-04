# Maintenance window handoff v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for **maintenance window handoff v1**: a **deterministic, shareable snapshot** of a **multi-subject maintenance-window planning review** so operators can **attach**, **email**, or **archive** “what we looked at for this window” **without** conflating it with **live** workspace JSON, **`evidence_export_v1`** frozen dossier exports, **briefing** bundles, **impact** reports, or **change-safety** cases.

**Maintenance window handoff v1** is a **serialization envelope** around an **`maintenance_window_workspace_v1`-shaped body** (or a **documented subset** of that body) **plus** handoff metadata—**not** a new truth engine, **not** workflow approval, and **not** tamper-evident evidence by default.

Stable product vocabulary: **`contract_id`:** **`maintenance_window_handoff_v1`**

**HTTP (implemented in app-api):** **`GET /api/v1/exports/maintenance-window-handoff`** — query alignment with **`GET /api/v1/maintenance-window-workspace`**: repeated **`subject`** (`node:` / `link:`), **`preview_context`**, **`sync_runs_limit`**; optional **`handoff_label`** and **`operator_note`** (communication only). **`format=json`** (default) or **`format=markdown`** (companion; JSON is canonical).

**Surface role:** `Phase 2` read-only product surface within the current repo state. This contract does not expand the bounded `Phase 5` workflow slices.

---

## Overlap review: why this is distinct (not duplicate work)

| Completed lane | Canonical artifact | **Maintenance window handoff v1** is **not** a duplicate because |
| --- | --- | --- |
| [`week-29-thursday-task-01-evidence-export-contract.md`](../../agent/sdn-tasks/completed/week-29-thursday-task-01-evidence-export-contract.md) → [`evidence-export-contract.md`](./evidence-export-contract.md) (`evidence_export_v1`) | **Dossier / situation / investigation** snapshots under **`exports/...`** with **`export_kind`** ∈ `policy_dossier` \| `topology_object_dossier` \| `situation_room` \| `investigation_workspace` | Handoff is **`maintenance_window_handoff_v1`** — **different** root **`contract_id`** and **different** subject (multi-subject **maintenance window** rollup), **not** another **`export_kind`** inside **`evidence_export_v1`**. |
| [`week-30-thursday-task-01-briefing-export-bundle-contract.md`](../../agent/sdn-tasks/completed/week-30-thursday-task-01-briefing-export-bundle-contract.md) → [`briefing-export-bundle-contract.md`](./briefing-export-bundle-contract.md) (`briefing_export_bundle_v1`) | **Container** of **zero or more** embedded **`evidence_export_v1`** members aligned with **operator briefing** context | **Briefing bundle** is **multi-member `evidence_export_v1`** packaging; **maintenance window handoff** is a **single-window** rollup snapshot tied to **`maintenance_window_workspace_v1`** semantics—**not** a bundle of dossier/situation exports. |
| [`week-30-tuesday-task-01-operator-briefing-workspace-contract.md`](../../agent/sdn-tasks/completed/week-30-tuesday-task-01-operator-briefing-workspace-contract.md) → [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md) | **Live** composed briefing workspace (`operator_briefing_workspace_v1`) | Handoff is a **frozen export** artifact for **maintenance-window** review, **not** a second copy of the **operator briefing** workspace contract. |
| [`week-31-thursday-task-01-impact-report-contract.md`](../../agent/sdn-tasks/completed/week-31-thursday-task-01-impact-report-contract.md) → [`impact-report-contract.md`](./impact-report-contract.md) (`impact_report_v1`) | **Downloadable narrative** from **`GET /api/v1/reports/...`** (service/policy/maintenance impact storylines) | **Impact report** is **report-family** narrative; handoff is **maintenance-window rollup serialization** from **`/api/v1/maintenance-window-workspace`** assembly—**orthogonal** envelope and **not** `impact_report_v1`. |
| [`week-32-wednesday-task-01-change-safety-case-contract.md`](../../agent/sdn-tasks/completed/week-32-wednesday-task-01-change-safety-case-contract.md) → [`change-safety-case-contract.md`](./change-safety-case-contract.md) (`change_safety_case_v1`) | **Pre-change** sufficiency for **one** anchored subject via **`reports/change-safety-case/...`** | **Change safety case** is **single-subject** change reasoning; handoff **may cite** overlapping maintenance context but **does not** embed CSC as the handoff root—**not** `change_safety_case_v1`. |

**One-line distinction:** **`evidence_export_v1`** = frozen **export-kind** snapshots from **`/exports/...`**; **`briefing_export_bundle_v1`** = **multi-member** briefing-aligned **`evidence_export_v1`** container; **`maintenance_window_handoff_v1`** = **maintenance-window multi-subject rollup** handoff snapshot from **`maintenance_window_workspace_v1`** semantics.

---

## Relationship to evidence export, briefing bundle, reports, and replay

| Artifact | Relationship |
| --- | --- |
| **`evidence_export_v1`** | Handoff is **not** an **`evidence_export_v1`** envelope. Operators who need **frozen dossier** or **situation/investigation** exports should use **`GET /api/v1/exports/...`** per [`evidence-export-contract.md`](./evidence-export-contract.md). |
| **`briefing_export_bundle_v1`** | Handoff is **not** a briefing bundle. Do **not** embed handoff as a bundle member without a **future** contract revision that explicitly defines mapping. |
| **`impact_report_v1`** | **Report** downloads remain **`GET /api/v1/reports/...`**. Handoff does **not** substitute for impact report JSON. |
| **`change_safety_case_v1`** | **Report** downloads remain **`GET /api/v1/reports/change-safety-case/...`**. Handoff does **not** substitute for change safety case JSON. |
| **`maintenance_window_workspace_v1`** | Handoff **should** carry a **`workspace_snapshot`** (or equivalent) whose semantics **match** [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md) for the same query parameters at **`handoff_generated_at`** (or document **staleness** if the snapshot is older). |
| **Evidence replay** ([`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md)) | **`maintenance_window_handoff_v1`** is **not** an **`evidence_export_v1`** root — **replay is out of scope** for the standard viewer **unless** a future revision explicitly adds support (same honesty class as **`maintenance_window_workspace_v1`** live JSON). |

---

## Envelope shape (normative intent)

A conforming handoff document **must** include:

1. **`contract_id`** — **`maintenance_window_handoff_v1`**
2. **`handoff_generated_at`** — UTC timestamp when the handoff file was **assembled** (distinct from nested **`metadata.generated_at`** on the workspace body when present).
3. **`handoff_subject`** — Echo of **bounded** inputs used to build the snapshot: **`subjects`** (normalized `node:` / `link:` list), **`preview_context`**, **`sync_runs_limit`** (or equivalent), **optional** `handoff_label` / `operator_note` (free-text **communication** only — **not** approval, **not** ticketing).
4. **`workspace_snapshot`** — **Embedded** or **referenced** payload that **conforms** to **`maintenance_window_workspace_v1`** semantics (full **`MaintenanceWindowWorkspaceResponse`** shape or a **documented** subset with **explicit truncation** notes).
5. **`source_contract_ids`** — Union of nested contract ids **`maintenance_window_handoff_v1`**, **`maintenance_window_workspace_v1`**, and any nested families referenced in the snapshot.
6. **`explicit_non_claims`** — **Must** include handoff-level lines below (see [Explicit non-claims](#explicit-non-claims)) **plus** propagated workspace non-claims **without** dropping honesty.

**Optional fields (implementation-defined):** `handoff_format_version`, `assembly_notes`, `truncation_notes`.

---

## Included sections (minimum body)

The **`workspace_snapshot`** **should** preserve the **normative section types** of the live workspace (see [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md) §Normative section order):

- Selected subjects and resolution failures (when present)
- Deduped affected services and related policies rollups
- Merged evidence gaps and assembly caveats
- Stability and tension cues (when present)
- Explicit non-claims

**Truncation:** If a future exporter caps table rows, **must** echo **`truncation_notes`** or **counts** vs **returned** so the file is not read as complete fleet truth.

---

## Omitted sections (must not appear as hidden authority)

A handoff file **must not** embed or imply:

- workflow **approval**, **scheduling**, or **dry-run** outputs not already in Phase **2** read contracts
- **Signatures**, **hashes**, or **non-repudiation** claims unless a **future** security contract explicitly adds them
- **Grafana** / **Prometheus** corpora as “evidence” beyond what the workspace already cites
- **Change safety case** or **impact report** **full bodies** as substitutes for **`GET /api/v1/reports/...`** (pointers only, if desired)
- **`evidence_export_v1`** members **pretending** to be the handoff root (wrong envelope)

---

## Explicit non-claims

Maintenance window handoff v1 **is**:

- **not** **workflow approval**, **maintenance authorization**, or **change validation**
- **not** **tamper-evident**, **signed**, or **immutable** by default
- **not** **`evidence_export_v1`**, **`briefing_export_bundle_v1`**, **`impact_report_v1`**, or **`change_safety_case_v1`**
- **not** a **substitute** for **live** **`GET /api/v1/maintenance-window-workspace`** or **live** per-subject **`GET`** families when current truth is required
- **not** **safe-to-change**, **blast-radius**, or **SLA** proof
- **not** an **evidence replay** root for [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) (unless a **future** revision adds explicit support)

---

## Formats (v1)

| Format | Role |
| --- | --- |
| **JSON** | **Canonical** interchange; lossless for allowed fields. UTF-8. |
| **Markdown** | **Optional** human companion; **must** state JSON is canonical for structured fidelity. |

---

## Gap audit (implementation follow-on)

| Area | Status |
| --- | --- |
| **Contract document** | **Delivered:** this file (`maintenance-window-handoff-contract.md`). |
| **Schema + export route** | **Delivered:** **`GET /api/v1/exports/maintenance-window-handoff`** — **`schemas/maintenance_window_handoff.py`**, **`services/maintenance_window_handoff.py`**, **`routers/exports.py`**; **`pytest`** **`test_maintenance_window_handoff.py`**. |
| **WebUI download** | **Future** — aligned with export route (week **38** follow-on). |

---

## Related documents

- [`maintenance-window-workspace-contract.md`](./maintenance-window-workspace-contract.md)
- [`evidence-export-contract.md`](./evidence-export-contract.md)
- [`briefing-export-bundle-contract.md`](./briefing-export-bundle-contract.md)
- [`impact-report-contract.md`](./impact-report-contract.md)
- [`change-safety-case-contract.md`](./change-safety-case-contract.md)
- [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md)
- [`operator-briefing-workspace-contract.md`](./operator-briefing-workspace-contract.md)
- [`data-flows.md`](./data-flows.md)

---

## Phase alignment note

**`01-CURRENT-PHASE.md`:** should **remain unchanged** — Phase **2** read-only foundation.

**`03-CURRENT-STATUS.md`:** update when the **export route** and **operational** handoff behavior exist—not for contract-doc-only delivery.
