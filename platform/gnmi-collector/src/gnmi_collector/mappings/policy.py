"""Mapping helpers for bounded live policy inventory."""

from datetime import UTC, datetime

from gnmi_collector.models.policy import NormalizedPolicyRecord, PolicyRawRecord


def derive_policy_observed_at(raw_records: list[PolicyRawRecord]) -> datetime | None:
    """Return the newest observed timestamp across collected policy records."""
    observed_values = [record.observed_at for record in raw_records if record.observed_at is not None]
    if not observed_values:
        return None
    return max(observed_values).astimezone(UTC)


def map_policy_records(raw_records: list[PolicyRawRecord]) -> list[NormalizedPolicyRecord]:
    """Map raw policy records into normalized per-policy records when available."""
    del raw_records
    # The first live slice is intentionally bounded to SR policy counters.
    # Per-policy details remain empty until a deeper, still vendor-neutral path is added.
    return []


def summarize_policy_counts(raw_records: list[PolicyRawRecord]) -> dict[str, int]:
    """Aggregate bounded live SR policy counters across all collected targets."""
    counts = {
        "observed_target_count": 0,
        "policy_capable_target_count": 0,
        "policy_count": 0,
        "active_policy_count": 0,
        "static_policy_count": 0,
        "bgp_policy_count": 0,
    }
    for record in raw_records:
        if record.collection_status == "failure":
            continue
        counts["observed_target_count"] += 1
        if record.sr_policy_counts.get("ttm-preferences", 0) > 0:
            counts["policy_capable_target_count"] += 1
        counts["policy_count"] += (
            record.sr_policy_counts.get("static-local-policies", 0)
            + record.sr_policy_counts.get("static-non-local-policies", 0)
            + record.sr_policy_counts.get("bgp-policies", 0)
        )
        counts["active_policy_count"] += (
            record.sr_policy_counts.get("active-static-local-policies", 0)
            + record.sr_policy_counts.get("active-bgp-policies", 0)
        )
        counts["static_policy_count"] += (
            record.sr_policy_counts.get("static-local-policies", 0)
            + record.sr_policy_counts.get("static-non-local-policies", 0)
        )
        counts["bgp_policy_count"] += record.sr_policy_counts.get("bgp-policies", 0)
    return counts
