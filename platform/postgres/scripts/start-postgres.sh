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

require_env POSTGRES_DB
require_env POSTGRES_USER
require_env POSTGRES_PASSWORD
require_env PGDATA

data_root=/var/lib/postgresql/data
require_dir "$data_root"
require_writable_dir "$data_root"

case "$PGDATA" in
  "$data_root"/*) ;;
  *)
    echo "PGDATA must stay under $data_root for the bind-mounted runtime contract" >&2
    exit 1
    ;;
esac

mkdir -p "$PGDATA"
require_writable_dir "$PGDATA"

if [ ! -d /docker-entrypoint-initdb.d ]; then
  echo "/docker-entrypoint-initdb.d mount is required" >&2
  exit 1
fi

exec docker-entrypoint.sh postgres