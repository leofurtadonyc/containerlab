# Platform Dashboards

## Purpose

This document describes the observability dashboard families for the platform, the operator questions they are meant to answer, and how Grafana fits into the platform without becoming the product UI.

## Current Status

The platform currently has:

- Grafana provisioning-from-files scaffolding
- a provisioned Prometheus datasource
- dashboard folder structure for the required dashboard families
- a real platform overview dashboard backed by Prometheus scrape health plus current `app-api` and `gnmi-collector` metrics
- real topology and SR policy overview dashboards backed by current Prometheus metrics for those bounded live slices
- the platform, topology, and SR policy dashboards now surface bounded persisted sync evidence plus clearer aggregate freshness, agreement, and evidence-gap cues where those backend and collector metrics honestly exist
- the SR policy dashboard now also mirrors policy detail blocker posture more directly through detail-ready-target share and blocker-presence flags derived from real collector and backend metrics, while keeping per-target blocker reason codes in the product and verifier
- the SR policy dashboard now also mirrors backend-owned policy source-readiness posture numerically through metric-backed posture labels and bounded source-readiness counts, while keeping the richer explanation and per-target blocker reasons on the Policies page and in verifier output
- `./scripts/verify-core-runtime.sh` conditionally asserts `/api/v1/policies` `history.recent_snapshots` source-readiness keys (including `detail_ready_target_count` and the four source-readiness count families) when Postgres holds `policy_snapshots` rows **and** the API returns a non-empty recent-snapshot list; it asserts `history.comparison_to_previous` source-readiness fields when a full comparison object is present; it emits an honest notice when Postgres has rows but `recent_snapshots` is empty, and skips snapshot-level checks entirely on a fresh baseline with no policy snapshot rows
- the platform overview dashboard now also surfaces collector-backed target coverage, observation-age, and policy detail-gap cues for inventory, topology, and policy, using real numeric signals rather than trying to serialize product-facing degraded-scope prose into Grafana
- the platform overview dashboard now also surfaces backend-owned collector-boundary latest fetch duration, timeout budget, and latest timeout or failure posture signals so operators can distinguish slow fallback triggers from ordinary degraded live collection
- the platform overview dashboard now also separates readiness evaluation sample age from readiness persisted-snapshot age so operators can distinguish Prometheus-observed recomputation cadence from the chronology of the last materially changed persisted readiness snapshot
- the topology overview dashboard now also surfaces paired-link counts, single-sided-link counts, paired-link share, and backend-owned topology pairing-posture labels as bounded observability projections for the current topology coverage slice
- the topology overview dashboard now also surfaces paired-link counts, single-sided-link counts, linked-node counts, isolated-node counts, and backend-owned inference, endpoint-pairing, node-participation, and collection posture labels as bounded observability projections for the current topology partiality slice
- the platform overview dashboard now also mirrors the narrower topology read-path coverage posture through paired-versus-single-sided link counts, linked-versus-isolated node counts, and backend-owned inference, pairing, node-participation, and collection posture labels without turning Grafana into the product contract
- a bounded post-deploy core-runtime regression check that now validates Grafana API health, the provisioned Prometheus datasource, and the provisioned overview dashboards alongside Postgres and Prometheus readiness
- clearly marked placeholder dashboard files for the dashboard families that do not yet have real backing metrics

What does not exist yet:

- fully implemented operational dashboards across all required families
- complete service metrics across the platform
- workflow-complete change validation dashboards

This document therefore describes the current dashboard architecture and near-term follow-on work, while staying honest about the current implementation depth.

## Role Of Grafana

Grafana is the observability and dashboard layer.

It is responsible for:

- visualizing platform metrics
- presenting observability-oriented drilldowns
- showing health, topology-adjacent, and validation-oriented evidence
- surfacing service degradation and adapter health

Grafana is not responsible for:

- product navigation
- workflow submission
- approvals
- reconciliation logic
- audit-system ownership
- business logic

Those responsibilities belong to the backend and the WebUI.

## Provisioning As Code

Dashboards and datasources must be provisioned from files stored in the repository.

The current file-based approach is:

- datasource provisioning under `platform/grafana/provisioning/datasources/`
- dashboard provider provisioning under `platform/grafana/provisioning/dashboards/`
- dashboard JSON files under `platform/grafana/dashboards/`

This approach is required because it keeps observability delivery:

- reviewable
- reproducible
- environment-friendly
- aligned with the platform topology and repository structure

Manual dashboard creation in the Grafana UI must not be the primary delivery model.

## Dashboard Change Workflow

Grafana dashboard delivery is now expected to follow one small repo-owned regression workflow.

When a change touches:

- `platform/grafana/provisioning/datasources/`
- `platform/grafana/provisioning/dashboards/`
- `platform/grafana/dashboards/`

the expected follow-on steps are:

1. redeploy or reconfigure the platform topology so the mounted provisioning files are re-read
2. run `./scripts/verify-core-runtime.sh` from `platform/`
3. treat any failure in Grafana API health, Prometheus datasource provisioning, or provisioned overview dashboard discovery as a regression that must be fixed before considering the observability change complete

This is intentionally narrow.

It does not claim full semantic validation of every panel query or every dashboard family.
It does ensure that the current repo-owned Grafana provisioning contract still loads cleanly after observability changes.

More specifically, `./scripts/verify-core-runtime.sh` currently validates only that:

- Grafana's health API responds
- the provisioned Prometheus datasource is present
- provisioned overview dashboards can be discovered through the Grafana API
- the current `app-api` and `gnmi-collector` metrics contracts still expose the metric families the platform overview dashboard depends on most directly
- the current `app-api` metrics contract now also exposes the backend collector-boundary latest duration, timeout budget, and latest posture metric families required by the platform overview dashboard's latency-posture row

It does not yet validate:

- every panel query result across the platform, topology, and SR policy dashboards
- placeholder dashboard families such as change-validation and vendor views
- visual correctness, folder presentation details, or operator interpretation quality
- deeper Prometheus query semantics beyond the current readiness and target-discovery checks

## Dashboard Families

The platform currently organizes dashboards into five required families.

### Platform

This family answers questions such as:

- are the core platform services healthy?
- is Prometheus scraping the expected targets?
- is the backend reachable and responsive?
- is the collector healthy?
- is ODL reachable when that integration path is in use?

Expected emphasis over time:

- `app-api` health
- `gnmi-collector` health
- ODL health
- Prometheus health
- Grafana health where useful
- scrape target state
- platform request and latency indicators as they become real
- persisted inventory, topology, and policy sync freshness and result posture where those metrics exist
- bounded cross-slice freshness and agreement cues where those aggregate metrics exist
- collector-backed read-path coverage percentages, observation age, and target/detail gaps where those collector metrics exist
- collector-boundary latest fetch duration, timeout budget, and latest outcome posture where those backend metrics exist
- readiness evaluation sample age versus persisted readiness snapshot age where those backend metrics exist

### Topology

This family answers questions such as:

- what topology-oriented data is visible right now?
- when was topology-related state last refreshed?
- are node and link views healthy or degraded?
- is the platform receiving enough evidence to trust the topology view?

Expected emphasis over time:

- node graph or topology-friendly visualization
- node state summaries
- link state summaries
- sync timestamps
- integration quality signals
- bounded backend-versus-collector aggregate agreement cues where those metrics exist
- explicit paired-versus-single-sided inferred-link counts and shares plus linked-versus-isolated node counts where those bounded collector or backend metrics exist
- backend-owned topology inference, pairing, node-participation, and collection posture labels only as observability projections from real metrics, not as dashboard-authored business logic
- operators should interpret paired-versus-single-sided topology panels as endpoint-evidence depth only, not as protocol adjacency validation or controller-backed topology truth
- operators should interpret linked-versus-isolated node panels as inferred participation depth only, not as end-to-end path validation or controller-backed topology truth
- operators should interpret topology collection posture as collection-window health only, not as a separate validation or workflow verdict

### SR Policy

This family answers questions such as:

- how many policies are active, degraded, or down?
- where do **current** metric-backed gaps or posture flags suggest attention (without claiming validation or drift verdicts)?
- which headends and endpoints are most affected?
- what **current** policy state looks unstable or inconsistent in the bounded slice?

Expected emphasis over time:

- policy counts by state
- degraded, active, and down summaries
- headend and endpoint breakdowns
- bounded **current** evidence-gap and agreement metrics only—not substitutes for product policy history
- **current** collector-versus-backend deltas and detail-gap signals—not persisted snapshot-to-snapshot history
- persisted policy sync freshness and result posture where that evidence exists
- bounded target-coverage and observed-versus-detailed evidence-gap cues where those aggregate metrics exist
- bounded detail-ready target gaps where collector metrics honestly expose that narrower policy detail posture
- backend-owned source-readiness posture labels and bounded live-empty, detail-unavailable, and partial-detail counts where those metrics exist
- blocker-presence and detail-ready-gap flags that mirror whether observed targets are still missing detail-ready policy evidence, without turning Grafana into the surface that authors blocker semantics

## Product Versus Observability Split

The current read-path coverage improvement is intentionally split across layers.

In `app-web`:

- operators see backend-owned read-path summaries
- degraded-scope explanations are shown as product trust cues
- coverage and freshness remain tied to the bounded platform-status contract
- topology endpoint-pairing posture should be shown as backend-owned product language, not as a Grafana-derived label
- topology inference posture, node-participation posture, and collection posture should also be shown as backend-owned product language, not as Grafana-authored semantics
- `paired`, `partially_paired`, and `single_sided` remain bounded topology trust cues about inferred-link endpoint evidence, not workflow or validation language
- `fully_linked`, `partially_isolated`, `isolated_only`, and `unknown` remain bounded topology trust cues about inferred node participation, not workflow or validation language
- `inferred` and `ok` or `degraded` or `blocked` remain bounded topology trust cues about inference-boundedness and collection-window posture, not validation language

In Grafana:

- operators see numeric observability signals only
- coverage is represented through observed-versus-configured targets
- freshness is represented through observation age from collector timestamps
- degraded scope is approximated through numeric gaps such as missing targets, paired-versus-single-sided topology link counts or shares, linked-versus-isolated node counts, policy detail-ready gaps, and collector-boundary duration-versus-budget posture
- policy detail blockers are mirrored through detail-ready-target share and blocker-presence flags, while per-target blocker reason codes stay on the Policies page and in verifier output
- policy source-readiness is mirrored through backend-owned posture labels plus bounded live-empty, detail-unavailable, and partial-detail counts, while the richer explanation and per-target blocker reasons stay on the Policies page and in verifier output
- policy history and comparison remain product-owned: the Policies page surfaces persisted source-readiness posture and supporting counts per snapshot and in the latest-versus-previous comparison; Grafana does not mirror policy history and stays on bounded current metrics only
- topology endpoint-pairing and node-participation observability should stay numeric as paired-link counts, single-sided-link counts, linked-node counts, isolated-node counts, and derived shares rather than becoming a product-owned status vocabulary inside dashboards
- backend-owned topology inference, pairing, node-participation, and collection posture labels may appear only as metric-backed label projections that support those numeric panels; Grafana still does not own that vocabulary
- collector-boundary timeout posture is an observability cue only; it explains whether the backend hit the fail-fast latency budget, not whether the product has emitted a workflow verdict or dependency-dashboard truth statement
- recovery posture panels mirror baseline and read-side posture numerically; preserved baseline and fresh live recollection are not the same thing, and the product-facing explanation stays in app-web
- readiness evaluation sample age is an observability cue about the latest Prometheus-observed bounded recomputation, while persisted readiness snapshot age remains the chronology of the last materially changed persisted snapshot; operators should not treat them as interchangeable freshness claims
- same-workspace recovery posture is mirrored numerically through backend-owned `platform_app_api_recovery_posture` and `platform_app_api_recovery_persisted_artifacts` metrics; the product-facing explanation, including the distinction that preserved baseline and fresh live recollection are not the same thing, remains in app-web Overview and Platform Health
- recovery panels are **observability mirrors only**: they reflect bounded same-workspace persisted-anchor posture as emitted by `app-api` metrics; they do **not** prove disaster recovery, backup/restore, cross-host migration, or data-directory-loss recovery, and they do not replace the product contract on `/api/v1/platform/status`

Grafana does not attempt to reproduce the backend's human-readable degraded-scope summaries verbatim, because those are product semantics rather than durable metric labels.

Platform overview latency-posture rule:

- duration and timeout-budget panels exist to show bounded collector-boundary timing posture by model family
- latest outcome posture panels may distinguish `timeout_budget_exceeded` from `collector_connection_error`, `collector_http_error`, `invalid_response_payload`, `unknown_error`, and `partial_live_feed`
- those panels help explain why persisted fallback happened, but the backend contracts and WebUI trust cues remain the product-facing source of truth

Week 14 topology coverage rule:

- backend and WebUI may use the bounded topology pairing vocabulary defined in `platform/schemas/topology/topology-read-path-coverage-semantics.md`
- Grafana should not become the surface that defines whether the topology slice is `paired`, `partially_paired`, `single_sided`, or `unknown`
- Grafana may only project the numeric counts and derived ratios that support that product interpretation

### Change Validation

This family answers questions such as:

- how often are dry-runs being requested?
- which validations are failing?
- how long do validation paths take?
- are rollback-related signals being observed?

This family must remain observability-oriented.

It may visualize workflow evidence and validation outcomes, but it must not become the workflow control surface. The actual action flow belongs in the backend and WebUI.

Expected emphasis over time:

- dry-run counts
- workflow outcome summaries
- validation failures
- rollback-related visibility
- timing and duration insights

### Vendor

This family answers questions such as:

- which vendor adapter paths are healthy?
- where are normalization errors occurring?
- what requests are unsupported for a given capability set?
- how honest is the current platform support picture by vendor?

Expected emphasis over time:

- per-vendor adapter health
- unsupported request counts
- normalization errors
- support and capability visibility

This family must stay explicit about partial implementation. It must never imply full multi-vendor parity before that exists.

## Dashboard Quality Rules

Every dashboard should answer real operator questions.

That means:

- no cosmetic empty dashboards
- no panels that exist only to look impressive
- meaningful titles and descriptions
- caveats called out when the underlying implementation is partial
- readable queries that can be maintained

As real metrics become available, dashboards should become denser with useful evidence, not noisier with vanity panels.

## Relationship To Prometheus

Prometheus is the metrics and time-series source for Grafana in this platform.

That separation matters:

- Prometheus stores and evaluates metrics
- Grafana visualizes and organizes them
- neither replaces the backend as the application brain
- neither replaces Postgres as the durable application data store

Dashboard design should therefore assume Prometheus-backed metrics first, with any future additional observability sources introduced intentionally rather than casually.

## Current Vs Future

### Current

- provisioning files exist
- dashboard family folders exist
- the platform, topology, and SR policy families now include real Prometheus-backed dashboards for the services that expose meaningful metrics today, with those dashboards now also surfacing bounded freshness, agreement, and evidence-gap cues where the supporting signals are real
- the platform overview dashboard now also uses the newer collector coverage and observation-age metrics to make read-path gaps faster to interpret without turning Grafana into a product-status surrogate
- the topology and platform dashboards now also use the newer topology paired-link, single-sided-link, share, and backend-owned pairing-posture metrics to make endpoint-coverage gaps faster to interpret without inventing dashboard-only semantics
- the topology and platform dashboards now also use the newer topology inference, collection, paired-link, single-sided-link, share, and backend-owned posture-label metrics to make topology partiality faster to interpret without inventing dashboard-only semantics
- placeholder dashboards still exist for families whose underlying metrics are not yet real
- the platform observability shape is documented

### Future

- service-backed health dashboards
- topology-aware visual panels backed by real normalized state and metrics
- SR policy health and drift dashboards backed by real product signals
- change-validation observability backed by actual dry-run and validation metrics
- vendor capability and adapter health dashboards backed by real platform evidence

## Boundary Reminder

Grafana is a powerful observability surface, but it is not the product.

The operator-facing product remains `app-web`, backed by `app-api`.

Grafana should help operators answer:

- what is healthy?
- what is failing?
- what is degraded?
- what evidence supports that conclusion?

It should not own:

- what action should be submitted
- what workflow should run
- what intent should be persisted
- what approval decision should be made
