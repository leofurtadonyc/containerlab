"""Targeted tests for persisted policy snapshot save/load and sync-run history shape."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app_api.integrations.collector.policies import CollectorPolicySnapshot
from app_api.models.policy import (
    CandidatePath,
    PolicyDetailSourceReadiness,
    PolicyInventoryRecord,
    PolicyInventorySnapshot,
)
from app_api.persistence.history import load_sync_runs
from app_api.persistence.read_side import (
    load_latest_policy_snapshot,
    load_recent_policy_snapshot_summaries,
    persist_policy_snapshot,
)


def _minimal_collector_snapshot(*, detail_ready: int, posture: str = "ready") -> CollectorPolicySnapshot:
    return CollectorPolicySnapshot(
        integration="gnmi_collector_policy",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://gnmi-collector:9804/policies/snapshot",
        configured_target_count=2,
        collection_success_count=2,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-10T00:00:00+00:00",
        newest_observed_at="2026-03-10T00:00:00+00:00",
        detail_ready_target_count=detail_ready,
        detail_source_readiness={
            "posture": posture,
            "no_policies_observed_target_count": 0,
            "detail_unavailable_target_count": 0,
            "partial_detail_target_count": 0,
        },
        degraded_scope_summary="",
        sync_source="gnmi_collector_policy_sr_counters",
        sync_status="ok",
        completeness="partial",
        detail_mode="static_policies_when_present",
        observed_at="2026-03-10T00:00:00+00:00",
        observed_target_count=2,
        policy_capable_target_count=2,
        observed_target_role_counts={"pe": 2},
        policy_capable_target_role_counts={"pe": 2},
        policy_count=1,
        active_policy_count=1,
        static_policy_count=1,
        static_local_policy_count=1,
        static_non_local_policy_count=0,
        bgp_policy_count=0,
        ttm_preference_count=0,
        binding_sid_count=0,
        srv6_binding_sid_count=0,
        target_footprints=[],
        notes=[],
        records=[
            {
                "policy_id": "PE1:static_local:192.0.2.11:100",
                "policy_name": "sr-static-PE1",
                "policy_type": "static_local",
                "headend": "PE1",
                "endpoint": "192.0.2.11",
                "color": 100,
                "source_target": "PE1",
                "source_target_role": "pe",
                "candidate_paths": [
                    {"name": "primary", "path_state": "active", "preference": 200, "notes": []}
                ],
                "intent_state": "declared",
                "observed_state": "active",
                "support_state": "supported",
                "health_state": "healthy",
                "source": "gnmi",
                "notes": [],
            }
        ],
    )


def _minimal_inventory_snapshot(
    *,
    readiness: PolicyDetailSourceReadiness,
    observed_at: datetime | None,
) -> PolicyInventorySnapshot:
    return PolicyInventorySnapshot(
        sync_source="gnmi_collector_policy_sr_counters",
        sync_status="ok",
        completeness="partial",
        detail_mode="static_policies_when_present",
        detail_source_readiness=readiness,
        empty_reason="none",
        observed_at=observed_at,
        observed_target_count=2,
        policy_capable_target_count=2,
        observed_target_role_counts={"pe": 2},
        policy_capable_target_role_counts={"pe": 2},
        observed_policy_count=1,
        active_policy_count=1,
        static_policy_count=1,
        static_local_policy_count=1,
        static_non_local_policy_count=0,
        bgp_policy_count=0,
        ttm_preference_count=0,
        binding_sid_count=0,
        srv6_binding_sid_count=0,
        notes=[],
        records=[
            PolicyInventoryRecord(
                policy_id="PE1:static_local:192.0.2.11:100",
                policy_name="sr-static-PE1",
                policy_type="static_local",
                headend="PE1",
                endpoint="192.0.2.11",
                color=100,
                source_target="PE1",
                source_target_role="pe",
                candidate_paths=[
                    CandidatePath(name="primary", path_state="active", preference=200, notes=[])
                ],
                intent_state="declared",
                observed_state="active",
                support_state="supported",
                health_state="healthy",
                source="gnmi",
                notes=[],
            )
        ],
    )


@pytest.fixture
def sqlite_persistence(monkeypatch, tmp_path):
    """Point app-api persistence at a throwaway SQLite file and create tables."""
    db_path = tmp_path / "policy_test.db"
    db_url = f"sqlite:///{db_path}"
    monkeypatch.setenv("DATABASE_URL", db_url)
    from app_api.config.settings import get_settings

    get_settings.cache_clear()
    from app_api.persistence import session as session_module

    session_module.get_engine.cache_clear()
    session_module.get_session_factory.cache_clear()
    from app_api.persistence import tables  # noqa: F401
    from app_api.models.base import Base

    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        execution_options={"schema_translate_map": {"platform_app": None}},
    )
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    monkeypatch.setattr(session_module, "get_engine", lambda: engine)
    monkeypatch.setattr(session_module, "get_session_factory", lambda: factory)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)
    engine.dispose()
    get_settings.cache_clear()


def test_persist_and_reload_policy_snapshot_round_trip(sqlite_persistence) -> None:
    observed = datetime(2026, 3, 10, 12, 0, tzinfo=UTC)
    readiness = PolicyDetailSourceReadiness(
        posture="partially_ready",
        no_policies_observed_target_count=1,
        detail_unavailable_target_count=2,
        partial_detail_target_count=3,
    )
    collector = _minimal_collector_snapshot(detail_ready=4, posture="partially_ready")
    snapshot = _minimal_inventory_snapshot(readiness=readiness, observed_at=observed)
    persist_policy_snapshot(
        collector_snapshot=collector,
        snapshot=snapshot,
        data_status="live",
    )
    loaded = load_latest_policy_snapshot()
    assert loaded is not None
    assert loaded.data_status == "live"
    assert loaded.detail_ready_target_count == 4
    assert loaded.snapshot.detail_source_readiness.posture == "partially_ready"
    assert loaded.snapshot.detail_source_readiness.no_policies_observed_target_count == 1
    assert loaded.snapshot.detail_source_readiness.detail_unavailable_target_count == 2
    assert loaded.snapshot.detail_source_readiness.partial_detail_target_count == 3
    assert loaded.snapshot.static_local_policy_count == 1
    assert loaded.snapshot.records[0].policy_type == "static_local"


def test_load_sync_runs_single_policy_snapshot_has_no_comparison(sqlite_persistence) -> None:
    collector = _minimal_collector_snapshot(detail_ready=1)
    snapshot = _minimal_inventory_snapshot(
        readiness=PolicyDetailSourceReadiness(posture="ready"),
        observed_at=datetime(2026, 3, 10, 12, 0, tzinfo=UTC),
    )
    persist_policy_snapshot(
        collector_snapshot=collector,
        snapshot=snapshot,
        data_status="degraded",
    )
    runs = load_sync_runs(limit=10)
    assert len(runs) == 1
    assert runs[0].policy_snapshot_summary is not None
    assert runs[0].policy_snapshot_summary.data_status == "degraded"
    assert runs[0].policy_snapshot_summary.static_local_policy_count == 1
    assert runs[0].policy_comparison_to_previous is None


def test_load_sync_runs_two_snapshots_has_comparison(sqlite_persistence) -> None:
    for i, detail_ready in enumerate((1, 2)):
        collector = _minimal_collector_snapshot(detail_ready=detail_ready)
        snapshot = _minimal_inventory_snapshot(
            readiness=PolicyDetailSourceReadiness(
                posture="partially_ready",
                no_policies_observed_target_count=i,
                detail_unavailable_target_count=0,
                partial_detail_target_count=0,
            ),
            observed_at=datetime(2026, 3, 10, 12, i, tzinfo=UTC),
        )
        persist_policy_snapshot(
            collector_snapshot=collector,
            snapshot=snapshot,
            data_status="live",
        )
    runs = load_sync_runs(limit=10)
    latest = runs[0]
    assert latest.policy_comparison_to_previous is not None
    cmp = latest.policy_comparison_to_previous
    assert cmp.current_detail_ready_target_count == 2
    assert cmp.previous_detail_ready_target_count == 1
    assert cmp.current_static_local_policy_count == 1
    assert cmp.previous_static_local_policy_count == 1
    assert cmp.current_data_status == "live"
    assert cmp.previous_data_status == "live"


def test_load_recent_policy_snapshot_summaries_includes_sync_anchors_and_nested_readiness(
    sqlite_persistence,
) -> None:
    collector = _minimal_collector_snapshot(detail_ready=3)
    snapshot = _minimal_inventory_snapshot(
        readiness=PolicyDetailSourceReadiness(
            posture="partially_ready",
            no_policies_observed_target_count=5,
            detail_unavailable_target_count=1,
            partial_detail_target_count=0,
        ),
        observed_at=datetime(2026, 3, 10, 12, 0, tzinfo=UTC),
    )
    persist_policy_snapshot(
        collector_snapshot=collector,
        snapshot=snapshot,
        data_status="live",
    )
    summaries = load_recent_policy_snapshot_summaries(limit=3)
    assert len(summaries) == 1
    rec = summaries[0].snapshot
    assert rec.sync_run_id
    assert rec.source_endpoint == "http://gnmi-collector:9804/policies/snapshot"
    assert rec.observed_target_count == 2
    assert rec.policy_capable_target_count == 2
    assert rec.detail_source_readiness.posture == "partially_ready"
    assert rec.detail_source_readiness.no_policies_observed_target_count == 5
    assert rec.detail_source_readiness_posture == "partially_ready"
