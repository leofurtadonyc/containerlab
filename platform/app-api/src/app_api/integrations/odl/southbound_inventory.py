"""Typed southbound rollout inventory and NETCONF onboarding generation.

This module keeps the southbound rollout deterministic and repo-owned by deriving
PE/P targeting directly from the lab's Containerlab topology YAML.
"""

from __future__ import annotations
from ipaddress import ip_interface
from pathlib import Path
import re
from typing import Any, Literal

import yaml
from pydantic import BaseModel, Field


SouthboundRole = Literal["pe", "p", "other"]


class SouthboundProtocolTargets(BaseModel):
    """Protocol applicability for one node derived from its role."""

    bgp_ls: bool
    pcep: bool
    netconf: bool


class SouthboundTarget(BaseModel):
    """One topology-derived device target for the live southbound rollout."""

    node_name: str
    vendor: str
    kind: str
    management_ipv4: str
    loopback_ipv4: str | None = None
    bgp_asn: int | None = None
    startup_config: str | None = None
    role: SouthboundRole
    protocol_targets: SouthboundProtocolTargets
    labels: dict[str, str] = Field(default_factory=dict)


class SouthboundRolloutConfig(BaseModel):
    """Repo-owned rollout configuration for southbound generation."""

    topology_file: str
    controller_northbound_address: str
    controller_southbound_address: str
    controller_southbound_bridge_name: str = "br-odl-sb"
    controller_southbound_interface: str = "eth1"
    controller_asn: int = Field(ge=1)
    controller_bgp_rib_id: str = "lab-bgp-rib"
    controller_bgp_linkstate_topology_id: str = "lab-linkstate-topology"
    controller_pcep_topology_id: str = "pcep-topology"
    controller_bgp_binding_port: int = Field(default=179, ge=1)
    netconf_port: int = Field(default=830, ge=1)
    pcep_port: int = Field(default=4189, ge=1)
    netconf_username_env: str = "ODL_NETCONF_USERNAME"
    netconf_password_env: str = "ODL_NETCONF_PASSWORD"
    netconf_default_username: str = "admin"
    netconf_default_password: str = "admin"


class NetconfNodeSpec(BaseModel):
    """One static NETCONF onboarding spec for ODL."""

    node_id: str
    host: str
    port: int
    username_env: str
    password_env: str
    default_username: str
    default_password: str
    tcp_only: bool = False
    reconnect_on_changed_schema: bool = False
    connection_timeout_millis: int = 20000
    keepalive_delay: int = 30
    max_connection_attempts: int = 0
    between_attempts_timeout_millis: int = 2000
    sleep_factor: float = 1.5

    def restconf_path(self) -> str:
        return (
            "/rests/data/network-topology:network-topology/"
            f"topology=topology-netconf/node={self.node_id}"
        )

    def payload(self) -> dict[str, Any]:
        return {
            "network-topology:node": [
                {
                    "node-id": self.node_id,
                    "netconf-node-topology:host": self.host,
                    "netconf-node-topology:port": self.port,
                    "netconf-node-topology:username": self.default_username,
                    "netconf-node-topology:password": self.default_password,
                    "netconf-node-topology:tcp-only": self.tcp_only,
                    "netconf-node-topology:reconnect-on-changed-schema": self.reconnect_on_changed_schema,
                    "netconf-node-topology:connection-timeout-millis": self.connection_timeout_millis,
                    "netconf-node-topology:keepalive-delay": self.keepalive_delay,
                    "netconf-node-topology:max-connection-attempts": self.max_connection_attempts,
                    "netconf-node-topology:between-attempts-timeout-millis": self.between_attempts_timeout_millis,
                    "netconf-node-topology:sleep-factor": self.sleep_factor,
                }
            ]
        }


class ProtocolPeerSpec(BaseModel):
    """One repo-owned BGP-LS/PCEP southbound peer assignment."""

    node_name: str
    southbound_ipv4: str
    loopback_ipv4: str
    peer_asn: int
    controller_peer_ipv4: str
    controller_asn: int
    device_interface: str = "1/1/c10/1"


class SouthboundArtifactBundle(BaseModel):
    """All generated rollout artifacts backed by topology truth."""

    config: SouthboundRolloutConfig
    targets: list[SouthboundTarget]
    netconf_nodes: list[NetconfNodeSpec]
    protocol_peers: list[ProtocolPeerSpec]

    def inventory_summary(self) -> dict[str, Any]:
        return {
            "topology_file": self.config.topology_file,
            "controller_northbound_address": self.config.controller_northbound_address,
            "controller_southbound_address": self.config.controller_southbound_address,
            "controller_southbound_bridge_name": self.config.controller_southbound_bridge_name,
            "controller_southbound_interface": self.config.controller_southbound_interface,
            "controller_asn": self.config.controller_asn,
            "counts": {
                "all_targets": len(self.targets),
                "bgp_ls_targets": len([t for t in self.targets if t.protocol_targets.bgp_ls]),
                "pcep_targets": len([t for t in self.targets if t.protocol_targets.pcep]),
                "netconf_targets": len([t for t in self.targets if t.protocol_targets.netconf]),
            },
            "targets": [target.model_dump(mode="json") for target in self.targets],
            "protocol_peers": [peer.model_dump(mode="json") for peer in self.protocol_peers],
        }


def _load_yaml(path: Path) -> dict[str, Any]:
    loaded = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(loaded, dict):
        raise ValueError(f"YAML at {path} must contain a top-level mapping.")
    return loaded


def load_rollout_config(path: str | Path) -> SouthboundRolloutConfig:
    """Load the repo-owned rollout config file."""

    config_path = Path(path)
    loaded = _load_yaml(config_path)
    return SouthboundRolloutConfig.model_validate(loaded)


def classify_node_role(node_name: str) -> SouthboundRole:
    """Classify a node deterministically from existing naming conventions.

    The Nokia lab already distinguishes `PE1`, `CSC1-PE1`, `P1`, `CSC1-P1`, and
    `CPE-*` names cleanly through hyphen-delimited tokens.
    """

    tokens = [token.upper() for token in node_name.split("-") if token]
    if any(token.startswith("PE") and token[2:].isdigit() for token in tokens):
        return "pe"
    if any(token.startswith("P") and token[1:].isdigit() for token in tokens):
        return "p"
    return "other"


def protocol_targets_for_role(role: SouthboundRole) -> SouthboundProtocolTargets:
    """Return rollout applicability for the derived role."""

    if role == "pe":
        return SouthboundProtocolTargets(bgp_ls=True, pcep=True, netconf=True)
    if role == "p":
        return SouthboundProtocolTargets(bgp_ls=False, pcep=False, netconf=True)
    return SouthboundProtocolTargets(bgp_ls=False, pcep=False, netconf=False)


def _vendor_for_kind(kind: str) -> str:
    if kind == "nokia_srsim":
        return "nokia"
    return kind or "unknown"


def _loopback_ipv4_from_labels(labels: dict[str, Any]) -> str | None:
    value = labels.get("loopback-ipv4")
    if not isinstance(value, str) or not value:
        return None
    return value.split("/", 1)[0]


def _bgp_asn_from_startup_config(startup_config: str | None) -> int | None:
    if not startup_config:
        return None
    config_text = Path(startup_config).read_text(encoding="utf-8")
    match = re.search(r"^\s*autonomous-system\s+(?P<asn>\d+)\s*$", config_text, re.MULTILINE)
    if match is None:
        return None
    return int(match.group("asn"))


def _controller_southbound_ip(config: SouthboundRolloutConfig) -> str:
    return str(ip_interface(config.controller_southbound_address).ip)


def _southbound_host_octet(node_name: str) -> int:
    match = re.fullmatch(r"PE(?P<pe>\d+)", node_name)
    if match:
        return 10 + int(match.group("pe"))

    match = re.fullmatch(r"CSC(?P<csc>\d+)-PE(?P<pe>\d+)", node_name)
    if match:
        return (int(match.group("csc")) * 100) + 10 + int(match.group("pe"))

    raise ValueError(f"No southbound host-octet mapping exists for node {node_name!r}.")


def _southbound_ipv4_for_target(
    target: SouthboundTarget,
    *,
    config: SouthboundRolloutConfig,
) -> str:
    network = ip_interface(config.controller_southbound_address).network.network_address
    octets = str(network).split(".")
    if len(octets) != 4:
        raise ValueError("Only IPv4 controller southbound addresses are supported in this rollout.")
    return ".".join([octets[0], octets[1], octets[2], str(_southbound_host_octet(target.node_name))])


def build_southbound_inventory(topology_file: str | Path) -> list[SouthboundTarget]:
    """Derive deterministic rollout targets from a Containerlab topology YAML."""

    topology_path = Path(topology_file)
    loaded = _load_yaml(topology_path)
    nodes = loaded.get("topology", {}).get("nodes", {})
    if not isinstance(nodes, dict):
        raise ValueError(f"Topology at {topology_path} does not expose topology.nodes as a mapping.")

    targets: list[SouthboundTarget] = []
    for node_name, raw_node in sorted(nodes.items()):
        if not isinstance(raw_node, dict):
            continue
        management_ipv4 = raw_node.get("mgmt-ipv4")
        if not isinstance(management_ipv4, str) or not management_ipv4:
            continue
        role = classify_node_role(str(node_name))
        labels = raw_node.get("labels", {})
        startup_config = raw_node.get("startup-config")
        resolved_startup_config: str | None = None
        if isinstance(startup_config, str) and startup_config:
            resolved_startup_config = str((topology_path.parent / startup_config).resolve())
        targets.append(
            SouthboundTarget(
                node_name=str(node_name),
                vendor=_vendor_for_kind(str(raw_node.get("kind", "unknown"))),
                kind=str(raw_node.get("kind", "unknown")),
                management_ipv4=management_ipv4,
                loopback_ipv4=_loopback_ipv4_from_labels(labels) if isinstance(labels, dict) else None,
                bgp_asn=_bgp_asn_from_startup_config(resolved_startup_config) if role == "pe" else None,
                startup_config=resolved_startup_config,
                role=role,
                protocol_targets=protocol_targets_for_role(role),
                labels={str(key): str(value) for key, value in labels.items()} if isinstance(labels, dict) else {},
            )
        )
    return targets


def build_netconf_node_specs(
    targets: list[SouthboundTarget],
    *,
    config: SouthboundRolloutConfig,
) -> list[NetconfNodeSpec]:
    """Build the static ODL NETCONF onboarding list for all P and PE nodes."""

    specs: list[NetconfNodeSpec] = []
    for target in targets:
        if not target.protocol_targets.netconf:
            continue
        specs.append(
            NetconfNodeSpec(
                node_id=target.node_name,
                host=target.management_ipv4,
                port=config.netconf_port,
                username_env=config.netconf_username_env,
                password_env=config.netconf_password_env,
                default_username=config.netconf_default_username,
                default_password=config.netconf_default_password,
            )
        )
    return specs


def build_southbound_artifact_bundle(config: SouthboundRolloutConfig) -> SouthboundArtifactBundle:
    """Build all generated rollout artifacts from one repo-owned config."""

    targets = build_southbound_inventory(config.topology_file)
    return SouthboundArtifactBundle(
        config=config,
        targets=targets,
        netconf_nodes=build_netconf_node_specs(targets, config=config),
        protocol_peers=build_protocol_peer_specs(targets, config=config),
    )


def build_protocol_peer_specs(
    targets: list[SouthboundTarget],
    *,
    config: SouthboundRolloutConfig,
) -> list[ProtocolPeerSpec]:
    """Build repo-owned southbound peer assignments for BGP-LS and PCEP."""

    controller_peer_ipv4 = _controller_southbound_ip(config)
    peers: list[ProtocolPeerSpec] = []
    for target in targets:
        if not target.protocol_targets.bgp_ls:
            continue
        if not target.loopback_ipv4:
            raise ValueError(f"Target {target.node_name} is missing loopback-ipv4 label metadata.")
        if target.bgp_asn is None:
            raise ValueError(f"Target {target.node_name} is missing a derivable BGP autonomous-system.")
        peers.append(
            ProtocolPeerSpec(
                node_name=target.node_name,
                southbound_ipv4=_southbound_ipv4_for_target(target, config=config),
                loopback_ipv4=target.loopback_ipv4,
                peer_asn=target.bgp_asn,
                controller_peer_ipv4=controller_peer_ipv4,
                controller_asn=config.controller_asn,
            )
        )
    return peers


def render_netconf_onboarding_script(bundle: SouthboundArtifactBundle) -> str:
    """Render a deterministic repo-owned shell script for NETCONF onboarding."""

    lines = [
        "#!/bin/sh",
        "set -eu",
        "",
        'ODL_URL="${ODL_URL:-http://127.0.0.1:8181}"',
        'ODL_USERNAME="${ODL_USERNAME:-admin}"',
        'ODL_PASSWORD="${ODL_PASSWORD:-change_me}"',
        f'{bundle.config.netconf_username_env}="${{{bundle.config.netconf_username_env}:-{bundle.config.netconf_default_username}}}"',
        f'{bundle.config.netconf_password_env}="${{{bundle.config.netconf_password_env}:-{bundle.config.netconf_default_password}}}"',
        "",
        "apply_node() {",
        "  node_id=\"$1\"",
        "  host=\"$2\"",
        "  port=\"$3\"",
        "  tcp_only=\"$4\"",
        "  reconnect_on_changed_schema=\"$5\"",
        "  connection_timeout_millis=\"$6\"",
        "  keepalive_delay=\"$7\"",
        "  max_connection_attempts=\"$8\"",
        "  between_attempts_timeout_millis=\"$9\"",
        "  sleep_factor=\"${10}\"",
        "  curl -sS -u \"${ODL_USERNAME}:${ODL_PASSWORD}\" \\",
        "    -X PUT \\",
        "    -H 'Accept: application/json' \\",
        "    -H 'Content-Type: application/json' \\",
        "    --data @- \\",
        "    \"${ODL_URL}/rests/data/network-topology:network-topology/topology=topology-netconf/node=${node_id}\" >/dev/null <<EOF",
        '{"network-topology:node":[{"node-id":"${node_id}","netconf-node-topology:host":"${host}","netconf-node-topology:port":${port},"netconf-node-topology:username":"${ODL_NETCONF_USERNAME}","netconf-node-topology:password":"${ODL_NETCONF_PASSWORD}","netconf-node-topology:tcp-only":${tcp_only},"netconf-node-topology:reconnect-on-changed-schema":${reconnect_on_changed_schema},"netconf-node-topology:connection-timeout-millis":${connection_timeout_millis},"netconf-node-topology:keepalive-delay":${keepalive_delay},"netconf-node-topology:max-connection-attempts":${max_connection_attempts},"netconf-node-topology:between-attempts-timeout-millis":${between_attempts_timeout_millis},"netconf-node-topology:sleep-factor":${sleep_factor}}]}',
        "EOF",
        "  echo \"mounted ${node_id}\"",
        "}",
        "",
    ]
    for spec in bundle.netconf_nodes:
        lines.append(
            "apply_node "
            + f"'{spec.node_id}' '{spec.host}' '{spec.port}' "
            + f"'{str(spec.tcp_only).lower()}' '{str(spec.reconnect_on_changed_schema).lower()}' "
            + f"'{spec.connection_timeout_millis}' '{spec.keepalive_delay}' "
            + f"'{spec.max_connection_attempts}' '{spec.between_attempts_timeout_millis}' '{spec.sleep_factor}'"
        )
    lines.append("")
    return "\n".join(lines)


def render_odl_southbound_config_script(bundle: SouthboundArtifactBundle) -> str:
    """Render a deterministic ODL interface and route bootstrap script."""

    lines = [
        "#!/bin/sh",
        "set -eu",
        "",
        f'ODL_SOUTHBAND_INTERFACE="${{ODL_SOUTHBAND_INTERFACE:-{bundle.config.controller_southbound_interface}}}"',
        f'ODL_SOUTHBAND_IPV4="${{ODL_SOUTHBAND_IPV4:-{bundle.config.controller_southbound_address}}}"',
        'ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS="${ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS:-30}"',
        "",
        'if ! command -v ip >/dev/null 2>&1; then',
        '  echo "ODL southbound bootstrap requires iproute2 inside the controller image." >&2',
        '  exit 1',
        'fi',
        '',
        'remaining_wait="${ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS}"',
        'while [ ! -d "/sys/class/net/${ODL_SOUTHBAND_INTERFACE}" ] && [ "${remaining_wait}" -gt 0 ]; do',
        '  sleep 1',
        '  remaining_wait=$((remaining_wait - 1))',
        'done',
        '',
        'if [ ! -d "/sys/class/net/${ODL_SOUTHBAND_INTERFACE}" ]; then',
        '  echo "ODL southbound interface ${ODL_SOUTHBAND_INTERFACE} is missing; verify bridge prep and topology wiring." >&2',
        '  exit 1',
        "fi",
        "",
        'ip link set "${ODL_SOUTHBAND_INTERFACE}" up',
        'ip addr replace "${ODL_SOUTHBAND_IPV4}" dev "${ODL_SOUTHBAND_INTERFACE}"',
        "",
    ]
    for peer in bundle.protocol_peers:
        lines.append(
            'ip route replace '
            + f"'{peer.loopback_ipv4}/32' via '{peer.southbound_ipv4}' dev \"${{ODL_SOUTHBAND_INTERFACE}}\""
        )
    lines.append("")
    return "\n".join(lines)


def render_odl_bgp_protocols_config_xml(bundle: SouthboundArtifactBundle) -> str:
    """Render repo-owned BGP-LS protocol seed XML for the ODL config-loader."""

    controller_router_id = _controller_southbound_ip(bundle.config)
    peer_group_names = {
        peer.peer_asn: f"external-as{peer.peer_asn}" for peer in bundle.protocol_peers
    }
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<protocols xmlns="http://openconfig.net/yang/network-instance">',
        '    <protocol>',
        f'        <name>{bundle.config.controller_bgp_rib_id}</name>',
        '        <identifier xmlns:x="http://openconfig.net/yang/policy-types">x:BGP</identifier>',
        '        <bgp xmlns="urn:opendaylight:params:xml:ns:yang:bgp:openconfig-extensions">',
        '            <global>',
        '                <config>',
        f'                    <router-id>{controller_router_id}</router-id>',
        f'                    <as>{bundle.config.controller_asn}</as>',
        '                </config>',
        '                <apply-policy>',
        '                    <config>',
        '                        <default-export-policy>REJECT-ROUTE</default-export-policy>',
        '                        <default-import-policy>REJECT-ROUTE</default-import-policy>',
        '                        <import-policy>default-odl-import-policy</import-policy>',
        '                        <export-policy>default-odl-export-policy</export-policy>',
        '                    </config>',
        '                </apply-policy>',
        '                <afi-safis>',
        '                    <afi-safi>',
        '                        <afi-safi-name>LINKSTATE</afi-safi-name>',
        '                    </afi-safi>',
        '                </afi-safis>',
        '            </global>',
        '            <neighbors>',
    ]
    for peer in bundle.protocol_peers:
        lines.extend(
            [
                '                <neighbor>',
                f'                    <neighbor-address>{peer.loopback_ipv4}</neighbor-address>',
                '                    <config>',
                f'                        <peer-group>/bgp/neighbors/neighbor/bgp/peer-groups/peer-group[peer-group-name="{peer_group_names[peer.peer_asn]}"]</peer-group>',
                '                    </config>',
                '                </neighbor>',
            ]
        )
    lines.extend(
        [
            '            </neighbors>',
            '            <peer-groups>',
        ]
    )
    for peer_asn in sorted(peer_group_names):
        peer_group_name = peer_group_names[peer_asn]
        lines.extend(
            [
                '                <peer-group>',
                f'                    <peer-group-name>{peer_group_name}</peer-group-name>',
                '                    <config>',
                '                        <peer-type>EXTERNAL</peer-type>',
                f'                        <peer-as>{peer_asn}</peer-as>',
                '                    </config>',
                '                    <transport>',
                '                        <config>',
                '                            <remote-port>179</remote-port>',
                '                            <passive-mode>true</passive-mode>',
                '                        </config>',
                '                    </transport>',
                '                    <timers>',
                '                        <config>',
                '                            <hold-time>180</hold-time>',
                '                            <connect-retry>10</connect-retry>',
                '                        </config>',
                '                    </timers>',
                '                    <graceful-restart>',
                '                        <config>',
                '                            <restart-time>60</restart-time>',
                '                        </config>',
                '                    </graceful-restart>',
                '                    <afi-safis>',
                '                        <afi-safi>',
                '                            <afi-safi-name>LINKSTATE</afi-safi-name>',
                '                            <graceful-restart>',
                '                                <config>',
                '                                    <enabled>true</enabled>',
                '                                </config>',
                '                            </graceful-restart>',
                '                        </afi-safi>',
                '                    </afi-safis>',
                '                </peer-group>',
            ]
        )
    lines.extend(
        [
            '            </peer-groups>',
            '        </bgp>',
            '    </protocol>',
            '</protocols>',
            '',
        ]
    )
    return "\n".join(lines)


def render_odl_bgp_topology_config_xml(bundle: SouthboundArtifactBundle) -> str:
    """Render repo-owned BGP-LS topology seed XML for the ODL config-loader."""

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<network-topology xmlns="urn:TBD:params:xml:ns:yang:network-topology">',
        '    <topology>',
        f'        <topology-id>{bundle.config.controller_bgp_linkstate_topology_id}</topology-id>',
        '        <topology-types>',
        '            <bgp-linkstate-topology xmlns="urn:opendaylight:params:xml:ns:yang:odl-bgp-topology-types"/>',
        '        </topology-types>',
        f'        <rib-id xmlns="urn:opendaylight:params:xml:ns:yang:odl-bgp-topology-config">{bundle.config.controller_bgp_rib_id}</rib-id>',
        '    </topology>',
        '</network-topology>',
        '',
    ]
    return "\n".join(lines)


def render_odl_pcep_topology_config_xml(bundle: SouthboundArtifactBundle) -> str:
    """Render repo-owned PCEP topology seed XML for the ODL config-loader."""

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<network-topology xmlns="urn:TBD:params:xml:ns:yang:network-topology">',
        '    <topology xmlns="urn:TBD:params:xml:ns:yang:network-topology">',
        f'        <topology-id>{bundle.config.controller_pcep_topology_id}</topology-id>',
        '        <topology-types>',
        '            <topology-pcep xmlns="urn:opendaylight:params:xml:ns:yang:topology:pcep">',
        '                <session-config>',
        '                    <rpc-timeout>30</rpc-timeout>',
        '                    <listen-address>0.0.0.0</listen-address>',
        f'                    <listen-port>{bundle.config.pcep_port}</listen-port>',
        '                    <dead-timer-value>120</dead-timer-value>',
        '                    <keep-alive-timer-value>30</keep-alive-timer-value>',
        '                </session-config>',
        f'                <ted-name>{bundle.config.controller_bgp_linkstate_topology_id}</ted-name>',
        '            </topology-pcep>',
        '        </topology-types>',
        '    </topology>',
        '</network-topology>',
        '',
    ]
    return "\n".join(lines)


def render_odl_bgp_peer_acceptor_script(bundle: SouthboundArtifactBundle) -> str:
    """Render a deterministic RESTCONF bootstrap script for ODL's BGP listener port."""

    lines = [
        "#!/bin/sh",
        "set -eu",
        "",
        'ODL_URL="${ODL_URL:-http://127.0.0.1:8181}"',
        'ODL_USERNAME="${ODL_USERNAME:-admin}"',
        'ODL_PASSWORD="${ODL_PASSWORD:-change_me}"',
        'ODL_BGP_ACCEPTOR_NAME="${ODL_BGP_ACCEPTOR_NAME:-default}"',
        'ODL_BGP_BIND_ADDRESS="${ODL_BGP_BIND_ADDRESS:-0.0.0.0}"',
        f'ODL_BGP_BIND_PORT="${{ODL_BGP_BIND_PORT:-{bundle.config.controller_bgp_binding_port}}}"',
        "",
        'curl -sS -u "${ODL_USERNAME}:${ODL_PASSWORD}" \\',
        '  -X PUT \\',
        "  -H 'Accept: application/json' \\",
        "  -H 'Content-Type: application/json' \\",
        '  --data @- \\',
        '  "${ODL_URL}/rests/data/odl-bgp-peer-acceptor-config:bgp-peer-acceptor-config=${ODL_BGP_ACCEPTOR_NAME}" >/dev/null <<EOF',
        '{"odl-bgp-peer-acceptor-config:bgp-peer-acceptor-config":[{"config-name":"${ODL_BGP_ACCEPTOR_NAME}","binding-address":"${ODL_BGP_BIND_ADDRESS}","binding-port":${ODL_BGP_BIND_PORT}}]}',
        'EOF',
        'echo "mounted ${ODL_BGP_ACCEPTOR_NAME}"',
        "",
    ]
    return "\n".join(lines)


def render_inventory_markdown(bundle: SouthboundArtifactBundle) -> str:
    """Render a concise phase-0 survey table for documentation."""

    lines = [
        "# ODL Southbound Rollout Inventory Summary",
        "",
        f"- Topology file: `{bundle.config.topology_file}`",
        f"- Controller northbound/admin address: `{bundle.config.controller_northbound_address}`",
        f"- Controller southbound/protocol address: `{bundle.config.controller_southbound_address}`",
        f"- Southbound bridge: `{bundle.config.controller_southbound_bridge_name}`",
        f"- ODL southbound interface: `{bundle.config.controller_southbound_interface}`",
        f"- Controller ASN: `{bundle.config.controller_asn}`",
        "",
        "| Node | Role | Mgmt IPv4 | Loopback IPv4 | Protocol Peer IPv4 | BGP-LS | PCEP | NETCONF | Startup Config |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    protocol_peer_map = {peer.node_name: peer.southbound_ipv4 for peer in bundle.protocol_peers}
    for target in bundle.targets:
        lines.append(
            "| "
            + f"{target.node_name} | {target.role} | {target.management_ipv4} | "
            + f"{target.loopback_ipv4 or ''} | {protocol_peer_map.get(target.node_name, '')} | "
            + f"{'yes' if target.protocol_targets.bgp_ls else 'no'} | "
            + f"{'yes' if target.protocol_targets.pcep else 'no'} | "
            + f"{'yes' if target.protocol_targets.netconf else 'no'} | "
            + f"{target.startup_config or ''} |"
        )
    lines.append("")
    return "\n".join(lines)