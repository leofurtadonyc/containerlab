# app-api (Backend)

## Purpose
The platform brain. Owns all business logic, application state coordination, vendor-neutral model management, workflow orchestration, and the REST API consumed by the WebUI.

## Why it exists
The platform requires a single authoritative source of business logic. The backend owns that role and prevents business concerns from leaking into the collector, ODL, or the WebUI.

## What it owns
- REST API for the WebUI and external consumers
- business logic and orchestration
- normalized model management
- Postgres writes and reads
- ODL integration adapter
- workflow and validation logic (future phases)
- audit and event log
- Prometheus metrics endpoint

## What it does not own
- gNMI collection (that is `gnmi-collector`)
- protocol-layer signaling (that is ODL)
- dashboard rendering (that is Grafana)
- operator UI (that is `app-web`)

## Runtime details
- image: `platform-app-api:0.1.0`, built from the local service Dockerfile
- startup: the packaged runtime now validates required env, waits for Postgres readiness, applies Alembic migrations, starts `uvicorn app_api.main:app`, and then runs the bounded read-side warm-up best-effort in the background with visible failure logging
- ports: 8000 for the versioned API and `/metrics`
- env vars: `API_PORT`, `DATABASE_URL`, `GNMI_COLLECTOR_TIMEOUT_SECONDS`, optional per-path overrides `GNMI_COLLECTOR_INVENTORY_TIMEOUT_SECONDS`, `GNMI_COLLECTOR_TOPOLOGY_TIMEOUT_SECONDS`, and `GNMI_COLLECTOR_POLICY_TIMEOUT_SECONDS`, `ODL_URL`, `ODL_USERNAME`, `ODL_PASSWORD`, `ODL_TIMEOUT_SECONDS`, and `PROMETHEUS_URL`
- mounts: none required for the packaged runtime
- persistence: writes bounded normalized inventory, topology, and policy snapshots, bounded policy candidate-path records, sync-run records, and deduplicated readiness-support snapshots to Postgres
- dependencies: Postgres, `gnmi-collector`, and optional ODL integration

## Integration points
- receives normalized state pushes from `gnmi-collector`
- queries ODL for SR topology/policy data
- serves versioned REST API to `app-web`
- exposes `/metrics` for Prometheus

## Current status
The backend implements a FastAPI application entrypoint, a versioned `/api/v1/...` route structure, typed read-only `/api/v1/health`, `/api/v1/platform/status`, `/api/v1/devices`, `/api/v1/topology`, `/api/v1/policies`, and `/api/v1/capabilities` endpoints, consistent error response scaffolding, live bounded collector-backed inventory, topology, and policy read paths, one bounded ODL-backed platform-status enrichment path, a more operational capability matrix that now distinguishes current supported, partially-supported, unknown, and not-implemented states across the delivered Nokia-first read-only slice, bounded in-memory HTTP request and latency metrics at `/metrics`, package structure for routers, services, repositories, models, schemas, integrations, adapters, metrics, and config, plus the first real Alembic-managed persistence slice for normalized inventory snapshots, normalized topology snapshots, normalized policy snapshots, bounded policy candidate-path records, and sync-run history.

Current collector-boundary latency posture:

- collector snapshot reads now default to a short bounded timeout budget so persisted fallback can appear quickly when the live collector path is slow or unavailable
- the shared collector timeout can be overridden per model family for inventory, topology, or policy reads if a later bounded deployment needs different budgets
- collector-boundary fetch failures are now classified into timeout-budget, connection, HTTP, or invalid-payload posture before fallback rather than exposing only raw exception text

Current comparison-friendly API reality:

- `/api/v1/devices` now distinguishes live collector reads, persisted fallback inventory reads, and bounded current-versus-latest-persisted inventory comparison when the backend has both sources available
- `/api/v1/topology` now distinguishes live collector reads, persisted fallback topology reads, inferred topology evidence, and bounded current-versus-latest-persisted topology comparison where persisted support exists
- `/api/v1/policies` now distinguishes live collector reads, persisted fallback policy reads, bounded current-versus-latest-persisted policy comparison, and bounded persisted-versus-previous policy snapshot comparison support
- `comparison_to_latest_persisted.status` uses the same two-valued string contract on devices, topology, and policies: `unavailable` or `live_vs_latest_persisted_ready` (shared alias `ComparisonToLatestPersistedStatus` in the API schemas)
- `/api/v1/policies` now also exposes a normalized per-target policy footprint so stable Nokia counter evidence remains visible even when the per-policy item list is empty
- `/api/v1/policies/{policy_id}/path-analysis` exposes a bounded **path-analysis** read model (`path_analysis_phase2_v1`): intended versus observed hints from the same normalized policy records, optional freshness anchors from latest persisted topology/inventory snapshots, explicit non-claims, and **404** when the policy id is absent from the current inventory list—not dataplane or TE resolution truth
- `/api/v1/policies/{policy_id}/topology-impact` exposes the **inverse** topology↔policy naming pivot (same string-equality rules as `/api/v1/topology/objects/{object_id}/related-policies`): topology nodes and links that align with this policy’s headend/endpoint/source_target—not blast-radius or impact simulation; **404** when the policy id is absent from the current inventory list
- the current comparison surfaces now expose explicit persisted snapshot anchors alongside timestamps: `comparison_snapshot_id` for current-versus-latest-persisted views and `current_snapshot_id` / `previous_snapshot_id` for persisted-versus-previous history views
- `/api/v1/capabilities` now exposes the persisted readiness-support anchor through `readiness_snapshot_id` when a readiness-support snapshot exists
- `/api/v1/workflow-history` and `/api/v1/audit-history` now expose bounded persisted snapshot context and immediate previous-snapshot comparison evidence for inventory, topology, and policy where those sync-derived records exist, including explicit `sync_run_id`, nested `snapshot_id`, and comparison snapshot anchors where those records already exist
- workflow-history and audit-history responses now include a `baseline_summary` field so operators can interpret whether the view reflects preserved sync-derived history from the current workspace baseline or is effectively starting from a new baseline after restart or redeploy; the summary is derived from persisted sync-run and readiness-snapshot presence plus current response posture
- those comparison views are explanatory read models only; they are not drift decisions, validation outcomes, or action recommendations

## Planned evolution
- refine read-only inventory, topology, capability, and policy-oriented APIs from current scaffolds into deeper collector-backed, controller-backed, and model-backed endpoints
- deepen the bounded persistence layer from the initial inventory/topology snapshot slice into broader read-side and intent history where justified
- bounded ODL integration module

## Notes and caveats
The backend is the only service that writes to Postgres. Keep it as the single source of truth for application state.
The current inventory, topology, and policy read models are intentionally bounded and honest: they provide stable product-owned contracts, but they do not yet claim live operational completeness, deep path computation, intended-state reconciliation, or workflow-grade policy semantics.
Inventory, topology, and policy now persist normalized snapshot records and sync-run history in Postgres, and the API may fall back to the latest persisted snapshot when the live collector path is temporarily unavailable.
The collector boundary now uses a short latency budget by default so slow live reads fail fast enough to surface explicit fallback posture instead of stalling the read-only product behind long collector waits. Timeout exhaustion (`timeout_budget_exceeded`) is classified separately from connection, HTTP, and invalid-payload boundary failures; platform status `read_paths` notes summarize that posture for operators.
The capabilities path now also persists deduplicated readiness-support snapshots in Postgres so the latest readiness anchor and timestamp can survive normal service replacement in the same workspace.
Live collector-backed reads remain the primary source for current observed state; persistence strengthens bounded fallback behavior and sync-derived history rather than replacing those live reads.
Serving-mode fields explain whether the current response is live-backed, persisted fallback, or effectively empty because neither live nor persisted state is available.
Collector-boundary failure details are now standardized around bounded timeout-budget, connection, HTTP, and invalid-payload classification so the backend can fail faster and report the boundary posture more clearly than a raw exception string alone.
Comparison summaries explain bounded normalized current-versus-persisted or persisted-versus-previous differences only where the backend already has the necessary persisted evidence.
The current response, readiness, and embedded history-support surfaces are now anchor-strong at the persisted snapshot or sync-run level, but they still do not claim durable per-change, per-capability-item, or per-readiness-item identities where no such persisted records exist yet.
Topology may still include inferred truth within the current normalized slice, especially for link interpretation, while workflow-history and audit-history may label sync-derived evidence as recent, aging, stale, or unavailable in the product view without claiming a verified network mismatch.
The current backend metrics path remains transient and in-memory for scrape safety. Those metrics are observability signals, not durable product records.
After restart or redeploy, live collector-backed reads may need to be recollected before the current APIs return fresh live evidence again, but persisted fallback snapshots, sync-derived history, and readiness-support anchors remain available as long as the Postgres data directory survives.
If the Postgres data directory is lost or replaced, the backend can rebuild schema and recollect current live read-side data, but prior persisted snapshot anchors, prior sync-derived history, prior readiness-support records, and bounded comparison baselines do not recover automatically from repo files alone.
The current same-workspace recovery matrix is intentionally narrow:

- normal container restart preserves the host-backed Postgres baseline, so bounded fallback, comparison, workflow-history, audit-history, and readiness anchors can still be served while fresh live collection catches up
- `clab deploy -t topology.clab.yml -c` in the same workspace preserves that same baseline when `platform/postgres/data` is left in place, even though the runtime containers and process memory are replaced
- first deploy, or replacement after `platform/postgres/data` was removed or replaced, rebuilds schema and the current live read-side slice but starts comparison windows, sync-derived history, and readiness-support anchors from a new baseline

`platform/scripts/verify-core-runtime.sh` now checks that boundary directly: when Postgres already contains persisted snapshot, sync-run, or readiness rows, the backend must still expose the corresponding history windows and anchor fields after restart or replacement.
The packaged runtime is now stricter about startup ordering against Postgres, but it is still bootstrap-grade in the broader operational sense: it relies on topology-level env wiring, does not yet own secret rotation, restart orchestration, TLS, or broader recovery automation, and still treats bounded warm-up as best-effort rather than as a full readiness gate.
The current ODL enrichment is intentionally narrow: the backend probes bounded RESTCONF capability signals for platform health, but ODL still does not own topology truth, policy truth, or workflow logic.
The current capability matrix is still intentionally bounded: it reflects the delivered Nokia-first read-only product slice and planned Juniper direction, not full multi-vendor parity or deep per-version capability discovery.
Capability items also remain descriptive support records rather than durable per-item entities: the current product can operate honestly with vendor, platform, domain, feature, and version-scope context, so explicit capability item IDs remain a deferred follow-on only if a later bounded consumer truly needs standalone item citation.
Workflow-history and audit-history are currently bounded views derived from persisted sync-run activity, not separate durable workflow or user-action audit domains.
Each response includes a `baseline_summary` so operators can tell whether the view reflects preserved sync-derived history from the current workspace baseline or is effectively starting from a new baseline after restart or redeploy; these remain sync-derived and readiness-derived Phase 2 history views, not workflow-grade lifecycle or audit history.
The current topology now mounts a host-backed Postgres data directory, so bounded read-side state survives normal container replacement within the same platform workspace when that directory is preserved.
