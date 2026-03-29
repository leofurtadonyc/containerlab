#!/bin/bash
# Append Karaf feature names from karaf-features.list to org.apache.karaf.features.cfg
# featuresBoot so they install and start on every controller boot (survives redeploy).
# Run at image build time only (USER root).
set -euo pipefail

CFG=/opt/opendaylight/etc/org.apache.karaf.features.cfg
LIST_FILE="${1:-/tmp/karaf-features.list}"

if [ ! -f "$CFG" ]; then
  echo "append-features-boot: missing ${CFG}" >&2
  exit 1
fi
if [ ! -f "$LIST_FILE" ]; then
  echo "append-features-boot: missing feature list ${LIST_FILE}" >&2
  exit 1
fi

BOOT_LINE=$(grep '^featuresBoot[[:space:]]*=' "$CFG" | head -1 || true)
if [ -z "${BOOT_LINE}" ]; then
  echo "append-features-boot: no featuresBoot line in ${CFG}" >&2
  exit 1
fi

# First boot feature is the ODL synthetic UUID (comma-separated list may follow).
UUID=$(printf '%s' "${BOOT_LINE}" | sed 's/^featuresBoot[[:space:]]*=[[:space:]]*//' | tr -d '\r' | cut -d',' -f1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

FEATURES=''
while IFS= read -r raw || [ -n "${raw}" ]; do
  line=$(printf '%s\n' "${raw%%#*}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  [ -z "${line}" ] && continue
  # shellcheck disable=SC2086
  for tok in ${line}; do
    [ -z "${tok}" ] && continue
    if [ -n "${FEATURES}" ]; then
      FEATURES="${FEATURES},"
    fi
    FEATURES="${FEATURES}${tok}"
  done
done < "${LIST_FILE}"

if [ -z "${FEATURES}" ]; then
  echo "append-features-boot: no features parsed from ${LIST_FILE}" >&2
  exit 1
fi

NEW_VALUE="${UUID},${FEATURES}"
TMP="${CFG}.new.$$"
awk -v nl="$NEW_VALUE" '/^featuresBoot[[:space:]]*=/ { print "featuresBoot = " nl; next } { print }' "${CFG}" > "${TMP}"
mv "${TMP}" "${CFG}"

echo "append-features-boot: wrote featuresBoot with $(printf '%s' "${FEATURES}" | tr ',' '\n' | grep -cve '^$') additional feature(s) after ${UUID}"
