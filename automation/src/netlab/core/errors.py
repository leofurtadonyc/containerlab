class NetlabError(Exception):
    """Base error for netlab exceptions."""


class IntentValidationError(NetlabError):
    """Raised when intent yaml is invalid."""
