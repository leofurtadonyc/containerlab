from dataclasses import dataclass


@dataclass(slots=True)
class GnmiResponse:
    ok: bool
    payload: dict
    error: str | None = None


class GnmiTransport:
    def __init__(self) -> None:
        self._unsupported_reason = "gNMI client unavailable in this environment"

    def get(self, node: str, path: str) -> GnmiResponse:
        return GnmiResponse(ok=False, payload={}, error=f"{self._unsupported_reason}: {node}:{path}")
