from typing import Callable

from netlab.evidence.cli import CliTransport
from netlab.evidence.gnmi import GnmiTransport


class EvidenceClient:
    def __init__(self, gnmi: GnmiTransport, cli: CliTransport) -> None:
        self.gnmi = gnmi
        self.cli = cli
        self._cache: dict[str, dict] = {}
        self._unsupported: set[str] = set()

    def collect(self, cache_key: str, gnmi_path: str, node: str, cli_fetcher: Callable[[], dict]) -> dict:
        if cache_key in self._cache:
            return self._cache[cache_key]

        if gnmi_path not in self._unsupported:
            res = self.gnmi.get(node=node, path=gnmi_path)
            if res.ok:
                out = {"source": "gnmi", "data": res.payload}
                self._cache[cache_key] = out
                return out
            self._unsupported.add(gnmi_path)

        out = {"source": "cli", "data": cli_fetcher()}
        self._cache[cache_key] = out
        return out
