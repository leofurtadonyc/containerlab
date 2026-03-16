"""Mapping helpers for bounded live policy inventory."""

from collections import Counter
from datetime import UTC, datetime

from gnmi_collector.models.policy import (
    NormalizedPolicyCandidatePathRecord,
    NormalizedPolicyRecord,
    NormalizedPolicyTargetFootprint,
    PolicyDetailBlockerReason,
    PolicyRawRecord,
)


def _resolve_detail_blocker_reason(
    *,
    raw_record: PolicyRawRecord,
    policy_capable: bool,
    observed_policy_count: int,
    detail_record_count: int,
) -> PolicyDetailBlockerReason:
    """Return one bounded reason code for why per-target policy detail is limited."""
    if raw_record.collection_status == "failure":
        return "collection_failed"
    if raw_record.collection_status == "partial":
        return "collection_partial"
    if not policy_capable:
        return "policy_capability_unavailable"
    if observed_policy_count == 0:
        return "no_policies_observed"
    if detail_record_count == 0:
        return "per_policy_details_unavailable"
    if detail_record_count < observed_policy_count:
        return "partial_detail_coverage"
    return "none"


def _normalize_key(value: str) -> str:
    return value.split(":", 1)[-1]


def _iter_nodes(node: object):
    if isinstance(node, dict):
        yield node
        for child in node.values():
            yield from _iter_nodes(child)
    elif isinstance(node, list):
        for item in node:
            yield from _iter_nodes(item)


def _find_first(node: object, candidate_keys: set[str]) -> object | None:
    for item in _iter_nodes(node):
        if not isinstance(item, dict):
            continue
        for key, value in item.items():
            if _normalize_key(key) in candidate_keys:
                return value
    return None


def _as_str(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    if isinstance(value, (int, float)):
        return str(value)
    return None


def _as_int(value: object) -> int | None:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            return int(stripped)
        except ValueError:
            return None
    return None


def _candidate_path_nodes(node: object) -> list[dict[str, object]]:
    candidate_nodes: list[dict[str, object]] = []
    for item in _iter_nodes(node):
        if not isinstance(item, dict):
            continue
        keys = {_normalize_key(key) for key in item}
        if "preference" in keys and (
            {"candidate-path-name", "name"} & keys or {"active", "oper-state"} & keys
        ):
            candidate_nodes.append(item)
    return candidate_nodes


def _map_candidate_path_state(node: dict[str, object]) -> str:
    active_value = _find_first(node, {"active"})
    if active_value is True:
        return "active"
    oper_value = _as_str(_find_first(node, {"oper-state", "state", "path-state"}))
    if oper_value is not None:
        lowered = oper_value.lower()
        if lowered in {"up", "active", "selected", "installed"}:
            return "active"
        if lowered in {"inactive", "standby", "valid", "available"}:
            return "inactive"
    validation_state = _as_str(_find_first(node, {"validation-state", "validity-state"}))
    if validation_state is not None:
        lowered = validation_state.lower()
        if lowered in {"valid", "available"}:
            return "inactive"
        if lowered in {"invalid", "failed"}:
            return "unknown"
    return "unknown"


def _map_candidate_paths(payload: dict[str, object]) -> list[NormalizedPolicyCandidatePathRecord]:
    items: list[NormalizedPolicyCandidatePathRecord] = []
    for index, candidate_node in enumerate(_candidate_path_nodes(payload), start=1):
        name = (
            _as_str(_find_first(candidate_node, {"candidate-path-name", "name"}))
            or f"candidate-{index}"
        )
        preference = _as_int(_find_first(candidate_node, {"preference"}))
        notes: list[str] = []
        protocol_origin = _as_str(_find_first(candidate_node, {"protocol-origin"}))
        if protocol_origin is not None:
            notes.append(f"protocol origin: {protocol_origin}")
        validation_state = _as_str(_find_first(candidate_node, {"validation-state"}))
        if validation_state is not None:
            notes.append(f"validation state: {validation_state}")
        binding_sid = _as_str(_find_first(candidate_node, {"binding-sid", "binding-label"}))
        if binding_sid is not None:
            notes.append(f"binding sid: {binding_sid}")
        items.append(
            NormalizedPolicyCandidatePathRecord(
                name=name,
                path_state=_map_candidate_path_state(candidate_node),
                preference=preference,
                notes=notes,
            )
        )
    return items


def _map_policy_type(payload: dict[str, object]) -> str:
    headend = _as_str(_find_first(payload, {"head-end"}))
    if headend is None:
        return "unknown"
    if headend.lower() == "local":
        return "static_local"
    return "static_non_local"


def _map_observed_state(
    payload: dict[str, object],
    candidate_paths: list[NormalizedPolicyCandidatePathRecord],
) -> str:
    if any(path.path_state == "active" for path in candidate_paths):
        return "active"
    oper_state = _as_str(_find_first(payload, {"oper-state", "state"}))
    if oper_state is not None:
        lowered = oper_state.lower()
        if lowered in {"up", "active", "installed"}:
            return "active"
        if lowered in {"inactive", "standby"}:
            return "inactive"
        if lowered in {"degraded", "partial"}:
            return "degraded"
        if lowered in {"down", "failed"}:
            return "degraded"
    admin_state = _as_str(_find_first(payload, {"admin-state"}))
    if admin_state is not None and admin_state.lower() in {"disable", "disabled"}:
        return "inactive"
    if candidate_paths:
        return "inactive"
    return "unknown"


def _map_health_state(observed_state: str) -> str:
    return {
        "active": "healthy",
        "inactive": "degraded",
        "degraded": "down",
        "unknown": "unknown",
    }.get(observed_state, "unknown")


def _policy_counts_from_raw_record(record: PolicyRawRecord) -> dict[str, int]:
    static_local_policies = record.sr_policy_counts.get("static-local-policies", 0)
    static_non_local_policies = record.sr_policy_counts.get("static-non-local-policies", 0)
    bgp_policies = record.sr_policy_counts.get("bgp-policies", 0)
    return {
        "policy_count": static_local_policies + static_non_local_policies + bgp_policies,
        "active_policy_count": (
            record.sr_policy_counts.get("active-static-local-policies", 0)
            + record.sr_policy_counts.get("active-bgp-policies", 0)
        ),
        "static_policy_count": static_local_policies + static_non_local_policies,
        "static_local_policy_count": static_local_policies,
        "static_non_local_policy_count": static_non_local_policies,
        "bgp_policy_count": bgp_policies,
        "ttm_preference_count": record.sr_policy_counts.get("ttm-preferences", 0),
        "binding_sid_count": record.sr_policy_counts.get("binding-sids-allocated", 0),
        "srv6_binding_sid_count": record.sr_policy_counts.get(
            "srv6-binding-sids-allocated", 0
        ),
    }


def _target_has_policy_capability(counts: dict[str, int], raw_policy_count: int) -> bool:
    return (
        counts["ttm_preference_count"] > 0
        or counts["binding_sid_count"] > 0
        or counts["srv6_binding_sid_count"] > 0
        or counts["policy_count"] > 0
        or raw_policy_count > 0
    )


def derive_policy_observed_at(raw_records: list[PolicyRawRecord]) -> datetime | None:
    """Return the newest observed timestamp across collected policy records."""
    observed_values = [record.observed_at for record in raw_records if record.observed_at is not None]
    if not observed_values:
        return None
    return max(observed_values).astimezone(UTC)


def map_policy_records(raw_records: list[PolicyRawRecord]) -> list[NormalizedPolicyRecord]:
    """Map raw policy records into normalized per-policy records when available."""
    items: list[NormalizedPolicyRecord] = []
    for raw_record in raw_records:
        for payload in raw_record.raw_policies:
            endpoint = _as_str(_find_first(payload, {"endpoint"}))
            color = _as_int(_find_first(payload, {"color"}))
            if endpoint is None or color is None:
                continue
            policy_type = _map_policy_type(payload)
            headend_value = _as_str(_find_first(payload, {"head-end"}))
            headend = raw_record.target_name if headend_value is None or headend_value.lower() == "local" else headend_value
            candidate_paths = _map_candidate_paths(payload)
            observed_state = _map_observed_state(payload, candidate_paths)
            notes = [
                f"Observed from Nokia static-policy config on {raw_record.target_name} over gNMI.",
                "This remains a bounded static-policy read slice rather than full SR policy truth.",
            ]
            if policy_type == "static_non_local":
                notes.append(
                    "Non-local static policy observations remain partial and do not imply remote installation truth."
                )
            if not candidate_paths:
                notes.append(
                    "Candidate path detail was not exposed in the current policy payload."
                )
            items.append(
                NormalizedPolicyRecord(
                    policy_id=f"{raw_record.target_name}:{policy_type}:{endpoint}:{color}",
                    policy_name=(
                        _as_str(_find_first(payload, {"policy-name", "name"}))
                        or f"{raw_record.target_name}:{endpoint}:{color}"
                    ),
                    policy_type=policy_type,
                    headend=headend,
                    endpoint=endpoint,
                    color=color,
                    source_target=raw_record.target_name,
                    source_target_role=raw_record.role,
                    candidate_paths=candidate_paths,
                    intent_state="declared",
                    observed_state=observed_state,
                    support_state="partially_supported",
                    health_state=_map_health_state(observed_state),
                    source="gnmi",
                    notes=notes,
                )
            )
    return items


def summarize_policy_counts(raw_records: list[PolicyRawRecord]) -> dict[str, int]:
    """Aggregate bounded live SR policy counters across all collected targets."""
    counts = {
        "observed_target_count": 0,
        "policy_capable_target_count": 0,
        "observed_target_role_counts": {},
        "policy_capable_target_role_counts": {},
        "policy_count": 0,
        "active_policy_count": 0,
        "static_policy_count": 0,
        "static_local_policy_count": 0,
        "static_non_local_policy_count": 0,
        "bgp_policy_count": 0,
        "ttm_preference_count": 0,
        "binding_sid_count": 0,
        "srv6_binding_sid_count": 0,
    }
    observed_role_counts: Counter[str] = Counter()
    policy_capable_role_counts: Counter[str] = Counter()
    for record in raw_records:
        if record.collection_status == "failure":
            continue
        counts["observed_target_count"] += 1
        role_name = record.role or "unknown"
        observed_role_counts[role_name] += 1
        target_counts = _policy_counts_from_raw_record(record)
        if _target_has_policy_capability(target_counts, len(record.raw_policies)):
            counts["policy_capable_target_count"] += 1
            policy_capable_role_counts[role_name] += 1
        counts["policy_count"] += target_counts["policy_count"]
        counts["active_policy_count"] += target_counts["active_policy_count"]
        counts["static_policy_count"] += target_counts["static_policy_count"]
        counts["static_local_policy_count"] += target_counts["static_local_policy_count"]
        counts["static_non_local_policy_count"] += target_counts["static_non_local_policy_count"]
        counts["bgp_policy_count"] += target_counts["bgp_policy_count"]
        counts["ttm_preference_count"] += target_counts["ttm_preference_count"]
        counts["binding_sid_count"] += target_counts["binding_sid_count"]
        counts["srv6_binding_sid_count"] += target_counts["srv6_binding_sid_count"]
    counts["observed_target_role_counts"] = dict(sorted(observed_role_counts.items()))
    counts["policy_capable_target_role_counts"] = dict(sorted(policy_capable_role_counts.items()))
    return counts


def summarize_policy_target_footprints(
    raw_records: list[PolicyRawRecord],
    normalized_records: list[NormalizedPolicyRecord],
) -> list[NormalizedPolicyTargetFootprint]:
    """Build a bounded normalized policy footprint for each collected target."""
    detail_counts = Counter(record.source_target for record in normalized_records)
    items: list[NormalizedPolicyTargetFootprint] = []
    for raw_record in sorted(raw_records, key=lambda item: item.target_name):
        target_counts = _policy_counts_from_raw_record(raw_record)
        detail_record_count = detail_counts.get(raw_record.target_name, 0)
        policy_capable = _target_has_policy_capability(target_counts, len(raw_record.raw_policies))
        detail_blocker_reason = _resolve_detail_blocker_reason(
            raw_record=raw_record,
            policy_capable=policy_capable,
            observed_policy_count=target_counts["policy_count"],
            detail_record_count=detail_record_count,
        )
        notes: list[str] = []
        if detail_blocker_reason == "collection_failed":
            notes.append(
                "Live policy collection failed for this target, so per-target policy truth is currently unavailable."
            )
        elif detail_blocker_reason == "policy_capability_unavailable":
            notes.append(
                "This target does not currently expose bounded policy-capability evidence, so per-target policy detail is unavailable."
            )
        elif detail_blocker_reason == "no_policies_observed":
            notes.append(
                "Stable SR policy resource counters are visible on this target even though no SR policies are currently observed."
            )
        elif detail_blocker_reason == "per_policy_details_unavailable":
            notes.append(
                "Counters indicate SR policies on this target, but the current bounded path could not derive per-policy detail records."
            )
        elif detail_blocker_reason == "partial_detail_coverage":
            notes.append(
                "Only a subset of the observed policies on this target currently has bounded normalized detail records."
            )
        if detail_blocker_reason == "collection_partial":
            notes.append(
                "Policy collection for this target was partial, so degraded and unknown states remain explicit."
            )
        items.append(
            NormalizedPolicyTargetFootprint(
                target_name=raw_record.target_name,
                target_role=raw_record.role,
                collection_status=raw_record.collection_status,
                policy_capable=policy_capable,
                observed_policy_count=target_counts["policy_count"],
                active_policy_count=target_counts["active_policy_count"],
                static_policy_count=target_counts["static_policy_count"],
                static_local_policy_count=target_counts["static_local_policy_count"],
                static_non_local_policy_count=target_counts["static_non_local_policy_count"],
                bgp_policy_count=target_counts["bgp_policy_count"],
                ttm_preference_count=target_counts["ttm_preference_count"],
                binding_sid_count=target_counts["binding_sid_count"],
                srv6_binding_sid_count=target_counts["srv6_binding_sid_count"],
                detail_record_count=detail_record_count,
                detail_blocker_reason=detail_blocker_reason,
                notes=notes,
            )
        )
    return items
