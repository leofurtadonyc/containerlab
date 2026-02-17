from netlab.core.model import CheckResult, CheckStatus, Severity
from netlab.core.results import RunSummary


def test_exit_code_on_error_fail() -> None:
    summary = RunSummary()
    summary.add(CheckResult("phase", "ok", CheckStatus.PASS, Severity.INFO, "ok"))
    assert summary.exit_code == 0
    summary.add(CheckResult("phase", "bad", CheckStatus.FAIL, Severity.ERROR, "bad"))
    assert summary.exit_code == 1
