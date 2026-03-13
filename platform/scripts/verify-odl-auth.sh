#!/bin/sh
set -eu

ODL_URL="${ODL_URL:-http://127.0.0.1:8181}"
ODL_USERNAME="${ODL_USERNAME:-admin}"
ODL_PASSWORD="${ODL_PASSWORD:-change_me}"
ODL_DEFAULT_PASSWORD="${ODL_DEFAULT_PASSWORD:-admin}"
ODL_RESTCONF_PATH="${ODL_RESTCONF_PATH:-/rests/data/ietf-yang-library:modules-state}"
APP_API_URL="${APP_API_URL:-http://127.0.0.1:8000}"

curl_status() {
  user=$1
  password=$2
  path=$3
  curl -sS -o /tmp/odl-auth-check.out -w "%{http_code}" \
    -u "${user}:${password}" \
    "${ODL_URL}${path}" || true
}

configured_status=$(curl_status "${ODL_USERNAME}" "${ODL_PASSWORD}" "${ODL_RESTCONF_PATH}")
if [ "${configured_status}" != "200" ]; then
  echo "Configured ODL credential check failed with HTTP ${configured_status}." >&2
  cat /tmp/odl-auth-check.out >&2
  exit 1
fi

if [ "${ODL_PASSWORD}" != "${ODL_DEFAULT_PASSWORD}" ]; then
  default_status=$(curl_status "${ODL_USERNAME}" "${ODL_DEFAULT_PASSWORD}" "${ODL_RESTCONF_PATH}")
  if [ "${default_status}" = "200" ]; then
    echo "Default ODL credential still authenticates unexpectedly." >&2
    exit 1
  fi
fi

platform_status=$(curl -sS "${APP_API_URL}/api/v1/platform/status")
platform_status_compact=$(printf '%s' "${platform_status}" | tr -d '\n\r\t ')

printf '%s' "${platform_status_compact}" | grep -F '"observation_source":"odl_restconf_capability_probe"' >/dev/null
printf '%s' "${platform_status_compact}" | grep -F '"observation_state":"ok"' >/dev/null

echo "ODL auth verification passed. Configured credential works, default fallback is rejected, and app-api reports bounded ODL health as ok."