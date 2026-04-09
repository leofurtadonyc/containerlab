"""Tests for topology-driven ODL southbound rollout inventory generation."""

from __future__ import annotations

import os
from pathlib import Path

from app_api.integrations.odl.southbound_inventory import (
    SouthboundRolloutConfig,
    build_southbound_artifact_bundle,
    build_southbound_inventory,
    classify_node_role,
    load_rollout_config,
    render_netconf_onboarding_script,
    render_odl_bgp_peer_acceptor_script,
    render_odl_bgp_protocols_config_xml,
    render_odl_bgp_topology_config_xml,
    render_odl_pcep_topology_config_xml,
    render_odl_southbound_config_script,
)


REPO_ROOT = Path(__file__).resolve().parents[3]
LAB_TOPOLOGY = REPO_ROOT / "nokia-sr-mpls" / "nokia-sr-mpls-lab3-full.clab.yml"


def test_classify_node_role_uses_existing_nokia_lab_naming() -> None:
    assert classify_node_role("PE1") == "pe"
    assert classify_node_role("CSC1-PE1") == "pe"
    assert classify_node_role("P1") == "p"
    assert classify_node_role("CSC2-P4") == "p"
    assert classify_node_role("CPE-A1") == "other"
    assert classify_node_role("NOC-R1") == "other"


def test_build_southbound_inventory_matches_lab3_full_targeting() -> None:
    inventory = build_southbound_inventory(LAB_TOPOLOGY)

    pe_targets = [target for target in inventory if target.role == "pe"]
    p_targets = [target for target in inventory if target.role == "p"]
    other_targets = [target for target in inventory if target.role == "other"]

    assert len(inventory) == 34
    assert len(pe_targets) == 8
    assert len(p_targets) == 16
    assert len(other_targets) == 10
    assert {target.node_name for target in pe_targets} >= {"PE1", "PE2", "PE3", "PE4", "CSC1-PE1", "CSC1-PE2", "CSC2-PE1", "CSC2-PE2"}
    assert {target.node_name for target in p_targets} >= {"P1", "P8", "CSC1-P1", "CSC2-P4"}
    assert all(target.protocol_targets.bgp_ls for target in pe_targets)
    assert all(target.protocol_targets.pcep for target in pe_targets)
    assert all(target.protocol_targets.netconf for target in pe_targets)
    assert not any(target.protocol_targets.bgp_ls for target in p_targets)
    assert all(target.protocol_targets.netconf for target in p_targets)
    assert all(not str(target.startup_config).startswith("/") for target in inventory if target.startup_config)


def test_load_rollout_config_resolves_relative_topology_paths(tmp_path: Path) -> None:
    config_path = tmp_path / "southbound-rollout.yaml"
    relative_topology = os.path.relpath(LAB_TOPOLOGY, start=tmp_path)
    config_path.write_text(
        "\n".join(
            [
                f"topology_file: {relative_topology}",
                "controller_northbound_address: 192.168.0.232",
                "controller_southbound_address: 10.90.0.10/24",
                "controller_asn: 64990",
                "",
            ]
        ),
        encoding="utf-8",
    )

    config = load_rollout_config(config_path)

    assert Path(config.topology_file).resolve() == LAB_TOPOLOGY.resolve()


def test_render_netconf_onboarding_script_covers_all_p_and_pe_targets() -> None:
    bundle = build_southbound_artifact_bundle(
        SouthboundRolloutConfig(
            topology_file=str(LAB_TOPOLOGY),
            controller_northbound_address="192.168.0.232",
            controller_southbound_address="10.90.0.10/24",
            controller_asn=64990,
        )
    )

    script = render_netconf_onboarding_script(bundle)
    odl_script = render_odl_southbound_config_script(bundle)
    protocols_xml = render_odl_bgp_protocols_config_xml(bundle)
    bgp_topology_xml = render_odl_bgp_topology_config_xml(bundle)
    pcep_topology_xml = render_odl_pcep_topology_config_xml(bundle)
    peer_acceptor_script = render_odl_bgp_peer_acceptor_script(bundle)

    assert len(bundle.netconf_nodes) == 24
    assert len(bundle.protocol_peers) == 8
    assert bundle.protocol_peers[0].peer_asn in {64513, 64515, 64516}
    assert bundle.inventory_summary()["topology_file"] == "nokia-sr-mpls/nokia-sr-mpls-lab3-full.clab.yml"
    assert all(not target["startup_config"].startswith("/") for target in bundle.inventory_summary()["targets"] if target["startup_config"])
    assert "ODL_NETCONF_USERNAME" in script
    assert "ODL_NETCONF_PASSWORD" in script
    assert "--data @-" in script
    assert ">/dev/null <<EOF" in script
    assert '"netconf-node-topology:username":"${ODL_NETCONF_USERNAME}"' in script
    assert "apply_node 'PE1' '172.20.20.107' '830'" in script
    assert "apply_node 'P1' '172.20.20.109' '830'" in script
    assert "apply_node 'CSC2-P4' '172.20.20.132' '830'" in script
    assert "apply_node 'CPE-A1'" not in script
    assert 'ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS="${ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS:-30}"' in odl_script
    assert 'remaining_wait="${ODL_SOUTHBAND_INTERFACE_WAIT_SECONDS}"' in odl_script
    assert 'command -v ip' in odl_script
    assert 'ODL southbound bootstrap requires iproute2 inside the controller image.' in odl_script
    assert 'verify bridge prep and topology wiring' in odl_script
    assert "ODL_SOUTHBAND_INTERFACE" in odl_script
    assert "ip addr replace \"${ODL_SOUTHBAND_IPV4}\" dev \"${ODL_SOUTHBAND_INTERFACE}\"" in odl_script
    assert "ip route replace '100.65.255.11/32' via '10.90.0.11'" in odl_script
    assert "ip route replace '100.64.255.11/32' via '10.90.0.111'" in odl_script
    assert "<name>lab-bgp-rib</name>" in protocols_xml
    assert "<router-id>10.90.0.10</router-id>" in protocols_xml
    assert "<neighbor-address>100.65.255.11</neighbor-address>" in protocols_xml
    assert "<peer-group-name>external-as64515</peer-group-name>" in protocols_xml
    assert "<peer-group-name>external-as64513</peer-group-name>" in protocols_xml
    assert "<peer-group-name>external-as64516</peer-group-name>" in protocols_xml
    assert "<peer-as>64515</peer-as>" in protocols_xml
    assert "<afi-safi-name>LINKSTATE</afi-safi-name>" in protocols_xml
    assert "<topology-id>lab-linkstate-topology</topology-id>" in bgp_topology_xml
    assert "<rib-id xmlns=\"urn:opendaylight:params:xml:ns:yang:odl-bgp-topology-config\">lab-bgp-rib</rib-id>" in bgp_topology_xml
    assert "<topology-id>pcep-topology</topology-id>" in pcep_topology_xml
    assert "<ted-name>lab-linkstate-topology</ted-name>" in pcep_topology_xml
    assert "<listen-port>4189</listen-port>" in pcep_topology_xml
    assert 'ODL_BGP_ACCEPTOR_NAME="${ODL_BGP_ACCEPTOR_NAME:-default}"' in peer_acceptor_script
    assert 'ODL_BGP_BIND_ADDRESS="${ODL_BGP_BIND_ADDRESS:-0.0.0.0}"' in peer_acceptor_script
    assert 'ODL_BGP_BIND_PORT="${ODL_BGP_BIND_PORT:-179}"' in peer_acceptor_script
    assert '/rests/data/odl-bgp-peer-acceptor-config:bgp-peer-acceptor-config=${ODL_BGP_ACCEPTOR_NAME}' in peer_acceptor_script
    assert '"binding-port":${ODL_BGP_BIND_PORT}' in peer_acceptor_script