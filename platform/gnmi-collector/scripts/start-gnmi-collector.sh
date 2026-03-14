#!/bin/sh
set -eu

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

wait_for_app_api() {
  attempts=${GNMI_COLLECTOR_APP_API_ATTEMPTS:-45}
  sleep_seconds=${GNMI_COLLECTOR_APP_API_SLEEP_SECONDS:-2}

  while [ "$attempts" -gt 0 ]; do
    if python3 - <<'PY'
import os
import sys
import urllib.error
import urllib.request

base_url = os.environ["APP_API_URL"].rstrip("/")
health_url = f"{base_url}/api/v1/health"

try:
    with urllib.request.urlopen(health_url, timeout=2) as response:
        if response.status == 200:
            raise SystemExit(0)
except (OSError, urllib.error.URLError):
    pass

raise SystemExit(1)
PY
    then
      return 0
    fi

    attempts=$((attempts - 1))
    if [ "$attempts" -gt 0 ]; then
      sleep "$sleep_seconds"
    fi
  done

  echo "Timed out waiting for app-api health at ${APP_API_URL%/}/api/v1/health" >&2
  exit 1
}

require_env COLLECTOR_METRICS_PORT
require_env APP_API_URL
require_env GNMI_CONFIG_PATH
require_file "$GNMI_CONFIG_PATH"

python3 - <<'PY'
from gnmi_collector.config.runtime import build_runtime_config

build_runtime_config()
PY

wait_for_app_api

exec uvicorn gnmi_collector.main:app --host 0.0.0.0 --port "${COLLECTOR_METRICS_PORT}"