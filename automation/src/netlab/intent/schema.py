from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class GnmiDefaults:
    port: int = 6030
    username: str = "clab"
    password: str = "clab"


@dataclass(slots=True)
class CheckDef:
    name: str
    phase: str
    kind: str
    severity: str = "ERROR"
    params: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class IntentModel:
    lab_name: str
    gnmi: GnmiDefaults
    inventory: dict[str, Any]
    services: dict[str, Any]
    checks: list[CheckDef]
    raw: dict[str, Any]
