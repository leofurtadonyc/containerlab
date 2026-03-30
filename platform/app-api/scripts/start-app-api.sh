#!/bin/sh
set -eu

# Container image: WORKDIR is /app with alembic.ini at the root.
# Host checkout: this file lives in app-api/scripts/ — use the app-api root next to it.
if [ -f /app/alembic.ini ]; then
  cd /app
else
  SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
  APP_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
  cd "$APP_ROOT" || exit 1
  if [ ! -f alembic.ini ]; then
    echo "start-app-api.sh: alembic.ini not found (expected /app in the image or ${APP_ROOT} on the host)." >&2
    exit 1
  fi
  export PYTHONPATH="${APP_ROOT}/src${PYTHONPATH:+:${PYTHONPATH}}"
  if ! python3 -c "import psycopg" 2>/dev/null; then
    echo "start-app-api.sh: host Python is missing dependencies (e.g. psycopg)." >&2
    echo "Easiest: from ${APP_ROOT} run:" >&2
    echo "  ./scripts/run-app-api-local.sh" >&2
    echo "That creates .venv/, installs from requirements.lock.txt, then starts this script." >&2
    echo "Manual alternative: python3 -m pip install -r requirements.lock.txt  (or pip install -c requirements.lock.txt . if you need the package installed)." >&2
    echo "Production path: use Docker image platform-app-api:0.1.0 (deps preinstalled)." >&2
    exit 1
  fi
fi

require_env() {
  var_name=$1
  eval "var_value=\${$var_name:-}"
  if [ -z "$var_value" ]; then
    echo "$var_name must be set" >&2
    exit 1
  fi
}

wait_for_database() {
  attempts=${APP_API_DATABASE_ATTEMPTS:-45}
  sleep_seconds=${APP_API_DATABASE_SLEEP_SECONDS:-2}

  while [ "$attempts" -gt 0 ]; do
    if python3 - <<'PY'
import os

import psycopg

database_url = os.environ["DATABASE_URL"]

try:
    with psycopg.connect(database_url, connect_timeout=3) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
except Exception:
    raise SystemExit(1)

raise SystemExit(0)
PY
    then
      return 0
    fi

    attempts=$((attempts - 1))
    if [ "$attempts" -gt 0 ]; then
      sleep "$sleep_seconds"
    fi
  done

  echo "Timed out waiting for Postgres readiness for app-api migrations." >&2
  exit 1
}

require_env API_PORT
require_env DATABASE_URL

wait_for_database

python3 -m alembic -c alembic.ini upgrade head

# Read-side warm-up runs in FastAPI lifespan (see app_api.main) before the server accepts connections.
# The previous background subshell raced HTTP clients and caused intermittent 500s on cold start.
exec uvicorn app_api.main:app --host 0.0.0.0 --port "${API_PORT:-8000}"
