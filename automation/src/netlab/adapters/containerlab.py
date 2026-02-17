from __future__ import annotations

import subprocess
from pathlib import Path

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
        self.nodes_map = dict(self.topology.get("topology", {}).get("nodes", {}))
        self.nodes = list(self.nodes_map.keys())

    def _resolve_topology_path(self) -> Path:
        direct = self.lab_dir / f"{self.lab}.clab.yml"
        if direct.exists():
            return direct
        files = sorted(self.lab_dir.glob("*.clab.yml"))
        if not files:
            raise FileNotFoundError(f"No .clab.yml found under {self.lab_dir}")
        return files[0]

    def node_kind(self, node: str) -> str:
        return str(self.nodes_map.get(node, {}).get("kind", "unknown"))

    def container_name(self, node: str) -> str:
        return f"clab-{self.clab_name}-{node}"

    def exec(self, node: str, cmd: str) -> CmdResult:
        p = subprocess.run(["docker", "exec", self.container_name(node), "bash", "-lc", cmd], capture_output=True, text=True)
        return CmdResult(p.returncode, p.stdout.strip(), p.stderr.strip())

    def eos_cli(self, node: str, command: str) -> CmdResult:
        container = self.container_name(node)
        p = subprocess.run(["docker", "exec", container, "Cli", "-c", command], capture_output=True, text=True)
        first = CmdResult(p.returncode, p.stdout.strip(), p.stderr.strip())

        combined = (first.stdout + "\n" + first.stderr).lower()
        needs_enable = "privileged mode required" in combined or "% invalid input" in combined
        if not needs_enable:
            return first

        # Retry via interactive CLI flow with enable mode.
        script = "cat <<'EOF' | Cli\nenable\n" + command + "\nEOF"
        p2 = subprocess.run(["docker", "exec", container, "bash", "-lc", script], capture_output=True, text=True)
        second = CmdResult(p2.returncode, p2.stdout.strip(), p2.stderr.strip())

        second_combined = (second.stdout + "\n" + second.stderr).lower()
        if second.rc == 0 and "privileged mode required" not in second_combined:
            return second
        return first

    def list_nodes(self) -> list[str]:
        return list(self.nodes)

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
