#!/bin/sh
# Bootstrap a repo-local venv with locked deps, then run start-app-api.sh on the host.
# Not the packaged Docker path — use for local dev against Postgres on DATABASE_URL.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
APP_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$APP_ROOT" || exit 1

if [ -f /app/alembic.ini ]; then
  echo "run-app-api-local.sh: use /app/scripts/start-app-api.sh inside the container." >&2
  exit 1
fi

VENV="$APP_ROOT/.venv"
if [ ! -x "$VENV/bin/python3" ]; then
  python3 -m venv "$VENV"
fi

"$VENV/bin/python3" -m pip install -q -U pip setuptools
# Install locked transitive deps only (no `pip install .`). That avoids setuptools writing
# to build/ — which may be root-owned if a Docker bind-mount created it.
"$VENV/bin/python3" -m pip install -q -r requirements.lock.txt

export PATH="$VENV/bin:$PATH"
export PYTHONPATH="$APP_ROOT/src${PYTHONPATH:+:${PYTHONPATH}}"

exec "$SCRIPT_DIR/start-app-api.sh"
