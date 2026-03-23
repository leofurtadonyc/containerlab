"""Bounded topology-object → related policies read contract (Phase 2, read-only).

Maps normalized policy inventory string fields (``headend``, ``endpoint``, ``source_target``)
to topology node identifiers (``node_id``, ``display_name``, ``device_id``) using **exact
string equality** on the same normalized inventory snapshot that backs ``GET /api/v1/policies``
and the same topology snapshot that backs ``GET /api/v1/topology``.

This module does **not** assert operational dependency, dataplane forwarding, TE resolution,
or that graph adjacency implies policy binding beyond the stated string match semantics.
"""

from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

TopologyObjectKind = Literal["node", "link"]

RelatedPolicyMatchedField = Literal["headend", "endpoint", "source_target"]

RelatedPolicyRelationshipKind = Literal[
    "policy_field_matches_node_identifier",
    "policy_field_matches_link_endpoint_identifier",
]


class TopologyRelatedPolicyReference(BaseModel):
    """One bounded policy reference tied to a topology object via string equality."""

    policy_id: str
    policy_name: str
    policy_type: Literal["static_local", "static_non_local", "unknown"]
    relationship_kind: RelatedPolicyRelationshipKind
    matched_field: RelatedPolicyMatchedField
    matched_policy_value: str = Field(
        ...,
        description="Value taken from the policy record field named by matched_field.",
    )
    matched_topology_identifier: str = Field(
        ...,
        description=(
            "Topology-side identifier that equaled the policy field (one of node_id, "
            "display_name, or device_id for the anchor node)."
        ),
    )
    anchor_topology_node_id: str = Field(
        ...,
        description="Topology node_id for the endpoint where the match was evaluated.",
    )
    evidence_source: str = Field(
        default=(
            "Normalized PolicyInventoryRecord headend/endpoint/source_target compared to "
            "normalized TopologyNode node_id, display_name, and device_id (exact string equality)."
        ),
    )
    caveats: list[str] = Field(
        default_factory=list,
        description="Per-reference caveats (duplication allowed when multiple fields match).",
    )


class TopologyObjectRelatedPoliciesResponse(BaseModel):
    """Read-only related-policies view for a topology node or link object id."""

    metadata: ApiResponseMetadata
    object_kind: TopologyObjectKind
    object_id: str
    derivation_summary: str = Field(
        ...,
        description="Human-readable explanation of how items were produced and what is excluded.",
    )
    global_caveats: list[str] = Field(
        default_factory=list,
        description="Response-level caveats (topology partiality, empty slices, etc.).",
    )
    items: list[TopologyRelatedPolicyReference]
