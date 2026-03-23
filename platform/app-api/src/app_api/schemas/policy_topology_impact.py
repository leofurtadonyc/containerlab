"""Bounded policy → topology impact read contract (Phase 2, read-only).

Inverse pivot of ``topology_related_policies``: for one policy, lists topology **nodes**
and **links** whose normalized identifiers align via the same exact string-equality rules.
"""

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata
from app_api.schemas.topology_related_policies import (
    RelatedPolicyMatchedField,
    RelatedPolicyRelationshipKind,
    TopologyObjectKind,
)


class PolicyTopologyImpactRow(BaseModel):
    """One topology object that aligns with the policy under bounded string rules."""

    topology_object_kind: TopologyObjectKind
    topology_object_id: str = Field(
        ...,
        description="Topology node_id for kind=node, or link_id for kind=link.",
    )
    relationship_kind: RelatedPolicyRelationshipKind
    matched_field: RelatedPolicyMatchedField
    matched_policy_value: str
    matched_topology_identifier: str
    anchor_topology_node_id: str
    evidence_source: str = Field(
        default=(
            "Normalized PolicyInventoryRecord headend/endpoint/source_target compared to "
            "normalized TopologyNode node_id, display_name, and device_id (exact string equality)."
        ),
    )
    caveats: list[str] = Field(default_factory=list)


class PolicyTopologyImpactResponse(BaseModel):
    """Read-only topology-impact rows for one normalized policy record."""

    metadata: ApiResponseMetadata
    policy_id: str
    policy_name: str
    derivation_summary: str = Field(
        ...,
        description="How rows were produced and what is excluded.",
    )
    global_caveats: list[str] = Field(default_factory=list)
    items: list[PolicyTopologyImpactRow]
