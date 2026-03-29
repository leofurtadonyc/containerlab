#!/bin/bash
set -euo pipefail

odl_dir=/opt/opendaylight
odl_url=${ODL_BOOTSTRAP_URL:-http://127.0.0.1:8181}
odl_user=${ODL_USERNAME:-admin}
default_password=${ODL_BOOTSTRAP_PASSWORD:-admin}
target_password=${ODL_ADMIN_PASSWORD:-admin}
user_id="${odl_user}@sdn"

auth_code() {
  curl -sS -o /dev/null -w "%{http_code}" \
    -u "${odl_user}:$1" \
    "${odl_url}/auth/v1/users/${user_id}" || true
}

rotate_password() {
  local payload
  local status_code

  payload=$(printf '{"userid":"%s","name":"%s","description":"admin user","enabled":1,"email":"","domainid":"sdn","password":"%s"}' \
    "${user_id}" \
    "${odl_user}" \
    "${target_password}")

  status_code=$(curl -sS -o /tmp/odl-password-rotation.out -w "%{http_code}" \
    -u "${odl_user}:${default_password}" \
    -X PUT \
    -H "Content-Type: application/json" \
    --data "${payload}" \
    "${odl_url}/auth/v1/users/${user_id}" || true)

  if [ "${status_code}" != "200" ] && [ "${status_code}" != "204" ]; then
    cat /tmp/odl-password-rotation.out >&2
    echo "ODL admin password rotation failed with HTTP ${status_code}" >&2
    exit 1
  fi
}

wait_for_auth() {
  local attempts=60

  while [ "${attempts}" -gt 0 ]; do
    if ! kill -0 "${odl_pid}" 2>/dev/null; then
      wait "${odl_pid}"
      exit $?
    fi

    if [ "$(auth_code "${target_password}")" = "200" ]; then
      echo "ODL admin password already matches configured runtime value."
      return 0
    fi

    if [ "$(auth_code "${default_password}")" = "200" ]; then
      echo "Rotating ODL admin password to the configured runtime value."
      rotate_password
      for _ in $(seq 1 20); do
        if [ "$(auth_code "${target_password}")" = "200" ]; then
          echo "ODL admin password rotation completed successfully."
          return 0
        fi
        sleep 1
      done
      echo "ODL admin password rotation did not become active in time." >&2
      exit 1
    fi

    attempts=$((attempts - 1))
    sleep 2
  done

  echo "Timed out waiting for ODL AAA readiness." >&2
  exit 1
}

"${odl_dir}/start_docker.sh" &
odl_pid=$!

if [ "${target_password}" != "${default_password}" ]; then
  wait_for_auth
fi

# Features are normally installed via featuresBoot (see Dockerfile + append-features-boot.sh).
# Optional: run `feature:install` over the client after boot (debug / recovery); uses long client idle timeout.
if [ "${ODL_RUNTIME_KARAF_FEATURES_INSTALL:-}" = "1" ]; then
  echo "Running runtime Karaf feature install (list: /usr/local/share/odl/karaf-features.list) ..."
  if ! /usr/local/bin/install-karaf-features.sh; then
    echo "WARN: Karaf feature install failed or was incomplete. Set ODL_KARAF_FEATURES_STRICT=1 to fail container startup on any failed feature:install." >&2
    if [ "${ODL_KARAF_FEATURES_STRICT:-}" = "1" ]; then
      exit 1
    fi
  fi
fi

wait "${odl_pid}"