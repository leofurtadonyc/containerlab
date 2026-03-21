"""Parse collector-delivered ISO-8601 timestamps for durable persistence."""

from datetime import UTC, datetime


def parse_collector_observed_at(raw: str | None) -> datetime | None:
    """Parse a collector boundary observation timestamp for sync-run persistence.

    Returns None when the value is missing, empty, or not parseable — callers must
    treat None as honest absence rather than fabricating a substitute.
    """
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt
