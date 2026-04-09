#!/usr/bin/env python3
"""Generate deterministic ODL southbound rollout artifacts from topology YAML."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from app_api.integrations.odl.southbound_inventory import (
    build_southbound_artifact_bundle,
    load_rollout_config,
    render_inventory_markdown,
    render_odl_bgp_peer_acceptor_script,
    render_odl_bgp_protocols_config_xml,
    render_odl_bgp_topology_config_xml,
    render_odl_pcep_topology_config_xml,
    render_netconf_onboarding_script,
    render_odl_southbound_config_script,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--config",
        default="../../odl/config/southbound-rollout.yaml",
        help="Path to the rollout config YAML, relative to this script.",
    )
    parser.add_argument(
        "--output-dir",
        default="../../odl/config/generated",
        help="Directory where generated artifacts will be written, relative to this script.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    config = load_rollout_config((script_dir / args.config).resolve())
    bundle = build_southbound_artifact_bundle(config)
    output_dir = (script_dir / args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    (output_dir / "southbound-inventory.json").write_text(
        json.dumps(bundle.inventory_summary(), indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "netconf-node-specs.json").write_text(
        json.dumps([spec.model_dump(mode="json") for spec in bundle.netconf_nodes], indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "protocol-peer-specs.json").write_text(
        json.dumps([peer.model_dump(mode="json") for peer in bundle.protocol_peers], indent=2) + "\n",
        encoding="utf-8",
    )
    netconf_script = output_dir / "apply-netconf-onboarding.sh"
    netconf_script.write_text(render_netconf_onboarding_script(bundle), encoding="utf-8")
    netconf_script.chmod(0o755)
    odl_southbound_script = output_dir / "configure-odl-southbound.sh"
    odl_southbound_script.write_text(render_odl_southbound_config_script(bundle), encoding="utf-8")
    odl_southbound_script.chmod(0o755)
    (output_dir / "protocols-config.xml").write_text(
        render_odl_bgp_protocols_config_xml(bundle),
        encoding="utf-8",
    )
    (output_dir / "network-topology-bgp-config.xml").write_text(
        render_odl_bgp_topology_config_xml(bundle),
        encoding="utf-8",
    )
    (output_dir / "network-topology-pcep-config.xml").write_text(
        render_odl_pcep_topology_config_xml(bundle),
        encoding="utf-8",
    )
    peer_acceptor_script = output_dir / "configure-odl-bgp-peer-acceptor.sh"
    peer_acceptor_script.write_text(render_odl_bgp_peer_acceptor_script(bundle), encoding="utf-8")
    peer_acceptor_script.chmod(0o755)
    (output_dir / "inventory-summary.md").write_text(
        render_inventory_markdown(bundle),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())