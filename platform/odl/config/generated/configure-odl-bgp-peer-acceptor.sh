#!/bin/sh
set -eu

ODL_URL="${ODL_URL:-http://127.0.0.1:8181}"
ODL_USERNAME="${ODL_USERNAME:-admin}"
ODL_PASSWORD="${ODL_PASSWORD:-change_me}"
ODL_BGP_ACCEPTOR_NAME="${ODL_BGP_ACCEPTOR_NAME:-default}"
ODL_BGP_BIND_ADDRESS="${ODL_BGP_BIND_ADDRESS:-0.0.0.0}"
ODL_BGP_BIND_PORT="${ODL_BGP_BIND_PORT:-179}"

curl -sS -u "${ODL_USERNAME}:${ODL_PASSWORD}" \
  -X PUT \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  --data @- \
  "${ODL_URL}/rests/data/odl-bgp-peer-acceptor-config:bgp-peer-acceptor-config=${ODL_BGP_ACCEPTOR_NAME}" >/dev/null <<EOF
{"odl-bgp-peer-acceptor-config:bgp-peer-acceptor-config":[{"config-name":"${ODL_BGP_ACCEPTOR_NAME}","binding-address":"${ODL_BGP_BIND_ADDRESS}","binding-port":${ODL_BGP_BIND_PORT}}]}
EOF
echo "mounted ${ODL_BGP_ACCEPTOR_NAME}"
