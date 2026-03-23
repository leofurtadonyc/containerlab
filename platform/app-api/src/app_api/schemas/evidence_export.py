"""Evidence export v1 envelope (Phase 2, read-only).

Wraps existing composed read responses without adding new truth domains.
See ``platform/docs/evidence-export-contract.md``.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app_api.schemas.evidence_pack import SituationPackAssemblyResponse
from app_api.schemas.investigation_workspace import InvestigationContextAssemblyResponse
from app_api.schemas.policy_dossier import PolicyDossierResponse
from app_api.schemas.topology_object_dossier import TopologyObjectDossierResponse

EVIDENCE_EXPORT_CONTRACT_ID = "evidence_export_v1"

EvidenceExportKind = Literal[
    "topology_object_dossier",
    "policy_dossier",
    "situation_room",
    "investigation_workspace",
]

DEFAULT_EVIDENCE_EXPORT_EXPLICIT_NON_CLAIMS: list[str] = [
    "not_compliance_or_legal_hold_artifact",
    "not_tamper_evident_signed_or_immutable_by_default",
    "not_backup_of_postgres_prometheus_or_collector_state",
    "not_substitute_for_live_product_surfaces_or_authoritative_per_domain_apis",
    "not_complete_across_all_time_ranges_tables_or_targets_unless_nested_contracts_state_completeness",
    "not_safe_to_change_validation_or_incident_command_authority",
]

DEFAULT_EVIDENCE_EXPORT_FRAMING = (
    "Phase 2 read-only evidence export: a bounded snapshot for operator communication and "
    "record-keeping. Nested payloads retain their own contract_id semantics; this envelope does "
    "not grant operational authorization, validation verdicts, or substitute for live Policies, "
    "Topology, Situation room, or Investigation views."
)


class PolicyDossierEvidenceExportResponse(BaseModel):
    """JSON export wrapping an existing policy dossier assembly."""

    contract_id: Literal["evidence_export_v1"] = Field(default=EVIDENCE_EXPORT_CONTRACT_ID)
    export_kind: Literal["policy_dossier"] = "policy_dossier"
    subject_ref: dict[str, Any] = Field(
        ...,
        description="Identity for this export (e.g. policy_id).",
    )
    generated_at: datetime
    source_contract_ids: list[str] = Field(
        ...,
        description="Nested contract_id values present in the nested payload (first-seen order).",
    )
    explicit_non_claims: list[str]
    export_framing: str
    nested: PolicyDossierResponse


class TopologyObjectDossierEvidenceExportResponse(BaseModel):
    """JSON export wrapping an existing topology object dossier assembly."""

    contract_id: Literal["evidence_export_v1"] = Field(default=EVIDENCE_EXPORT_CONTRACT_ID)
    export_kind: Literal["topology_object_dossier"] = "topology_object_dossier"
    subject_ref: dict[str, Any]
    generated_at: datetime
    source_contract_ids: list[str]
    explicit_non_claims: list[str]
    export_framing: str
    nested: TopologyObjectDossierResponse


class SituationRoomEvidenceExportResponse(BaseModel):
    """JSON export wrapping the situation (evidence) pack assembly."""

    contract_id: Literal["evidence_export_v1"] = Field(default=EVIDENCE_EXPORT_CONTRACT_ID)
    export_kind: Literal["situation_room"] = "situation_room"
    subject_ref: dict[str, Any]
    generated_at: datetime
    source_contract_ids: list[str]
    explicit_non_claims: list[str]
    export_framing: str
    nested: SituationPackAssemblyResponse


class InvestigationWorkspaceEvidenceExportResponse(BaseModel):
    """JSON export wrapping the investigation context assembly."""

    contract_id: Literal["evidence_export_v1"] = Field(default=EVIDENCE_EXPORT_CONTRACT_ID)
    export_kind: Literal["investigation_workspace"] = "investigation_workspace"
    subject_ref: dict[str, Any]
    generated_at: datetime
    source_contract_ids: list[str]
    explicit_non_claims: list[str]
    export_framing: str
    nested: InvestigationContextAssemblyResponse
