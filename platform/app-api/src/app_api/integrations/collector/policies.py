"""Bounded collector policy integration models and live snapshot client."""

import json
from dataclasses import dataclass
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from pydantic import BaseModel, Field, ValidationError

from app_api.config.settings import get_settings
from app_api.integrations.collector.cache import SnapshotCache
from app_api.integrations.collector.failure import (
    CollectorFetchErrorKind,
    classify_collector_fetch_failure,
)


class CollectorPolicyCandidatePathRecord(BaseModel):
    """Normalized candidate path accepted from the collector boundary."""

    name: str
    path_state: Literal["active", "inactive", "unknown"]
    preference: int | None = None
    notes: list[str] = Field(default_factory=list)


class CollectorPolicyRecord(BaseModel):
    """Normalized policy record accepted from the collector boundary."""

    policy_id: str
    policy_name: str
    policy_type: Literal["static_local", "static_non_local", "unknown"]
    headend: str
    endpoint: str
    color: int
    source_target: str
    source_target_role: str | None = None
    candidate_paths: list[CollectorPolicyCandidatePathRecord] = Field(default_factory=list)
    intent_state: Literal["declared", "unknown"]
    observed_state: Literal["active", "inactive", "degraded", "unknown"]
    support_state: Literal[
        "supported",
        "partially_supported",
        "unsupported",
        "unknown",
        "not_implemented_in_platform",
    ]
    health_state: Literal["healthy", "degraded", "down", "unknown"]
    source: Literal["gnmi"]
    notes: list[str] = Field(default_factory=list)


class CollectorPolicyTargetFootprintRecord(BaseModel):
    """Normalized per-target policy footprint accepted from the collector boundary."""

    target_name: str
    target_role: str | None = None
    collection_status: Literal["success", "failure", "partial"]
    policy_capable: bool
    observed_policy_count: int
    active_policy_count: int
    static_policy_count: int
    static_local_policy_count: int
    static_non_local_policy_count: int
    bgp_policy_count: int
    ttm_preference_count: int
    binding_sid_count: int
    srv6_binding_sid_count: int
    detail_record_count: int
    notes: list[str] = Field(default_factory=list)


class CollectorPolicySnapshot(BaseModel):
    """Stable intermediate boundary for collector-backed policy reads."""

    integration: Literal["gnmi_collector_policy"]
    status: Literal["live_normalized_feed", "partial_live_feed", "collector_unavailable"]
    destination_service: Literal["app-api"]
    source_endpoint: str
    configured_target_count: int
    collection_success_count: int
    collection_partial_count: int
    collection_failure_count: int
    oldest_observed_at: str | None = None
    newest_observed_at: str | None = None
    detail_ready_target_count: int
    degraded_scope_summary: str
    sync_source: str
    sync_status: Literal["ok", "degraded", "failed", "unknown"]
    completeness: Literal["complete", "partial", "unknown"]
    detail_mode: Literal[
        "counters_only",
        "static_policies_when_present",
        "mixed",
        "unknown",
    ]
    observed_at: str | None = None
    observed_target_count: int
    policy_capable_target_count: int
    observed_target_role_counts: dict[str, int] = Field(default_factory=dict)
    policy_capable_target_role_counts: dict[str, int] = Field(default_factory=dict)
    policy_count: int
    active_policy_count: int
    static_policy_count: int
    static_local_policy_count: int
    static_non_local_policy_count: int
    bgp_policy_count: int
    ttm_preference_count: int
    binding_sid_count: int
    srv6_binding_sid_count: int
    target_footprints: list[CollectorPolicyTargetFootprintRecord] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    records: list[CollectorPolicyRecord] = Field(default_factory=list)
    fetch_error_kind: CollectorFetchErrorKind | None = None
    fetch_error: str | None = None


@dataclass(frozen=True)
class CollectorPolicyClient:
    """HTTP client for the normalized collector policy boundary."""

    source_endpoint: str
    timeout_seconds: int
    cache_ttl_seconds: int
    unavailable_cache_ttl_seconds: int

    def _load_policy_snapshot(self) -> CollectorPolicySnapshot:
        """Load the live normalized policy snapshot from the collector."""
        snapshot_url = f"{self.source_endpoint.rstrip('/')}/policies/snapshot"
        try:
            with urlopen(snapshot_url, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
            target_footprints = [
                CollectorPolicyTargetFootprintRecord.model_validate(record)
                for record in payload.get("target_footprints", [])
            ]
            records = [
                CollectorPolicyRecord.model_validate(record)
                for record in payload.get("records", [])
            ]
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, ValidationError) as exc:
            failure = classify_collector_fetch_failure(
                exc,
                boundary_label="policy snapshot",
                snapshot_url=snapshot_url,
                timeout_seconds=self.timeout_seconds,
            )
            return CollectorPolicySnapshot(
                integration="gnmi_collector_policy",
                status="collector_unavailable",
                destination_service="app-api",
                source_endpoint=snapshot_url,
                configured_target_count=0,
                collection_success_count=0,
                collection_partial_count=0,
                collection_failure_count=0,
                oldest_observed_at=None,
                newest_observed_at=None,
                detail_ready_target_count=0,
                degraded_scope_summary=(
                    "No configured policy targets returned usable live policy evidence."
                ),
                sync_source="gnmi_collector_policy",
                sync_status="failed",
                completeness="unknown",
                detail_mode="unknown",
                observed_at=None,
                observed_target_count=0,
                policy_capable_target_count=0,
                observed_target_role_counts={},
                policy_capable_target_role_counts={},
                policy_count=0,
                active_policy_count=0,
                static_policy_count=0,
                static_local_policy_count=0,
                static_non_local_policy_count=0,
                bgp_policy_count=0,
                ttm_preference_count=0,
                binding_sid_count=0,
                srv6_binding_sid_count=0,
                target_footprints=[],
                notes=[],
                records=[],
                fetch_error_kind=failure.kind,
                fetch_error=failure.detail,
            )

        status_map = {
            "live_ready": "live_normalized_feed",
            "partial": "partial_live_feed",
            "failed": "collector_unavailable",
        }
        return CollectorPolicySnapshot(
            integration="gnmi_collector_policy",
            status=status_map.get(payload.get("delivery_status"), "collector_unavailable"),
            destination_service="app-api",
            source_endpoint=snapshot_url,
            configured_target_count=payload.get("configured_target_count", 0),
            collection_success_count=payload.get("collection_success_count", 0),
            collection_partial_count=payload.get("collection_partial_count", 0),
            collection_failure_count=payload.get("collection_failure_count", 0),
            oldest_observed_at=payload.get("oldest_observed_at"),
            newest_observed_at=payload.get("newest_observed_at"),
            detail_ready_target_count=payload.get("detail_ready_target_count", 0),
            degraded_scope_summary=payload.get(
                "degraded_scope_summary",
                "Policy degraded scope was not provided by the collector.",
            ),
            sync_source=payload.get("sync_source", "gnmi_collector_policy"),
            sync_status=payload.get("sync_status", "unknown"),
            completeness=payload.get("completeness", "unknown"),
            detail_mode=payload.get("detail_mode", "unknown"),
            observed_at=payload.get("observed_at"),
            observed_target_count=payload.get("observed_target_count", 0),
            policy_capable_target_count=payload.get("policy_capable_target_count", 0),
            observed_target_role_counts=payload.get("observed_target_role_counts", {}),
            policy_capable_target_role_counts=payload.get("policy_capable_target_role_counts", {}),
            policy_count=payload.get("policy_count", 0),
            active_policy_count=payload.get("active_policy_count", 0),
            static_policy_count=payload.get("static_policy_count", 0),
            static_local_policy_count=payload.get("static_local_policy_count", 0),
            static_non_local_policy_count=payload.get("static_non_local_policy_count", 0),
            bgp_policy_count=payload.get("bgp_policy_count", 0),
            ttm_preference_count=payload.get("ttm_preference_count", 0),
            binding_sid_count=payload.get("binding_sid_count", 0),
            srv6_binding_sid_count=payload.get("srv6_binding_sid_count", 0),
            target_footprints=target_footprints,
            notes=payload.get("notes", []),
            records=records,
            fetch_error_kind=None,
            fetch_error=None,
        )

    def read_policy_snapshot(self) -> CollectorPolicySnapshot:
        """Read the live normalized policy snapshot from the collector."""
        snapshot_key = (self.source_endpoint, self.timeout_seconds)
        return _policy_snapshot_cache.get_or_load(
            snapshot_key=snapshot_key,
            ttl_seconds=self.cache_ttl_seconds,
            ttl_resolver=lambda snapshot: (
                self.unavailable_cache_ttl_seconds
                if snapshot.status == "collector_unavailable"
                else self.cache_ttl_seconds
            ),
            loader=self._load_policy_snapshot,
        )


_policy_snapshot_cache: SnapshotCache[CollectorPolicySnapshot] = SnapshotCache()


def clear_policy_snapshot_cache() -> None:
    """Clear the short-lived policy snapshot cache."""
    _policy_snapshot_cache.clear()


def get_collector_policy_client() -> CollectorPolicyClient:
    """Return the current collector policy boundary client."""
    settings = get_settings()
    return CollectorPolicyClient(
        source_endpoint=settings.gnmi_collector_url,
        timeout_seconds=settings.get_gnmi_collector_policy_timeout_seconds(),
        cache_ttl_seconds=settings.gnmi_collector_snapshot_cache_ttl_seconds,
        unavailable_cache_ttl_seconds=settings.gnmi_collector_unavailable_snapshot_cache_ttl_seconds,
    )
