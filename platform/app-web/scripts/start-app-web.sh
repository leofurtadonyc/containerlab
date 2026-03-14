#!/bin/sh
set -eu

APP_WEB_HTML_ROOT="${APP_WEB_HTML_ROOT:-/usr/share/nginx/html}"
APP_WEB_ENTRYPOINT_FILE="${APP_WEB_ENTRYPOINT_FILE:-${APP_WEB_HTML_ROOT}/index.html}"

require_dir() {
  dir_path=$1
  if [ ! -d "$dir_path" ]; then
    echo "Required directory missing: $dir_path" >&2
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

require_dir "$APP_WEB_HTML_ROOT"
require_file "$APP_WEB_ENTRYPOINT_FILE"

nginx -t

exec nginx -g 'daemon off;'