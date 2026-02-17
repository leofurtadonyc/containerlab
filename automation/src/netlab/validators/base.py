from netlab.core.model import CheckResult, CheckStatus, Severity


def make_result(phase: str, name: str, ok: bool, message: str, evidence: dict | None = None) -> CheckResult:
    return CheckResult(
        phase=phase,
        name=name,
        status=CheckStatus.PASS if ok else CheckStatus.FAIL,
        severity=Severity.INFO if ok else Severity.ERROR,
        message=message,
        evidence=evidence or {},
    )
