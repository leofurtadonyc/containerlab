#!/bin/sh
set -eu
#
# Optional tuning (environment):
#   VERIFY_ATTEMPTS (default 45) × VERIFY_SLEEP_SECONDS (default 1) ≈ max wall time per
#     wait_for_postgres / wait_for_http_ok / wait_for_container_healthy loop when the target stays down.
#   CURL_MAX_TIME (default 25) — per-request total time limit for curl (avoids indefinite hangs on stuck TCP).
#   CURL_CONNECT_TIMEOUT (default 10) — connection phase limit for curl.
#   CURL_PROBE_MAX_TIME (default 12) / CURL_PROBE_CONNECT_TIMEOUT (default 5) — shorter limits used only
#     inside wait_for_http_ok for most URLs so polling does not burn CURL_MAX_TIME on every retry.
#   METRICS_PROBE_MAX_TIME (default 90) / METRICS_PROBE_CONNECT_TIMEOUT (default 8) — used only for URLs
#     ending in /metrics (app-api and gNMI); first Prometheus exposition after cold start can exceed 12s.
#   METRICS_FULL_MAX_TIME (default 90) — full GET body for app-api /metrics (assertions); must align with Prometheus scrape_timeout.
#   CURL_HTTP_MAX_TIME (default 120) — app-api JSON APIs via fetch_compact_json (large payloads + cold start;
#     operator-briefing and similar assemblies can exceed 90s after cold deploy with persisted Postgres).
#   CURL_MAX_TIME_STATIC (default 120) — max time for large app-web /assets/*.js fetches (cold start can exceed CURL_MAX_TIME).
#   STATIC_FETCH_ATTEMPTS (default 5) — retries per JS chunk when a fetch fails or returns empty.

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
VERIFY_SLEEP_SECONDS="${VERIFY_SLEEP_SECONDS:-1}"
CURL_MAX_TIME="${CURL_MAX_TIME:-25}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-10}"
CURL_PROBE_MAX_TIME="${CURL_PROBE_MAX_TIME:-12}"
CURL_PROBE_CONNECT_TIMEOUT="${CURL_PROBE_CONNECT_TIMEOUT:-5}"
METRICS_PROBE_MAX_TIME="${METRICS_PROBE_MAX_TIME:-90}"
METRICS_PROBE_CONNECT_TIMEOUT="${METRICS_PROBE_CONNECT_TIMEOUT:-8}"
METRICS_FULL_MAX_TIME="${METRICS_FULL_MAX_TIME:-90}"
CURL_HTTP_MAX_TIME="${CURL_HTTP_MAX_TIME:-120}"
CURL_MAX_TIME_STATIC="${CURL_MAX_TIME_STATIC:-120}"
STATIC_FETCH_ATTEMPTS="${STATIC_FETCH_ATTEMPTS:-5}"
warning_count=0

# All HTTP checks use bounded curl so a single bad endpoint cannot block the whole script (common when
# app-api is down but the port is half-open, or a proxy wedges).
curl_http() {
  curl -fsS --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME" "$@"
}

# Short timeouts for wait_for_http_ok polling only — avoids ~25s per retry when services are still starting.
curl_http_probe() {
  curl -fsS --connect-timeout "$CURL_PROBE_CONNECT_TIMEOUT" --max-time "$CURL_PROBE_MAX_TIME" "$@"
}

# Probe with explicit connect/max time (used for /metrics — cold scrape can exceed CURL_PROBE_MAX_TIME).
curl_http_probe_max() {
  max_time=$1
  connect_timeout=$2
  shift 2
  curl -fsS --connect-timeout "$connect_timeout" --max-time "$max_time" "$@"
}

# Large Vite bundles after a cold deploy can take longer than CURL_MAX_TIME to deliver first bytes.
curl_http_static() {
  curl -fsS --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME_STATIC" "$@"
}

# Full app-api /metrics body (same path Prometheus scrapes; can exceed CURL_MAX_TIME).
curl_http_metrics_full() {
  curl -fsS --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$METRICS_FULL_MAX_TIME" "$@"
}

# app-api JSON endpoints (large compact responses; cold start can exceed 25s).
curl_http_json() {
  curl -fsS --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_HTTP_MAX_TIME" "$@"
}

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
  curl_http_json "$1" | tr -d '\n\r\t '
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

assert_not_contains() {
  name=$1
  payload=$2
  unexpected=$3

  if printf '%s' "$payload" | grep -F "$unexpected" >/dev/null 2>&1; then
    echo "$name unexpectedly contained: $unexpected" >&2
    exit 1
  fi
}

# comparison_to_latest_persisted.status is shared across devices, topology, and policies (week 21 alignment).
assert_comparison_to_latest_status_allowed() {
  name=$1
  payload=$2

  if printf '%s' "$payload" | grep -F '"comparison_to_latest_persisted":{"status":"unavailable"' >/dev/null 2>&1; then
    return 0
  fi
  if printf '%s' "$payload" | grep -F '"comparison_to_latest_persisted":{"status":"live_vs_latest_persisted_ready"' >/dev/null 2>&1; then
    return 0
  fi
  echo "$name: comparison_to_latest_persisted.status must be unavailable or live_vs_latest_persisted_ready" >&2
  exit 1
}

query_postgres_scalar() {
  sql=$1

  docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "$sql" | tr -d '[:space:]'
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
  probe_max=$CURL_PROBE_MAX_TIME
  conn=$CURL_PROBE_CONNECT_TIMEOUT

  # Prometheus /metrics can block longer than JSON health on first request after deploy.
  case "$url" in
    */metrics)
      probe_max=$METRICS_PROBE_MAX_TIME
      conn=$METRICS_PROBE_CONNECT_TIMEOUT
      ;;
  esac

  while [ "$attempts" -gt 0 ]; do
    if curl_http_probe_max "$probe_max" "$conn" "$url" >/dev/null 2>&1; then
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

# Fetch one app-web /assets/*.js chunk with retries (cold start / same-workspace restart drills).
fetch_app_web_asset_chunk() {
  url=$1
  attempts=$STATIC_FETCH_ATTEMPTS

  while [ "$attempts" -gt 0 ]; do
    chunk=$(curl_http_static "$url" 2>/dev/null) || chunk=""
    if [ -n "$chunk" ]; then
      printf '%s' "$chunk"
      return 0
    fi
    attempts=$((attempts - 1))
    if [ "$attempts" -gt 0 ]; then
      sleep "$VERIFY_SLEEP_SECONDS"
    fi
  done

  echo "app-web: failed to fetch static asset after $STATIC_FETCH_ATTEMPTS attempts: $url" >&2
  curl_http_static "$url" || exit 1
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

# Week 29–30 NOC cockpit / handoff WebUI: shipped /assets/*.js must retain stable composition markers (repository vitest covers UI behavior).
app_web_index_html=$(curl_http_json "$APP_WEB_URL/")
app_web_noc_cockpit_marker=0
app_web_overview_mode_marker=0
app_web_delta_digest_marker=0
app_web_operator_briefing_marker=0
app_web_briefing_bundle_export_marker=0
app_web_evidence_replay_marker=0
app_web_noc_cockpit_strategic_pivots_marker=0
app_web_global_search_week30_marker=0
app_web_global_search_impact_hub_marker=0
app_web_maintenance_preview_marker=0
app_web_maintenance_evidence_workspace_marker=0
app_web_maintenance_window_workspace_marker=0
app_web_impact_report_marker=0
app_web_service_explorer_marker=0
app_web_service_dossier_marker=0
app_web_policy_explainability_marker=0
app_web_path_explorer_marker=0
app_web_service_impact_workspace_marker=0
app_web_change_safety_case_marker=0
app_web_evidence_consistency_marker=0
app_web_stability_workspace_marker=0
for asset_path in $(printf '%s' "$app_web_index_html" | tr ' ' '\n' | tr '"' '\n' | grep -E '^/assets/.*\.js$' || true); do
  app_web_chunk=$(fetch_app_web_asset_chunk "$APP_WEB_URL$asset_path")
  if printf '%s' "$app_web_chunk" | grep -qF 'noc_cockpit_v1'; then
    app_web_noc_cockpit_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'overview_mode'; then
    app_web_overview_mode_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'cross_domain_delta_digest_v1'; then
    app_web_delta_digest_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'operator_briefing_workspace_v1'; then
    app_web_operator_briefing_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'briefing_export_bundle_v1'; then
    app_web_briefing_bundle_export_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'evidence_replay_viewer_v1'; then
    app_web_evidence_replay_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'noc-cockpit-strategic-pivots'; then
    app_web_noc_cockpit_strategic_pivots_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'Evidence replay (frozen file)'; then
    app_web_global_search_week30_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'Impact report hub'; then
    app_web_global_search_impact_hub_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'maintenance_preview_v1'; then
    app_web_maintenance_preview_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'maintenance_evidence_workspace_v1'; then
    app_web_maintenance_evidence_workspace_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'maintenance_window_workspace_v1'; then
    app_web_maintenance_window_workspace_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'impact_report_v1'; then
    app_web_impact_report_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'service_explorer_v1'; then
    app_web_service_explorer_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'service_dossier_v1'; then
    app_web_service_dossier_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'policy_explainability_workspace_v1'; then
    app_web_policy_explainability_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'path_explorer_v1'; then
    app_web_path_explorer_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'service_impact_workspace_v1'; then
    app_web_service_impact_workspace_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'change_safety_case_v1'; then
    app_web_change_safety_case_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'evidence_consistency_summary_v1'; then
    app_web_evidence_consistency_marker=1
  fi
  if printf '%s' "$app_web_chunk" | grep -qF 'operational_stability_summary_v1'; then
    app_web_stability_workspace_marker=1
  fi
done
if [ "$app_web_noc_cockpit_marker" != "1" ] || [ "$app_web_overview_mode_marker" != "1" ] || [ "$app_web_delta_digest_marker" != "1" ] || [ "$app_web_operator_briefing_marker" != "1" ] || [ "$app_web_briefing_bundle_export_marker" != "1" ] || [ "$app_web_evidence_replay_marker" != "1" ] || [ "$app_web_noc_cockpit_strategic_pivots_marker" != "1" ] || [ "$app_web_global_search_week30_marker" != "1" ] || [ "$app_web_global_search_impact_hub_marker" != "1" ] || [ "$app_web_maintenance_preview_marker" != "1" ] || [ "$app_web_maintenance_evidence_workspace_marker" != "1" ] || [ "$app_web_maintenance_window_workspace_marker" != "1" ] || [ "$app_web_impact_report_marker" != "1" ] || [ "$app_web_service_explorer_marker" != "1" ] || [ "$app_web_service_dossier_marker" != "1" ] || [ "$app_web_policy_explainability_marker" != "1" ] || [ "$app_web_path_explorer_marker" != "1" ] || [ "$app_web_service_impact_workspace_marker" != "1" ] || [ "$app_web_change_safety_case_marker" != "1" ] || [ "$app_web_evidence_consistency_marker" != "1" ] || [ "$app_web_stability_workspace_marker" != "1" ]; then
  echo "app-web: expected noc_cockpit_v1, overview_mode, cross_domain_delta_digest_v1, operator_briefing_workspace_v1, briefing_export_bundle_v1, evidence_replay_viewer_v1, noc-cockpit-strategic-pivots, Evidence replay (frozen file), Impact report hub, maintenance_preview_v1, maintenance_evidence_workspace_v1, maintenance_window_workspace_v1, impact_report_v1, service_explorer_v1, service_dossier_v1, policy_explainability_workspace_v1, path_explorer_v1, service_impact_workspace_v1, change_safety_case_v1, evidence_consistency_summary_v1, and operational_stability_summary_v1 substrings in shipped /assets/*.js (NOC cockpit + delta digest + operator briefing + bundle export + evidence replay + cockpit 2.0 pivots + global search week 30 footer + impact hub + maintenance preview + maintenance evidence workspace + maintenance window workspace + impact report + week 31 service/explainability + week 34 path explorer + week 34 service impact workspace + week 32 service dossier + change safety case + week 35 evidence consistency workspace + week 37 stability workspace)" >&2
  exit 1
fi

wait_for_http_ok "Prometheus readiness" "$PROMETHEUS_URL/-/ready"

# Prometheus does not reload bind-mounted prometheus.yml automatically; the process keeps the
# previous config until reload/restart. Without reload, scrape_timeout (e.g. app-api 90s) may stay
# at an old value (e.g. 25s) and the app-api target stays down even though the file on disk is
# correct. Prefer HTTP reload; fall back to SIGHUP when the image predates --web.enable-lifecycle.
if ! curl -fsS -X POST "$PROMETHEUS_URL/-/reload" >/dev/null 2>&1; then
  docker exec "$PROMETHEUS_CONTAINER" /bin/sh -c '
    pid=$(pgrep -f "^/bin/prometheus" 2>/dev/null | head -1)
    [ -n "$pid" ] && kill -HUP "$pid"
  ' 2>/dev/null || true
fi
sleep 3

# After deploy, app-api /metrics may exceed Prometheus's scrape_timeout on the first attempt; the next
# successful scrape marks the target up. Poll until all expected jobs are up (or attempts exhausted).
prometheus_targets=""
attempts=$VERIFY_ATTEMPTS
while [ "$attempts" -gt 0 ]; do
  prometheus_targets=$(curl_http "$PROMETHEUS_URL/api/v1/targets" | tr -d '\n')
  if echo "$prometheus_targets" | grep '"job":"prometheus".*"health":"up"' >/dev/null 2>&1 \
    && echo "$prometheus_targets" | grep '"job":"app-api".*"health":"up"' >/dev/null 2>&1 \
    && echo "$prometheus_targets" | grep '"job":"gnmi-collector".*"health":"up"' >/dev/null 2>&1 \
    && ! echo "$prometheus_targets" | grep '"health":"down"' >/dev/null 2>&1; then
    break
  fi
  attempts=$((attempts - 1))
  if [ "$attempts" -gt 0 ]; then
    sleep "$VERIFY_SLEEP_SECONDS"
  fi
done

if [ "$attempts" -eq 0 ]; then
  echo "Prometheus still reports at least one active scrape target as down (app-api /metrics may need a successful scrape after cold start; see prometheus.yml scrape_timeout)." >&2
  printf '%s\n' "$prometheus_targets" >&2
  exit 1
fi

wait_for_http_ok "Grafana health" "$GRAFANA_URL/api/health"

grafana_datasources=$(curl_http -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/datasources")
echo "$grafana_datasources" | grep '"uid":"prometheus"' >/dev/null

grafana_dashboards=$(curl_http -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/search?query=overview")
echo "$grafana_dashboards" | grep 'platform-overview' >/dev/null
echo "$grafana_dashboards" | grep 'topology-overview' >/dev/null
echo "$grafana_dashboards" | grep 'sr-policy-overview' >/dev/null
echo "$grafana_dashboards" | grep 'vendor-overview' >/dev/null
echo "$grafana_dashboards" | grep 'change-validation-overview' >/dev/null
grafana_uid_lines=$(echo "$grafana_dashboards" | grep -o '"uid":"[^"]*"' || true)
grafana_uid_count=$(printf '%s\n' "$grafana_uid_lines" | grep -cve '^$' || true)
grafana_uid_unique=$(printf '%s\n' "$grafana_uid_lines" | sort -u | grep -cve '^$' || true)
if [ "$grafana_uid_count" != "$grafana_uid_unique" ]; then
  echo "Grafana /api/search?query=overview returned duplicate dashboard uid entries (count=$grafana_uid_count unique=$grafana_uid_unique). Clear stale Grafana state or remove forked dashboards; see dashboards.md." >&2
  printf '%s\n' "$grafana_dashboards" >&2
  exit 1
fi

platform_status_response=$(fetch_compact_json "$APP_API_URL/api/v1/platform/status")
devices_response=$(fetch_compact_json "$APP_API_URL/api/v1/devices")
topology_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology")
policies_response=$(fetch_compact_json "$APP_API_URL/api/v1/policies")
capabilities_response=$(fetch_compact_json "$APP_API_URL/api/v1/capabilities")
workflow_history_response=$(fetch_compact_json "$APP_API_URL/api/v1/workflow-history")
audit_history_response=$(fetch_compact_json "$APP_API_URL/api/v1/audit-history")
change_intelligence_response=$(fetch_compact_json "$APP_API_URL/api/v1/change-intelligence/recent-summary")
investigation_workspace_response=$(fetch_compact_json "$APP_API_URL/api/v1/investigation-workspace/context")
app_api_metrics=$(curl_http_metrics_full "$APP_API_URL/metrics")
collector_metrics=$(curl_http "$GNMI_COLLECTOR_URL/metrics")

sync_runs_count=$(query_postgres_scalar "SELECT count(*) FROM platform_app.sync_runs;")
inventory_snapshots_count=$(query_postgres_scalar "SELECT count(*) FROM platform_app.inventory_snapshots;")
topology_snapshots_count=$(query_postgres_scalar "SELECT count(*) FROM platform_app.topology_snapshots;")
policy_snapshots_count=$(query_postgres_scalar "SELECT count(*) FROM platform_app.policy_snapshots;")
readiness_snapshots_count=$(query_postgres_scalar "SELECT count(*) FROM platform_app.readiness_snapshots;")
persisted_artifact_count=$((sync_runs_count + inventory_snapshots_count + topology_snapshots_count + policy_snapshots_count + readiness_snapshots_count))

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
assert_contains "platform status response" "$platform_status_response" '"recovery":{'
assert_contains "platform status response" "$platform_status_response" '"baseline_posture":"'
assert_contains "platform status response" "$platform_status_response" '"read_side_posture":"'
assert_contains "platform status response" "$platform_status_response" '"persisted_artifacts":{'
assert_contains "platform status response" "$platform_status_response" '"inventory_snapshot":'
assert_contains "platform status response" "$platform_status_response" '"topology_snapshot":'
assert_contains "platform status response" "$platform_status_response" '"policy_snapshot":'
assert_contains "platform status response" "$platform_status_response" '"sync_history":'
assert_contains "platform status response" "$platform_status_response" '"readiness_snapshot":'
assert_contains "platform status response" "$platform_status_response" '"node_participation_posture":"'
assert_contains "platform status response" "$platform_status_response" '"paired_link_count":'
assert_contains "platform status response" "$platform_status_response" '"single_sided_link_count":'
assert_contains "platform status response" "$platform_status_response" '"linked_node_count":'
assert_contains "platform status response" "$platform_status_response" '"isolated_node_count":'
assert_contains "platform status response" "$platform_status_response" '"policy_capable_target_count":'
assert_contains "platform status response" "$platform_status_response" '"detail_ready_target_count":'
assert_contains "platform status response (API metadata)" "$platform_status_response" '"service":"app-api"'
assert_contains "platform status response (API metadata)" "$platform_status_response" '"phase":"phase_2_read_only_foundation"'

assert_contains "devices response" "$devices_response" '"data_status":"'
assert_contains "devices response" "$devices_response" '"serving_mode":"'
assert_contains "devices response" "$devices_response" '"evidence_confidence":{'
assert_contains "devices response" "$devices_response" '"comparison_to_latest_persisted":{'
assert_contains "devices response" "$devices_response" '"count":'
assert_contains "devices response" "$devices_response" '"history":{'
assert_contains "devices response (read_side query ergonomics)" "$devices_response" '"read_side_query":{'
assert_contains "devices response (read_side query ergonomics)" "$devices_response" '"items_total":'
assert_contains "devices response (read_side query ergonomics)" "$devices_response" '"items_returned":'
assert_contains "devices response (read_side query ergonomics)" "$devices_response" '"history_recent_limit_effective":'
assert_contains "devices response (read_side query ergonomics)" "$devices_response" '"history_recent_snapshots_returned":'

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
assert_contains "policies response (read_side query ergonomics)" "$policies_response" '"read_side_query":{'
assert_contains "policies response (read_side query ergonomics)" "$policies_response" '"items_total":'
assert_contains "policies response (read_side query ergonomics)" "$policies_response" '"items_returned":'
assert_contains "policies response (read_side query ergonomics)" "$policies_response" '"history_recent_limit_effective":'
assert_contains "policies response (read_side query ergonomics)" "$policies_response" '"history_recent_snapshots_returned":'
assert_contains "policies response (degraded_policy_v1)" "$policies_response" '"degraded_policy_v1"'

# Week 31: Service Explorer v1 (grouped policy inventory lens; structural contract check).
services_response=$(fetch_compact_json "$APP_API_URL/api/v1/services")
assert_contains "services response (service_explorer_v1)" "$services_response" '"contract_id":"service_explorer_v1"'
assert_contains "services response (policy_inventory)" "$services_response" '"policy_inventory":{'
assert_contains "services response (read_side_query)" "$services_response" '"read_side_query":{'

# Week 28: topology risk summary (structural contract sampling; no python3 required).
topology_risk_summary_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology/risk-summary")
assert_contains "topology risk summary response (contract id)" "$topology_risk_summary_response" '"contract_id":"topology_risk_summary_v1"'
assert_contains "topology risk summary response (ranked_objects)" "$topology_risk_summary_response" '"ranked_objects":['

# Week 29: global operator search (bounded inventory field search; structural contract check).
operator_search_response=$(fetch_compact_json "$APP_API_URL/api/v1/operator-search?q=__verify_runtime__")
assert_contains "operator search response (contract id)" "$operator_search_response" '"contract_id":"operator_search_pivot_v1"'
assert_contains "operator search response (result_state)" "$operator_search_response" '"result_state":"'
assert_contains "operator search response (groups array)" "$operator_search_response" '"groups":'

# Week 27–28: path-analysis, topology-related-policies, failure-impact, policy evidence timeline+delta
# (uses python3 when available to sample first policy id, first topology node id, and first Service Explorer service_id).
if command -v python3 >/dev/null 2>&1; then
  first_policy_id=$(printf '%s' "$policies_response" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('items') or []; print(items[0]['policy_id'] if items else '')")
  first_node_id=$(printf '%s' "$topology_response" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('topology'); nodes=t.get('nodes') if t else None; print(nodes[0]['node_id'] if nodes else '')")
  first_service_id=$(printf '%s' "$services_response" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('items') or []; print(items[0]['service_id'] if items else '')")
else
  notice "python3 not found; skipping week 27–28 path-analysis, related-policies, failure-impact, policy evidence timeline/delta structural sampling, week 32 service dossier GET sampling, week 33 change safety case report GET sampling, and week 37 topology/service stability-profile GET sampling in verify-core-runtime.sh."
  first_policy_id=""
  first_node_id=""
  first_service_id=""
fi

# Week 32 / week 33: Service Dossier v1 + Change Safety Case /service report (structural GET; uses first service_id from GET /api/v1/services when python3 + items exist).
if [ -n "$first_service_id" ]; then
  enc_service_id=$(printf '%s' "$first_service_id" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip(), safe=''))")
  service_dossier_response=$(fetch_compact_json "$APP_API_URL/api/v1/services/${enc_service_id}/dossier")
  assert_contains "service dossier response (contract id)" "$service_dossier_response" '"contract_id":"service_dossier_v1"'
  assert_contains "service dossier response (service_explorer_detail)" "$service_dossier_response" '"service_explorer_detail":{'
  assert_contains "service dossier response (merged_caveats)" "$service_dossier_response" '"merged_caveats":'
  assert_contains "service dossier response (source_contract_ids)" "$service_dossier_response" '"source_contract_ids":'
  service_evidence_timeline_response=$(fetch_compact_json "$APP_API_URL/api/v1/services/${enc_service_id}/evidence-timeline")
  assert_contains "service evidence timeline response (contract id)" "$service_evidence_timeline_response" '"contract_id":"service_evidence_timeline_v1"'
  assert_contains "service evidence timeline response (service_id echo)" "$service_evidence_timeline_response" '"service_id":"'
  service_evidence_delta_response=$(fetch_compact_json "$APP_API_URL/api/v1/services/${enc_service_id}/evidence-delta")
  assert_contains "service evidence delta response (contract id)" "$service_evidence_delta_response" '"contract_id":"service_evidence_delta_v1"'
  assert_contains "service evidence delta response (service_id echo)" "$service_evidence_delta_response" '"service_id":"'
  service_stability_profile_response=$(fetch_compact_json "$APP_API_URL/api/v1/services/${enc_service_id}/stability-profile")
  assert_contains "service stability profile response (contract id)" "$service_stability_profile_response" '"contract_id":"service_stability_profile_v1"'
  assert_contains "service stability profile response (service_id echo)" "$service_stability_profile_response" '"service_id":"'
  assert_contains "service stability profile response (primary_stability_posture)" "$service_stability_profile_response" '"primary_stability_posture":"'
  service_change_safety_case_response=$(fetch_compact_json "$APP_API_URL/api/v1/reports/change-safety-case/service?service_id=${enc_service_id}&format=json")
  assert_contains "service change safety case response (contract id)" "$service_change_safety_case_response" '"contract_id":"change_safety_case_v1"'
  assert_contains "service change safety case response (safety_case_context)" "$service_change_safety_case_response" '"safety_case_context":"service_change_safety"'
else
  if command -v python3 >/dev/null 2>&1; then
    notice "Services Explorer items list empty; skipping service dossier, service stability-profile GET, and service change safety case structural checks."
  fi
fi

if [ -n "$first_policy_id" ]; then
  path_analysis_response=$(fetch_compact_json "$APP_API_URL/api/v1/policies/${first_policy_id}/path-analysis")
  assert_contains "path analysis response (contract id)" "$path_analysis_response" '"contract_id":"path_analysis_phase2_v1"'
  assert_contains "path analysis response (subject anchor)" "$path_analysis_response" '"anchor_kind":"policy"'
  assert_contains "path analysis response (truth_alignment)" "$path_analysis_response" '"truth_alignment":{'
  assert_contains "policies response (degraded_policy_v1 contract_id in items)" "$policies_response" '"contract_id":"degraded_policy_v1"'
  policy_evidence_timeline_response=$(fetch_compact_json "$APP_API_URL/api/v1/policies/${first_policy_id}/evidence-timeline")
  assert_contains "policy evidence timeline response (contract id)" "$policy_evidence_timeline_response" '"contract_id":"policy_evidence_timeline_v1"'
  policy_evidence_delta_response=$(fetch_compact_json "$APP_API_URL/api/v1/policies/${first_policy_id}/evidence-delta")
  assert_contains "policy evidence delta response (contract id)" "$policy_evidence_delta_response" '"contract_id":"policy_evidence_delta_v1"'
  assert_contains "policy evidence delta response (comparison_status)" "$policy_evidence_delta_response" '"comparison_status":"'
  policy_dossier_response=$(fetch_compact_json "$APP_API_URL/api/v1/policies/${first_policy_id}/dossier")
  assert_contains "policy dossier response (contract id)" "$policy_dossier_response" '"contract_id":"policy_dossier_v1"'
  assert_contains "policy dossier response (nested path_analysis)" "$policy_dossier_response" '"path_analysis":{'
  assert_contains "policy dossier response (nested evidence_delta)" "$policy_dossier_response" '"evidence_delta":{'
  assert_contains "policy dossier response (merged_caveats)" "$policy_dossier_response" '"merged_caveats":'
  policy_explainability_response=$(fetch_compact_json "$APP_API_URL/api/v1/policies/${first_policy_id}/explainability")
  assert_contains "policy explainability response (contract id)" "$policy_explainability_response" '"contract_id":"policy_explainability_workspace_v1"'
  assert_contains "policy explainability response (nested path_analysis)" "$policy_explainability_response" '"path_analysis":{'
  assert_contains "policy explainability response (candidate_path_rollups)" "$policy_explainability_response" '"candidate_path_rollups":'
  assert_contains "policy explainability response (merged_caveats)" "$policy_explainability_response" '"merged_caveats":'
  assert_contains "policy explainability response (unknown_candidate_posture)" "$policy_explainability_response" '"unknown_candidate_posture"'
  policy_export_response=$(fetch_compact_json "$APP_API_URL/api/v1/exports/policies/${first_policy_id}/dossier?format=json")
  assert_contains "policy evidence export response (envelope contract id)" "$policy_export_response" '"contract_id":"evidence_export_v1"'
  assert_contains "policy evidence export response (export_kind)" "$policy_export_response" '"export_kind":"policy_dossier"'
  assert_contains "policy evidence export response (nested policy dossier)" "$policy_export_response" '"contract_id":"policy_dossier_v1"'
  assert_contains "policy evidence export response (source_contract_ids)" "$policy_export_response" '"source_contract_ids":'
  enc_policy_q=$(printf '%s' "$first_policy_id" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip(), safe=''))")
  policy_impact_report_response=$(fetch_compact_json "$APP_API_URL/api/v1/reports/policy-impact?policy_id=${enc_policy_q}&format=json")
  assert_contains "policy impact report response (contract id)" "$policy_impact_report_response" '"contract_id":"impact_report_v1"'
  assert_contains "policy impact report response (report_context)" "$policy_impact_report_response" '"report_context":"policy_impact"'
  policy_change_safety_case_response=$(fetch_compact_json "$APP_API_URL/api/v1/reports/change-safety-case/policy?policy_id=${enc_policy_q}&format=json")
  assert_contains "policy change safety case response (contract id)" "$policy_change_safety_case_response" '"contract_id":"change_safety_case_v1"'
  assert_contains "policy change safety case response (safety_case_context)" "$policy_change_safety_case_response" '"safety_case_context":"policy_change_safety"'
else
  notice "Policies items list empty; skipping path-analysis, degraded_policy_v1 contract_id, policy evidence timeline, policy evidence delta, policy dossier, policy explainability, policy impact report, and policy change safety case structural checks."
fi

if [ -n "$first_node_id" ]; then
  related_policies_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology/objects/${first_node_id}/related-policies")
  assert_contains "topology related policies response (object_kind)" "$related_policies_response" '"object_kind":"node"'
  assert_contains "topology related policies response (object_id)" "$related_policies_response" "\"object_id\":\"${first_node_id}\""
  assert_contains "topology related policies response (derivation_summary)" "$related_policies_response" '"derivation_summary":"'
  assert_contains "topology related policies response (items array)" "$related_policies_response" '"items":'
  failure_impact_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology/objects/${first_node_id}/failure-impact")
  assert_contains "failure impact response (contract id)" "$failure_impact_response" '"contract_id":"failure_impact_v1"'
  assert_contains "failure impact response (subject)" "$failure_impact_response" '"subject":{'
  topology_object_dossier_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology/objects/${first_node_id}/dossier")
  assert_contains "topology object dossier response (contract id)" "$topology_object_dossier_response" '"contract_id":"topology_object_dossier_v1"'
  assert_contains "topology object dossier response (nested failure_impact)" "$topology_object_dossier_response" '"failure_impact":{'
  assert_contains "topology object dossier response (risk_attention)" "$topology_object_dossier_response" '"risk_attention":{'
  topology_object_evidence_timeline_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology/objects/${first_node_id}/evidence-timeline")
  assert_contains "topology object evidence timeline response (contract id)" "$topology_object_evidence_timeline_response" '"contract_id":"topology_object_evidence_timeline_v1"'
  assert_contains "topology object evidence timeline response (object_id echo)" "$topology_object_evidence_timeline_response" "\"object_id\":\"${first_node_id}\""
  topology_object_evidence_delta_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology/objects/${first_node_id}/evidence-delta")
  assert_contains "topology object evidence delta response (contract id)" "$topology_object_evidence_delta_response" '"contract_id":"topology_object_evidence_delta_v1"'
  assert_contains "topology object evidence delta response (object_id echo)" "$topology_object_evidence_delta_response" "\"object_id\":\"${first_node_id}\""
  topology_object_stability_profile_response=$(fetch_compact_json "$APP_API_URL/api/v1/topology/objects/${first_node_id}/stability-profile")
  assert_contains "topology object stability profile response (contract id)" "$topology_object_stability_profile_response" '"contract_id":"topology_object_stability_profile_v1"'
  assert_contains "topology object stability profile response (object_id echo)" "$topology_object_stability_profile_response" "\"object_id\":\"${first_node_id}\""
  assert_contains "topology object stability profile response (primary_stability_posture)" "$topology_object_stability_profile_response" '"primary_stability_posture":"'
  topology_export_response=$(fetch_compact_json "$APP_API_URL/api/v1/exports/topology-objects/${first_node_id}/dossier?format=json")
  assert_contains "topology evidence export response (envelope contract id)" "$topology_export_response" '"contract_id":"evidence_export_v1"'
  assert_contains "topology evidence export response (export_kind)" "$topology_export_response" '"export_kind":"topology_object_dossier"'
  assert_contains "topology evidence export response (nested topology dossier)" "$topology_export_response" '"contract_id":"topology_object_dossier_v1"'
  enc_node_q=$(printf '%s' "$first_node_id" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip(), safe=''))")
  maintenance_preview_response=$(fetch_compact_json "$APP_API_URL/api/v1/maintenance-preview?node_id=${enc_node_q}&preview_context=topology_drilldown")
  assert_contains "maintenance preview response (contract id)" "$maintenance_preview_response" '"contract_id":"maintenance_preview_v1"'
  assert_contains "maintenance preview response (preview_context)" "$maintenance_preview_response" '"preview_context":"topology_drilldown"'
  maintenance_evidence_workspace_response=$(fetch_compact_json "$APP_API_URL/api/v1/maintenance-evidence-workspace?node_id=${enc_node_q}&preview_context=topology_drilldown")
  assert_contains "maintenance evidence workspace response (contract id)" "$maintenance_evidence_workspace_response" '"contract_id":"maintenance_evidence_workspace_v1"'
  assert_contains "maintenance evidence workspace response (nested maintenance_preview)" "$maintenance_evidence_workspace_response" '"contract_id":"maintenance_preview_v1"'
  assert_contains "maintenance evidence workspace response (topology_change_safety)" "$maintenance_evidence_workspace_response" '"safety_case_context":"topology_change_safety"'
  maintenance_impact_report_response=$(fetch_compact_json "$APP_API_URL/api/v1/reports/maintenance-impact?node_id=${enc_node_q}&format=json")
  assert_contains "maintenance impact report response (contract id)" "$maintenance_impact_report_response" '"contract_id":"impact_report_v1"'
  assert_contains "maintenance impact report response (report_context)" "$maintenance_impact_report_response" '"report_context":"maintenance_impact"'
  topology_change_safety_case_response=$(fetch_compact_json "$APP_API_URL/api/v1/reports/change-safety-case/maintenance?node_id=${enc_node_q}&format=json")
  assert_contains "topology change safety case response (contract id)" "$topology_change_safety_case_response" '"contract_id":"change_safety_case_v1"'
  assert_contains "topology change safety case response (safety_case_context)" "$topology_change_safety_case_response" '"safety_case_context":"topology_change_safety"'
else
  notice "Topology nodes list empty; skipping topology-related-policies, failure-impact, topology-object-dossier, topology-object evidence timeline/delta, topology-object stability-profile GET, maintenance-preview assembly, maintenance-evidence-workspace assembly, maintenance-impact report, and topology change safety case structural checks."
fi

# Cross-slice list/history metadata and evidence shape (contract posture, not business truth).
assert_contains "devices response (API metadata)" "$devices_response" '"service":"app-api"'
assert_contains "devices response (API metadata)" "$devices_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "topology response (API metadata)" "$topology_response" '"service":"app-api"'
assert_contains "topology response (API metadata)" "$topology_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "policies response (API metadata)" "$policies_response" '"service":"app-api"'
assert_contains "policies response (API metadata)" "$policies_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "workflow history response (API metadata)" "$workflow_history_response" '"service":"app-api"'
assert_contains "workflow history response (API metadata)" "$workflow_history_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "audit history response (API metadata)" "$audit_history_response" '"service":"app-api"'
assert_contains "audit history response (API metadata)" "$audit_history_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "capabilities response (API metadata)" "$capabilities_response" '"service":"app-api"'
assert_contains "capabilities response (API metadata)" "$capabilities_response" '"phase":"phase_2_read_only_foundation"'

assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"source_posture":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"evidence_kind":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"confidence_posture":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"freshness_posture":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"blocked_reason":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"source_posture":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"evidence_kind":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"confidence_posture":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"freshness_posture":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"blocked_reason":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"source_posture":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"evidence_kind":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"confidence_posture":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"freshness_posture":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"blocked_reason":"'

assert_not_contains "devices response (legacy policy-only comparison status)" "$devices_response" '"current_vs_latest_persisted_ready"'
assert_not_contains "topology response (legacy policy-only comparison status)" "$topology_response" '"current_vs_latest_persisted_ready"'
assert_not_contains "policies response (legacy policy-only comparison status)" "$policies_response" '"current_vs_latest_persisted_ready"'
assert_comparison_to_latest_status_allowed "devices response" "$devices_response"
assert_comparison_to_latest_status_allowed "topology response" "$topology_response"
assert_comparison_to_latest_status_allowed "policies response" "$policies_response"

# Cross-slice list/history metadata and evidence shape (contract posture, not business truth).
assert_contains "devices response (API metadata)" "$devices_response" '"service":"app-api"'
assert_contains "devices response (API metadata)" "$devices_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "topology response (API metadata)" "$topology_response" '"service":"app-api"'
assert_contains "topology response (API metadata)" "$topology_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "policies response (API metadata)" "$policies_response" '"service":"app-api"'
assert_contains "policies response (API metadata)" "$policies_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "workflow history response (API metadata)" "$workflow_history_response" '"service":"app-api"'
assert_contains "workflow history response (API metadata)" "$workflow_history_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "audit history response (API metadata)" "$audit_history_response" '"service":"app-api"'
assert_contains "audit history response (API metadata)" "$audit_history_response" '"phase":"phase_2_read_only_foundation"'
assert_contains "capabilities response (API metadata)" "$capabilities_response" '"service":"app-api"'
assert_contains "capabilities response (API metadata)" "$capabilities_response" '"phase":"phase_2_read_only_foundation"'

assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"source_posture":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"evidence_kind":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"confidence_posture":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"freshness_posture":"'
assert_contains "devices response (evidence_confidence fields)" "$devices_response" '"blocked_reason":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"source_posture":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"evidence_kind":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"confidence_posture":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"freshness_posture":"'
assert_contains "topology response (evidence_confidence fields)" "$topology_response" '"blocked_reason":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"source_posture":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"evidence_kind":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"confidence_posture":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"freshness_posture":"'
assert_contains "policies response (evidence_confidence fields)" "$policies_response" '"blocked_reason":"'

assert_not_contains "devices response (legacy policy-only comparison status)" "$devices_response" '"current_vs_latest_persisted_ready"'
assert_not_contains "topology response (legacy policy-only comparison status)" "$topology_response" '"current_vs_latest_persisted_ready"'
assert_not_contains "policies response (legacy policy-only comparison status)" "$policies_response" '"current_vs_latest_persisted_ready"'
assert_comparison_to_latest_status_allowed "devices response" "$devices_response"
assert_comparison_to_latest_status_allowed "topology response" "$topology_response"
assert_comparison_to_latest_status_allowed "policies response" "$policies_response"

assert_contains "capabilities response" "$capabilities_response" '"data_status":"bounded_matrix"'
assert_contains "capabilities response" "$capabilities_response" '"dry_run_readiness":{'
assert_contains "capabilities response" "$capabilities_response" '"planning_readiness":"readiness_planning_supported"'
assert_contains "capabilities response" "$capabilities_response" '"phase_recommendation":"remain_phase_2_read_only_foundation"'
assert_contains "capabilities response" "$capabilities_response" '"delivery_tier_counts":{'
assert_contains "capabilities response" "$capabilities_response" '"future_roadmap":'
assert_contains "capabilities response" "$capabilities_response" '"vendor_posture_counts":{'
assert_contains "capabilities response" "$capabilities_response" '"future_juniper_target":'
# Week 23 decision-support: capability rows link to readiness blockers; dry_run blockers link to prerequisites.
assert_contains "capabilities response (related_readiness_blockers)" "$capabilities_response" '"related_readiness_blockers":'
assert_contains "capabilities response (blocker related_prerequisites)" "$capabilities_response" '"related_prerequisites":['

assert_contains "workflow history response" "$workflow_history_response" '"data_status":"'
assert_contains "workflow history response" "$workflow_history_response" '"count":'
assert_contains "workflow history response" "$workflow_history_response" '"items":['

assert_contains "audit history response" "$audit_history_response" '"data_status":"'
assert_contains "audit history response" "$audit_history_response" '"count":'
assert_contains "audit history response" "$audit_history_response" '"items":['

assert_contains "workflow history response" "$workflow_history_response" '"read_side_query":{'
assert_contains "workflow history response" "$workflow_history_response" '"sync_runs_limit_effective":'
assert_contains "audit history response" "$audit_history_response" '"read_side_query":{'
assert_contains "audit history response" "$audit_history_response" '"readiness_snapshot_history_limit_effective":'

# Optional bounded query strings: structural echo-only check (week 22 query ergonomics contract).
workflow_history_bounded_query=$(fetch_compact_json "$APP_API_URL/api/v1/workflow-history?limit=1&sync_runs_limit=3")
audit_history_bounded_query=$(fetch_compact_json "$APP_API_URL/api/v1/audit-history?limit=2&sync_runs_limit=3&readiness_snapshot_history_limit=5")
assert_contains "workflow history bounded query (read_side echo)" "$workflow_history_bounded_query" '"limit_requested":1'
assert_contains "workflow history bounded query (read_side echo)" "$workflow_history_bounded_query" '"sync_runs_limit_requested":3'
assert_contains "audit history bounded query (read_side echo)" "$audit_history_bounded_query" '"limit_requested":2'
assert_contains "audit history bounded query (read_side echo)" "$audit_history_bounded_query" '"sync_runs_limit_requested":3'
assert_contains "audit history bounded query (read_side echo)" "$audit_history_bounded_query" '"readiness_snapshot_history_limit_requested":5'

# Week 24 change-intelligence: structural presence of bounded cross-domain summary (not business scoring).
assert_contains "change intelligence response" "$change_intelligence_response" '"contract_id":"change_intelligence_phase2_v1"'
assert_contains "change intelligence response" "$change_intelligence_response" '"window_semantics":"backend_defined_bounded_lookback"'
assert_contains "change intelligence response" "$change_intelligence_response" '"authority_posture":"evidence_aggregated_non_authoritative"'
assert_contains "change intelligence response" "$change_intelligence_response" '"domain":"devices"'
assert_contains "change intelligence response" "$change_intelligence_response" '"domain":"workflow_history"'
assert_contains "change intelligence response" "$change_intelligence_response" '"domain":"audit_history"'
assert_contains "change intelligence response" "$change_intelligence_response" '"completeness_posture":"bounded_partial"'
change_intelligence_bounded_query=$(fetch_compact_json "$APP_API_URL/api/v1/change-intelligence/recent-summary?sync_runs_limit=10")
assert_contains "change intelligence bounded query (sync_runs_limit echo)" "$change_intelligence_bounded_query" '"sync_runs_limit_applied":10'

# Week 25 investigation workspace: structural assembly (nested contracts; not scoring).
assert_contains "investigation workspace response" "$investigation_workspace_response" '"contract_id":"investigation_workspace_phase2_v1"'
assert_contains "investigation workspace response" "$investigation_workspace_response" '"authority_posture":"interpretation_support_only"'
assert_contains "investigation workspace response" "$investigation_workspace_response" '"assembly_notes":['
assert_contains "investigation workspace response" "$investigation_workspace_response" '"recent_change":{'
assert_contains "investigation workspace response" "$investigation_workspace_response" '"contract_id":"change_intelligence_phase2_v1"'
assert_contains "investigation workspace response" "$investigation_workspace_response" '"platform_status":{'
assert_contains "investigation workspace response" "$investigation_workspace_response" '"capabilities":{'
assert_contains "investigation workspace response" "$investigation_workspace_response" '"next_inspection_framing":"'
assert_contains "investigation workspace response" "$investigation_workspace_response" '"next_inspection_suggestions":[{'
assert_contains "investigation workspace response (next_inspection suggestion shape)" "$investigation_workspace_response" '"suggestion_id":"'
assert_contains "investigation workspace response (next_inspection suggestion shape)" "$investigation_workspace_response" '"context_domain":"'
assert_contains "investigation workspace response (next_inspection suggestion shape)" "$investigation_workspace_response" '"framing_rule":"'
investigation_workspace_bounded_query=$(fetch_compact_json "$APP_API_URL/api/v1/investigation-workspace/context?sync_runs_limit=10")
assert_contains "investigation workspace bounded query (sync_runs echo)" "$investigation_workspace_bounded_query" '"sync_runs_limit_applied":10'
assert_contains "investigation workspace bounded query (next_inspection present)" "$investigation_workspace_bounded_query" '"next_inspection_suggestions":[{'

# Week 26 evidence-pack / situation room: structural assembly (nested contracts; interpretation-only).
evidence_pack_situation_response=$(fetch_compact_json "$APP_API_URL/api/v1/evidence-pack/situation")
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"contract_id":"evidence_pack_phase2_v1"'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"authority_posture":"interpretation_support_only"'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"situation_pack_guidance_framing":"'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"situation_review_guidance":{'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"review_framing":"'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"explicit_missing_evidence_notes":['
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"review_navigation_prompts":['
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"investigation_context":{'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"contract_id":"investigation_workspace_phase2_v1"'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"devices":{'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"workflow_history":{'
assert_contains "evidence pack situation response" "$evidence_pack_situation_response" '"audit_history":{'
evidence_pack_situation_bounded=$(fetch_compact_json "$APP_API_URL/api/v1/evidence-pack/situation?sync_runs_limit=10")
assert_contains "evidence pack bounded query (nested change window)" "$evidence_pack_situation_bounded" '"sync_runs_limit_applied":10'
assert_contains "evidence pack bounded query (situation_review_guidance present)" "$evidence_pack_situation_bounded" '"situation_review_guidance":{'

# Week 29 evidence export v1 (serialization envelope over existing assemblies; structural only).
export_situation_summary=$(fetch_compact_json "$APP_API_URL/api/v1/exports/situation-room/summary")
assert_contains "evidence export situation summary (envelope contract id)" "$export_situation_summary" '"contract_id":"evidence_export_v1"'
assert_contains "evidence export situation summary (export_kind)" "$export_situation_summary" '"export_kind":"situation_room"'
assert_contains "evidence export situation summary (explicit_non_claims)" "$export_situation_summary" '"explicit_non_claims":'
assert_contains "evidence export situation summary (nested evidence pack)" "$export_situation_summary" '"contract_id":"evidence_pack_phase2_v1"'
export_investigation_summary=$(fetch_compact_json "$APP_API_URL/api/v1/exports/investigation-workspace/summary")
assert_contains "evidence export investigation summary (envelope contract id)" "$export_investigation_summary" '"contract_id":"evidence_export_v1"'
assert_contains "evidence export investigation summary (export_kind)" "$export_investigation_summary" '"export_kind":"investigation_workspace"'
assert_contains "evidence export investigation summary (nested investigation assembly)" "$export_investigation_summary" '"contract_id":"investigation_workspace_phase2_v1"'
export_investigation_bounded=$(fetch_compact_json "$APP_API_URL/api/v1/exports/investigation-workspace/summary?sync_runs_limit=10")
assert_contains "evidence export investigation bounded query (subject_ref sync_runs_limit)" "$export_investigation_bounded" '"sync_runs_limit":10'

export_operator_briefing_bundle=$(fetch_compact_json "$APP_API_URL/api/v1/exports/operator-briefing?sync_runs_limit=10")
assert_contains "briefing export bundle (contract id)" "$export_operator_briefing_bundle" '"contract_id":"briefing_export_bundle_v1"'
assert_contains "briefing export bundle (bundle_members)" "$export_operator_briefing_bundle" '"bundle_members":'
assert_contains "briefing export bundle (briefing_subject)" "$export_operator_briefing_bundle" '"briefing_subject":'

# Week 30: cross-domain delta digest + operator briefing read APIs (structural contract sampling; repository pytest covers semantics).
delta_digest_runtime_response=$(fetch_compact_json "$APP_API_URL/api/v1/delta-digest?sync_runs_limit=10")
assert_contains "delta digest response (contract id)" "$delta_digest_runtime_response" '"contract_id":"cross_domain_delta_digest_v1"'
assert_contains "delta digest response (sections)" "$delta_digest_runtime_response" '"sections":['

evidence_consistency_runtime_response=$(fetch_compact_json "$APP_API_URL/api/v1/evidence-consistency/summary?sync_runs_limit=10")
assert_contains "evidence consistency summary (contract id)" "$evidence_consistency_runtime_response" '"contract_id":"evidence_consistency_summary_v1"'
assert_contains "evidence consistency summary (items array)" "$evidence_consistency_runtime_response" '"items":['
assert_contains "evidence consistency summary (sync_runs_limit_applied echo)" "$evidence_consistency_runtime_response" '"sync_runs_limit_applied":10'
assert_contains "evidence consistency summary (safety_framing)" "$evidence_consistency_runtime_response" '"safety_framing":{'

operational_stability_runtime_response=$(fetch_compact_json "$APP_API_URL/api/v1/stability/summary?sync_runs_limit=10")
assert_contains "operational stability summary (contract id)" "$operational_stability_runtime_response" '"contract_id":"operational_stability_summary_v1"'
assert_contains "operational stability summary (rows array)" "$operational_stability_runtime_response" '"rows":['
assert_contains "operational stability summary (sync_runs_limit_applied echo)" "$operational_stability_runtime_response" '"sync_runs_limit_applied":10'
assert_contains "operational stability summary (operational_stability_posture)" "$operational_stability_runtime_response" '"operational_stability_posture":"'
assert_contains "operational stability summary (safety_framing)" "$operational_stability_runtime_response" '"safety_framing":{'

operator_briefing_runtime_response=$(fetch_compact_json "$APP_API_URL/api/v1/operator-briefing?sync_runs_limit=10")
assert_contains "operator briefing response (contract id)" "$operator_briefing_runtime_response" '"contract_id":"operator_briefing_workspace_v1"'
assert_contains "operator briefing response (section_meta)" "$operator_briefing_runtime_response" '"section_meta":['

if [ "$sync_runs_count" -gt 0 ]; then
  assert_not_contains "workflow history response" "$workflow_history_response" '"data_status":"empty"'
  assert_not_contains "workflow history response" "$workflow_history_response" '"count":0'
  assert_contains "workflow history response" "$workflow_history_response" '"sync_run_id":"'
  assert_not_contains "audit history response" "$audit_history_response" '"data_status":"empty"'
  assert_not_contains "audit history response" "$audit_history_response" '"count":0'
  assert_contains "audit history response" "$audit_history_response" '"sync_run_id":"'
fi

# When Postgres holds inventory snapshot rows, require an honest devices history window; gate
# snapshot-level keys on a non-empty recent_snapshots list (prefix match avoids false positives
# from comparison_to_previous snapshot id fields), matching topology/policy verifier intent.
if [ "$inventory_snapshots_count" -gt 0 ]; then
  assert_not_contains "devices response" "$devices_response" '"history":{"status":"unavailable"'
  assert_contains "devices response" "$devices_response" '"recent_snapshots":['
  if printf '%s' "$devices_response" | grep -qF '"recent_snapshots":[{"snapshot_id"'; then
    assert_contains "devices response (history snapshots)" "$devices_response" '"snapshot_id":"'
    assert_contains "devices response (history snapshots)" "$devices_response" '"sync_run_id":"'
    assert_contains "devices response (history snapshots)" "$devices_response" '"source_endpoint":"'
    assert_contains "devices response (history snapshots)" "$devices_response" '"persisted_at":"'
    assert_contains "devices response (history snapshots)" "$devices_response" '"observed_at":'
    assert_contains "devices response (history snapshots)" "$devices_response" '"sync_source":"'
    assert_contains "devices response (history snapshots)" "$devices_response" '"sync_status":"'
    assert_contains "devices response (history snapshots)" "$devices_response" '"data_status":"'
    assert_contains "devices response (history snapshots)" "$devices_response" '"device_count":'
    assert_contains "devices response (history snapshots)" "$devices_response" '"role_counts":'
    assert_contains "devices response (history snapshots)" "$devices_response" '"collector_status_counts":'
    assert_contains "devices response (history snapshots)" "$devices_response" '"capability_summary_counts":'
  else
    notice "Devices history recent_snapshots is empty in the API response even though Postgres reports inventory snapshot rows; skipping history-snapshot key assertions."
  fi
  if printf '%s' "$devices_response" | grep -F '"comparison_to_previous":{' | grep -F '"current_snapshot_id"' >/dev/null 2>&1; then
    assert_contains "devices response (history comparison)" "$devices_response" '"current_snapshot_id":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"previous_snapshot_id":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"current_persisted_at":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"previous_persisted_at":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"current_observed_at":'
    assert_contains "devices response (history comparison)" "$devices_response" '"previous_observed_at":'
    assert_contains "devices response (history comparison)" "$devices_response" '"current_sync_status":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"previous_sync_status":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"current_data_status":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"previous_data_status":"'
    assert_contains "devices response (history comparison)" "$devices_response" '"current_device_count":'
    assert_contains "devices response (history comparison)" "$devices_response" '"previous_device_count":'
    assert_contains "devices response (history comparison)" "$devices_response" '"device_count_delta":'
    assert_contains "devices response (history comparison)" "$devices_response" '"added_device_count":'
    assert_contains "devices response (history comparison)" "$devices_response" '"removed_device_count":'
    assert_contains "devices response (history comparison)" "$devices_response" '"changed_device_count":'
    assert_contains "devices response (history comparison)" "$devices_response" '"change_preview":'
    assert_contains "devices response (history comparison)" "$devices_response" '"notes":'
  fi
else
  notice "No persisted inventory snapshot rows in Postgres; devices history contract checks for snapshot-level keys are skipped (fresh baseline is honest)."
fi

if [ "$topology_snapshots_count" -gt 0 ]; then
  assert_not_contains "topology response" "$topology_response" '"history":{"status":"unavailable"'
  assert_contains "topology response" "$topology_response" '"snapshot_id":"'
  assert_contains "topology response" "$topology_response" '"recent_snapshots":['
  if printf '%s' "$topology_response" | grep -qF '"recent_snapshots":[{"snapshot_id"'; then
    assert_contains "topology response (history snapshots include aggregate counts)" "$topology_response" '"node_count":'
    inference_hits=$(printf '%s' "$topology_response" | grep -o '"inference_posture":"' | wc -l | tr -d ' ')
    if [ "${inference_hits:-0}" -lt 2 ]; then
      echo "topology response: expected inference_posture in history.recent_snapshots entries plus coverage_summary (distinct occurrences), got ${inference_hits:-0}" >&2
      exit 1
    fi
    participation_hits=$(printf '%s' "$topology_response" | grep -o '"node_participation_posture":"' | wc -l | tr -d ' ')
    if [ "${participation_hits:-0}" -lt 2 ]; then
      echo "topology response: expected node_participation_posture in history.recent_snapshots plus coverage_summary, got ${participation_hits:-0}" >&2
      exit 1
    fi
  else
    notice "Topology history recent_snapshots is empty in the API response even though Postgres reports topology snapshot rows; skipping history-snapshot coverage key assertions."
  fi
  if printf '%s' "$topology_response" | grep -F '"comparison_to_previous":{' | grep -F '"current_snapshot_id"' >/dev/null 2>&1; then
    assert_contains "topology response (history comparison coverage fields)" "$topology_response" '"current_endpoint_pairing_posture"'
    assert_contains "topology response (history comparison coverage fields)" "$topology_response" '"current_paired_link_count"'
    assert_contains "topology response (history comparison coverage fields)" "$topology_response" '"current_inference_posture"'
    assert_contains "topology response (history comparison coverage fields)" "$topology_response" '"current_collection_posture"'
    assert_contains "topology response (history comparison coverage fields)" "$topology_response" '"current_node_participation_posture"'
    assert_contains "topology response (history comparison coverage fields)" "$topology_response" '"current_single_sided_link_count"'
    assert_contains "topology response (history comparison coverage fields)" "$topology_response" '"current_isolated_node_count"'
  fi
else
  notice "No persisted topology snapshot rows in Postgres; topology history contract checks for snapshot-level coverage keys are skipped (fresh baseline is honest)."
fi

# Policy persisted history: gate snapshot-level keys on a non-empty recent_snapshots list (prefix
# match), and comparison keys when comparison_to_previous is present—mirrors devices + week 20
# anchors (sync_run_id, source_endpoint, target counts, nested detail_source_readiness).
if [ "$policy_snapshots_count" -gt 0 ]; then
  assert_not_contains "policies response" "$policies_response" '"history":{"status":"unavailable"'
  assert_contains "policies response" "$policies_response" '"recent_snapshots":['
  if printf '%s' "$policies_response" | grep -qF '"recent_snapshots":[{"snapshot_id"'; then
    assert_contains "policies response (history snapshots)" "$policies_response" '"snapshot_id":"'
    assert_contains "policies response (history snapshots)" "$policies_response" '"sync_run_id":"'
    assert_contains "policies response (history snapshots)" "$policies_response" '"source_endpoint":"'
    assert_contains "policies response (history snapshots)" "$policies_response" '"persisted_at":"'
    assert_contains "policies response (history snapshots)" "$policies_response" '"observed_at":'
    assert_contains "policies response (history snapshots)" "$policies_response" '"observed_target_count":'
    assert_contains "policies response (history snapshots)" "$policies_response" '"policy_capable_target_count":'
    assert_contains "policies response (history snapshots)" "$policies_response" '"static_local_policy_count":'
    nested_readiness_hits=$(printf '%s' "$policies_response" | grep -o '"detail_source_readiness":{' | wc -l | tr -d ' ')
    if [ "${nested_readiness_hits:-0}" -lt 2 ]; then
      echo "policies response: expected nested detail_source_readiness on history.recent_snapshots in addition to top-level (at least 2 occurrences), got ${nested_readiness_hits:-0}" >&2
      exit 1
    fi
    posture_hits=$(printf '%s' "$policies_response" | grep -o '"detail_source_readiness_posture":"' | wc -l | tr -d ' ')
    if [ "${posture_hits:-0}" -lt 1 ]; then
      echo "policies response: expected detail_source_readiness_posture on history.recent_snapshots entries, got ${posture_hits:-0}" >&2
      exit 1
    fi
    assert_contains "policies response (history snapshots)" "$policies_response" '"detail_ready_target_count"'
    assert_contains "policies response (history snapshots)" "$policies_response" '"no_policies_observed_target_count"'
    assert_contains "policies response (history snapshots)" "$policies_response" '"detail_unavailable_target_count"'
    assert_contains "policies response (history snapshots)" "$policies_response" '"partial_detail_target_count"'
  else
    notice "Policy history recent_snapshots is empty in the API response even though Postgres reports policy snapshot rows; skipping history-snapshot source-readiness key assertions."
  fi
  if printf '%s' "$policies_response" | grep -F '"comparison_to_previous":{' | grep -F '"current_snapshot_id"' >/dev/null 2>&1; then
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"current_detail_source_readiness_posture"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"previous_detail_source_readiness_posture"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"current_detail_ready_target_count"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"previous_detail_ready_target_count"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"current_no_policies_observed_target_count"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"previous_no_policies_observed_target_count"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"current_detail_unavailable_target_count"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"previous_detail_unavailable_target_count"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"current_partial_detail_target_count"'
    assert_contains "policies response (history comparison source-readiness)" "$policies_response" '"previous_partial_detail_target_count"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"current_observed_at":'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"previous_observed_at":'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"current_sync_run_id":"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"previous_sync_run_id":"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"current_source_endpoint":"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"previous_source_endpoint":"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"current_data_status":"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"previous_data_status":"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"current_static_local_policy_count"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"previous_static_local_policy_count"'
    assert_contains "policies response (history comparison anchors)" "$policies_response" '"static_local_policy_delta"'
    assert_contains "policies response (history comparison nested readiness)" "$policies_response" '"current_detail_source_readiness":{'
    assert_contains "policies response (history comparison nested readiness)" "$policies_response" '"previous_detail_source_readiness":{'
  fi
else
  notice "No persisted policy snapshot rows in Postgres; policy history contract checks for snapshot-level source-readiness keys are skipped (fresh baseline is honest)."
fi

if [ "$readiness_snapshots_count" -gt 0 ]; then
  assert_not_contains "capabilities response" "$capabilities_response" '"readiness_snapshot_id":null'
  assert_not_contains "capabilities response" "$capabilities_response" '"readiness_persisted_at":null'
fi

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
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_recovery_posture'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_recovery_persisted_artifacts'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_readiness_status'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_readiness_latest_evaluation_at_seconds'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_sync_runs_total'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_inventory_snapshots_persisted_total'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_inventory_snapshot_latest_persisted_at_seconds'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_policy_snapshots_persisted_total'
assert_contains "app-api metrics" "$app_api_metrics" 'platform_app_api_policy_snapshot_latest_persisted_at_seconds'
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

# When Postgres still holds persisted read-side rows, require the product APIs to
# report preserved same-workspace baseline (aligned with drill-same-workspace-restart.sh).
if [ "$persisted_artifact_count" -gt 0 ]; then
  notice "Postgres persisted read-side baseline present: sync_runs=$sync_runs_count inventory_snapshots=$inventory_snapshots_count topology_snapshots=$topology_snapshots_count policy_snapshots=$policy_snapshots_count readiness_snapshots=$readiness_snapshots_count."
  assert_contains "platform status recovery (preserved-baseline)" "$platform_status_response" '"baseline_posture":"preserved_same_workspace_baseline"'
  assert_contains "workflow history baseline_summary object (preserved-baseline)" "$workflow_history_response" '"baseline_summary":{'
  assert_contains "workflow history baseline_summary (preserved-baseline)" "$workflow_history_response" '"baseline_posture":"preserved_same_workspace_baseline"'
  assert_contains "audit history baseline_summary object (preserved-baseline)" "$audit_history_response" '"baseline_summary":{'
  assert_contains "audit history baseline_summary (preserved-baseline)" "$audit_history_response" '"baseline_posture":"preserved_same_workspace_baseline"'
else
  notice "Postgres currently has no persisted read-side snapshots, sync runs, or readiness snapshots; this is consistent with a first deploy or missing-data-dir recovery, and historical recovery is starting from a new baseline."
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