"""Service Explorer v1 — derived grouping over policy inventory + topology (Phase 2 read-only)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from app_api.config.settings import get_settings
from app_api.schemas.degraded_policy_v1 import DegradedPolicyV1ReasonCode
from app_api.schemas.policies import PoliciesListResponse, PolicyRecord
from app_api.schemas.read_side_query import build_read_side_query_echo
from app_api.schemas.service_explorer import (
    SERVICE_EXPLORER_V1_CONTRACT_ID,
    DegradedServiceRollup,
    ServiceDetailResponse,
    ServiceExplorerPolicyInventoryEcho,
    ServiceListRow,
    ServiceMemberSummary,
    ServicesListResponse,
    ServiceTopologyLinkRecord,
    TopologyEvidenceStatus,
)
from app_api.schemas.topology import TopologyNodeRecord, TopologyResponse
from app_api.services.policies import build_policies_list_response
from app_api.services.topology import build_topology_response

ServiceIdKind = Literal["policy", "color", "headend", "endpoint"]

_REASON_CODE_CAP = 20
_PIVOT_CAP = 10


def parse_service_id(raw: str) -> tuple[ServiceIdKind, str] | None:
    """Parse ``service_id`` per ``service-explorer-contract.md`` (prefix forms only)."""
    if raw.startswith("policy:"):
        return ("policy", raw.removeprefix("policy:"))
    if raw.startswith("color:"):
        rest = raw.removeprefix("color:")
        try:
            int(rest)
        except ValueError:
            return None
        return ("color", rest)
    if raw.startswith("headend:"):
        return ("headend", raw.removeprefix("headend:"))
    if raw.startswith("endpoint:"):
        return ("endpoint", raw.removeprefix("endpoint:"))
    return None


def _roll_up_degraded(members: list[PolicyRecord]) -> tuple[Literal["ok", "degraded", "unknown"], DegradedServiceRollup]:
    postures = [m.degraded_policy_v1.posture for m in members]
    if "degraded" in postures:
        worst: Literal["ok", "degraded", "unknown"] = "degraded"
    elif "unknown" in postures:
        worst = "unknown"
    else:
        worst = "ok"
    reason_set: set[DegradedPolicyV1ReasonCode] = set()
    for m in members:
        for r in m.degraded_policy_v1.reason_codes:
            reason_set.add(r)
    sorted_codes = sorted(reason_set)
    truncated = len(sorted_codes) > _REASON_CODE_CAP
    capped = sorted_codes[:_REASON_CODE_CAP]
    rollup = DegradedServiceRollup(
        posture=worst,
        reason_codes=capped,
        reason_codes_truncated=truncated,
    )
    return worst, rollup


def _sorted_members(items: list[PolicyRecord]) -> list[PolicyRecord]:
    return sorted(items, key=lambda p: p.policy_id)


def _members_for_kind(
    kind: ServiceIdKind,
    key: str,
    items: list[PolicyRecord],
) -> list[PolicyRecord]:
    if kind == "policy":
        return [p for p in items if p.policy_id == key]
    if kind == "color":
        return [p for p in items if str(p.color) == key]
    if kind == "headend":
        return [p for p in items if p.headend == key]
    return [p for p in items if p.endpoint == key]


def _policy_inventory_echo(policies: PoliciesListResponse) -> ServiceExplorerPolicyInventoryEcho:
    return ServiceExplorerPolicyInventoryEcho(
        data_status=policies.data_status,
        serving_mode=policies.serving_mode,
        empty_reason=policies.empty_reason,
        summary=policies.summary,
        observed_policy_count=policies.observed_policy_count,
        policy_items_total=policies.count,
    )


def _default_pivots(*, policy_id: str | None, topology_node_id: str | None) -> list[str]:
    settings = get_settings()
    pivots = [
        f"{SERVICE_EXPLORER_V1_CONTRACT_ID}: GET /api/v1/policies — flat inventory authority.",
        f"{SERVICE_EXPLORER_V1_CONTRACT_ID}: GET /api/v1/topology — graph read (inference-bounded).",
        f"Live shell: view=delta-digest — cross_domain_delta_digest_v1 (app-api {settings.app_version}).",
    ]
    if policy_id:
        pivots.append(
            f"Live shell: view=policies — policy_workspace=dossier with policy_id={policy_id}",
        )
    if topology_node_id:
        pivots.append(
            f"Live shell: view=topology — topology_workspace=dossier with topology_object={topology_node_id}",
        )
    return pivots[:_PIVOT_CAP]


def _match_topology_links(
    members: list[PolicyRecord],
    topology: TopologyResponse | None,
) -> tuple[list[ServiceTopologyLinkRecord], TopologyEvidenceStatus, list[str]]:
    caveats: list[str] = []
    if topology is None:
        return [], "unavailable", ["Topology response was unavailable; linkage is not shown."]
    nodes = topology.topology.nodes
    if not nodes:
        return [], "partial", ["Topology graph has zero nodes; policy-to-node matching is empty."]

    links: list[ServiceTopologyLinkRecord] = []
    for pol in members:
        candidates: list[tuple[str, Literal["headend", "source_target", "endpoint"]]] = [
            (pol.headend, "headend"),
            (pol.source_target, "source_target"),
            (pol.endpoint, "endpoint"),
        ]
        for value, field in candidates:
            if not value:
                continue
            for node in nodes:
                matched_on = _node_match(node, value)
                if matched_on is not None:
                    links.append(
                        ServiceTopologyLinkRecord(
                            policy_id=pol.policy_id,
                            node_id=node.node_id,
                            display_name=node.display_name,
                            matched_on=matched_on,
                            matched_from_policy_field=field,
                        )
                    )
    # De-duplicate identical rows
    seen: set[tuple[str, str, str, str]] = set()
    unique: list[ServiceTopologyLinkRecord] = []
    for row in links:
        sig = (row.policy_id, row.node_id, row.matched_on, row.matched_from_policy_field)
        if sig in seen:
            continue
        seen.add(sig)
        unique.append(row)

    cov = topology.coverage_summary
    if cov.inference_posture == "unknown" or cov.collection_posture in ("degraded", "blocked"):
        caveats.append(cov.summary)

    if not unique:
        status: TopologyEvidenceStatus = "partial"
        caveats.append(
            "No topology nodes matched policy headend/source_target/endpoint strings "
            "(exact match on node_id, display_name, or device_id).",
        )
    elif caveats:
        status = "partial"
    else:
        status = "present"
    return unique, status, caveats


def _node_match(node: TopologyNodeRecord, value: str) -> Literal["node_id", "display_name", "device_id"] | None:
    if value == node.node_id:
        return "node_id"
    if value == node.display_name:
        return "display_name"
    if node.device_id is not None and value == node.device_id:
        return "device_id"
    return None


def _load_topology_or_none() -> tuple[TopologyResponse | None, list[str]]:
    try:
        return build_topology_response(), []
    except Exception as exc:  # noqa: BLE001 — bounded read: surface as caveat, not 500
        return None, [f"Topology assembly failed ({type(exc).__name__}); linkage unavailable for this response."]


def build_service_list_rows_for_policy_subset(items: list[PolicyRecord]) -> list[ServiceListRow]:
    """Derive Service Explorer–style grouping rows over a **filtered** policy subset.

    Uses the same grouping rules as ``GET /api/v1/services`` (policy / color / headend /
    endpoint), but only among policies in ``items``. Empty input yields an empty list.
    """
    if not items:
        return []
    return _build_list_rows(items)


def _build_list_rows(items: list[PolicyRecord]) -> list[ServiceListRow]:
    rows: list[ServiceListRow] = []
    for p in items:
        worst, _ = _roll_up_degraded([p])
        rows.append(
            ServiceListRow(
                service_id=f"policy:{p.policy_id}",
                kind="policy",
                member_count=1,
                degraded_group_posture=worst,
            )
        )
    colors: set[int] = {p.color for p in items}
    headends: set[str] = {p.headend for p in items}
    endpoints: set[str] = {p.endpoint for p in items}
    for c in sorted(colors):
        members = [p for p in items if p.color == c]
        worst, _ = _roll_up_degraded(members)
        rows.append(
            ServiceListRow(
                service_id=f"color:{c}",
                kind="color",
                member_count=len(members),
                degraded_group_posture=worst,
            )
        )
    for h in sorted(headends):
        members = [p for p in items if p.headend == h]
        worst, _ = _roll_up_degraded(members)
        rows.append(
            ServiceListRow(
                service_id=f"headend:{h}",
                kind="headend",
                member_count=len(members),
                degraded_group_posture=worst,
            )
        )
    for e in sorted(endpoints):
        members = [p for p in items if p.endpoint == e]
        worst, _ = _roll_up_degraded(members)
        rows.append(
            ServiceListRow(
                service_id=f"endpoint:{e}",
                kind="endpoint",
                member_count=len(members),
                degraded_group_posture=worst,
            )
        )
    rows.sort(key=lambda r: r.service_id)
    return rows


def _to_member_summary(p: PolicyRecord) -> ServiceMemberSummary:
    return ServiceMemberSummary(
        policy_id=p.policy_id,
        policy_name=p.policy_name,
        policy_type=p.policy_type,
        headend=p.headend,
        endpoint=p.endpoint,
        color=p.color,
        source_target=p.source_target,
        degraded_policy_v1=p.degraded_policy_v1,
    )


def build_services_list_response(*, limit: int | None = None) -> ServicesListResponse:
    """Build grouped service index rows from the current policies inventory."""
    settings = get_settings()
    policies = build_policies_list_response(limit=None, history_recent_limit=1)
    items = policies.items
    all_rows = _build_list_rows(items)
    items_total = len(all_rows)
    if limit is not None:
        sliced = all_rows[:limit]
    else:
        sliced = all_rows
    caveats: list[str] = []
    if policies.empty_reason != "none":
        caveats.append(
            f"Policy inventory empty_reason={policies.empty_reason}; "
            "service groupings are bounded to the same slice as GET /api/v1/policies.",
        )
    if limit is not None and items_total > len(sliced):
        caveats.append(
            f"Service list truncated: returning {len(sliced)} of {items_total} rows (limit={limit}).",
        )
    return ServicesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        policy_inventory=_policy_inventory_echo(policies),
        items=sliced,
        read_side_query=build_read_side_query_echo(
            limit_requested=limit,
            items_total=items_total,
            items_returned=len(sliced),
        ),
        caveats=caveats,
        recommended_pivots=_default_pivots(policy_id=None, topology_node_id=None),
    )


def build_service_detail_response(service_id: str) -> ServiceDetailResponse | None:
    """Return detail for ``service_id``, or ``None`` when unknown id form or zero members."""
    parsed = parse_service_id(service_id)
    if parsed is None:
        return None
    kind, key = parsed
    settings = get_settings()
    policies = build_policies_list_response(limit=None, history_recent_limit=1)
    items = policies.items
    members = _sorted_members(_members_for_kind(kind, key, items))
    if not members:
        return None
    _, degraded = _roll_up_degraded(members)
    topology, topo_errs = _load_topology_or_none()
    topo_errs = list(topo_errs)
    links, topo_status, topo_caveats = _match_topology_links(members, topology)
    caveats = list(topo_errs) + list(topo_caveats)
    first_node = links[0].node_id if links else None
    pivot_policy = members[0].policy_id
    return ServiceDetailResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        service_id=service_id,
        kind=kind,
        policy_inventory=_policy_inventory_echo(policies),
        members=[_to_member_summary(p) for p in members],
        members_total=len(members),
        degraded_service=degraded,
        topology_evidence_status=topo_status,
        topology_links=links,
        topology_caveats=topo_caveats,
        caveats=caveats,
        recommended_pivots=_default_pivots(policy_id=pivot_policy, topology_node_id=first_node),
    )
