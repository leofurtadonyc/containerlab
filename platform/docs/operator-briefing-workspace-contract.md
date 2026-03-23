# Operator briefing workspace v1 contract (Phase 2, read-only)

## Purpose

This document is the **product-owned bounded contract** for an **operator briefing workspace v1**: a **single, coherent surface** where an operator can **review**, **sequence**, and **hand off** the **most relevant bounded evidence** that Phase **2** already exposes—**before** sharing links, attaching exports, or pivoting to deeper views.

The briefing workspace **composes previews and summaries** from **existing** read APIs and assemblies. It **does not** introduce a new truth domain, a cross-domain scoring engine, incident-command authority, or a substitute for full **Policies**, **Topology**, **Situation room**, **Investigation**, or **Delta digest** pages.

Stable product vocabulary (for implementation and tests when the workspace ships): **`operator_briefing_workspace_v1`**

**Relationship to adjacent surfaces:**

| Surface | Role | Distinction |
| --- | --- | --- |
| [**NOC cockpit**](./noc-cockpit-contract.md) (`noc_cockpit_v1`) | Watch-style **attention ordering** on **Overview** | Dense landing; **not** a handoff narrative |
| [**Cross-domain delta digest**](./cross-domain-delta-digest-contract.md) (`cross_domain_delta_digest_v1`) | **“What changed?”** cross-domain scan | One assembly; briefing **may embed or point** to it **without** duplicating every section |
| [**Evidence export**](./evidence-export-contract.md) (`evidence_export_v1`) | **Deterministic snapshots** for attach/archive | Briefing **frames** export actions; exports **serialize** contracts already defined elsewhere |

**Implementation posture (v1):** May ship as a **dedicated WebUI route or workspace region** that **reuses** only documented **`GET /api/v1/...`** responses and the **same** shell query parameters already used for dossiers, investigation, situation room, and delta digest. A future thin **read-only** **`GET /api/v1/.../operator-briefing`** assembly is **optional**; this file defines **what the briefing may contain**, **section order**, **subject binding**, and **honesty limits**—not a mandatory backend shape before UI composition exists.

---

## Subject and context sources (Phase 2)

A conforming briefing **binds** to **zero or more** of the following **already-supported** context dimensions. Implementations **must** use **string identities and URL conventions** already defined by dossier, investigation, and shell contracts—**no** new entity resolution.

| Context dimension | Typical shell / API inputs | Role in the briefing |
| --- | --- | --- |
| **Sync-run window** | **`sync_runs_limit`** (1–100, aligned with change intelligence / investigation / situation room / delta digest) | **Single coherent window** for nested previews that take a sync limit; **do not** invent parallel window math |
| **Topology object (optional)** | **`topology_object`**, **`topology_object_kind`** (`node` \| `link`), optional **`topology_workspace`**, **`dossier_source`** | **Topology dossier preview** when an object id is in scope ([`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md)) |
| **Policy (optional)** | **`policy_id`**, optional **`policy_workspace`**, **`policy_dossier_entry`** | **Policy dossier preview** when a policy id is in scope ([`policy-dossier-contract.md`](./policy-dossier-contract.md)) |
| **Investigation entry hint (optional)** | **`inv_from`** and related shell-only params per [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) | Breadcrumb / return context only—**not** sent as authority to app-api |
| **Operator search echo (optional)** | **`global_search_q`** deeplink patterns per [`operator-search-contract.md`](./operator-search-contract.md) | Optional **how we got here** context—**not** a second search index |

**Out of scope for v1:** multi-tenant bundles, ad-hoc “brief everything,” workflow execution payloads, dry-run outputs, ODL writes, Grafana/Prometheus bodies as briefing **content**, or credentials.

---

## Included evidence sections (normative layout)

Sections **SHOULD** appear in this **order** so operators get a stable **briefing narrative**: context first, then cross-domain orientation, then **selected** deep previews, then assemblies, then honesty and export. Each section **must** tolerate **empty, partial, or unavailable** without collapsing caveats.

1. **Briefing header and context** — **Title**, **as-of** / generation hints, and a **short context strip**: which **`policy_id`** / **`topology_object`** / **`sync_runs_limit`** / optional **`inv_from`** / search echo apply. **Not** a management summary score or approval line.
2. **Delta digest summary** — **Pointer or embedded excerpt** from **`GET /api/v1/delta-digest`** / **`cross_domain_delta_digest_v1`** ([`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md)): at minimum **completeness posture**, **sync_runs_limit_applied**, and **one-line** cross-domain cue; optional **weak-section** count. **Not** a second digest engine.
3. **Selected topology dossier preview** — When **`topology_object`** is set, a **bounded preview** of **`GET /api/v1/topology/objects/{object_id}/dossier`** (identity strip, posture lines, **merged caveats** excerpt). **Not** the full dossier page duplicated verbatim unless product explicitly chooses an expanded layout.
4. **Selected policy dossier preview** — When **`policy_id`** is set, a **bounded preview** of **`GET /api/v1/policies/{policy_id}/dossier`** (inventory/degraded summary strip, **merged caveats** excerpt). **Not** dataplane proof or validation.
5. **Situation room preview** — **Pointer or excerpt** from **`GET /api/v1/evidence-pack/situation`** ([`evidence-pack-contract.md`](./evidence-pack-contract.md)) with the **same** **`sync_runs_limit`** discipline: framing, **situation_review_guidance** highlights, honest **empty** workflow/audit rows. **Not** incident command.
6. **Investigation preview** — **Pointer or excerpt** from **`GET /api/v1/investigation-workspace/context`** ([`investigation-workspace-contract.md`](./investigation-workspace-contract.md)): recent change + platform/capabilities cues already in that assembly; **explicit_non_claims** visible or linked. **Not** a forensic timeline replacement.
7. **Explicit caveat block** — **Merged** non-claims and **missing-evidence** lines from nested responses **without** dilution; **per-section** failures called out if any preview is **partial** or **fallback**.
8. **Export actions framing** — **Labeled** actions aligned with [`evidence-export-contract.md`](./evidence-export-contract.md): which **export_kind**(s) apply given current **`subject_ref`** (policy dossier, topology dossier, situation room, investigation workspace). **Not** implying compliance, signing, or tamper evidence.

---

## Section prioritization rules

1. **Context before depth** — Header and delta digest **precede** dossier previews so the reader knows **window and scope** before long excerpts.
2. **Selection-driven visibility** — **Omit** or **collapse** dossier preview sections when **`policy_id`** or **`topology_object`** is **absent**; show **explicit** “no object selected” copy instead of silent empty cards.
3. **No duplicate authority** — If the **full** delta digest view is already open in another tab, the briefing **still** may show a **short** digest summary for self-contained handoff—must **label** duplication risk (“excerpt only”) if the same JSON is embedded twice in one screen.
4. **Assembly ordering** — **Situation room** preview **before or after** investigation preview is **product choice** but must be **documented** in the implementation; default **recommended** order: **situation** then **investigation** (evidence pack **then** cross-domain investigation assembly) to match “pack context → investigation lens.”
5. **Failure isolation** — A failed **`GET`** for one preview **must not** block the header or unrelated sections; **bounded error** copy per section.

---

## Export relationship

1. **Same export contracts** — Briefing **must** route export actions to the **same** **`GET /api/v1/exports/...`** families and **`export_kind`** values as [`evidence-export-contract.md`](./evidence-export-contract.md); **no** new export MIME “briefing-only” authority.
2. **Subject alignment** — Exports **require** resolvable **`subject_ref`** (e.g. **`policy_id`**, **`object_id`**, **`sync_runs_limit`** for situation/investigation). The briefing **must** make **which export applies** obvious **before** download.
3. **No briefing-shaped export required in v1** — A **single** “export the whole briefing” bundle is **optional** and **out of scope** unless a future **`operator_briefing_workspace_v2`** defines a **dedicated** export envelope; v1 **reuses** per-subject exports only.

---

## Live vs export framing

| Mode | Meaning | Operator obligation |
| --- | --- | --- |
| **Live briefing** | On-screen composition fed by **current** API responses | Staleness and **refresh** semantics are those of each **source route**; “Reload” refreshes previews, **not** the physical network |
| **Exported artifact** | File generated via **`evidence_export_v1`** at **`generated_at`** | **Point-in-time** snapshot; **not** a live feed; **not** tamper-proof by default |

Implementations **must** avoid implying that **export** is **fresher** than **live** product views, or vice versa, without explicit timestamps per source.

---

## Explicit non-claims

Operator briefing workspace v1:

- is **not** **change approval**, **maintenance authorization**, or **safe-to-change** verdict
- is **not** **incident command**, **severity scoring**, or **on-call workflow**
- is **not** a **unified source of truth** across inventory, topology, and policy
- is **not** **validation**, **drift detection**, or **compliance** packaging
- is **not** **log search**, **metrics exploration**, or **Grafana substitution**
- is **not** **workflow execution truth** or **dry-run** output
- is **not** guaranteed **completeness** when upstream APIs cap, filter, or return **bounded_partial**

The word **“briefing”** means **read-only interpretation support for handoff and review** in Phase **2**—not a staff slide deck of network certainty.

---

## Empty, sparse, and partial rules

1. **Empty selection** — If **neither** **`policy_id`** nor **`topology_object`** is set, **dossier preview** sections show **honest “not selected”** guidance and **pivots** to Policies/Topology—**no** fabricated placeholders.
2. **Sparse assemblies** — If **situation** or **investigation** returns **empty** history rows or **bounded_partial** completeness, the briefing **surfaces** that posture **in the preview**, not only on the owning page.
3. **Delta digest degraded** — If **`GET /api/v1/delta-digest`** fails, show **section-level** error; **other** sections remain available when their routes succeed.
4. **No invented glue narrative** — **Do not** connect domains with **causal** language unless a **source field** already states a bounded relationship; default to **pointers** and **caveats**.

---

## Navigation expectations

| From briefing | Expected behavior |
| --- | --- |
| **Full delta digest** | Shell navigation to **`view=delta-digest`** with preserved **`sync_runs_limit`** |
| **Full dossiers** | **`navigateToTopologyDossier`**, **`navigateToPolicyDossierWorkspace`** (or equivalents) with **`policy_dossier_entry` / `dossier_source`** hints such as a **briefing**-specific entry token when implemented client-side |
| **Situation / Investigation** | **`navigateToSituationRoomView`**, **`navigateToInvestigationView`** with **`inv_from`** set to a **documented** briefing source id when the shell supports it |
| **Export** | Invoke **`GET /api/v1/exports/...`** per [`evidence-export-contract.md`](./evidence-export-contract.md) |

---

## Related documents

- [`cross-domain-delta-digest-contract.md`](./cross-domain-delta-digest-contract.md) — digest assembly and sections  
- [`policy-dossier-contract.md`](./policy-dossier-contract.md), [`topology-object-dossier-contract.md`](./topology-object-dossier-contract.md) — dossier semantics  
- [`evidence-pack-contract.md`](./evidence-pack-contract.md) — situation room assembly  
- [`investigation-workspace-contract.md`](./investigation-workspace-contract.md) — investigation assembly  
- [`evidence-export-contract.md`](./evidence-export-contract.md) — export routes and non-claims  
- [`noc-cockpit-contract.md`](./noc-cockpit-contract.md) — Overview cockpit composition  
- [`operator-search-contract.md`](./operator-search-contract.md) — search pivot semantics  
- [`../../agent/sdn/03-CURRENT-STATUS.md`](../../agent/sdn/03-CURRENT-STATUS.md) — operational verdict  

---

## Current phase

This contract is **Phase 2 — read-only product foundation** only. It **does not** authorize phase transition, workflow implementation, or validation engines.

Implementations **must not** justify changing [`01-CURRENT-PHASE.md`](../../agent/sdn/01-CURRENT-PHASE.md) unless separate evidence exists for a documented phase-boundary review (out of scope for this document).

---

## Revision policy

A **unified briefing export envelope**, **new** truth domains, **write** paths, or **mandatory** backend **`operator-briefing`** assembly requires **`operator_briefing_workspace_v2`** (or an explicit minor version) and updated non-claims.
