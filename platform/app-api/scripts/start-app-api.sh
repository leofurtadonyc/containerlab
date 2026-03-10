#!/bin/sh
set -eu

cd /app

python3 -m pip install --no-cache-dir -e .
python3 -m alembic -c alembic.ini upgrade head

uvicorn app_api.main:app --host 0.0.0.0 --port "${API_PORT:-8000}" &
api_pid=$!

(
  python3 - <<'PY'
import os
import socket
import time

port = int(os.environ.get("API_PORT", "8000"))
for _ in range(60):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1):
            raise SystemExit(0)
    except OSError:
        time.sleep(1)
raise SystemExit(1)
PY
  python3 -m app_api.startup.warmup
) >/tmp/app-api-warmup.log 2>&1 || true &

wait "$api_pid"
