#!/bin/sh
set -eu

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-clab-platform-postgres}"
POSTGRES_USER="${POSTGRES_USER:-platform}"
POSTGRES_DB="${POSTGRES_DB:-platform}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://127.0.0.1:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3000}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-change_me}"

require_command() {
  command_name=$1
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
}

require_command curl
require_command docker

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "Postgres container not found: $POSTGRES_CONTAINER" >&2
  exit 1
fi

docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null

postgres_schema_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM information_schema.schemata WHERE schema_name = 'platform_app';")
if [ "$postgres_schema_count" != "1" ]; then
  echo "Expected platform_app schema in Postgres, found count=$postgres_schema_count" >&2
  exit 1
fi

curl -fsS "$PROMETHEUS_URL/-/ready" >/dev/null

prometheus_targets=$(curl -fsS "$PROMETHEUS_URL/api/v1/targets" | tr -d '\n')
echo "$prometheus_targets" | grep '"job":"app-api"' >/dev/null
echo "$prometheus_targets" | grep '"job":"gnmi-collector"' >/dev/null
echo "$prometheus_targets" | grep '"health":"up"' >/dev/null

curl -fsS "$GRAFANA_URL/api/health" >/dev/null

grafana_datasources=$(curl -fsS -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/datasources")
echo "$grafana_datasources" | grep '"uid":"prometheus"' >/dev/null

grafana_dashboards=$(curl -fsS -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/search?query=overview")
echo "$grafana_dashboards" | grep 'platform-overview' >/dev/null
echo "$grafana_dashboards" | grep 'topology-overview' >/dev/null

echo "Core runtime verification passed. Postgres is ready with the expected schema, Prometheus is ready and scraping the current real targets, and Grafana has the provisioned datasource and dashboards." 