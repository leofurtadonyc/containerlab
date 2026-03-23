"""Global operator search over normalized Phase 2 read-side list payloads only."""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Callable

from app_api.config.settings import get_settings
from app_api.schemas.capabilities import CapabilityRecord
from app_api.schemas.devices import DeviceRecord
from app_api.schemas.operator_search import (
    OperatorSearchFamily,
    OperatorSearchFamilyGroup,
    OperatorSearchHit,
    OperatorSearchPivotTarget,
    OperatorSearchResponse,
    RankingBasis,
)
from app_api.schemas.policies import PolicyRecord
from app_api.schemas.topology import TopologyLinkRecord, TopologyNodeRecord
from app_api.services.capabilities import build_capabilities_list_response
from app_api.services.devices import build_devices_list_response
from app_api.services.policies import build_policies_list_response
from app_api.services.topology import build_topology_response

MIN_QUERY_LEN = 2
CAP_PER_FAMILY = 25

_EXPLICIT_NON_CLAIMS = [
    "Search covers normalized inventory list fields exposed by Phase 2 read APIs only—not logs, metrics, Grafana, or controller config stores.",
    "Results are bounded to current collector or persisted-fallback snapshots; completeness is not guaranteed.",
    "Ranking is heuristic and deterministic (exact id preferred, then substring rules)—not ML relevance.",
]


@dataclass(frozen=True)
class _Match:
    ranking_basis: RankingBasis
    match_reason: str
    tie_match_len: int


def _normalize_haystack(*parts: str | None) -> str:
    return " ".join(p for p in parts if p).lower()


def _match_row(
    *,
    q_raw: str,
    q_lower: str,
    haystack_lower: str,
    exact_ids: list[str | None],
) -> _Match | None:
    for eid in exact_ids:
        if eid and q_raw == eid:
            return _Match(
                ranking_basis="exact_id",
                match_reason=f"Exact id match ({eid}).",
                tie_match_len=len(eid),
            )
    tokens = q_lower.split()
    if len(tokens) > 1:
        if all(t and t in haystack_lower for t in tokens):
            shortest = min(len(t) for t in tokens)
            return _Match(
                ranking_basis="multi_token_substring",
                match_reason="All query tokens appear in the searchable fields for this row.",
                tie_match_len=shortest,
            )
        return None
    if len(tokens) == 1:
        tok = tokens[0]
        if tok in haystack_lower:
            return _Match(
                ranking_basis="substring_match",
                match_reason=f"Substring match on token {tok!r}.",
                tie_match_len=len(tok),
            )
    return None


def _sort_key(m: _Match, sort_id: str) -> tuple[int, int, str]:
    tier = 0 if m.ranking_basis == "exact_id" else 1 if m.ranking_basis == "multi_token_substring" else 2
    return (tier, m.tie_match_len, sort_id)


def _build_policy_hit(policy: PolicyRecord, m: _Match) -> OperatorSearchHit:
    title = policy.policy_name or policy.policy_id
    return OperatorSearchHit(
        object_kind="policy",
        primary_id=policy.policy_id,
        title=title,
        ranking_basis=m.ranking_basis,
        match_reason=m.match_reason,
        pivot=OperatorSearchPivotTarget(view="policies", policy_id=policy.policy_id),
    )


def _build_node_hit(node: TopologyNodeRecord, m: _Match) -> OperatorSearchHit:
    title = node.display_name or node.node_id
    return OperatorSearchHit(
        object_kind="topology_node",
        primary_id=node.node_id,
        title=title,
        ranking_basis=m.ranking_basis,
        match_reason=m.match_reason,
        pivot=OperatorSearchPivotTarget(
            view="topology",
            topology_object=node.node_id,
            topology_object_kind="node",
        ),
    )


def _build_link_hit(link: TopologyLinkRecord, m: _Match) -> OperatorSearchHit:
    title = f"{link.source_node_id} → {link.target_node_id}"
    return OperatorSearchHit(
        object_kind="topology_link",
        primary_id=link.link_id,
        title=title,
        ranking_basis=m.ranking_basis,
        match_reason=m.match_reason,
        pivot=OperatorSearchPivotTarget(
            view="topology",
            topology_object=link.link_id,
            topology_object_kind="link",
        ),
    )


def _build_device_hit(device: DeviceRecord, m: _Match) -> OperatorSearchHit:
    title = device.device_id
    return OperatorSearchHit(
        object_kind="device",
        primary_id=device.device_id,
        title=title,
        ranking_basis=m.ranking_basis,
        match_reason=m.match_reason,
        pivot=OperatorSearchPivotTarget(view="devices", device_id=device.device_id),
    )


def _build_capability_hit(cap: CapabilityRecord, m: _Match) -> OperatorSearchHit:
    title = f"{cap.feature} ({cap.domain})"
    return OperatorSearchHit(
        object_kind="capability",
        primary_id=cap.feature,
        title=title,
        ranking_basis=m.ranking_basis,
        match_reason=m.match_reason,
        pivot=OperatorSearchPivotTarget(
            view="capabilities",
            readiness_capability_feature=cap.feature,
        ),
    )


def _collect_family(
    family: OperatorSearchFamily,
    rows: list[Any],
    match_fn: Callable[[Any], _Match | None],
    build_hit: Callable[[Any, _Match], OperatorSearchHit],
) -> OperatorSearchFamilyGroup | None:
    scored: list[tuple[tuple[int, int, str], OperatorSearchHit]] = []
    for row in rows:
        m = match_fn(row)
        if m is None:
            continue
        hit = build_hit(row, m)
        sk = _sort_key(m, hit.primary_id)
        scored.append((sk, hit))
    if not scored:
        return None
    scored.sort(key=lambda x: x[0])
    total = len(scored)
    capped = total > CAP_PER_FAMILY
    items = [h for _, h in scored[:CAP_PER_FAMILY]]
    return OperatorSearchFamilyGroup(
        family=family,
        items=items,
        items_total_matched=total,
        capped=capped,
        cap=CAP_PER_FAMILY if capped else None,
    )


def build_operator_search_response(q: str) -> OperatorSearchResponse:
    """Build bounded operator search results; ``q`` must be non-empty after strip."""
    settings = get_settings()
    q_eff = q.strip()
    if len(q_eff) < MIN_QUERY_LEN:
        return OperatorSearchResponse(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=datetime.now(UTC),
            q=q_eff,
            result_state="ambiguous",
            guidance=(
                "Query is shorter than two characters after trim. "
                "Use at least two characters to search bounded Phase 2 inventory fields."
            ),
            groups=[],
            explicit_non_claims=list(_EXPLICIT_NON_CLAIMS),
        )

    q_lower = q_eff.lower()
    devices = build_devices_list_response(limit=None)
    policies = build_policies_list_response(limit=None)
    topology = build_topology_response()
    capabilities = build_capabilities_list_response()

    def match_policy(p: PolicyRecord) -> _Match | None:
        hay = _normalize_haystack(
            p.policy_id,
            p.policy_name,
            p.headend,
            p.endpoint,
            p.source_target,
            p.source_target_role,
        )
        return _match_row(
            q_raw=q_eff,
            q_lower=q_lower,
            haystack_lower=hay,
            exact_ids=[p.policy_id],
        )

    def match_node(n: TopologyNodeRecord) -> _Match | None:
        hay = _normalize_haystack(
            n.node_id,
            n.display_name,
            n.device_id,
            n.role,
            n.source,
        )
        return _match_row(
            q_raw=q_eff,
            q_lower=q_lower,
            haystack_lower=hay,
            exact_ids=[n.node_id],
        )

    def match_link(link: TopologyLinkRecord) -> _Match | None:
        hay = _normalize_haystack(
            link.link_id,
            link.source_node_id,
            link.target_node_id,
            link.source,
        )
        return _match_row(
            q_raw=q_eff,
            q_lower=q_lower,
            haystack_lower=hay,
            exact_ids=[link.link_id],
        )

    def match_device(d: DeviceRecord) -> _Match | None:
        hay = _normalize_haystack(
            d.device_id,
            d.vendor,
            d.platform,
            d.role,
            d.management_address,
            d.capability_detail,
        )
        return _match_row(
            q_raw=q_eff,
            q_lower=q_lower,
            haystack_lower=hay,
            exact_ids=[d.device_id],
        )

    def match_capability(c: CapabilityRecord) -> _Match | None:
        hay = _normalize_haystack(
            c.feature,
            c.domain,
            c.status_detail,
            c.vendor,
            c.availability_scope,
        )
        return _match_row(
            q_raw=q_eff,
            q_lower=q_lower,
            haystack_lower=hay,
            exact_ids=[c.feature],
        )

    groups: list[OperatorSearchFamilyGroup] = []
    for fam, rows, mf, bh in (
        ("policies", policies.items, match_policy, _build_policy_hit),
        ("topology_nodes", topology.topology.nodes, match_node, _build_node_hit),
        ("topology_links", topology.topology.links, match_link, _build_link_hit),
        ("devices", devices.items, match_device, _build_device_hit),
        ("capabilities", capabilities.items, match_capability, _build_capability_hit),
    ):
        g = _collect_family(fam, rows, mf, bh)
        if g is not None:
            groups.append(g)

    if not groups:
        return OperatorSearchResponse(
            service="app-api",
            version=settings.app_version,
            phase="phase_2_read_only_foundation",
            generated_at=datetime.now(UTC),
            q=q_eff,
            result_state="no_hits",
            guidance="No matches in bounded Phase 2 inventory fields for this query.",
            groups=[],
            explicit_non_claims=list(_EXPLICIT_NON_CLAIMS),
        )

    return OperatorSearchResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_2_read_only_foundation",
        generated_at=datetime.now(UTC),
        q=q_eff,
        result_state="hits",
        guidance=None,
        groups=groups,
        explicit_non_claims=list(_EXPLICIT_NON_CLAIMS),
    )
