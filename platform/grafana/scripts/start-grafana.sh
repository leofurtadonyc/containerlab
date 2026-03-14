#!/bin/sh
set -eu

GF_PATHS_PROVISIONING="${GF_PATHS_PROVISIONING:-/etc/grafana/provisioning}"
GRAFANA_DASHBOARDS_PATH="${GRAFANA_DASHBOARDS_PATH:-/etc/grafana/dashboards}"
GRAFANA_DATA_PATH="${GRAFANA_DATA_PATH:-/var/lib/grafana}"

require_env() {
  var_name=$1
  eval "var_value=\${$var_name:-}"
  if [ -z "$var_value" ]; then
    echo "$var_name must be set" >&2
    exit 1
  fi
}

require_file() {
  file_path=$1
  if [ ! -f "$file_path" ]; then
    echo "Required file missing: $file_path" >&2
    exit 1
  fi
}

require_dir() {
  dir_path=$1
  if [ ! -d "$dir_path" ]; then
    echo "Required directory missing: $dir_path" >&2
    exit 1
  fi
}

require_writable_dir() {
  dir_path=$1
  if [ ! -w "$dir_path" ]; then
    echo "Directory is not writable: $dir_path" >&2
    exit 1
  fi
}

prepare_runtime_dir() {
  dir_path=$1

  if [ "$(id -u)" -eq 0 ]; then
    chown -R grafana:0 "$dir_path"
    chmod -R u+rwX,g+rwX "$dir_path"
  fi

  if ! su -s /bin/sh grafana -c "test -w '$dir_path'"; then
    echo "Directory is not writable by grafana: $dir_path" >&2
    exit 1
  fi
}

require_env GF_SECURITY_ADMIN_USER
require_env GF_SECURITY_ADMIN_PASSWORD
require_env GF_PATHS_PROVISIONING

mkdir -p "$GF_PATHS_PROVISIONING/plugins" "$GF_PATHS_PROVISIONING/alerting"

require_dir "$GF_PATHS_PROVISIONING"
require_dir "$GF_PATHS_PROVISIONING/datasources"
require_dir "$GF_PATHS_PROVISIONING/dashboards"
require_dir "$GF_PATHS_PROVISIONING/plugins"
require_dir "$GF_PATHS_PROVISIONING/alerting"
require_file "$GF_PATHS_PROVISIONING/datasources/prometheus.yml"
require_file "$GF_PATHS_PROVISIONING/dashboards/dashboards.yml"
require_dir "$GRAFANA_DASHBOARDS_PATH"
require_dir "$GRAFANA_DATA_PATH"
prepare_runtime_dir "$GRAFANA_DATA_PATH"

exec su -s /bin/sh grafana -c /run.sh