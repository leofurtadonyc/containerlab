#!/bin/sh
set -eu

ODL_SOUTHBAND_INTERFACE="${ODL_SOUTHBAND_INTERFACE:-eth1}"
ODL_SOUTHBAND_IPV4="${ODL_SOUTHBAND_IPV4:-10.90.0.10/24}"
ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS="${ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS:-30}"

if ! command -v ip >/dev/null 2>&1; then
  echo "ODL southbound bootstrap requires iproute2 inside the controller image." >&2
  exit 1
fi

remaining_wait="${ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS}"
while [ ! -d "/sys/class/net/${ODL_SOUTHBAND_INTERFACE}" ] && [ "${remaining_wait}" -gt 0 ]; do
  sleep 1
  remaining_wait=$((remaining_wait - 1))
done

if [ ! -d "/sys/class/net/${ODL_SOUTHBAND_INTERFACE}" ]; then
  echo "ODL southbound interface ${ODL_SOUTHBAND_INTERFACE} is missing; verify bridge prep and topology wiring." >&2
  exit 1
fi

ip link set "${ODL_SOUTHBAND_INTERFACE}" up
ip addr replace "${ODL_SOUTHBAND_IPV4}" dev "${ODL_SOUTHBAND_INTERFACE}"

ip route replace '100.64.255.11/32' via '10.90.0.111' dev "${ODL_SOUTHBAND_INTERFACE}"
ip route replace '100.64.255.12/32' via '10.90.0.112' dev "${ODL_SOUTHBAND_INTERFACE}"
ip route replace '100.66.255.11/32' via '10.90.0.211' dev "${ODL_SOUTHBAND_INTERFACE}"
ip route replace '100.66.255.12/32' via '10.90.0.212' dev "${ODL_SOUTHBAND_INTERFACE}"
ip route replace '100.65.255.11/32' via '10.90.0.11' dev "${ODL_SOUTHBAND_INTERFACE}"
ip route replace '100.65.255.12/32' via '10.90.0.12' dev "${ODL_SOUTHBAND_INTERFACE}"
ip route replace '100.65.255.13/32' via '10.90.0.13' dev "${ODL_SOUTHBAND_INTERFACE}"
ip route replace '100.65.255.14/32' via '10.90.0.14' dev "${ODL_SOUTHBAND_INTERFACE}"
