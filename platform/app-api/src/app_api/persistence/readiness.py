"""Persistence helpers for bounded readiness-support snapshots."""

from datetime import UTC, datetime
from hashlib import sha256
from logging import getLogger
from uuid import uuid4

from app_api.persistence.session import create_session
from app_api.persistence.tables import ReadinessSnapshotTable
from app_api.schemas.capabilities import DryRunReadinessSummary

logger = getLogger(__name__)


def _build_readiness_content_hash(
    dry_run_readiness: DryRunReadinessSummary,
) -> str:
    """Return a stable hash for the bounded readiness-support snapshot."""
    return sha256(
        dry_run_readiness.model_dump_json(exclude_none=False, round_trip=True).encode(
            "utf-8"
        )
    ).hexdigest()


def persist_readiness_snapshot(
    *,
    dry_run_readiness: DryRunReadinessSummary,
) -> datetime | None:
    """Persist one bounded readiness-support snapshot when it changed materially."""
    content_hash = _build_readiness_content_hash(dry_run_readiness)
    try:
        with create_session() as session:
            latest_snapshot = (
                session.query(ReadinessSnapshotTable)
                .order_by(ReadinessSnapshotTable.persisted_at.desc())
                .limit(1)
                .one_or_none()
            )
            if latest_snapshot is not None and latest_snapshot.content_hash == content_hash:
                return latest_snapshot.persisted_at

            persisted_at = datetime.now(UTC)
            snapshot = ReadinessSnapshotTable(
                id=str(uuid4()),
                persisted_at=persisted_at,
                content_hash=content_hash,
                readiness_status=dry_run_readiness.status,
                planning_readiness=dry_run_readiness.planning_readiness,
                phase_recommendation=dry_run_readiness.phase_recommendation,
                summary=dry_run_readiness.summary,
                readiness_scope=dry_run_readiness.readiness_scope,
                notes=dry_run_readiness.notes,
                strongest_blockers=dry_run_readiness.strongest_blockers,
                bounded_next_steps=dry_run_readiness.bounded_next_steps,
                evidence_coverage_counts=dry_run_readiness.evidence_coverage_counts,
                support_posture_counts=dry_run_readiness.support_posture_counts,
                prerequisites=[
                    prerequisite.model_dump(mode="json")
                    for prerequisite in dry_run_readiness.prerequisites
                ],
                assessment_areas=[
                    area.model_dump(mode="json")
                    for area in dry_run_readiness.assessment_areas
                ],
                blockers=[
                    blocker.model_dump(mode="json")
                    for blocker in dry_run_readiness.blockers
                ],
            )
            session.add(snapshot)
            session.commit()
            return persisted_at
    except Exception:
        logger.exception("Failed to persist bounded readiness snapshot.")
        return None
