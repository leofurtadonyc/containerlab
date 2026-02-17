from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

from netlab.adapters.base import CmdResult
from netlab.utils.yaml import load_yaml


class ContainerlabAdapter:
    def __init__(self, repo_root: Path, lab: str) -> None:
        self.repo_root = repo_root
        self.lab = lab
        self.lab_dir = repo_root / lab
        self.topology_file = self._resolve_topology_path()
        self.topology = load_yaml(self.topology_file)
        self.clab_name = self.topology.get("name", lab)
        self.nodes = list(self.topology.get("topology", {}).get("nodes", {}).keys())

    def _resolve_topology_path(self) -> Path:
        direct = self.lab_dir / f"{self.lab}.clab.yml"
        if direct.exists():
            return direct
        files = sorted(self.lab_dir.glob("*.clab.yml"))
        if not files:
            raise FileNotFoundError(f"No .clab.yml found under {self.lab_dir}")
        return files[0]

    def container_name(self, node: str) -> str:
        return f"clab-{self.clab_name}-{node}"

    def exec(self, node: str, cmd: str) -> CmdResult:
        p = subprocess.run(["docker", "exec", self.container_name(node), "bash", "-lc", cmd], capture_output=True, text=True)
        return CmdResult(p.returncode, p.stdout.strip(), p.stderr.strip())

    def eos_cli(self, node: str, command: str) -> CmdResult:
        p = subprocess.run(["docker", "exec", self.container_name(node), "Cli", "-c", command], capture_output=True, text=True)
        return CmdResult(p.returncode, p.stdout.strip(), p.stderr.strip())

    def list_nodes(self) -> list[str]:
        return list(self.nodes)

    def list_by_role(self, intent: Any) -> dict[str, list[str]]:
        out = {
            "spines": list(intent.spines),
            "leaves": [n for group in intent.leaves.values() for n in group],
            "hosts": [n for group in intent.hosts.values() for n in group],
        }
        if intent.dci:
            out["routers_dc1"] = list(intent.dci.routers_dc1)
            out["routers_dc2"] = list(intent.dci.routers_dc2)
        return out

    def get_mgmt_ip(self, node: str) -> str | None:
        p = subprocess.run(
            ["docker", "inspect", "-f", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", self.container_name(node)],
            capture_output=True,
            text=True,
        )
        if p.returncode != 0:
            return None
        ip = p.stdout.strip()
        return ip if ip else None
