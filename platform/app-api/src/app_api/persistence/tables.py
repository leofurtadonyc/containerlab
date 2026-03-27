"""SQLAlchemy tables for bounded read-side persistence."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app_api.models.base import Base


class SyncRunTable(Base):
    """Bounded sync-run history for persisted read-side snapshots."""

    __tablename__ = "sync_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    model_family: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    source_endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    fetch_status: Mapped[str] = mapped_column(String(32), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    inventory_snapshot: Mapped["InventorySnapshotTable | None"] = relationship(
        back_populates="sync_run",
        cascade="all, delete-orphan",
    )
    topology_snapshot: Mapped["TopologySnapshotTable | None"] = relationship(
        back_populates="sync_run",
        cascade="all, delete-orphan",
    )
    policy_snapshot: Mapped["PolicySnapshotTable | None"] = relationship(
        back_populates="sync_run",
        cascade="all, delete-orphan",
    )


class InventorySnapshotTable(Base):
    """One persisted normalized inventory snapshot."""

    __tablename__ = "inventory_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sync_run_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.sync_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    data_status: Mapped[str] = mapped_column(String(32), nullable=False)
    persisted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    sync_run: Mapped[SyncRunTable] = relationship(back_populates="inventory_snapshot")
    records: Mapped[list["InventoryRecordTable"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )


class InventoryRecordTable(Base):
    """One normalized inventory record within a persisted snapshot."""

    __tablename__ = "inventory_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.inventory_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    vendor: Mapped[str] = mapped_column(String(64), nullable=False)
    platform: Mapped[str] = mapped_column(String(128), nullable=False)
    software_version: Mapped[str | None] = mapped_column(String(128))
    role: Mapped[str | None] = mapped_column(String(64), index=True)
    management_address: Mapped[str] = mapped_column(String(128), nullable=False)
    collector_status: Mapped[str] = mapped_column(String(32), nullable=False)
    capability_summary: Mapped[str] = mapped_column(String(64), nullable=False)

    snapshot: Mapped[InventorySnapshotTable] = relationship(back_populates="records")


class TopologySnapshotTable(Base):
    """One persisted normalized topology snapshot."""

    __tablename__ = "topology_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sync_run_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.sync_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    topology_id: Mapped[str] = mapped_column(String(255), nullable=False)
    topology_name: Mapped[str] = mapped_column(String(255), nullable=False)
    data_status: Mapped[str] = mapped_column(String(32), nullable=False)
    sync_source: Mapped[str] = mapped_column(String(255), nullable=False)
    sync_status: Mapped[str] = mapped_column(String(32), nullable=False)
    completeness: Mapped[str] = mapped_column(String(32), nullable=False)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    persisted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    node_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    link_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    sync_run: Mapped[SyncRunTable] = relationship(back_populates="topology_snapshot")
    nodes: Mapped[list["TopologyNodeTable"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )
    links: Mapped[list["TopologyLinkTable"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )


class TopologyNodeTable(Base):
    """One normalized topology node within a persisted snapshot."""

    __tablename__ = "topology_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.topology_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(255))
    attributes: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False, default=dict)

    snapshot: Mapped[TopologySnapshotTable] = relationship(back_populates="nodes")


class TopologyLinkTable(Base):
    """One normalized topology link within a persisted snapshot."""

    __tablename__ = "topology_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.topology_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    link_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source_node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    target_node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    attributes: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False, default=dict)

    snapshot: Mapped[TopologySnapshotTable] = relationship(back_populates="links")


class PolicySnapshotTable(Base):
    """One persisted normalized policy snapshot."""

    __tablename__ = "policy_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sync_run_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.sync_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    data_status: Mapped[str] = mapped_column(String(32), nullable=False)
    sync_source: Mapped[str] = mapped_column(String(255), nullable=False)
    sync_status: Mapped[str] = mapped_column(String(32), nullable=False)
    completeness: Mapped[str] = mapped_column(String(32), nullable=False)
    detail_mode: Mapped[str] = mapped_column(String(64), nullable=False)
    empty_reason: Mapped[str] = mapped_column(String(64), nullable=False)
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    persisted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    observed_target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    policy_capable_target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    observed_target_role_counts: Mapped[dict[str, int]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    policy_capable_target_role_counts: Mapped[dict[str, int]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    observed_policy_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_policy_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    static_policy_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    static_local_policy_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    static_non_local_policy_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bgp_policy_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ttm_preference_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    binding_sid_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    srv6_binding_sid_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    detail_source_readiness_posture: Mapped[str] = mapped_column(
        String(64), nullable=False, default="unknown"
    )
    detail_ready_target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    no_policies_observed_target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    detail_unavailable_target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    partial_detail_target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    sync_run: Mapped[SyncRunTable] = relationship(back_populates="policy_snapshot")
    records: Mapped[list["PolicyRecordTable"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )


class PolicyRecordTable(Base):
    """One normalized policy record within a persisted snapshot."""

    __tablename__ = "policy_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.policy_snapshots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    policy_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    policy_name: Mapped[str] = mapped_column(String(255), nullable=False)
    policy_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    headend: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    color: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    source_target: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source_target_role: Mapped[str | None] = mapped_column(String(64), index=True)
    intent_state: Mapped[str] = mapped_column(String(32), nullable=False)
    observed_state: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    support_state: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    health_state: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    snapshot: Mapped[PolicySnapshotTable] = relationship(back_populates="records")
    candidate_paths: Mapped[list["PolicyCandidatePathTable"]] = relationship(
        back_populates="policy_record",
        cascade="all, delete-orphan",
    )


class PolicyCandidatePathTable(Base):
    """One normalized candidate path within a persisted policy record."""

    __tablename__ = "policy_candidate_paths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    policy_record_id: Mapped[int] = mapped_column(
        ForeignKey("platform_app.policy_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    path_state: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    preference: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    policy_record: Mapped[PolicyRecordTable] = relationship(back_populates="candidate_paths")


class ReadinessSnapshotTable(Base):
    """One persisted bounded readiness-support snapshot."""

    __tablename__ = "readiness_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    persisted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    readiness_status: Mapped[str] = mapped_column(String(64), nullable=False)
    planning_readiness: Mapped[str] = mapped_column(String(64), nullable=False)
    phase_recommendation: Mapped[str] = mapped_column(String(96), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    readiness_scope: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    strongest_blockers: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    bounded_next_steps: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )
    evidence_coverage_counts: Mapped[dict[str, int]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    support_posture_counts: Mapped[dict[str, int]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    prerequisites: Mapped[list[dict[str, object]]] = mapped_column(
        JSON, nullable=False, default=list
    )
    assessment_areas: Mapped[list[dict[str, object]]] = mapped_column(
        JSON, nullable=False, default=list
    )
    blockers: Mapped[list[dict[str, object]]] = mapped_column(
        JSON, nullable=False, default=list
    )


class WorkflowLifecycleTable(Base):
    """Durable operator workflow lifecycle record (not sync-run history)."""

    __tablename__ = "workflow_lifecycles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    workflow_type: Mapped[str] = mapped_column(String(96), nullable=False, index=True)
    workflow_status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_scope: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)
    capability_decision: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)
    actor_created: Mapped[str] = mapped_column(String(255), nullable=False)
    actor_updated: Mapped[str | None] = mapped_column(String(255), nullable=True)
    audit_attachment_hint: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    events: Mapped[list["WorkflowLifecycleEventTable"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
    )


class WorkflowLifecycleEventTable(Base):
    """One durable transition or lifecycle event on a workflow record."""

    __tablename__ = "workflow_lifecycle_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    workflow_id: Mapped[str] = mapped_column(
        ForeignKey("platform_app.workflow_lifecycles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    prior_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    next_status: Mapped[str] = mapped_column(String(32), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_metadata: Mapped[dict[str, object]] = mapped_column("metadata", JSON, nullable=False, default=dict)
    provenance: Mapped[str] = mapped_column(String(32), nullable=False)

    workflow: Mapped[WorkflowLifecycleTable] = relationship(back_populates="events")
