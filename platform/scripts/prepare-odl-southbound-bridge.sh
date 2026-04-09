#!/bin/sh
set -eu

bridge_name="${ODL_SOUTHBAND_BRIDGE_NAME:-br-odl-sb}"

run() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
    return
  fi

  echo "This script requires root privileges or sudo to manage Linux bridges." >&2
  exit 1
}

if ! run ip link show "$bridge_name" >/dev/null 2>&1; then
  run ip link add name "$bridge_name" type bridge
fi

run ip link set "$bridge_name" up
echo "Prepared ODL southbound bridge: $bridge_name"