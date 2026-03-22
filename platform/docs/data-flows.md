# Platform Data Flows

## Purpose

This document describes the major data flows in the platform and the boundaries that shape them.

The goal is to make it clear:

- how the platform integrates with lab topologies
- how observed state is expected to move through the system
- how product APIs and UI flows are separated from observability flows
- where ODL fits without taking over the architecture

## Current Status

The current repository state includes:

- a separate platform topology
- a live `app-api` read path for inventory, topology, policy, capabilities,
  platform status (including recovery summary), workflow-history, and audit-history
- a live `gnmi-collector` path with Nokia adapter boundaries and normalized
  deliveries to `app-api`
- Prometheus and Grafana with real scrape targets and bounded dashboard families
  for the current metrics
- Postgres with **bounded durable persistence** for normalized inventory,
  topology, and policy snapshots, sync-run records, readiness snapshots, and
  the history fields needed for week **16–20** coverage and source-readiness
  history (not a full durable domain model for every future product area)
- repo-built local images for the initial platform service set
- bounded post-deploy verification for the current core runtime contract, ODL
  credential path, preserved-baseline posture when artifacts exist, **conditional**
  devices/inventory history checks aligned with topology and policy history when
  Postgres holds inventory snapshot rows, and optional same-workspace restart drill
- **Readiness:** product and Grafana platform overview share **evaluation sample**
  (this response) versus **persisted snapshot** (last material change) vocabulary;
  observability mirrors numeric ages only—not validation or drift verdicts
- **Grafana honesty:** change-validation family is **markdown-only** (no fake
  metrics; not a validation engine); vendor/adapters overview uses **real**
  bounded collector and collector-boundary metrics (**Nokia-first** scope)—see
  `dashboards.md` and `production-readiness-assessment.md`

It does not yet include:

- substantive ODL integration beyond the bounded platform-health probe
- workflow execution, dry-run APIs, or workflow-owned durable storage

The workflow-history and audit-history frontend views are read-only product pages
with persisted context, topology coverage and policy source-readiness posture in
history where records exist, baseline summaries (preserved versus new baseline),
and operator documentation for the same-workspace restart drill that proves
preserved-baseline recovery only when host-backed Postgres data survives.

This document explains the current flow direction honestly, including which paths are useful today and which remain scaffolded.

## Persisted Vs Transient

At the current stage, the platform uses both durable and transient read-side behavior.

Persisted today:

- normalized inventory snapshots written by `app-api` to Postgres
- normalized topology snapshots, node records, and link records written by `app-api` to Postgres
- normalized policy snapshots, policy records, and candidate-path records written by `app-api` to Postgres
- sync-run records for those bounded inventory, topology, and policy persistence writes

Transient today:

- live collector responses fetched over HTTP from `gnmi-collector`
- in-memory metrics caches inside `app-api` and `gnmi-collector`
- frontend UI state in `app-web`

Fallback behavior today:

- devices use the live collector-backed read path first and fall back to the latest persisted normalized inventory snapshot only when that live path is unavailable
- topology uses the live collector-backed read path first and falls back to the latest persisted normalized topology snapshot only when that live path is unavailable
- policy uses the live collector-backed read path first and falls back to the latest persisted normalized policy snapshot only when that live path is unavailable
- workflow-history and audit-history are read from persisted sync-run activity, but they still do not represent a full workflow engine or user-action audit log

Current truth labels today:

- `live` means the response is primarily backed by the active collector-to-backend read path
- `persisted_fallback` means the live collector path could not be used and the response is serving the latest persisted normalized snapshot
- `preserved_same_workspace_baseline` means at least one bounded persisted application artifact still exists in Postgres after restart or redeploy in the same workspace; it does not mean every read-side slice has a persisted fallback anchor
- `new_baseline` means the current runtime is rebuilding its persisted anchors from the current environment because no bounded persisted application artifacts are presently available in Postgres
- `inferred` currently describes bounded topology knowledge that is derived from interface-state interpretation rather than protocol-derived adjacency truth
- `partial` means the platform is intentionally exposing bounded read-side knowledge rather than claiming full operational truth
- `unavailable` means the backend does not currently have the additional persisted evidence required to build a bounded comparison view
- `stale` is currently a frontend interpretation used mainly by workflow-history and audit-history pages to describe the age of persisted sync-derived evidence relative to page generation time

Collector-boundary latency and failure posture (bounded):

- `app-api` calls the collector on a **bounded per-path latency budget** (configured timeout); this is a **fail-fast** boundary so product APIs do not block indefinitely on a slow collector.
- **`timeout_budget_exceeded`** means the fetch **ran out of budget**—`app-api` **stopped waiting** for the collector response. That is **not** the same as a connection refused, HTTP error, or invalid payload; those are **separate** classified boundary failures.
- After **any** boundary failure or timeout, slice responses may use **persisted fallback** when a snapshot exists, or **blocked / empty** posture when it does not; **`serving_mode`** and **`evidence_confidence`** on each slice API explain the result—not Grafana.
- **`partial_live_feed`** means the fetch **finished within budget** but the collector still returned only **bounded partial** live coverage; platform status may mark the read path **degraded** even though the budget was not exceeded.
- **`/api/v1/platform/status`** `read_paths[].notes` may include a short **latency posture line** for operators; it supplements but does not replace slice-level serving and evidence fields.

## Read-side query ergonomics (Phase 2)

Read-only list endpoints may expose **bounded optional query parameters** so clients can reduce payload size without implying new truth semantics. Shared rules:

- **Primary flat lists:** `GET /api/v1/devices` and `GET /api/v1/policies` accept an optional `limit` query parameter (integer **1–500**). When present, the response truncates the **`items`** array only. **`count`** and **`read_side_query.items_total`** remain the **full logical list size** before truncation; **`read_side_query`** echoes `limit_requested`, `items_total`, and `items_returned` so truncation is never mistaken for inventory shrinkage.
- **History snapshot summaries:** the same two endpoints accept optional **`history_recent_limit`** (integer **1–50**, default **3**). It controls how many persisted snapshot **summary** rows appear in **`history.recent_snapshots`**. It does **not** change latest-versus-previous **comparison** semantics (that still uses the two newest full persisted snapshots). **`read_side_query`** echoes `history_recent_limit_requested`, `history_recent_limit_effective`, and `history_recent_snapshots_returned` (the latter may be fewer than the effective limit when Postgres holds fewer rows).
- **Not supported via query:** free-text search, arbitrary filters that claim new domains, workflow or dry-run flags, vendor-specific query vocabulary on generic routes, or unbounded pagination cursors.
- **Workflow/audit history:** embedded snapshot lists on workflow-history and audit-history **keep** their own bounded internal limits unless a dedicated contract extends them.
- **Topology:** `GET /api/v1/topology` does not apply `limit` to nested `nodes` / `links` in the current contract—graph payloads need a separate truncation story.

Implementation reference: `platform/app-api/src/app_api/schemas/read_side_query.py` and `platform/app-api/src/app_api/dependencies/read_side_query.py`.

Important current limitation:

- the current topology now uses host-backed Postgres, Prometheus, and Grafana data directories, so bounded read-side state and observability state survive normal container replacement within the same workspace, but backup, restore, and broader lifecycle hardening are still intentionally out of scope

## Deployment And Integration Model

The platform and the labs are deployed separately.

The default integration model is management-plane-first:

- lab devices expose management reachability
- platform services connect over that management path
- no direct data-plane coupling is assumed
- no lab-specific direct wiring is treated as the default design

This keeps the platform reusable across multiple lab scenarios.

## Core Flow Categories

The main platform flow categories are:

- collector-to-backend observed-state flow
- backend-to-frontend product flow
- metrics flow
- bounded ODL integration flow
- database persistence flow

## Collector To Backend Flow

This is the primary observed-state path for the platform.

Intended flow:

1. `gnmi-collector` connects to devices over gNMI on the management plane.
2. Vendor-specific collection logic runs inside named adapter boundaries.
3. Raw records are mapped into normalized platform-friendly shapes.
4. The collector delivers normalized outputs to `app-api` through a bounded integration path.
5. `app-api` becomes responsible for product-facing interpretation and future persistence decisions.

Boundary rules:

- raw vendor payloads must not become the product API
- adapter logic must stay inside the collector or explicit backend integration boundaries
- the collector does not become the product brain

Current state:

- collector package structure exists
- adapter and mapping scaffolding exist
- narrow normalized inventory, topology, and policy delivery shapes now exist between the collector and the backend
- live transport from the collector process into `app-api` now exists for those bounded read-side slices
- those bounded collector deliveries now also carry configured-target coverage, observed-target counts, freshness-window timestamps, degraded-scope summaries, and policy detail-ready posture so `app-api` can expose clearer product trust cues without inventing fuller truth

Current topology coverage semantics:

- the current topology path now uses the explicit coverage vocabulary defined in `platform/schemas/topology/topology-read-path-coverage-semantics.md`
- collector delivery now carries the smallest honest endpoint-pairing signals the live evidence supports, centered on per-link `endpoint_pairing_state` plus aggregate `paired_link_count` and `single_sided_link_count`
- collector delivery now also carries an aggregate `endpoint_pairing_posture`, but that remains a bounded coverage observation rather than a product verdict
- collector-side endpoint-pairing semantics must not imply protocol adjacency truth, path validity, or controller agreement

## Backend To Frontend Flow

This is the primary product flow.

Intended flow:

1. `app-api` exposes versioned APIs.
2. `app-web` consumes those APIs.
3. The frontend renders product pages, navigation, and operator-facing views.
4. Business logic stays in `app-api`, not in the frontend.

Boundary rules:

- `app-web` does not talk directly to Postgres
- `app-web` does not talk directly to `gnmi-collector`
- `app-web` does not talk directly to ODL
- the frontend is API-driven

Current state:

- backend health and metrics endpoints exist
- versioned read-only inventory, topology, policy, capability, and platform status endpoints now exist as bounded live product contracts
- the current inventory API is fed by a bounded normalized live collector contract and now also exposes explicit serving-mode plus current-versus-latest-persisted comparison semantics where a persisted inventory snapshot exists
- the current topology API is fed by a backend-owned normalized live read model that explicitly marks partial and unknown state and now also exposes explicit serving-mode plus current-versus-latest-persisted topology comparison semantics
- the current topology API and the topology read-path row in platform status now also carry explicit endpoint-pairing posture plus paired-versus-single-sided inferred-link counts owned by the backend contract
- the current policy API is fed by a backend-owned normalized live read model that explicitly marks support, observed, and unknown state and now also exposes explicit serving-mode plus current-versus-latest-persisted policy comparison semantics
- inventory and topology may be served from the latest persisted normalized snapshot if the live collector boundary is temporarily unavailable
- policy may now also be served from the latest persisted normalized policy snapshot if the live collector boundary is temporarily unavailable
- useful frontend read-only pages now consume those stable contracts for overview, platform health, devices, topology, policies, and capabilities
- overview and platform health now also surface the backend-owned bounded read-path coverage, freshness-window, and degraded-scope posture that the platform-status contract exposes for inventory, topology, and policy
- the platform-status contract now also exposes a backend-owned `recovery` summary so product, verifier, and observability consumers can reuse one bounded same-workspace preserved-baseline versus new-baseline contract instead of inferring recovery posture independently
- workflow-history and audit-history pages now interpret persisted sync-derived evidence using bounded recency and comparison cues, and surface the response-level baseline summary so operators can see preserved-baseline versus new-baseline posture directly; those remain product-facing explanations rather than workflow, audit-forensics, or validation conclusions
- **Readiness (capabilities / Readiness view):** distinguish **evaluation sample** time (bounded assembly for this response, e.g. `generated_at`) from **persisted snapshot** time (last material change to the persisted readiness row, e.g. `readiness_persisted_at`). Grafana’s platform overview uses the same phrases for observability-only stat panels; neither implies a validation engine, dry-run, or full readiness truth

Current topology coverage semantics:

- the backend remains the owner of product-facing topology coverage semantics
- the topology product contract now carries explicit bounded endpoint-pairing semantics rather than leaving all pairing posture implicit in generic attributes and prose
- the implemented additions are aggregate `endpoint_pairing_posture`, `paired_link_count`, and `single_sided_link_count`, plus per-link `endpoint_pairing_state` and `endpoint_evidence_count`
- these fields remain bounded trust cues only and must not be interpreted as topology validation, adjacency validation, or workflow eligibility

Current comparison semantics:

- devices compare the current normalized inventory response against the latest persisted normalized inventory snapshot when one exists and the current response is still live-backed
- devices also expose a short recent persisted inventory snapshot window and a bounded latest-versus-previous persisted inventory comparison when those persisted records exist; **`history.recent_snapshots`** summaries include anchors such as **`sync_run_id`**, **`source_endpoint`**, **`persisted_at`**, **`observed_at`**, sync/data posture, and aggregate counts, and **`history.comparison_to_previous`** may include bounded **`change_preview`** and related comparison fields when two snapshots exist—these are product/API contracts on **`/api/v1/devices`** (and mirrored on workflow-history and audit-history inventory envelopes where applicable), not Grafana timelines
- topology compares the current normalized topology response against the latest persisted normalized topology snapshot when one exists and the current response is still live-backed
- topology also exposes a short recent persisted topology snapshot window and a bounded latest-versus-previous persisted topology comparison when those persisted records exist
- topology history and comparison now carry derived coverage posture (inference, endpoint-pairing, collection, node-participation postures plus paired/single-sided and linked/isolated counts) as trust cues, not validation conclusions; persisted topology link rows store `endpoint_pairing_state` and `endpoint_evidence_count` in JSON `attributes` so history loads can recompute the same vocabulary after restart
- the topology product page surfaces persisted coverage posture in recent-snapshot and comparison readouts so operators can see how coverage changed across persisted snapshots; these remain persisted coverage cues only, not drift or fault verdicts
- policies compare the current normalized policy response against the latest persisted normalized policy snapshot, and may also compare the latest persisted policy snapshot against the immediately previous persisted policy snapshot for bounded history support
- policy history and comparison now expose persisted source-readiness posture and counts (detail-ready targets, no-policies-observed targets, etc.) so operators can see how coverage changed across persisted snapshots; these remain coverage cues only, not validation verdicts
- **Product versus Grafana:** persisted **policy history** (recent snapshots, comparison, source-readiness **across** snapshots) is owned by **`app-api` `/api/v1/policies` and the WebUI**; Grafana’s SR policy dashboards intentionally mirror **current** numeric posture (gaps, labels, sync evidence) and explicit scope text, not snapshot-to-snapshot history or drift conclusions; **`app-api`** **`/metrics`** may also expose **`platform_app_api_policy_snapshots_persisted_total`** and **`platform_app_api_policy_snapshot_latest_persisted_at_seconds`** (Postgres **`policy_snapshots`** row count and latest **`persisted_at`**) plus existing **`platform_app_api_sync_run_*`** history metrics—numeric depth and chronology only, not replacement **`history`** semantics
- **Product versus Grafana (devices inventory history):** rich **`/api/v1/devices`** **`history`** (recent snapshots, **`comparison_to_previous`**, **`change_preview`**, honest empty-baseline notices in the verifier) is owned by **`app-api` and the WebUI** (Devices page, Overview/Platform Health cues); Grafana and **`/metrics`** may expose only low-cardinality mirrors such as **`platform_app_api_inventory_snapshots_persisted_total`** and **`platform_app_api_inventory_snapshot_latest_persisted_at_seconds`** (Postgres **`inventory_snapshots`** table row count and latest **`persisted_at`**) plus existing **`platform_app_api_sync_run_*`** history metrics—numeric depth and chronology only, not replacement history semantics
- workflow-history and audit-history may attach bounded inventory, topology, and policy snapshot context plus immediate previous-snapshot comparison evidence where those persisted sync-run records exist
- for inventory on **workflow-history** and **audit-history** items, `inventory_snapshot_summary` and `inventory_comparison_to_previous` mirror the persisted sync-run envelope field-for-field in JSON: when no comparison row was attached to that run, **`inventory_comparison_to_previous` is `null`**—the API does not synthesize a zero-delta comparison object; `app-api` pytest pins the full comparison shape when present and this honest-null path (same pattern as topology snapshot-without-comparison)
- workflow-history and audit-history responses now expose a response-level `baseline_summary` so operators can tell whether those views reflect preserved sync-derived history from the current workspace baseline or are effectively starting from a new baseline after restart or redeploy; the summary is derived from persisted sync-run and readiness-snapshot presence plus current response posture and remains bounded to preserved-baseline versus new-baseline and available-history-window interpretation
- none of these comparisons currently claim policy correctness, topology validity, intended-versus-observed reconciliation, or automated remediation guidance

## Inventory Read-Model Limitations

The current inventory read model is intentionally conservative.

What is real today:

- the devices API returns a stable platform-owned structure for device identity, platform, role, management address, collector status, and capability posture
- live collector-backed inventory remains the primary read path
- the backend now persists bounded normalized inventory snapshots and can fall back to the latest persisted snapshot when live collection is unavailable
- the devices response can now distinguish live collection, persisted fallback, and comparison-unavailable versus comparison-ready states explicitly
- the devices response now also exposes a short recent persisted snapshot window plus bounded latest-versus-previous persisted comparison support where those normalized persisted records exist

What remains partial:

- the inventory slice does not yet represent intended device state, validated lifecycle state, or controller-derived truth
- persisted inventory support is intentionally limited to bounded normalized snapshot comparison rather than a final durable device domain model
- inventory comparison counts remain explanatory summaries over normalized device attributes rather than drift judgments or operator recommendations

## Topology Read-Model Limitations

The current topology read model is intentionally conservative.

What is real today:

- the topology API returns a stable platform-owned structure for nodes, links, source, sync status, completeness, timestamps, and notes
- partial and unknown states are explicit in the contract
- the backend owns the read model rather than exposing collector or controller-native shapes
- the topology response now also carries a bounded `coverage_summary` and per-link endpoint-pairing fields so operators can distinguish paired versus single-sided inferred evidence more directly
- the backend now persists bounded normalized topology snapshots and can fall back to the latest persisted snapshot when live collection is unavailable
- the topology response can now distinguish live collection, persisted fallback, and comparison-unavailable versus comparison-ready states explicitly
- the topology response now also exposes a short recent persisted snapshot window plus bounded latest-versus-previous persisted comparison support where those normalized persisted records exist
- topology history snapshots and comparisons now include derived coverage posture (inference, endpoint-pairing, collection, node-participation postures and paired/single-sided/linked/isolated counts) as bounded trust cues; workflow-history and audit-history topology summaries carry the same coverage context where honest persisted records exist

What remains partial:

- the topology does not yet represent full adjacency discovery
- the graph remains a bounded live slice rather than comprehensive operational truth
- persisted topology support is intentionally limited to normalized snapshot history rather than a final topology database design
- comparison counts describe bounded normalized node and link differences, not protocol-adjacency validation, path computation, or controller truth

Current topology coverage interpretation:

- the current topology contract now sharpens endpoint-pairing and single-sided-link interpretation inside the existing bounded inferred slice without redesigning the broader topology-source model
- `paired` means both endpoints were observed for one emitted inferred link; it does not mean validated adjacency truth
- `partially_paired` is an aggregate posture meaning the response includes both paired and single-sided links; it does not mean measured global topology completeness
- `single_sided` means emitted inferred links currently rely on one observed endpoint; it does not automatically mean operational fault
- `unknown` should remain rare and should only be used when the runtime cannot classify pairing honestly from emitted normalized evidence

## Policy Read-Model Limitations

The current policy read model is also intentionally conservative.

What is real today:

- the policies API returns a stable platform-owned structure for policy inventory
- intended, observed, support, and health states are explicit
- candidate paths are represented in a normalized form rather than as vendor-native payloads
- the backend exposes current live policy observations and now persists bounded normalized policy snapshots plus candidate-path records to Postgres
- the policy response can now distinguish live collection, persisted fallback, and comparison-unavailable versus comparison-ready states explicitly, both for current-versus-latest-persisted and bounded persisted-versus-previous history views
- policy history snapshots and comparisons now include source-readiness posture and counts (detail-ready targets, no-policies-observed targets, etc.) as bounded trust cues; workflow-history and audit-history policy summaries carry the same source-readiness context where honest persisted records exist
- for policy sync-derived **workflow-history** and **audit-history** items, when a persisted policy snapshot is attached, the envelope mirrors `/api/v1/policies` history semantics: snapshot summaries include posture plus detail-ready, no-policies-observed, detail-unavailable, and partial-detail target counts, and `policy_comparison_to_previous` (when present) carries **current** and **previous** values for those counts alongside readiness posture—still coverage cues from persisted rows only, not workflow execution or validation

What remains partial:

- the policy inventory is backed only by a bounded live SR policy counter slice rather than full per-policy or controller-derived state
- persisted policy support is intentionally limited to bounded normalized snapshot history rather than a final durable policy database design
- support states such as `unknown` and `not_implemented_in_platform` are expected and honest in the current phase
- candidate path data remains absent or bounded rather than validated operational path computation
- no policy details, editing, validation, or workflow execution flows exist yet
- comparison counts remain explanatory summaries over normalized policy observations rather than a drift verdict, validation result, or action recommendation

## Metrics Flow

This is the observability flow, not the product data flow.

Intended flow:

1. platform services expose `/metrics` endpoints where appropriate
2. `prometheus` scrapes those endpoints
3. Prometheus stores and evaluates time-series data
4. `grafana` queries Prometheus
5. Grafana presents dashboard views and observability drilldowns

Expected metric sources over time:

- `app-api`
- `gnmi-collector`
- ODL where useful
- Prometheus itself
- Grafana where useful
- future exporters such as a Postgres exporter

Boundary rules:

- Prometheus is not the application database
- Grafana is not the product UI
- observability data must not replace normalized product models

Current state:

- Prometheus scrape configuration exists
- Grafana provisioning exists
- placeholder dashboard families exist
- `app-api` now exposes bounded HTTP request and latency metrics
- `gnmi-collector` now exposes bounded inventory collection, normalization, and backend-readiness metrics
- `gnmi-collector` now also exposes bounded observed-target coverage and observation-age metrics for inventory, topology, and policy plus policy detail-ready target counts, which the platform overview dashboard can use directly
- Prometheus should actively scrape only the currently real service metrics targets and keep the remaining service targets documented as future placeholders
- `verify-core-runtime` now provides one bounded post-deploy regression for Prometheus readiness, current real target discovery, Grafana health, datasource provisioning, and overview dashboard discovery

Current product-versus-observability split:

- `app-api` and `app-web` carry the human-readable degraded-scope summaries and bounded read-path explanations
- Prometheus and Grafana carry the numeric proxies for those same conditions, such as observed-versus-configured target gaps, freshness age, paired-versus-single-sided topology evidence counts or shares, and policy detail-ready gaps
- observability panels therefore reinforce the product posture without becoming a second product contract
- **Persisted history (policy, topology, devices inventory):** snapshot lists, comparisons, source-readiness or coverage **across** time, and (for devices) **`history`** snapshot/comparison **`change_preview`** and related fields are **product-owned** via `app-api` and WebUI; Grafana mirrors **current** posture, sync-run history metrics, and bounded **`inventory_snapshots`** and **`policy_snapshots`** table gauges (**`platform_app_api_inventory_snapshots_persisted_total`**, **`platform_app_api_inventory_snapshot_latest_persisted_at_seconds`**, **`platform_app_api_policy_snapshots_persisted_total`**, **`platform_app_api_policy_snapshot_latest_persisted_at_seconds`**) with explicit scope text—not snapshot-to-snapshot product history timelines, drift verdicts, or validation semantics (see `policy-truth-depth-review.md`, `dashboards.md`, and `deployment-runbook.md` verifier sections)
- **Change-validation and vendor dashboard families:** text-only or real-metrics honesty as provisioned; Grafana is **not** a change-validation engine—see `dashboards.md`

Week 14 topology split:

- `app-api` and `app-web` should carry the human-readable endpoint-pairing vocabulary and the bounded aggregate pairing posture
- Prometheus and Grafana should carry only numeric topology pairing projections such as `paired_link_count`, `single_sided_link_count`, and derived shares, plus any backend-owned pairing-posture labels projected directly from metrics
- Grafana must not become the source of product-facing pairing posture language even when it displays those backend-owned label projections

## ODL Integration Flow

ODL is a bounded input path, not the system center.

Intended flow:

1. ODL collects or exposes controller-side state where it adds genuine value.
2. `app-api` queries ODL through explicit integration modules.
3. ODL-derived records are translated into internal platform-friendly structures.
4. ODL becomes one observed input among several, not the only truth source.

Boundary rules:

- ODL does not own product APIs
- ODL does not own workflow logic
- ODL does not replace collector-based observed state
- ODL outputs must not leak directly into product contracts

Current state:

- service presence and topology-level role exist
- substantive integration code is still pending

## Database Persistence Flow

Postgres is the durable application-state path.

Intended flow:

1. `app-api` decides what durable records should exist.
2. `app-api` persists those records to Postgres.
3. Alembic migrations evolve the schema over time.

Boundary rules:

- Postgres is not the metrics store
- the collector does not write durable product state directly to Postgres
- Grafana and Prometheus do not become persistence owners for business records

Current state:

- init SQL bootstrap exists
- Alembic scaffolding exists
- the backend now persists bounded normalized inventory snapshots, normalized topology snapshots, and sync-run records
- the backend now persists bounded normalized policy snapshots and candidate-path records alongside those existing inventory/topology snapshots
- devices, topology, and policy can fall back to the latest persisted normalized snapshot if the live collector boundary is temporarily unavailable
- devices, topology, and policy can also expose bounded current-versus-latest-persisted comparison summaries when both current live-backed state and an earlier persisted normalized snapshot exist
- workflow-history and audit-history currently read persisted sync-run activity rather than separate durable workflow or audit tables
- bounded persisted read-side state survives **normal container replacement in the same workspace** when host-backed directories (e.g. `platform/postgres/data`) remain in place; removing or replacing those directories starts a **new baseline**—same boundary as `deployment-runbook.md` and `production-readiness-assessment.md` (not backup, HA, or cross-host DR)
- workflow history, audit history, and broader intent models remain read-only views over sync activity rather than workflow-owned durable records
- broader domain persistence logic is still pending

## Flow Summary By Consumer

### For product views

- source of truth direction: `app-api`
- durable state direction: `postgres`
- UI consumer: `app-web`

### For observability

- metrics source direction: service `/metrics` endpoints
- time-series store: `prometheus`
- dashboard consumer: `grafana`

### For controller-side enrichment

- bounded protocol/controller component: `odl`
- consuming service: `app-api`

## Current Vs Future

### Current

- flow directions are documented
- platform topology and service boundaries exist
- backend and collector skeleton endpoints exist
- bounded normalized inventory, topology, and policy integrations now connect the collector shape to the backend read paths
- backend-owned normalized inventory, topology, and policy read models now exist as stable live API slices with explicit live, persisted-fallback, partial, unknown, and bounded comparison semantics where supported
- observability scaffolding exists
- bounded persistence direction is explicit and now partially implemented for inventory, topology, and policy snapshots
- persisted sync-run activity now supports bounded read-side history views, while live collector reads remain the primary source for current observed state

### Future

- deeper backend persistence of policy-oriented history and broader domain records beyond the current bounded snapshot slice
- harder durability across full platform reprovisioning
- richer frontend product pages for workflow history, audit history, and deeper read-oriented exploration
- ODL-backed enrichment where justified
- later dry-run and workflow-related data paths

## Related Documents

- `roadmap.md` — phased scope and **`conditionally_ready_with_explicit_limits`** operating boundary
- `production-readiness-assessment.md` — strict readiness verdict and what remains outside safe use
- `deployment-runbook.md` — build, deploy, **`verify-core-runtime`** / **`verify-odl-auth`**, conditional history checks, same-workspace drill
- `dashboards.md` — Grafana scope honesty (including change-validation and vendor families)
