#!/bin/bash
# Install Karaf features listed in ODL_KARAF_FEATURES_FILE after the controller shell is up.
# Intended for platform ODL container startup (bounded operator automation).
set -u

FEATURES_FILE="${ODL_KARAF_FEATURES_FILE:-/usr/local/share/odl/karaf-features.list}"
ODL_HOME="${ODL_HOME:-/opt/opendaylight}"
CLIENT="${ODL_HOME}/bin/client"
KARAF_HOST="${KARAF_HOST:-127.0.0.1}"
KARAF_PORT="${KARAF_PORT:-8101}"
KARAF_USER="${KARAF_USER:-karaf}"
KARAF_PASSWORD="${KARAF_PASSWORD:-karaf}"
MAX_WAIT_SECONDS="${ODL_KARAF_WAIT_SECONDS:-600}"
POST_UP_SLEEP_SECONDS="${ODL_KARAF_POST_UP_SLEEP:-5}"

wait_for_karaf_port() {
  local deadline=$(( $(date +%s) + MAX_WAIT_SECONDS ))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    if (echo > "/dev/tcp/${KARAF_HOST}/${KARAF_PORT}") >/dev/null 2>&1; then
      sleep "${POST_UP_SLEEP_SECONDS}"
      return 0
    fi
    sleep 2
  done
  echo "install-karaf-features: timed out after ${MAX_WAIT_SECONDS}s waiting for ${KARAF_HOST}:${KARAF_PORT}" >&2
  return 1
}

install_one() {
  local feat=$1
  echo "install-karaf-features: feature:install ${feat}"
  # Karaf client defaults to a short idle timeout; large features resolve silently for >5m and disconnect.
  if ! "${CLIENT}" -u "${KARAF_USER}" -p "${KARAF_PASSWORD}" \
    -a "${KARAF_PORT}" -h "${KARAF_HOST}" -r 60 -d 3 \
    -t "${ODL_KARAF_CLIENT_IDLE_TIMEOUT_MS:-86400000}" \
    "feature:install ${feat}"; then
    echo "install-karaf-features: WARN failed: ${feat}" >&2
    return 1
  fi
  return 0
}

main() {
  if [ ! -x "${CLIENT}" ]; then
    echo "install-karaf-features: missing or not executable: ${CLIENT}" >&2
    return 1
  fi
  if [ ! -f "${FEATURES_FILE}" ]; then
    echo "install-karaf-features: no feature list at ${FEATURES_FILE}" >&2
    return 1
  fi

  echo "install-karaf-features: waiting for Karaf shell on ${KARAF_HOST}:${KARAF_PORT} ..."
  wait_for_karaf_port || return 1

  local failures=0
  while IFS= read -r raw || [ -n "${raw}" ]; do
    line=$(printf '%s\n' "${raw%%#*}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "${line}" ] && continue
    # shellcheck disable=SC2086
    set -f
    set -- ${line}
    set +f
    while [ "$#" -gt 0 ]; do
      feat=$1
      shift
      [ -z "${feat}" ] && continue
      install_one "${feat}" || failures=$((failures + 1))
    done
  done < "${FEATURES_FILE}"

  if [ "${failures}" -gt 0 ]; then
    echo "install-karaf-features: completed with ${failures} failure(s)" >&2
    if [ "${ODL_KARAF_FEATURES_STRICT:-}" = "1" ]; then
      return 1
    fi
  fi
  echo "install-karaf-features: done (${failures} failure(s))"
  return 0
}

main "$@"
