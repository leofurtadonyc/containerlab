# Path Explorer v1 contract (Phase 2, read-only)

## Purpose and classification

**Path Explorer v1** is a **bounded Phase 2** operator workspace that **composes** existing read-only assemblies into one **path-centric** presentation. It is **documentation-first** in this contract; HTTP and UI surfaces, when implemented, must follow the same boundaries.

**Phase:** [`Phase 2 — read-only product foundation`](../../agent/sdn/01-CURRENT-PHASE.md) — unchanged.

---

## Overlap with closed slices (extension, not duplicate work)

Path Explorer v1 **does not** re-derive path truth, collector mappings, or inventory rules. It **aggregates and frames** work already delivered under these **closed** tasks:

| Closed slice | Canonical completed task | What Path Explorer adds |
| --- | --- | --- |
| Path analysis (`path_analysis_phase2_v1`) | [`week-27-monday-task-01-path-analysis-contract-and-gap-audit.md`](../../agent/sdn-tasks/completed/week-27-monday-task-01-path-analysis-contract-and-gap-audit.md), [`week-27-monday-task-02-policy-path-analysis-read-api.md`](../../agent/sdn-tasks/completed/week-27-monday-task-02-policy-path-analysis-read-api.md) | A **single workspace** that treats path-analysis as **one** nested authority for path semantics—not a second path-analysis API. |
| Policy explainability workspace | [`week-31-tuesday-task-01-policy-explainability-workspace-contract.md`](../../agent/sdn-tasks/completed/week-31-tuesday-task-01-policy-explainability-workspace-contract.md) | **Juxtaposition** with path-analysis and optional dossier in **stable section order**; **no** new scoring or rejection semantics. |
| Policy dossier | [`week-29-tuesday-task-01-policy-dossier-contract.md`](../../agent/sdn-tasks/completed/week-29-tuesday-task-01-policy-dossier-contract.md) | Optional **adjacent** composed context when embedded; dossier remains **authoritative** for its own JSON. |
| Cross-domain delta digest | [`week-30-monday-task-01-cross-domain-delta-digest-contract.md`](../../agent/sdn-tasks/completed/week-30-monday-task-01-cross-domain-delta-digest-contract.md) | **Navigation / interpretation** relationship only—digest is a **different** cross-domain aggregate; Path Explorer does **not** merge digest semantics into path proof. |

---

## What a path explorer is (Phase 2 slice)

In the current bounded slice, a **path explorer** is a **read-only** product framing for:

- **Subject:** one **`policy_id`** anchor in the **normalized policy inventory** (same identity rules as **`GET /api/v1/policies/{policy_id}/path-analysis`**).
- **Story:** **intended vs observed** path interpretation, **candidate-path** reasoning summaries, and **explainability** rollups—using **only** evidence and language already allowed by the nested contracts.
- **Role:** reduce operator fragmentation by presenting **one** coherent workspace instead of requiring manual stitching across multiple pages—**without** strengthening claims.

---

## Supported path subjects and anchors

- **Primary anchor:** **`policy_id`** for a row that exists in the current normalized policy inventory.
- **Path semantics:** **policy-centric** (aligned with path-analysis v1): headend, endpoint, color, intent/observed state, and candidate-path records **as already modeled**—not controller-computed TE paths or dataplane verification.

Unsupported or unknown anchors follow the same **404 / honest empty** rules as the underlying **`path-analysis`** and **`explainability`** routes.

### HTTP surface (shipped)

- **`GET /api/v1/path-explorer?policy_id=…`** — returns composed **`path_explorer_v1`** JSON with nested path-analysis, explainability, and optional policy dossier (see OpenAPI **`/api/v1/path-explorer`**).
- **WebUI:** **`view=path-explorer`** and query **`path_explorer_policy_id`** (stable anchor); optional entry from Policies **Path analysis** panel (**Open Path Explorer**).

### Navigation pivots (overlap with closed shell helpers)

Path Explorer entry points **reuse** the same **`policy_id`** inventory identity as Policies, explainability, and dossier — they **do not** replace **`policy_dossier_navigation`**, **`topology-policy-navigation`**, or global-search **operator_search_pivot_v1** semantics. Implemented pivots (read-only navigation):

| Surface | Role |
| --- | --- |
| Policies — Path analysis panel | **Open Path Explorer** (`navigateToPathExplorer`) |
| Policies — Explainability workspace | **Path Explorer** header (same policy as explainability) |
| Policies — Policy dossier workspace | **Path Explorer** header (same policy as dossier; dossier JSON remains separate) |
| Overview — NOC cockpit strategic pivots | **Path Explorer (worst degraded)** — same policy row as adjacent explainability |
| Overview — NOC cockpit launch grid | **Open Path Explorer (strongest policy row)** — alongside explainability |
| Global operator search | **Path Explorer** — policy hits only, same anchor as Explainability |

---

## Reuse boundaries versus path-analysis, explainability, dossier, and digest

| Surface | Boundary |
| --- | --- |
| **Path analysis** | **Authoritative** for path-analysis JSON and per-candidate summaries. Path Explorer **must not** contradict its `truth_alignment`, `caveats`, or `freshness`—only **surface** and **merge** presentation. |
| **Explainability** | **Authoritative** for explainability workspace JSON (sparse signals, rollups, navigation hints). Path Explorer **does not** add new “why” verdicts beyond composed nested fields. |
| **Policy dossier** | **Optional** embedded context. If present, dossier sections remain **dossier-shaped**; Path Explorer adds **workspace ordering** and **merged caveat lines**, not new dossier semantics. |
| **Delta digest** | **Out of scope** as a nested JSON contract inside Path Explorer. **Relationship:** optional **navigation** to the digest view with bounded query hints—**not** digest-as-path-proof. |

---

## Normative section order (path explorer workspace)

When presenting Path Explorer v1 in product or docs, use this **stable order**:

1. **Subject and scope** — `policy_id`, policy identity summary, Phase 2 read-only reminder.  
2. **Intended vs observed path story** — from path-analysis `truth_alignment` and hints (no new alignment algorithm).  
3. **Candidate path reasoning summary** — from path-analysis candidate summaries and explainability rollups.  
4. **Explainability relationship** — sparse signals, unknown-candidate posture, cross-signal notes (nested contract).  
5. **Policy and service pivots** — read-only pointers (e.g. Service Explorer `service_id` forms, Policies detail)—**navigation**, not new grouping logic.  
6. **Topology anchors and caveats** — topology-impact / topology partiality language consistent with path-analysis **caveats** (inferred links, partial snapshots).  
7. **Evidence gaps and unsupported conditions** — merged `missing_evidence_notes` / sparse flags from nested sources.  
8. **Investigation / briefing / export relationships** — shell-only pivots; see below.

---

## Merged caveat, freshness, and evidence-gap expectations

- **Merged caveats:** a **deduped ordered list** of human-readable lines from nested assemblies (path-analysis caveat messages, explainability `merged_caveats`, optional dossier caveats). **No** new caveat codes invented by Path Explorer alone.  
- **Freshness:** Path Explorer **echoes** nested `freshness` / `metadata.generated_at` semantics; **do not** invent a single “fresher than path-analysis” story. If nested sources disagree on timestamps, **surface the disagreement** as a caveat line, not a reconciled lie.  
- **Evidence gaps:** union of **explicit** gap notes from nested contracts (e.g. sparse timeline, delta not ready, topology naming unknown). Path Explorer may add **one** framing line that composition itself does not add evidence—**not** new domain facts.

---

## Navigation expectations and export / report relationship

- **Navigation:** Path Explorer is a **live interpretation** workspace. Pivots to **Investigation**, **Operator briefing**, **Situation room**, **Policies**, **Topology**, **Service Explorer**, and **Delta digest** are **read-only URL / shell** hints—same discipline as dossier and explainability contracts.  
- **Export / replay:** Path Explorer is **not** a frozen **`evidence_export_v1`** payload and **not** a substitute for **`impact_report_v1`** or **Change Safety Case** downloads. Operators needing **replay-grade** artifacts use **export** contracts; Path Explorer may **link** to those surfaces without claiming equivalence.  
- **Reports:** Any future **Path Explorer** report line must be a **separate** contract id if introduced; this document does **not** authorize report JSON reuse from path-analysis alone.

---

## Explicit non-claims

Path Explorer v1 **is**:

- **not** dataplane proof or per-hop forwarding verification  
- **not** a TE solver or controller path computation authority  
- **not** validation truth or safe-to-change verdict  
- **not** change approval, workflow execution, or rollback authority  
- **not** multi-vendor parity proof  
- **not** a stronger evidence layer than the **nested** contracts it composes  

---

## Empty and sparse behavior

- **Unknown / missing policy:** same behavior as **`path-analysis`** for missing **`policy_id`** (e.g. **404** with an honest inventory message)—Path Explorer **does not** return synthetic path content.  
- **Sparse explainability or path signals:** present **nested** sparse flags and copy; Path Explorer **does not** fill gaps with inferred operational truth.  
- **Partial topology or collector degradation:** follow path-analysis **caveats** and **serving mode** echoes; workspace-level copy may summarize **“partial read-side evidence”** without inventing completeness.  
- **Optional dossier absent or failed:** workspace remains **valid** if path-analysis + explainability succeed; dossier omission is **honest** and may add a **single** caveat line.

---

## References

- [`path-analysis-contract.md`](./path-analysis-contract.md)  
- [`policy-explainability-workspace-contract.md`](./policy-explainability-workspace-contract.md)  
- [`policy-dossier-contract.md`](./policy-dossier-contract.md)  
- [`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md)  

---

## Task closure notes

- **`01-CURRENT-PHASE.md`:** **unchanged** — Path Explorer v1 is **Phase 2 read-only** documentation only for this task.  
- **`03-CURRENT-STATUS.md`:** **no update** required for this task unless and until a shipped API/WebUI reflects operational truth.
