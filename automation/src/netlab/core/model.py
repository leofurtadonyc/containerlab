from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class CheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARN = "WARN"
    SKIP = "SKIP"


class Severity(str, Enum):
    ERROR = "ERROR"
    WARN = "WARN"
    INFO = "INFO"


@dataclass(slots=True)
class CheckResult:
    phase: str
    name: str
    status: CheckStatus
    severity: Severity
    message: str
    evidence: dict[str, Any] = field(default_factory=dict)
    remediation: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "phase": self.phase,
            "name": self.name,
            "status": self.status.value,
            "severity": self.severity.value,
            "message": self.message,
            "evidence": self.evidence,
            "remediation": self.remediation,
        }


@dataclass(slots=True)
class ValidationContext:
    lab: str
    profile: str
    intent: Any
    adapter: Any
    evidence_client: Any
