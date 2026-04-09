#!/bin/sh
set -eu

ODL_URL="${ODL_URL:-http://127.0.0.1:8181}"
ODL_USERNAME="${ODL_USERNAME:-admin}"
ODL_PASSWORD="${ODL_PASSWORD:-change_me}"
ODL_NETCONF_USERNAME="${ODL_NETCONF_USERNAME:-admin}"
ODL_NETCONF_PASSWORD="${ODL_NETCONF_PASSWORD:-admin}"

apply_node() {
  node_id="$1"
  host="$2"
  port="$3"
  tcp_only="$4"
  reconnect_on_changed_schema="$5"
  connection_timeout_millis="$6"
  keepalive_delay="$7"
  max_connection_attempts="$8"
  between_attempts_timeout_millis="$9"
  sleep_factor="${10}"
  curl -sS -u "${ODL_USERNAME}:${ODL_PASSWORD}" \
    -X PUT \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    --data @- \
    "${ODL_URL}/rests/data/network-topology:network-topology/topology=topology-netconf/node=${node_id}" >/dev/null <<EOF
{"network-topology:node":[{"node-id":"${node_id}","netconf-node-topology:host":"${host}","netconf-node-topology:port":${port},"netconf-node-topology:username":"${ODL_NETCONF_USERNAME}","netconf-node-topology:password":"${ODL_NETCONF_PASSWORD}","netconf-node-topology:tcp-only":${tcp_only},"netconf-node-topology:reconnect-on-changed-schema":${reconnect_on_changed_schema},"netconf-node-topology:connection-timeout-millis":${connection_timeout_millis},"netconf-node-topology:keepalive-delay":${keepalive_delay},"netconf-node-topology:max-connection-attempts":${max_connection_attempts},"netconf-node-topology:between-attempts-timeout-millis":${between_attempts_timeout_millis},"netconf-node-topology:sleep-factor":${sleep_factor}}]}
EOF
  echo "mounted ${node_id}"
}

apply_node 'CSC1-P1' '172.20.20.121' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC1-P2' '172.20.20.122' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC1-P3' '172.20.20.123' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC1-P4' '172.20.20.124' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC1-PE1' '172.20.20.119' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC1-PE2' '172.20.20.120' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC2-P1' '172.20.20.129' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC2-P2' '172.20.20.130' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC2-P3' '172.20.20.131' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC2-P4' '172.20.20.132' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC2-PE1' '172.20.20.127' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'CSC2-PE2' '172.20.20.128' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P1' '172.20.20.109' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P2' '172.20.20.110' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P3' '172.20.20.111' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P4' '172.20.20.112' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P5' '172.20.20.113' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P6' '172.20.20.114' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P7' '172.20.20.115' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'P8' '172.20.20.116' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'PE1' '172.20.20.107' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'PE2' '172.20.20.108' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'PE3' '172.20.20.117' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
apply_node 'PE4' '172.20.20.118' '830' 'false' 'false' '20000' '30' '0' '2000' '1.5'
