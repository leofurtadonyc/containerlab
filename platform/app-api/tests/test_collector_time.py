"""Tests for collector timestamp parsing used in read-side persistence."""

from datetime import UTC, datetime

from app_api.persistence.collector_time import parse_collector_observed_at


def test_parse_collector_observed_at_accepts_z_suffix() -> None:
    got = parse_collector_observed_at("2026-03-10T15:30:00Z")
    assert got == datetime(2026, 3, 10, 15, 30, tzinfo=UTC)


def test_parse_collector_observed_at_accepts_offset() -> None:
    got = parse_collector_observed_at("2026-03-10T15:30:00+00:00")
    assert got == datetime(2026, 3, 10, 15, 30, tzinfo=UTC)


def test_parse_collector_observed_at_fills_naive_with_utc() -> None:
    got = parse_collector_observed_at("2026-03-10T15:30:00")
    assert got == datetime(2026, 3, 10, 15, 30, tzinfo=UTC)


def test_parse_collector_observed_at_none_for_empty_or_invalid() -> None:
    assert parse_collector_observed_at(None) is None
    assert parse_collector_observed_at("") is None
    assert parse_collector_observed_at("   ") is None
    assert parse_collector_observed_at("not-a-date") is None
