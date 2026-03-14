#!/bin/sh
set -eu

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-clab-platform-postgres}"
POSTGRES_USER="${POSTGRES_USER:-platform}"
POSTGRES_DB="${POSTGRES_DB:-platform}"
APP_API_CONTAINER="${APP_API_CONTAINER:-clab-platform-app-api}"
APP_WEB_CONTAINER="${APP_WEB_CONTAINER:-clab-platform-app-web}"
APP_API_URL="${APP_API_URL:-http://127.0.0.1:8000}"
APP_WEB_URL="${APP_WEB_URL:-http://127.0.0.1:8088}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://127.0.0.1:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3000}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-change_me}"
VERIFY_ATTEMPTS="${VERIFY_ATTEMPTS:-45}"
VERIFY_SLEEP_SECONDS="${VERIFY_SLEEP_SECONDS:-2}"

require_command() {
  command_name=$1
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
}

require_command curl
require_command docker

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

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "Postgres container not found: $POSTGRES_CONTAINER" >&2
  exit 1
fi

wait_for_postgres

postgres_schema_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM information_schema.schemata WHERE schema_name = 'platform_app';")
if [ "$postgres_schema_count" != "1" ]; then
  echo "Expected platform_app schema in Postgres, found count=$postgres_schema_count" >&2
  exit 1
fi

wait_for_container_healthy "$APP_API_CONTAINER"
wait_for_container_healthy "$APP_WEB_CONTAINER"
wait_for_http_ok "app-api health" "$APP_API_URL/api/v1/health"
wait_for_http_ok "app-web root" "$APP_WEB_URL/"
wait_for_http_ok "Prometheus readiness" "$PROMETHEUS_URL/-/ready"

prometheus_targets=$(curl -fsS "$PROMETHEUS_URL/api/v1/targets" | tr -d '\n')
echo "$prometheus_targets" | grep '"job":"app-api"' >/dev/null
echo "$prometheus_targets" | grep '"job":"gnmi-collector"' >/dev/null
echo "$prometheus_targets" | grep '"health":"up"' >/dev/null

wait_for_http_ok "Grafana health" "$GRAFANA_URL/api/health"

grafana_datasources=$(curl -fsS -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/datasources")
echo "$grafana_datasources" | grep '"uid":"prometheus"' >/dev/null

grafana_dashboards=$(curl -fsS -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/search?query=overview")
echo "$grafana_dashboards" | grep 'platform-overview' >/dev/null
echo "$grafana_dashboards" | grep 'topology-overview' >/dev/null

echo "Core runtime verification passed. Postgres, app-api, and app-web are ready with their expected startup contracts, Prometheus is ready and scraping the current real targets, and Grafana has the provisioned datasource and dashboards."