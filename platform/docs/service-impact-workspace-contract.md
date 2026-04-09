# Service Impact Workspace v1 contract (Phase 2, read-only)

## Purpose and classification

**Service Impact Workspace v1** is a **bounded Phase 2** operator workspace that answers, in read-only form: **“Given this service anchor, what does existing evidence say about affected services, related policies, topology linkage, and failure-oriented posture—without pretending we have blast radius or incident authority?”**

It **aggregates and frames** already-delivered assemblies; it **does not** replace inventory rules, collector mappings, or the authoritative JSON of nested routes.

**Surface role:** `Phase 2` read-only product surface within the current repo state.

---

## Overlap with closed slices (extension, not duplicate work)

| Closed slice | Canonical completed task | What Service Impact Workspace adds |
| --- | --- | --- |
| Failure-impact v1 (`failure_impact_v1`) | [`week-28-monday-task-01-failure-impact-v1-contract-and-gap-audit.md`](../../agent/sdn-tasks/completed/week-28-monday-task-01-failure-impact-v1-contract-and-gap-audit.md) | **Service-centric framing** that may **embed** or pivot to failure-impact for a topology anchor—**not** a second failure-impact derivation. |
| Service Explorer v1 (`service_explorer_v1`) | [`week-31-monday-task-01-service-explorer-contract.md`](../../agent/sdn-tasks/completed/week-31-monday-task-01-service-explorer-contract.md) | **Composed “affected services” narrative** over the **authoritative** member/grouping list—**not** a replacement for **`GET /api/v1/services/...`**. |
| Service Dossier v1 (`service_dossier_v1`) | [`week-32-monday-task-01-service-dossier-contract.md`](../../agent/sdn-tasks/completed/week-32-monday-task-01-service-dossier-contract.md) | **Different workspace goal**: dossier is **deep composed briefing** for one **`service_id`**; Service Impact Workspace emphasizes **impact-oriented grouping and cross-signal summary** when implemented—still **optional embed**, not dossier JSON substitution. |
| Maintenance Preview v1 (`maintenance_preview_v1`) | [`week-31-wednesday-task-01-maintenance-preview-contract.md`](../../agent/sdn-tasks/completed/week-31-wednesday-task-01-maintenance-preview-contract.md) | **Navigation / interpretation** relationship only—maintenance preview remains **authoritative** for its **`GET`**; workspace may **link** with honest “planning context” copy. |
| Change Safety Case v1 (`change_safety_case_v1`) | [`week-32-wednesday-task-01-change-safety-case-contract.md`](../../agent/sdn-tasks/completed/week-32-wednesday-task-01-change-safety-case-contract.md) | **Distinct report contract**; workspace may **pivot** to change-safety-case **`GET`**s—**not** merge case JSON into “impact” proof. |

---

## What a service impact workspace is (Phase 2 slice)

- **Subject:** one **`service_id`** using the **same identity and parsing rules** as [**Service Explorer v1**](./service-explorer-contract.md) (`policy:`, `color:`, `headend:`, `endpoint:` forms as defined there).
- **Intent:** surface **read-only** summaries that help operators orient on **which policies and topology anchors matter** for “impact” **interpretation** in the bounded evidence model—using **nested** Explorer detail, optional **failure-impact** rollup when a topology **`node_id`** anchor resolves, and **merged** caveats.
- **Non-intent:** **not** a new catalog of services, **not** SLA or traffic simulation, **not** workflow or approval.

---

## Supported anchors and scoping rules

- **Primary anchor:** **`service_id`** that resolves for **`GET /api/v1/services/{service_id}`** (same **404** / empty honesty as Service Explorer detail when unsupported).
- **Topology anchor (optional):** a **`node_id`** (or documented link rule) taken from **Service Explorer** **`topology_links`** when present—used **only** to attach **failure-impact v1** semantics that already exist for that object identity.
- **Policy scope:** **member policies** of the service grouping per Explorer—**not** global policy health.

---

## Reuse boundaries versus failure-impact, explorer, dossier, maintenance preview, change safety case

| Surface | Boundary |
| --- | --- |
| **Service Explorer** | **Authoritative** for **members**, **degraded** rollups, and **topology_links** columns. |
| **Failure-impact** | **Authoritative** for rollup counts and **`failure_impact_v1`** JSON when embedded; subset-scoped per existing contract. |
| **Service Dossier** | **Different** composed product; may share **`service_id`** but **not** interchangeable JSON. |
| **Maintenance Preview** | **Separate** `GET`; workspace links for planning context only. |
| **Change Safety Case** | **Separate** report `GET`s; workspace links for change-adjacent interpretation only. |
| **Impact Report (`impact_report_v1`)** | **Separate** downloadable report family ([`impact-report-contract.md`](./impact-report-contract.md)); not merged as “the workspace body.” |

---

## HTTP surface (shipped backend, read-only)

- **`GET /api/v1/service-impact-workspace?service_id=…`**
  - **Contract id:** `service_impact_workspace_v1`
  - **Composition:** nested **`service_explorer_v1`** body (same assembly as **`GET /api/v1/services/{service_id}`**), plus optional embedded **`failure_impact_v1`** when **`topology_links`** yields a **`node_id`** and failure-impact assembly succeeds for that topology object.
  - **Does not replace:** **`GET /api/v1/services/{service_id}`**, **`GET /api/v1/topology/objects/{object_id}/failure-impact`**, maintenance preview, change safety case, service dossier, or impact reports — **`recommended_api_pivots`** lists those GETs for navigation only.
  - **Sparse / 404:** unknown **`service_id`** form or zero members (**404**, aligned with Service Explorer detail); no topology links → failure-impact omitted with **`failure_impact_assembly_note`** and merged gap notes; topology anchor present but failure-impact returns no rollup → honest **`failure_impact_assembly_note`**.
- **WebUI:** **`view=service-impact-workspace`** with query **`service_impact_workspace_service_id`** (distinct from Service Explorer **`service_id`** to avoid cross-view ambiguity). First-class nav item **Service Impact**; pivot from Service Explorer detail (**Service Impact workspace**).

---

## Normative section order (service impact workspace)

1. **Subject and scope** — `service_id`, kind, Phase 2 read-only reminder.  
2. **Affected service grouping summary** — from Explorer: members, degraded posture, topology evidence status.  
3. **Related policies and topology anchors** — member table and **`topology_links`** (string alignment discipline unchanged).  
4. **Degraded / failure-impact relationship summary** — optional failure-impact block; explicit subset scope.  
5. **Maintenance / change-safety relationship** — pointers only; contract ids echoed, not merged verdicts.  
6. **Evidence gaps and unsupported conditions** — merged notes when anchors or assemblies are partial.  
7. **Investigation / briefing / export relationships** — shell pivots; see below.

---

## Merged caveat and freshness expectations

- **Merged caveats:** deduped lines from Explorer **`caveats`**, **`topology_caveats`**, optional failure-impact **`caveats`** / **`missing_evidence_notes`**, and optional workspace framing lines—**no** invented operational facts.
- **Freshness:** echo nested **`metadata.generated_at`** and inventory/topology timestamps from nested responses; **do not** claim a single unified “freshness score” unless computed only from **existing** fields.

---

## Navigation expectations and export / report relationship

- **Navigation:** read-only **`view=`** shell hints to **Investigation**, **Operator briefing**, **Policies**, **Topology**, **Service Dossier**, **Maintenance Preview**, **Impact Report** hub, **Change Safety Case**—same discipline as other composed workspaces.
- **Export / replay (normative):**
  - **Live API:** **`GET /api/v1/service-impact-workspace?service_id=…`** returns **`service_impact_workspace_v1`** — a **read-only composed** response, **not** an export envelope.
  - **Not `evidence_export_v1`:** there is **no** dedicated “save workspace as export” contract in Phase **2**; frozen review uses **`GET /api/v1/exports/...`** (dossier, situation, investigation, operator briefing bundle per [`evidence-export-contract.md`](./evidence-export-contract.md)).
  - **Evidence replay:** the WebUI **rejects** root JSON with **`contract_id":"service_impact_workspace_v1`** in **Evidence replay** (same class of honesty as **`impact_report_v1`** / **`change_safety_case_v1`** roots)—see [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md).
  - **Reports:** **`impact_report_v1`** and **`change_safety_case_v1`** remain **separate** **`GET /api/v1/reports/...`** families; this workspace may **pivot** to them but does **not** merge their bodies into “impact proof.”
- **Operator search / NOC:** may add **honest** pivots when **`service_id`** is known—**no** new search corpora.

---

## Explicit non-claims

Service Impact Workspace v1 **is**:

- **not** blast-radius truth or dependency-graph simulation  
- **not** SLA proof or traffic risk  
- **not** incident command, on-call routing, or ticketing  
- **not** approval authority or safe-to-change verdict  
- **not** validation truth  
- **not** multi-vendor parity proof  

---

## Empty and sparse behavior

- **Unknown `service_id`:** same as Service Explorer detail (**404** or documented empty)—**no** synthetic members.  
- **No `topology_links`:** failure-impact rollup **omitted** with honest note; Explorer detail may still load.  
- **Partial collector / inventory:** follow Explorer and failure-impact **caveats**; workspace may add **one** line that composition does not add evidence.  
- **Sparse degraded counts:** present nested postures honestly; **do not** extrapolate to fleet-wide health.

---

## References

- [`service-explorer-contract.md`](./service-explorer-contract.md)  
- [`failure-impact-contract.md`](./failure-impact-contract.md)  
- [`service-dossier-contract.md`](./service-dossier-contract.md)  
- [`maintenance-preview-contract.md`](./maintenance-preview-contract.md)  
- [`change-safety-case-contract.md`](./change-safety-case-contract.md)  
- [`impact-report-contract.md`](./impact-report-contract.md)  
- [`evidence-export-contract.md`](./evidence-export-contract.md) · [`evidence-replay-viewer-contract.md`](./evidence-replay-viewer-contract.md) (replay rejects non-export roots including **`service_impact_workspace_v1`**)  

---

## Task closure notes

- **`01-CURRENT-PHASE.md`:** **unchanged** — Phase **2** read-only.  
- **`03-CURRENT-STATUS.md`:** update when **`service_impact_workspace_v1`** API (and optional WebUI) reflects operational truth in the running platform.
