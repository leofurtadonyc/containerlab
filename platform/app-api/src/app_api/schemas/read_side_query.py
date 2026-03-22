"""Bounded Phase 2 read-side query ergonomics (shared contract).

This module defines reusable limits and response echo metadata for optional query
parameters on read-only list endpoints. It exists so later week-22 work and UI
filters stay aligned without inventing search, workflow, or validation semantics.

Contract rules (see also ``platform/docs/data-flows.md``):

- **Allowed:** optional bounded ``limit`` on **primary flat list** payloads
  (``items`` on ``/api/v1/devices`` and ``/api/v1/policies``) to reduce payload
  size; totals in the response remain **honest** (``count`` and
  ``read_side_query.items_total`` reflect the full logical list before truncation).
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


def build_read_side_query_echo(
    *,
    limit_requested: int | None,
    items_total: int,
    items_returned: int,
) -> ReadSideQueryEcho:
    """Construct echo metadata; keeps truncation visible without implying truth shrinkage."""
    return ReadSideQueryEcho(
        limit_requested=limit_requested,
        items_total=items_total,
        items_returned=items_returned,
    )
