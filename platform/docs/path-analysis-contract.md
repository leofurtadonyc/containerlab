# Path analysis contract (Phase 2)

## Purpose

This document is the **backend-owned bounded contract** for a future **read-only path-analysis** product surface: an operator-facing answer to **“why this path?”** (and related questions) that **honestly** relates **policy intent**, **policy observed/candidate-path signals**, and **bounded topology/inventory context**—without claiming dataplane forwarding truth, traffic-engineering resolution, per-hop label verification, or controller-computed path authority.

Implementation references (contract vocabulary only in week **27** Monday task **01**):

- `platform/app-api/src/app_api/schemas/path_analysis.py` — **`PATH_ANALYSIS_CONTRACT_ID`**, **`PathAnalysisViewResponse`**, **`PathAnalysisSafetyFraming`**, **`PathAnalysisExplicitNonClaim`**, intended/observed hints, candidate-path summaries, freshness, truth-alignment posture, caveats
- `platform/app-api/tests/test_path_analysis_contract.py` — literal and shape regression tests
- Architectural decision: `platform/docs/decisions/ADR-0002-path-analysis-phase2-read-only-contract.md`

**No** HTTP route is required for this task; follow-on tasks may implement e.g. `GET /api/v1/path-analysis/...` using the same vocabulary.

---

## Gap audit: what exists vs what is missing

### Already present in the codebase (evidence for a bounded slice)

| Area | What exists | Limits relevant to path analysis |
| --- | --- | --- |
| **Policy inventory** | `PolicyRecord` / `CandidatePathRecord` on `GET /api/v1/policies`; internal `CandidatePath` with `path_state`, `preference`, notes; weeks **19–20** history and comparison semantics | Proven live depth is the narrow **`static_local`** envelope in reviews; broader policy families are not claimed. |
| **Topology** | `GET /api/v1/topology` with nodes/links, four-axis partiality (`inference_posture`, `endpoint_pairing_posture`, `collection_posture`, `node_participation_posture`), inferred links | Inference-bounded; not validated IGP adjacency or full underlay truth. |
| **Devices / inventory** | `GET /api/v1/devices`, persisted snapshots, history | Identity and inventory truth; not path computation. |
| **Platform status** | `GET /api/v1/platform/status` including `read_paths`, recovery | Collector timeout vs failure semantics; not path selection. |
| **ODL** | Bounded RESTCONF capability probe via platform status (week **21** operator truth) | Reachability/capability hints only—not BGP-LS path feed or path computation product truth. |
| **Composed surfaces** | Change intelligence, investigation workspace, evidence pack (weeks **24–26**) | Cross-domain **interpretation** assemblies; not duplicate per-domain path math. |

### Missing for an honest Phase 2 path-analysis **implementation** (follow-on work)

| Gap | Notes |
| --- | --- |
| **Dataplane / forwarding verification** | No platform contract today asserts per-hop labels, outgoing interfaces, or active LSP forwarding state as product truth. |
| **TE / CSPF resolution** | No backend-owned “computed path” or “why not alternate” semantics. |
| **Controller path computation** | ODL is bounded; no BGP-LS–derived path graph as a first-class read model in app-api. |
| **Unified path object** | No single durable “tunnel/LSP” record spanning devices, topology, and policy; Phase 2 v1 intentionally anchors on **policy** as subject (see schema `PathAnalysisSubject`). |

The contract below defines **what may be shown** when those gaps are explicit: hints, summaries, caveats, and evidence attribution—not hidden equivalence to forwarding reality.

---

## Classification vs adjacent contracts

| Contract | Role |
| --- | --- |
| **Change intelligence** (`change-intelligence-contract.md`) | Cross-domain **recent change** aggregation over existing snapshot metrics. |
| **Investigation workspace** (`investigation-workspace-contract.md`) | Nested assembly of change intelligence, platform status, capabilities. |
| **Evidence pack** (`evidence-pack-contract.md`) | Broadest composed “situation room” artifact. |
| **Path analysis** (this document) | **Subject-centric** (policy-first) read-only view relating **intent vs observed** path **signals** and **where** evidence came from—**not** a fourth copy of change-intelligence math or evidence-pack assembly. |

---

## Contract shape (summary)

Responses are expected to use **`PathAnalysisViewResponse`** with:

- **`metadata`**: standard `ApiResponseMetadata` (Phase 2).
- **`safety_framing`**: `PathAnalysisSafetyFraming` with **`PATH_ANALYSIS_CONTRACT_ID`**, authority posture, explicit non-claims list, phase, and **`summary_disclaimer`**.
- **`subject`**: **`PathAnalysisSubject`** — Phase 2 v1 anchors on **`anchor_kind: policy`** (policy id, endpoints, color, source target).
- **`intended_path_hints`**: declarative hints (`IntendedPathHint`) from policy intent / declared candidate vocabulary—**not** TE CSPF output.
- **`observed_path_hints`**: hints (`ObservedPathHint`) from policy observed/candidate state and optional topology/inventory **context**—**not** dataplane verification.
- **`candidate_path_summaries`**: mirrors policy candidate-path summaries (`PathAnalysisCandidatePathSummary`).
- **`evidence_sources`**: rollup list of **`PathEvidenceAttribution`** (domain + reference string).
- **`freshness`**: **`PathAnalysisFreshness`** — assembly time plus optional snapshot timestamps and serving-mode echo.
- **`truth_alignment`**: **`PathAnalysisTruthAlignment`** — coarse `intended_vs_observed_*` posture **for interpretation**, not validation.
- **`caveats`**: **`PathAnalysisCaveat`** entries (e.g. topology partial, inferred links, ODL probe only).

---

## Explicit non-claims

Stable keys live in **`PathAnalysisExplicitNonClaim`** and default list **`DEFAULT_PATH_ANALYSIS_EXPLICIT_NON_CLAIMS`**. In prose:

- **Not** a validation verdict, drift result, safe-to-change recommendation, workflow authorization, or dry-run execution.
- **Not** dataplane forwarding truth, TE resolution truth, per-hop label stack verification, or controller-computed path authority.
- **Not** substituting ODL probe success for gNMI/collector-backed read paths.
- **Not** a guarantee of completeness across domains or timestamps.
- **Not** implied equivalence between intent labels and observed forwarding.

---

## Overlap with closed slices (weeks 15–26)

This task **does not reopen**:

- **Topology** truth-depth, pairing, partiality decomposition, or coverage-history **algorithms** (weeks **14–16**, **19** checkpoint)—path analysis may **cite** topology partiality **as caveats** only.
- **Policy** snapshot/history **API semantics** (weeks **19–20**)—path analysis **consumes** policy records; it does not replace **`/api/v1/policies`** history contracts.
- **Read-side query ergonomics** (week **22**)—orthogonal; future path routes may reuse bounded query patterns without duplicating week **22** deliverables.
- **Readiness / capabilities** decision-support (week **23**)—orthogonal unless a follow-on adds explicit cross-links.
- **Change intelligence, investigation, evidence pack** (weeks **24–26**)—orthogonal assemblies; path analysis is a **narrower subject-centric** lane.

**Why this is a new bounded step:** it introduces a **dedicated operator vocabulary** for **path interpretation** (intent vs observed hints, alignment posture, path-specific non-claims) that **no** prior week defined. Prior work supplies **inputs**; this contract defines the **product shape** for consuming those inputs honestly.

---

## Implementation map (follow-on tasks)

| Layer | Likely files / areas |
| --- | --- |
| **Backend router** | New router module under `platform/app-api/src/app_api/routers/`; register in `api/v1/router.py`. |
| **Backend service** | New service (e.g. `path_analysis.py`) composing existing policy/topology/inventory **read builders**—**no** new collector models in the first vertical slice unless a later task proves need. |
| **Schemas** | `schemas/path_analysis.py` (this task); extend only when follow-on fields are required. |
| **Tests** | `tests/test_path_analysis_contract.py` (this task); `tests/test_app.py` for future route; optional repository **`pytest`** for assembly. |
| **WebUI** | New feature folder under `platform/app-web/src/features/path-analysis/` (or policy drill-through entry); `contracts.ts`, `client.ts`, `nav-views.ts`, `App.tsx` wiring. |
| **Verifier** | `verify-core-runtime.sh` structural checks when a live route exists. |
| **Docs** | `architecture.md`, `data-flows.md`, `roadmap.md`, `deployment-runbook.md` alignment after implementation. |

---

## Related documents

- `platform/docs/decisions/ADR-0002-path-analysis-phase2-read-only-contract.md`
- `platform/docs/change-intelligence-contract.md`
- `platform/docs/investigation-workspace-contract.md`
- `platform/docs/evidence-pack-contract.md`
- `platform/schemas/topology/topology-read-path-coverage-semantics.md`
- `agent/sdn/03-CURRENT-STATUS.md` — platform operating boundary
