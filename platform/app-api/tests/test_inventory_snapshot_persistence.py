"""Tests for inventory snapshot persistence parity (sync-run observation time, reload shape)."""

from contextlib import contextmanager
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from app_api.integrations.collector.inventory import CollectorInventorySnapshot
from app_api.models.inventory import InventoryDevice
from app_api.persistence.read_side import persist_inventory_snapshot
from app_api.persistence.tables import InventorySnapshotTable, SyncRunTable


def _minimal_collector_snapshot(
    *,
    newest_observed_at: str | None = "2026-03-21T18:00:00Z",
) -> CollectorInventorySnapshot:
    return CollectorInventorySnapshot(
        integration="gnmi_collector_inventory",
        status="live_normalized_feed",
        destination_service="app-api",
        source_endpoint="http://collector:9804",
        configured_target_count=2,
        observed_target_count=2,
        collection_success_count=2,
        collection_partial_count=0,
        collection_failure_count=0,
        oldest_observed_at="2026-03-21T17:00:00Z",
        newest_observed_at=newest_observed_at,
        degraded_scope_summary="",
        records=[],
        notes=[],
    )


def test_persist_inventory_snapshot_sets_sync_run_observed_at_from_newest() -> None:
    mock_session = MagicMock()

    @contextmanager
    def _fake_create_session():
        yield mock_session

    collector = _minimal_collector_snapshot()
    device = InventoryDevice(
        device_id="PE1",
        vendor="nokia",
        platform="7750",
        software_version=None,
        role="pe",
        management_address="10.0.0.1",
        collector_status="ok",
        capability_summary="supported",
    )

    with patch("app_api.persistence.read_side.create_session", _fake_create_session):
        persist_inventory_snapshot(
            collector_snapshot=collector,
            devices=[device],
            data_status="live",
        )

    assert mock_session.add.call_count == 2
    added = [call.args[0] for call in mock_session.add.call_args_list]
    sync_runs = [x for x in added if isinstance(x, SyncRunTable)]
    snapshots = [x for x in added if isinstance(x, InventorySnapshotTable)]
    assert len(sync_runs) == 1
    assert len(snapshots) == 1
    assert sync_runs[0].observed_at == datetime(2026, 3, 21, 18, 0, tzinfo=UTC)
    assert snapshots[0].data_status == "live"
    mock_session.commit.assert_called_once()


def test_persist_inventory_snapshot_leaves_observed_at_none_when_timestamp_absent() -> None:
    mock_session = MagicMock()

    @contextmanager
    def _fake_create_session():
        yield mock_session

    collector = _minimal_collector_snapshot(newest_observed_at=None)

    with patch("app_api.persistence.read_side.create_session", _fake_create_session):
        persist_inventory_snapshot(
            collector_snapshot=collector,
            devices=[],
            data_status="degraded",
        )

    added = [call.args[0] for call in mock_session.add.call_args_list]
    sync_runs = [x for x in added if isinstance(x, SyncRunTable)]
    assert sync_runs[0].observed_at is None


def test_persist_inventory_snapshot_skips_when_collector_unavailable() -> None:
    mock_session = MagicMock()

    @contextmanager
    def _fake_create_session():
        yield mock_session

    collector = CollectorInventorySnapshot(
        integration="gnmi_collector_inventory",
        status="collector_unavailable",
        destination_service="app-api",
        source_endpoint="http://collector:9804",
        configured_target_count=0,
        observed_target_count=0,
        collection_success_count=0,
        collection_partial_count=0,
        collection_failure_count=0,
        degraded_scope_summary="unreachable",
        records=[],
        notes=[],
    )

    with patch("app_api.persistence.read_side.create_session", _fake_create_session):
        persist_inventory_snapshot(
            collector_snapshot=collector,
            devices=[],
            data_status="live",
        )

    mock_session.add.assert_not_called()
