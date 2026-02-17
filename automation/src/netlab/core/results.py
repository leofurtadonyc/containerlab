from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .model import CheckResult, CheckStatus, Severity


@dataclass(slots=True)
class RunSummary:
    results: list[CheckResult] = field(default_factory=list)

    def add(self, result: CheckResult) -> None:
        self.results.append(result)

    def extend(self, results: list[CheckResult]) -> None:
        self.results.extend(results)

    def counts_by_status(self) -> dict[str, int]:
        counts = {status.value: 0 for status in CheckStatus}
        for r in self.results:
            counts[r.status.value] += 1
        return counts

    def counts_by_phase(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for r in self.results:
            out[r.phase] = out.get(r.phase, 0) + 1
        return out

    @property
    def exit_code(self) -> int:
        return 1 if any(r.status == CheckStatus.FAIL and r.severity == Severity.ERROR for r in self.results) else 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": {
                "counts_by_status": self.counts_by_status(),
                "counts_by_phase": self.counts_by_phase(),
                "exit_code": self.exit_code,
            },
            "results": [r.to_dict() for r in self.results],
        }
