#!/bin/sh
set -eu

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-clab-platform-postgres}"
POSTGRES_USER="${POSTGRES_USER:-platform}"
POSTGRES_DB="${POSTGRES_DB:-platform}"
PROMETHEUS_CONTAINER="${PROMETHEUS_CONTAINER:-clab-platform-prometheus}"
GRAFANA_CONTAINER="${GRAFANA_CONTAINER:-clab-platform-grafana}"
GNMI_COLLECTOR_CONTAINER="${GNMI_COLLECTOR_CONTAINER:-clab-platform-gnmi-collector}"
APP_API_CONTAINER="${APP_API_CONTAINER:-clab-platform-app-api}"
APP_WEB_CONTAINER="${APP_WEB_CONTAINER:-clab-platform-app-web}"
GNMI_COLLECTOR_URL="${GNMI_COLLECTOR_URL:-http://127.0.0.1:9804}"
APP_API_URL="${APP_API_URL:-http://127.0.0.1:8000}"
APP_WEB_URL="${APP_WEB_URL:-http://127.0.0.1:8088}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://127.0.0.1:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3000}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-change_me}"
VERIFY_ATTEMPTS="${VERIFY_ATTEMPTS:-45}"
VERIFY_SLEEP_SECONDS="${VERIFY_SLEEP_SECONDS:-2}"
warning_count=0

require_command() {
  command_name=$1
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
}

require_command curl
require_command docker

warn() {
  warning_count=$((warning_count + 1))
  echo "Warning: $1"
}

notice() {
  echo "Notice: $1"
}

fetch_compact_json() {
  curl -fsS "$1" | tr -d '\n\r\t '
}

assert_contains() {
  name=$1
  payload=$2
  expected=$3

  if ! printf '%s' "$payload" | grep -F "$expected" >/dev/null 2>&1; then
    echo "$name is missing expected content: $expected" >&2
    exit 1
  fi
}

wait_for_postgres() {
  attempts=$VERIFY_ATTEMPTS

  while [ "$attempts" -gt 0 ]; do
    if docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      return 0
    fi

    attempts=$((attempts - 1))
    if [ "$attempts" -gt 0 ]; then
      sleep "$VERIFY_SLEEP_SECONDS"
    fi
  done

  echo "Postgres readiness check timed out for container: $POSTGRES_CONTAINER" >&2
  exit 1
}

wait_for_http_ok() {
  name=$1
  url=$2
  attempts=$VERIFY_ATTEMPTS

  while [ "$attempts" -gt 0 ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    attempts=$((attempts - 1))
    if [ "$attempts" -gt 0 ]; then
      sleep "$VERIFY_SLEEP_SECONDS"
    fi
  done

  echo "$name did not become ready at $url" >&2
  exit 1
}

wait_for_container_healthy() {
  container_name=$1
  attempts=$VERIFY_ATTEMPTS

  while [ "$attempts" -gt 0 ]; do
    health_status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name" 2>/dev/null || true)
    if [ "$health_status" = "healthy" ]; then
      return 0
    fi

    attempts=$((attempts - 1))
    if [ "$attempts" -gt 0 ]; then
      sleep "$VERIFY_SLEEP_SECONDS"
    fi
  done

  echo "Container did not reach healthy state: $container_name" >&2
  docker inspect -f '{{json .State}}' "$container_name" >&2 || true
  exit 1
}

require_container() {
  container_name=$1
  if ! docker inspect "$container_name" >/dev/null 2>&1; then
    echo "Container not found: $container_name" >&2
    exit 1
  fi
}

require_container "$POSTGRES_CONTAINER"
require_container "$PROMETHEUS_CONTAINER"
require_container "$GRAFANA_CONTAINER"
require_container "$GNMI_COLLECTOR_CONTAINER"
require_container "$APP_API_CONTAINER"
require_container "$APP_WEB_CONTAINER"

wait_for_container_healthy "$POSTGRES_CONTAINER"
wait_for_postgres

postgres_schema_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM information_schema.schemata WHERE schema_name = 'platform_app';")
if [ "$postgres_schema_count" != "1" ]; then
  echo "Expected platform_app schema in Postgres, found count=$postgres_schema_count" >&2
  exit 1
fi

wait_for_container_healthy "$PROMETHEUS_CONTAINER"
wait_for_container_healthy "$GRAFANA_CONTAINER"
wait_for_container_healthy "$GNMI_COLLECTOR_CONTAINER"
wait_for_container_healthy "$APP_API_CONTAINER"
wait_for_container_healthy "$APP_WEB_CONTAINER"
wait_for_http_ok "gNMI collector metrics" "$GNMI_COLLECTOR_URL/metrics"
wait_for_http_ok "app-api health" "$APP_API_URL/api/v1/health"
wait_for_http_ok "app-api metrics" "$APP_API_URL/metrics"
wait_for_http_ok "app-web root" "$APP_WEB_URL/"
wait_for_http_ok "app-web API proxy health" "$APP_WEB_URL/api/v1/health"
wait_for_http_ok "Prometheus readiness" "$PROMETHEUS_URL/-/ready"

prometheus_targets=$(curl -fsS "$PROMETHEUS_URL/api/v1/targets" | tr -d '\n')
echo "$prometheus_targets" | grep '"job":"prometheus".*"health":"up"' >/dev/null
echo "$prometheus_targets" | grep '"job":"app-api".*"health":"up"' >/dev/null
echo "$prometheus_targets" | grep '"job":"gnmi-collector".*"health":"up"' >/dev/null
if echo "$prometheus_targets" | grep '"health":"down"' >/dev/null 2>&1; then
  echo "Prometheus still reports at least one active scrape target as down." >&2
  printf '%s\n' "$prometheus_targets" >&2
  exit 1
fi

wait_for_http_ok "Grafana health" "$GRAFANA_URL/api/health"

grafana_datasources=$(curl -fsS -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/datasources")
echo "$grafana_datasources" | grep '"uid":"prometheus"' >/dev/null

grafana_dashboards=$(curl -fsS -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/search?query=overview")
echo "$grafana_dashboards" | grep 'platform-overview' >/dev/null
echo "$grafana_dashboards" | grep 'topology-overview' >/dev/null

platform_status_response=$(fetch_compact_json "$APP_API_URL/api/v1/platform/status")
devices_response=$(fetch_compact_json "$APP_API_URL/api/v1/devices")
topology_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology")
policies_response=$(fetch_compact_json "$APP_API_URL/api/v1/policies")
capabilities_response=$(fetch_compact_json "$APP_API_URL/api/v1/capabilities")
app_api_metrics=$(curl -fsS "$APP_API_URL/metrics")
collector_metrics=$(curl -fsS "$GNMI_COLLECTOR_URL/metrics")

assert_contains "platform status response" "$platform_status_response" '"status":"ok"'
assert_contains "platform status response" "$platform_status_response" '"topology_name":"platform"'
assert_contains "platform status response" "$platform_status_response" '"name":"app-api"'
assert_contains "platform status response" "$platform_status_response" '"name":"app-web"'
assert_contains "platform status response" "$platform_status_response" '"name":"gnmi-collector"'
assert_contains "platform status response" "$platform_status_response" '"name":"postgres"'
assert_contains "platform status response" "$platform_status_response" '"name":"prometheus"'
assert_contains "platform status response" "$platform_status_response" '"name":"grafana"'
assert_contains "platform status response" "$platform_status_response" '"name":"odl"'
assert_contains "platform status response" "$platform_status_response" '"read_paths":[{'
assert_contains "platform status response" "$platform_status_response" '"model_family":"inventory"'
assert_contains "platform status response" "$platform_status_response" '"model_family":"topology"'
assert_contains "platform status response" "$platform_status_response" '"model_family":"policy"'
assert_contains "platform status response" "$platform_status_response" '"configured_target_count":'
assert_contains "platform status response" "$platform_status_response" '"observed_target_count":'
assert_contains "platform status response" "$platform_status_response" '"collection_success_count":'
assert_contains "platform status response" "$platform_status_response" '"collection_partial_count":'
assert_contains "platform status response" "$platform_status_response" '"collection_failure_count":'
assert_contains "platform status response" "$platform_status_response" '"oldest_observed_at":'
assert_contains "platform status response" "$platform_status_response" '"newest_observed_at":'
assert_contains "platform status response" "$platform_status_response" '"degraded_scope_summary":"'
assert_contains "platform status response" "$platform_status_response" '"inference_posture":"'
assert_contains "platform status response" "$platform_status_response" '"endpoint_pairing_posture":"'
assert_contains "platform status response" "$platform_status_response" '"collection_posture":"'
assert_contains "platform status response" "$platform_status_response" '"node_participation_posture":"'
assert_contains "platform status response" "$platform_status_response" '"paired_link_count":'
assert_contains "platform status response" "$platform_status_response" '"single_sided_link_count":'
assert_contains "platform status response" "$platform_status_response" '"linked_node_count":'
assert_contains "platform status response" "$platform_status_response" '"isolated_node_count":'
assert_contains "platform status response" "$platform_status_response" '"policy_capable_target_count":'
assert_contains "platform status response" "$platform_status_response" '"detail_ready_target_count":'

assert_contains "devices response" "$devices_response" '"data_status":"'
assert_contains "devices response" "$devices_response" '"serving_mode":"'
assert_contains "devices response" "$devices_response" '"evidence_confidence":{'
assert_contains "devices response" "$devices_response" '"comparison_to_latest_persisted":{'
assert_contains "devices response" "$devices_response" '"count":'

assert_contains "topology response" "$topology_response" '"data_status":"'
assert_contains "topology response" "$topology_response" '"serving_mode":"'
assert_contains "topology response" "$topology_response" '"sync_status":"'
assert_contains "topology response" "$topology_response" '"completeness":"'
assert_contains "topology response" "$topology_response" '"coverage_summary":{'
assert_contains "topology response" "$topology_response" '"inference_posture":"'
assert_contains "topology response" "$topology_response" '"endpoint_pairing_state":"'
assert_contains "topology response" "$topology_response" '"endpoint_evidence_count":'
assert_contains "topology response" "$topology_response" '"collection_posture":"'
assert_contains "topology response" "$topology_response" '"node_participation_posture":"'
assert_contains "topology response" "$topology_response" '"linked_node_count":'
assert_contains "topology response" "$topology_response" '"isolated_node_count":'
assert_contains "topology response" "$topology_response" '"topology":{'
assert_contains "topology response" "$topology_response" '"comparison_to_latest_persisted":{'

assert_contains "policies response" "$policies_response" '"data_status":"'
assert_contains "policies response" "$policies_response" '"serving_mode":"'
assert_contains "policies response" "$policies_response" '"sync_status":"'
assert_contains "policies response" "$policies_response" '"detail_mode":"'
assert_contains "policies response" "$policies_response" '"detail_source_readiness":{'
assert_contains "policies response" "$policies_response" '"posture":"'
assert_contains "policies response" "$policies_response" '"no_policies_observed_target_count":'
assert_contains "policies response" "$policies_response" '"detail_unavailable_target_count":'
assert_contains "policies response" "$policies_response" '"partial_detail_target_count":'
assert_contains "policies response" "$policies_response" '"empty_reason":"'
assert_contains "policies response" "$policies_response" '"target_footprints":['
assert_contains "policies response" "$policies_response" '"detail_blocker_reason":"'
assert_contains "policies response" "$policies_response" '"comparison_to_latest_persisted":{'
assert_contains "policies response" "$policies_response" '"history":{'

assert_contains "capabilities response" "$capabilities_response" '"data_status":"bounded_matrix"'
assert_contains "capabilities response" "$capabilities_response" '"dry_run_readiness":{'
assert_contains "capabilities response" "$capabilities_response" '"planning_readiness":"readiness_planning_supported"'
assert_contains "capabilities response" "$capabilities_response" '"phase_recommendation":"remain_phase_2_read_only_foundation"'
assert_contains "capabilities response" "$capabilities_response" '"delivery_tier_counts":{'
assert_contains "capabilities response" "$capabilities_response" '"future_roadmap":'
assert_contains "capabilities response" "$capabilities_response" '"vendor_posture_counts":{'
assert_contains "capabilities response" "$capabilities_response" '"future_juniper_target":'

assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_topology_snapshot_status'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_topology_paired_links'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_topology_single_sided_links'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_topology_linked_nodes'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_topology_isolated_nodes'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_topology_coverage_posture{inference_posture="'
assert_contains "app-api metrics" "$app_api_metrics" 'node_participation_posture="'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_topology_coverage_posture'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_policy_snapshot_status'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_policy_detail_source_readiness'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_policy_detail_source_targets'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_collector_boundary_latest_fetch_duration_seconds'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_collector_boundary_timeout_budget_seconds'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_collector_boundary_latest_fetch_posture'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_readiness_status'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_readiness_latest_evaluation_at_seconds'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_sync_runs_total'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_inventory_newest_observed_timestamp_seconds'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_topology_paired_links'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_topology_single_sided_links'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_topology_linked_nodes'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_topology_isolated_nodes'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_topology_node_participation_posture'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_topology_newest_observed_timestamp_seconds'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_policy_newest_observed_timestamp_seconds'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_topology_normalized_nodes'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_policy_observed_targets'
assert_contains "collector metrics" "$collector_metrics" 'platform_gnmi_collector_policy_detail_ready_targets'

if printf '%s' "$platform_status_response" | grep -F '"name":"odl"' | grep -F '"observation_state":"ok"' >/dev/null 2>&1; then
  :
elif printf '%s' "$platform_status_response" | grep -F '"name":"odl"' >/dev/null 2>&1; then
  warn "Platform status does not currently report ODL observation_state as ok; run ./scripts/verify-odl-auth.sh to validate the controller path explicitly."
fi

if printf '%s' "$devices_response" | grep -F '"serving_mode":"persisted_fallback"' >/dev/null 2>&1; then
  warn "Devices API is serving persisted fallback data instead of live collector inventory."
fi
if printf '%s' "$devices_response" | grep -F '"serving_mode":"empty_scaffold"' >/dev/null 2>&1; then
  warn "Devices API has no live inventory and no persisted fallback snapshot."
fi
if printf '%s' "$devices_response" | grep -F '"blocked_reason":"collector_unavailable_and_no_persisted_snapshot"' >/dev/null 2>&1; then
  warn "Devices API is blocked because the collector is unavailable and no persisted inventory snapshot exists."
fi
if printf '%s' "$devices_response" | grep -F '"data_status":"degraded"' >/dev/null 2>&1; then
  warn "Devices API reports degraded data_status."
fi

if printf '%s' "$platform_status_response" | grep -E '"model_family":"inventory"[^}]*"observation_state":"(degraded|unreachable|unknown)"' >/dev/null 2>&1; then
  warn "Platform status reports a non-ok inventory read path; inspect inventory coverage and freshness posture before treating the slice as current."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"topology"[^}]*"observation_state":"(degraded|unreachable|unknown)"' >/dev/null 2>&1; then
  warn "Platform status reports a non-ok topology read path; inspect bounded topology coverage and freshness posture before treating the slice as current."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"policy"[^}]*"observation_state":"(degraded|unreachable|unknown)"' >/dev/null 2>&1; then
  warn "Platform status reports a non-ok policy read path; inspect bounded policy coverage and freshness posture before treating the slice as current."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"topology"[^}]*"endpoint_pairing_posture":"partially_paired"' >/dev/null 2>&1; then
  notice "Platform status reports partially_paired topology endpoint coverage, so some inferred links still rely on single-sided endpoint evidence."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"topology"[^}]*"endpoint_pairing_posture":"single_sided"' >/dev/null 2>&1; then
  notice "Platform status reports single_sided topology endpoint coverage, so the current inferred links remain bounded to one observed endpoint per link."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"topology"[^}]*"collection_posture":"degraded"' >/dev/null 2>&1; then
  warn "Platform status reports degraded topology collection posture, so the current topology slice should be treated as a partially degraded live window."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"topology"[^}]*"collection_posture":"blocked"' >/dev/null 2>&1; then
  warn "Platform status reports blocked topology collection posture, so the current topology slice is not backed by a normal live collection window."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"topology"[^}]*"inference_posture":"inferred"' >/dev/null 2>&1; then
  notice "Platform status reports inferred topology posture, so current topology links remain bounded inferred evidence rather than direct adjacency truth."
fi
if printf '%s' "$platform_status_response" | grep -E '"model_family":"policy"[^}]*"detail_ready_target_count":0' >/dev/null 2>&1; then
  notice "Platform status reports zero policy detail-ready targets, so current policy truth remains bounded to counters or other aggregate-only evidence."
fi
if printf '%s' "$app_api_metrics" | grep 'platform_app_api_collector_boundary_latest_fetch_posture{model_family="inventory",outcome="timeout_budget_exceeded"} 1' >/dev/null 2>&1; then
  warn "App API metrics report that the latest inventory collector-boundary fetch exhausted its bounded timeout budget and triggered fallback posture."
fi
if printf '%s' "$app_api_metrics" | grep 'platform_app_api_collector_boundary_latest_fetch_posture{model_family="topology",outcome="timeout_budget_exceeded"} 1' >/dev/null 2>&1; then
  warn "App API metrics report that the latest topology collector-boundary fetch exhausted its bounded timeout budget and triggered fallback posture."
fi
if printf '%s' "$app_api_metrics" | grep 'platform_app_api_collector_boundary_latest_fetch_posture{model_family="policy",outcome="timeout_budget_exceeded"} 1' >/dev/null 2>&1; then
  warn "App API metrics report that the latest policy collector-boundary fetch exhausted its bounded timeout budget and triggered fallback posture."
fi
if printf '%s' "$app_api_metrics" | grep -E 'platform_app_api_collector_boundary_latest_fetch_posture\{model_family="(inventory|topology|policy)",outcome="(collector_connection_error|collector_http_error|invalid_response_payload|unknown_error)"\} 1' >/dev/null 2>&1; then
  warn "App API metrics report a non-timeout collector-boundary failure outcome on at least one read path; inspect the latest collector-boundary posture panels before treating fallback as a pure latency-budget issue."
fi

if printf '%s' "$topology_response" | grep -F '"serving_mode":"persisted_fallback"' >/dev/null 2>&1; then
  warn "Topology API is serving a persisted fallback snapshot instead of live collector-backed topology."
fi
if printf '%s' "$topology_response" | grep -F '"serving_mode":"empty_scaffold"' >/dev/null 2>&1; then
  warn "Topology API has no live topology and no persisted fallback snapshot."
fi
if printf '%s' "$topology_response" | grep -F '"sync_status":"degraded"' >/dev/null 2>&1; then
  warn "Topology API reports degraded sync_status."
fi
if printf '%s' "$topology_response" | grep -F '"sync_status":"failed"' >/dev/null 2>&1; then
  warn "Topology API reports failed sync_status."
fi
if printf '%s' "$topology_response" | grep -F '"blocked_reason":"collector_unavailable_and_no_persisted_snapshot"' >/dev/null 2>&1; then
  warn "Topology API is blocked because the collector is unavailable and no persisted topology snapshot exists."
fi
if printf '%s' "$topology_response" | grep -F '"completeness":"partial"' >/dev/null 2>&1; then
  notice "Topology completeness remains partial by design in the current Phase 2 slice."
fi
if printf '%s' "$topology_response" | grep -F '"collection_posture":"degraded"' >/dev/null 2>&1; then
  warn "Topology API reports degraded collection posture, so the current topology slice is live but partially degraded."
fi
if printf '%s' "$topology_response" | grep -F '"collection_posture":"blocked"' >/dev/null 2>&1; then
  warn "Topology API reports blocked collection posture, so current topology trust depends on fallback or blocked evidence rather than a normal live collection window."
fi
if printf '%s' "$topology_response" | grep -F '"inference_posture":"inferred"' >/dev/null 2>&1; then
  notice "Topology API reports inferred topology posture, so current links remain a bounded inferred slice rather than direct adjacency truth."
fi

if printf '%s' "$policies_response" | grep -F '"serving_mode":"persisted_fallback"' >/dev/null 2>&1; then
  warn "Policies API is serving a persisted fallback snapshot instead of live collector-backed policy evidence."
fi
if printf '%s' "$policies_response" | grep -F '"serving_mode":"empty_scaffold"' >/dev/null 2>&1; then
  warn "Policies API has no live policy evidence and no persisted fallback snapshot."
fi
if printf '%s' "$policies_response" | grep -F '"sync_status":"degraded"' >/dev/null 2>&1; then
  warn "Policies API reports degraded sync_status."
fi
if printf '%s' "$policies_response" | grep -F '"sync_status":"failed"' >/dev/null 2>&1; then
  warn "Policies API reports failed sync_status."
fi
if printf '%s' "$policies_response" | grep -F '"blocked_reason":"collector_unavailable_and_no_persisted_snapshot"' >/dev/null 2>&1; then
  warn "Policies API is blocked because the collector is unavailable and no persisted policy snapshot exists."
fi
if printf '%s' "$policies_response" | grep -F '"empty_reason":"no_policies_observed"' >/dev/null 2>&1; then
  notice "Policies API currently reports a live-empty no_policies_observed posture, which remains an honest bounded state for this Nokia-first slice."
fi
if printf '%s' "$policies_response" | grep -F '"detail_mode":"counters_only"' >/dev/null 2>&1; then
  notice "Policies API detail_mode remains counters_only, so current policy truth is still bounded to aggregate counters and per-target footprint evidence."
fi
if printf '%s' "$policies_response" | grep -F '"detail_blocker_reason":"per_policy_details_unavailable"' >/dev/null 2>&1; then
  notice "Policies API target footprints report per_policy_details_unavailable blockers, so per-target detail remains blocked even when aggregate policy presence is real."
fi
if printf '%s' "$policies_response" | grep -F '"posture":"no_policies_observed"' >/dev/null 2>&1; then
  notice "Policies API source-readiness reports no_policies_observed, so the current source-visible policy slice is healthy but live-empty."
fi
if printf '%s' "$policies_response" | grep -F '"posture":"source_detail_unavailable"' >/dev/null 2>&1; then
  notice "Policies API source-readiness reports source_detail_unavailable, so observed policy presence exists but the bounded source slice still cannot derive stable per-policy detail."
fi
if printf '%s' "$policies_response" | grep -F '"posture":"partially_ready"' >/dev/null 2>&1; then
  notice "Policies API source-readiness reports partially_ready, so the current source-visible slice mixes detail-ready targets with live-empty or detail-limited targets."
fi
if printf '%s' "$policies_response" | grep -F '"detail_blocker_reason":"no_policies_observed"' >/dev/null 2>&1; then
  notice "Policies API target footprints report no_policies_observed blockers on at least one target, so some targets remain healthy live-empty rather than detail-ready."
fi
if printf '%s' "$policies_response" | grep -F '"detail_blocker_reason":"partial_detail_coverage"' >/dev/null 2>&1; then
  notice "Policies API target footprints report partial_detail_coverage, so only a subset of observed policy detail is normalized on at least one target."
fi
if printf '%s' "$policies_response" | grep -F '"detail_blocker_reason":"collection_partial"' >/dev/null 2>&1; then
  warn "Policies API target footprints report collection_partial, so at least one target has degraded policy collection and incomplete detail coverage."
fi
if printf '%s' "$policies_response" | grep -F '"detail_blocker_reason":"collection_failed"' >/dev/null 2>&1; then
  warn "Policies API target footprints report collection_failed, so at least one target currently has no live policy detail due to collection failure."
fi
if printf '%s' "$policies_response" | grep -F '"detail_blocker_reason":"policy_capability_unavailable"' >/dev/null 2>&1; then
  notice "Policies API target footprints report policy_capability_unavailable on at least one target, so that target cannot currently contribute bounded policy detail evidence."
fi
if printf '%s' "$policies_response" | grep -F '"detail_blocker_reason":"not_recorded"' >/dev/null 2>&1; then
  warn "Policies API target footprints still include not_recorded blocker posture on at least one target, so per-target blocker visibility is incomplete."
fi

if [ "$warning_count" -gt 0 ]; then
  echo "Core runtime verification passed with $warning_count warning(s). Postgres, Prometheus, Grafana, gNMI collector, app-api, and app-web are ready with their expected startup contracts, the WebUI proxy reaches the backend health path, the read-side API contracts and dashboard-critical metric families are present, and bounded degraded states are called out above for operator review."
else
  echo "Core runtime verification passed. Postgres, Prometheus, Grafana, gNMI collector, app-api, and app-web are ready with their expected startup contracts, the WebUI proxy reaches the backend health path, the read-side API contracts and dashboard-critical metric families are present, and Grafana has the provisioned datasource and dashboards."
fi