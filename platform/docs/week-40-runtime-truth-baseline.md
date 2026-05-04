# Week 40 Runtime Truth Baseline

Date: 2026-05-04

Task source: `agent/sdn/week40-monday-runtime-truth-baseline.md`

Verdict: `conditionally_ready_with_explicit_limits` remains accurate for this runtime baseline.

This document records the current runtime truth from the packaged platform validation path. It distinguishes verified live behavior from historical documentation, unavailable or bounded lab evidence, structural verifier success, and semantic product truth.

## Executive Summary

The platform built, redeployed, and passed both documented runtime verifiers:

- `./scripts/build-images.sh`: passed.
- `./scripts/prepare-odl-southbound-bridge.sh`: command failed because interactive `sudo` password entry was unavailable, but the required bridge `br-odl-sb` already existed and was UP.
- `clab deploy -t topology.clab.yml -c`: passed and replaced the existing `platform` lab.
- `./scripts/verify-core-runtime.sh`: passed.
- `./scripts/verify-odl-auth.sh`: passed.

All platform containers were running after deploy. All containers with Docker health checks were healthy. ODL was running and passed the dedicated ODL auth verifier, but it does not expose a Docker health status in the `docker ps` summary.

The runtime currently shows real live collector-backed data for the configured Nokia footprint:

- inventory: 34 configured targets, 34 observed, 34 successful, 0 failed
- topology: 34 configured targets, 34 observed, 34 successful, 44 normalized links, 42 paired links, 2 single-sided links
- policy: 34 configured targets, 34 observed, 34 successful, 4 detail-ready targets, 4 observed static local policies, 30 targets with `no_policies_observed`

Important limits remain:

- topology remains partial, inferred, and only partially paired
- LLDP evidence is present and correlated, but IGP adjacency metrics currently report zero observations
- policy visibility remains narrow: `static_policies_when_present`, not broad SR policy truth
- NETCONF controller lane is exposed but not observed as an established/session-backed lane
- safe-action and rollback routes are reachable, but list responses are empty and remain bounded platform-only contracts
- passing verifiers proves structural/runtime contracts, not full production semantics

## Commands Run

All commands were run from `platform/` unless noted.

```bash
./scripts/build-images.sh
```

Result: passed.

Evidence:

- Built `platform-app-api:0.1.0`
- Built `platform-gnmi-collector:0.1.0`
- Built `platform-app-web:0.1.0`
- Built `platform-odl:0.1.0`
- Built `platform-postgres:0.1.0`
- Built `platform-prometheus:0.1.0`
- Built `platform-grafana:0.1.0`

Most Docker layers were cached. No build error occurred.

```bash
./scripts/prepare-odl-southbound-bridge.sh
```

Result: command failed due non-interactive sudo, but the required bridge already existed.

Observed failure:

```text
sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
sudo: a password is required
```

Follow-up check:

```bash
ip link show br-odl-sb
```

Result:

```text
53: br-odl-sb: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9500 qdisc noqueue state UP mode DEFAULT group default qlen 1000
```

Interpretation: bridge preparation could not be executed through the non-interactive agent shell, but deploy was not blocked because `br-odl-sb` was already present and UP.

```bash
clab deploy -t topology.clab.yml -c
```

Result: passed.

Containerlab version: `0.74.3`.

Deploy behavior:

- destroyed existing `platform` lab containers
- recreated lab directory
- created `grafana`, `prometheus`, `odl`, `postgres`, `app-api`, `gnmi-collector`, `app-web`
- created link `odl:eth1` to `br-odl-sb:odl-eth1`
- installed host entries and SSH config

Containerlab reported the following initial states at deploy completion:

- all seven containers running
- health checks still starting for all services that define health checks
- ODL running with REST/Karaf ports exposed

```bash
./scripts/verify-core-runtime.sh
```

Result: passed.

Verifier summary:

```text
Core runtime verification passed. Postgres, Prometheus, Grafana, gNMI collector, app-api, and app-web are ready with their expected startup contracts, the WebUI proxy reaches the backend health path, the read-side API contracts and dashboard-critical metric families are present, and Grafana has the provisioned datasource and dashboards.
```

Verifier notices:

```text
Notice: Postgres persisted read-side baseline present: sync_runs=760124 inventory_snapshots=20392 topology_snapshots=360718 policy_snapshots=379014 readiness_snapshots=3.
Notice: Platform status reports partially_paired topology endpoint coverage, so some inferred links still rely on single-sided endpoint evidence.
Notice: Platform status reports inferred topology posture, so current topology links remain bounded inferred evidence rather than direct adjacency truth.
Notice: Topology completeness remains partial by design in the current Phase 2 slice.
Notice: Topology API reports inferred topology posture, so current links remain a bounded inferred slice rather than direct adjacency truth.
Notice: Policies API source-readiness reports partially_ready, so the current source-visible slice mixes detail-ready targets with live-empty or detail-limited targets.
Notice: Policies API target footprints report no_policies_observed blockers on at least one target, so some targets remain healthy live-empty rather than detail-ready.
```

```bash
./scripts/verify-odl-auth.sh
```

Result: passed.

Verifier summary:

```text
ODL auth verification passed. Configured credential works, default fallback is rejected, and app-api reports bounded ODL health as ok.
```

## Container And Service Health

Command:

```bash
docker ps --filter 'name=clab-platform' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Observed runtime status:

| Container | Status | Notes |
| --- | --- | --- |
| `clab-platform-app-web` | `Up 13 minutes (healthy)` | host port `8088` |
| `clab-platform-gnmi-collector` | `Up 13 minutes (healthy)` | host port `9804` |
| `clab-platform-app-api` | `Up 13 minutes (healthy)` | host port `8000` |
| `clab-platform-postgres` | `Up 13 minutes (healthy)` | host port `5432` |
| `clab-platform-odl` | `Up 13 minutes` | ports `8101`, `8181`; no Docker health marker shown |
| `clab-platform-prometheus` | `Up 13 minutes (healthy)` | host port `9090` |
| `clab-platform-grafana` | `Up 13 minutes (healthy)` | host port `3000` |

## URL And API Reachability

HTTP probes:

| Probe | Result | Interpretation |
| --- | --- | --- |
| `http://127.0.0.1:8000/api/v1/health` | HTTP 200 | app-api health reachable |
| `http://127.0.0.1:8000/docs` | HTTP 200 | API docs reachable |
| `http://127.0.0.1:8000/openapi.json` | HTTP 200 | OpenAPI reachable |
| `http://127.0.0.1:8088/` | HTTP 200 | WebUI shell reachable |
| `http://127.0.0.1:8088/?view=safe-action-workspace` | HTTP 200 | SPA route reachable structurally |
| `http://127.0.0.1:8088/?view=rollback-workspace` | HTTP 200 | SPA route reachable structurally |
| `http://127.0.0.1:9090/-/ready` | HTTP 200 | Prometheus ready |
| `http://127.0.0.1:3000/api/health` | HTTP 200 | Grafana database ok, version `11.2.2` |
| `http://127.0.0.1:9804/metrics` | HTTP 200 | gNMI collector metrics reachable |
| `http://127.0.0.1:8000/api/v1/actions` | HTTP 200 | safe-action route reachable |
| `http://127.0.0.1:8000/api/v1/rollbacks` | HTTP 200 | rollback route reachable |

Action and rollback route summaries:

```text
/api/v1/actions contract_id=safe_action_workflow_v1 items=0
/api/v1/rollbacks contract_id=rollback_orchestration_v1 items=0
```

Interpretation: bounded safe-action and rollback surfaces are reachable, but this baseline did not create or execute any workflow, action, validation, preview, or rollback record.

## Prometheus Target Posture

Command used the Prometheus active targets API:

```text
GET http://127.0.0.1:9090/api/v1/targets?state=active
```

Observed active targets:

| Job | Scrape URL | Health | Last error |
| --- | --- | --- | --- |
| `app-api` | `http://app-api:8000/metrics` | `up` | `none` |
| `gnmi-collector` | `http://gnmi-collector:9804/metrics` | `up` | `none` |
| `prometheus` | `http://localhost:9090/metrics` | `up` | `none` |

Interpretation: Prometheus target posture is healthy for the currently real scrape set. This does not imply ODL, Grafana, or Postgres exporter scraping; those are not active targets in this baseline.

## Database And Migrations

Alembic version query:

```bash
docker exec clab-platform-postgres psql -U platform -d platform -c "select version_num from alembic_version;"
```

Result:

```text
version_num
---------------
20260330_0012
```

App-api startup log scan for migration/error terms in the last 30 minutes found:

```text
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
```

No `error` or `traceback` lines were found in that scan.

Interpretation: app-api reached the current Alembic head known to this repository baseline (`20260330_0012`) and started without migration errors in the inspected log window.

## Read Path Runtime Truth

### Platform status

`GET /api/v1/platform/status` returned:

```text
status=ok
```

Read-path summary:

| Read path | Observation | Targets | Success | Partial | Failure | Important posture |
| --- | --- | --- | --- | --- | --- | --- |
| inventory | `ok` | `34/34` | `34` | `0` | `0` | live bounded Nokia gNMI inventory |
| topology | `ok` | `34/34` | `34` | `0` | `0` | `endpoint_pairing=partially_paired`, `inference=inferred` |
| policy | `ok` | `34/34` | `34` | `0` | `0` | `detail_ready=4` |

Platform-status notes included:

- Inventory remains a bounded normalized read path sourced from live Nokia gNMI collection.
- Topology links are rooted in live router interface evidence, with OpenConfig LLDP as an additional device-native physical adjacency lane where available.
- Device-native OSPF and IS-IS adjacency observations are separate control-plane evidence lanes, but do not claim forwarding or service truth.
- Policy inventory is bounded to live Nokia SR policy counters collected over gNMI.
- BGP-signaled SR policy detail remains out of scope until a deeper vendor-neutral path is added.

### Devices

`GET /api/v1/devices?limit=5` returned:

```text
data_status=live
serving_mode=live_collector
count=34
```

Interpretation: device inventory is live collector-backed for all 34 configured targets in this baseline.

### Topology

`GET /api/v1/topology` returned:

```text
data_status=live
serving_mode=live_collector
endpoint_pairing_posture=partially_paired
inference_posture=inferred
paired_link_count=42
single_sided_link_count=2
linked_node_count=34
isolated_node_count=0
```

Interpretation: topology is live and useful, but remains explicitly bounded inferred topology, not full adjacency or forwarding truth.

### Policies

`GET /api/v1/policies` returned:

```text
data_status=live
serving_mode=live_collector
count=4
detail_mode=static_policies_when_present
empty_reason=none
```

Policy posture:

- 34 policy-capable targets observed.
- 4 detail-ready targets.
- 4 observed policies.
- 4 static local policies.
- 30 targets reported `no_policies_observed`.

First observed policy sample:

```text
policy_id=PE1:static_local:100.65.255.13:100
policy_name=PE1-to-PE3-SRTE
policy_type=static_local
source=gnmi
source_target=PE1
observed_state=degraded
health_state=down
degraded_policy_v1.posture=degraded
```

Interpretation: policy evidence is live and real for the current Nokia static-local slice, but it is narrow. It is not full SR policy truth.

## gNMI Collector Target Posture

Collector metrics from `http://127.0.0.1:9804/metrics` reported:

| Metric family | Observed value |
| --- | --- |
| inventory targets | `34` |
| inventory collection success | `34` |
| inventory collection partial | `0` |
| inventory collection failure | `0` |
| inventory normalized records | `34` |
| topology targets | `34` |
| topology collection success | `34` |
| topology collection partial | `0` |
| topology collection failure | `0` |
| topology normalized nodes | `34` |
| topology normalized links | `44` |
| topology paired links | `42` |
| topology single-sided links | `2` |
| LLDP observations | `80` |
| LLDP correlated links | `40` |
| LLDP mismatch links | `0` |
| IGP adjacency observations | `0` |
| OSPF adjacency observations | `0` |
| IS-IS adjacency observations | `0` |
| policy targets | `34` |
| policy collection success | `34` |
| policy collection partial | `0` |
| policy collection failure | `0` |
| policy detail-ready targets | `4` |
| policy targets with `no_policies_observed` | `30` |
| observed policies | `4` |

Interpretation:

- The configured gNMI collector targets are real and reachable in this baseline.
- Collector posture is not noisy from unreachable targets in this run.
- Policy detail is still intentionally narrow.
- LLDP evidence is present; IGP adjacency evidence is absent in this baseline despite zero collection failures.

## Controller / ODL Evidence

`GET /api/v1/controller/evidence` returned:

```text
contract_id=controller_southbound_session_truth_v2
controller_reachability=ok
```

Lane summary:

| Lane | Lane posture | Session posture | Evidence strength | Nodes | Links | Derivation |
| --- | --- | --- | --- | --- | --- | --- |
| BGP-LS | `available` | `established` | `session_backed` | `1` | `0` | `protocol_native` |
| PCEP | `available` | `established` | `session_backed` | `8` | `0` | `controller_object_parse` |
| NETCONF | `empty` | `not_observed` | `unavailable` | `0` | `0` | `topology_partition_heuristic` |

Controller notes:

- BGP native probe succeeded on `/rests/data/openconfig-network-instance:network-instances`; session/oper hints were present.
- PCEP native RESTCONF candidate did not return usable JSON, but PCEP topology exposed 8 PCC node rows with `state-sync=synchronized`.
- NETCONF native probes returned HTTP 409, no usable native JSON, and no mounted NETCONF nodes were visible.

Interpretation:

- ODL is reachable and authenticated.
- BGP-LS and PCEP have session-backed evidence in this baseline.
- NETCONF is not observed as usable southbound session evidence in this baseline.
- Controller evidence remains controller-exported evidence only; it is not dataplane or forwarding truth.

## WebUI Route Reachability

HTTP 200 was observed for:

- `/`
- `/?view=safe-action-workspace`
- `/?view=rollback-workspace`

Interpretation:

- The WebUI static shell and the two bounded action-slice routes are structurally reachable.
- This probe does not prove full browser-side render semantics, user interaction behavior, or successful mutation workflows.
- `verify-core-runtime.sh` also confirmed app-web startup contracts and WebUI proxy access to backend health.

## Safe Action And Rollback Runtime Truth

API routes are reachable:

- `GET /api/v1/actions`: HTTP 200, `contract_id=safe_action_workflow_v1`, `items=[]`
- `GET /api/v1/rollbacks`: HTTP 200, `contract_id=rollback_orchestration_v1`, `items=[]`

Interpretation:

- The bounded Phase 5 surfaces exist and are reachable.
- No safe action or rollback workflow was created or executed during this baseline.
- This baseline does not prove action execution, preview validity, validation authority, or rollback effectiveness.

## Verified Runtime Truth Versus Historical Documentation

Verified live behavior in this baseline:

- platform images build successfully
- platform topology redeploys successfully
- all expected containers run
- health-checked containers report healthy
- core runtime verifier passes
- ODL auth verifier passes
- API health, API docs, OpenAPI, WebUI shell, Prometheus, Grafana, collector metrics, actions, and rollbacks are reachable
- Prometheus active targets for app-api, gnmi-collector, and prometheus are up
- Postgres Alembic version is `20260330_0012`
- app-api logs show Alembic startup context with no migration errors found in the inspected window
- collector-backed inventory/topology/policy reads are live
- ODL controller evidence returns `controller_southbound_session_truth_v2`

Historical documentation still relevant but not independently re-proven here:

- all week 24-39 feature-level regression claims
- every individual WebUI workspace rendering path
- all exported reports and replay semantics
- every Grafana panel query
- every backend contract test
- same-workspace restart drill behavior

Unavailable or bounded lab/device evidence:

- no separate lab deploy command was run in this baseline
- current live target evidence appears already available for 34 configured targets
- IGP adjacency observations are currently zero
- NETCONF southbound session evidence is unavailable/not observed

Structural verifier success:

- `verify-core-runtime.sh` proves the documented bounded runtime contract and structural API/dashboard-critical checks
- `verify-odl-auth.sh` proves configured ODL credential works, default fallback is rejected, and app-api reports bounded ODL health as ok

Semantic product truth:

- inventory is live for configured targets
- topology is live but partial/inferred and partially paired
- policy is live but narrow/static-local and partially ready
- action and rollback APIs are reachable but empty and not exercised
- controller evidence is bounded controller/session evidence, not forwarding truth

## Failure And Blocker Classification

| Area | Status | Classification | Notes |
| --- | --- | --- | --- |
| Build | passed | none | all seven images built |
| Bridge prep | failed command, environment already satisfied | deploy prerequisite / privilege | helper needs interactive sudo; `br-odl-sb` already existed and was UP |
| Deploy | passed | none | topology replaced and containers recreated |
| Core verifier | passed | none | with bounded-truth notices |
| ODL auth verifier | passed | none | configured credential works; default rejected |
| API | passed for probed routes | none | health/docs/openapi/actions/rollbacks reachable |
| WebUI | passed structural probes | none | root and action/rollback query routes HTTP 200 |
| Collector | passed | bounded evidence | all 34 targets succeeded; policy detail only 4 targets |
| Database | passed | none | Alembic at `20260330_0012` |
| Prometheus | passed | none | three active targets up |
| Grafana | passed | none | health endpoint ok |
| Lab dependency | available for configured targets | bounded evidence | no separate lab deploy performed; target evidence was live |

## Baseline Decision

The current platform remains:

```text
conditionally_ready_with_explicit_limits
```

Reason:

- The packaged runtime builds, deploys, and verifies successfully.
- Live collector data exists for the configured target set.
- Prometheus, Grafana, Postgres, app-api, app-web, gNMI collector, and ODL auth are operational.
- The product still has explicit bounded limits: partial/inferred topology, narrow static-local policy truth, zero IGP adjacency observations, unavailable NETCONF session evidence, and unexercised empty safe-action/rollback lists.

This baseline does not authorize production readiness, broad automation, general safe-to-change claims, or full network truth.

## Next-Step Implications

Future work should compare against this baseline before making claims.

High-signal follow-ups:

1. If topology truth-depth is considered, explain why current LLDP evidence (`80` observations, `40` correlated links, `0` mismatches) and zero IGP adjacency observations justify or block that work.
2. If controller work is considered, start from the current lane reality: BGP-LS and PCEP session-backed, NETCONF unavailable/not observed.
3. If policy work is considered, stay inside the current evidence: 4 static-local policies on 4 detail-ready targets, 30 targets live-empty with `no_policies_observed`.
4. If safe-action or rollback work is considered, first create a bounded test/evidence plan; this baseline only proves route reachability and empty list responses.
5. If runtime automation is considered, account for the non-interactive sudo limitation on `prepare-odl-southbound-bridge.sh`.
