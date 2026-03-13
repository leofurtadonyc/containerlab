#!/bin/sh
set -eu

PROMETHEUS_CONFIG_FILE="${PROMETHEUS_CONFIG_FILE:-/etc/prometheus/prometheus.yml}"
PROMETHEUS_RULES_DIR="${PROMETHEUS_RULES_DIR:-/etc/prometheus/rules}"
PROMETHEUS_RECORDING_RULES_DIR="${PROMETHEUS_RECORDING_RULES_DIR:-/etc/prometheus/recording-rules}"
PROMETHEUS_STORAGE_PATH="${PROMETHEUS_STORAGE_PATH:-/prometheus}"

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
    chown -R nobody:0 "$dir_path"
    chmod -R u+rwX,g+rwX "$dir_path"
  fi

  if ! su -s /bin/sh nobody -c "test -w '$dir_path'"; then
    echo "Directory is not writable by nobody: $dir_path" >&2
    exit 1
  fi
}

require_file "$PROMETHEUS_CONFIG_FILE"
require_dir "$PROMETHEUS_RULES_DIR"
require_dir "$PROMETHEUS_RECORDING_RULES_DIR"
require_dir "$PROMETHEUS_STORAGE_PATH"
prepare_runtime_dir "$PROMETHEUS_STORAGE_PATH"

promtool check config "$PROMETHEUS_CONFIG_FILE"

exec su -s /bin/sh nobody -c "/bin/prometheus \
  --config.file="$PROMETHEUS_CONFIG_FILE" \
  --storage.tsdb.path="$PROMETHEUS_STORAGE_PATH" \
  --web.console.libraries=/usr/share/prometheus/console_libraries \
  --web.console.templates=/usr/share/prometheus/consoles"