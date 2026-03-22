"""Bounded Phase 2 read-side query ergonomics (shared contract).

This module defines reusable limits and response echo metadata for optional query
parameters on read-only list endpoints. It exists so later week-22 work and UI
filters stay aligned without inventing search, workflow, or validation semantics.

Contract rules (see also ``platform/docs/data-flows.md``):

- **Allowed:** optional bounded ``limit`` on **primary flat list** payloads
  (``items`` on ``/api/v1/devices`` and ``/api/v1/policies``) to reduce payload
  size; totals in the response remain **honest** (``count`` and
  ``read_side_query.items_total`` reflect the full logical list before truncation).
- **Allowed:** optional bounded ``history_recent_limit`` on ``/api/v1/devices`` and
  ``/api/v1/policies`` controlling how many persisted snapshot **summary** rows are
  loaded into ``history.recent_snapshots`` (default **3**, max **50**). This does
  **not** change latest-vs-previous comparison semantics (still the two newest full
  snapshots); it only widens or narrows the **recent snapshot list** for operator context.
- **Allowed:** optional ``sync_runs_limit`` on ``/api/v1/workflow-history`` and
  ``/api/v1/audit-history`` (default **50**, max **100**) controlling how many persisted
  sync-run rows are loaded. **Audit** also accepts ``readiness_snapshot_history_limit``
  (default **20**, max **50**) for readiness snapshot rows before merge. These are
  **not** workflow engines—still sync-derived Phase 2 views.
- **Allowed:** optional ``limit`` (default **20**, max **50**) and optional ``blocker``
  (``ReadinessBlockerName``) on ``GET /api/v1/readiness-snapshot-history``, plus optional
  ``include_blockers_detail`` for persisted JSON blocker objects—planning-support inspection
  only; not workflow or dry-run execution.
- **Allowed later:** anchor-oriented lookups (for example snapshot id) only where
  persistence and APIs already support them—add per-endpoint with the same echo
  pattern.
- **Not allowed in Phase 2 via query strings:** free-text search, arbitrary
  filtering that implies new truth domains, workflow or dry-run flags, vendor
  leakage into generic parameter names, or unbounded offsets/cursors.

Topology (``/api/v1/topology``) keeps a **structural** ``topology`` object
(nodes/links); list ``limit`` is not applied there until a separate contract
defines safe truncation semantics for nested graph payloads.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

# Maximum number of primary list rows returned when ``limit`` is used.
READ_SIDE_PRIMARY_LIST_LIMIT_MAX = 500

# Bounded window for persisted snapshot summaries in ``history.recent_snapshots``.
READ_SIDE_HISTORY_RECENT_LIMIT_DEFAULT = 3
READ_SIDE_HISTORY_RECENT_LIMIT_MAX = 50

READ_SIDE_SYNC_RUNS_LIMIT_DEFAULT = 50
READ_SIDE_SYNC_RUNS_LIMIT_MAX = 100
READ_SIDE_READINESS_SNAPSHOT_HISTORY_DEFAULT = 20
READ_SIDE_READINESS_SNAPSHOT_HISTORY_MAX = 50


class ReadSideQueryEcho(BaseModel):
    """Echo of bounded query parameters and list sizing for one read response."""

    limit_requested: int | None = Field(
        default=None,
        description=(
            "Client-requested limit on the primary flat list, if any. "
            "``null`` means no limit was requested (full list returned up to natural size)."
        ),
    )
    items_total: int = Field(
        ge=0,
        description="Total primary list rows in the logical inventory view before applying ``limit``.",
    )
    items_returned: int = Field(
        ge=0,
        description="Primary list rows included in this response after applying ``limit``.",
    )
    history_recent_limit_requested: int | None = Field(
        default=None,
        description=(
            "Client-requested ``history_recent_limit`` for persisted snapshot summaries, if any. "
            "``null`` means the default window applies."
        ),
    )
    history_recent_limit_effective: int | None = Field(
        default=None,
        description=(
            "Effective ``history_recent_limit`` when the endpoint exposes ``history.recent_snapshots``; "
            "``null`` on workflow/audit history endpoints."
        ),
    )
    history_recent_snapshots_returned: int | None = Field(
        default=None,
        description="Snapshot summary rows returned in ``history.recent_snapshots``; ``null`` when not applicable.",
    )
    sync_runs_limit_requested: int | None = Field(
        default=None,
        description="Client-requested ``sync_runs_limit`` for workflow/audit history; ``null`` on devices/policies.",
    )
    sync_runs_limit_effective: int | None = Field(
        default=None,
        description="Effective sync-run load limit; ``null`` on devices/policies.",
    )
    readiness_snapshot_history_limit_requested: int | None = Field(
        default=None,
        description="Client-requested readiness snapshot history limit (audit only); ``null`` elsewhere.",
    )
    readiness_snapshot_history_limit_effective: int | None = Field(
        default=None,
        description="Effective readiness snapshot history load limit (audit only); ``null`` elsewhere.",
    )
    readiness_blocker_filter_requested: str | None = Field(
        default=None,
        description=(
            "Client-requested ``ReadinessBlockerName`` filter on readiness-snapshot history endpoints; "
            "``null`` when no blocker filter was requested."
        ),
    )


def build_read_side_query_echo(
    *,
    limit_requested: int | None,
    items_total: int,
    items_returned: int,
    history_recent_limit_requested: int | None = None,
    history_recent_limit_effective: int | None = None,
    history_recent_snapshots_returned: int | None = None,
    sync_runs_limit_requested: int | None = None,
    sync_runs_limit_effective: int | None = None,
    readiness_snapshot_history_limit_requested: int | None = None,
    readiness_snapshot_history_limit_effective: int | None = None,
    readiness_blocker_filter_requested: str | None = None,
) -> ReadSideQueryEcho:
    """Construct echo metadata; keeps truncation visible without implying truth shrinkage."""
    return ReadSideQueryEcho(
        limit_requested=limit_requested,
        items_total=items_total,
        items_returned=items_returned,
        history_recent_limit_requested=history_recent_limit_requested,
        history_recent_limit_effective=history_recent_limit_effective,
        history_recent_snapshots_returned=history_recent_snapshots_returned,
        sync_runs_limit_requested=sync_runs_limit_requested,
        sync_runs_limit_effective=sync_runs_limit_effective,
        readiness_snapshot_history_limit_requested=readiness_snapshot_history_limit_requested,
        readiness_snapshot_history_limit_effective=readiness_snapshot_history_limit_effective,
        readiness_blocker_filter_requested=readiness_blocker_filter_requested,
    )
