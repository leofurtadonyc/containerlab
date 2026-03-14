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

wait_for_configured_auth() {
  attempts=${ODL_AUTH_ATTEMPTS:-30}
  sleep_seconds=${ODL_AUTH_SLEEP_SECONDS:-2}

  while [ "${attempts}" -gt 0 ]; do
    configured_status=$(curl_status "${ODL_USERNAME}" "${ODL_PASSWORD}" "${ODL_RESTCONF_PATH}")
    if [ "${configured_status}" = "200" ]; then
      return 0
    fi

    attempts=$((attempts - 1))
    if [ "${attempts}" -gt 0 ]; then
      sleep "${sleep_seconds}"
    fi
  done

  echo "Configured ODL credential check failed with HTTP ${configured_status}." >&2
  cat /tmp/odl-auth-check.out >&2
  exit 1
}

wait_for_platform_probe() {
  attempts=${ODL_AUTH_ATTEMPTS:-30}
  sleep_seconds=${ODL_AUTH_SLEEP_SECONDS:-2}

  while [ "${attempts}" -gt 0 ]; do
    platform_status=$(curl -sS "${APP_API_URL}/api/v1/platform/status" || true)
    platform_status_compact=$(printf '%s' "${platform_status}" | tr -d '\n\r\t ')

    if printf '%s' "${platform_status_compact}" | grep -F '"observation_source":"odl_restconf_capability_probe"' >/dev/null \
      && printf '%s' "${platform_status_compact}" | grep -F '"observation_state":"ok"' >/dev/null; then
      return 0
    fi

    attempts=$((attempts - 1))
    if [ "${attempts}" -gt 0 ]; then
      sleep "${sleep_seconds}"
    fi
  done

  echo "app-api did not report bounded ODL health as ok in time." >&2
  printf '%s\n' "${platform_status}" >&2
  exit 1
}

wait_for_configured_auth

if [ "${ODL_PASSWORD}" != "${ODL_DEFAULT_PASSWORD}" ]; then
  default_status=$(curl_status "${ODL_USERNAME}" "${ODL_DEFAULT_PASSWORD}" "${ODL_RESTCONF_PATH}")
  if [ "${default_status}" = "200" ]; then
    echo "Default ODL credential still authenticates unexpectedly." >&2
    exit 1
  fi
fi

wait_for_platform_probe

echo "ODL auth verification passed. Configured credential works, default fallback is rejected, and app-api reports bounded ODL health as ok."