from netlab.core.model import CheckResult, ValidationContext


def validate(ctx: ValidationContext) -> list[CheckResult]:
    # Legacy module retained for compatibility; checks run via validators.engine
    _ = ctx
    return []
