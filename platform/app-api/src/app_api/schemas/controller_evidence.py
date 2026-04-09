"""Controller southbound session truth v2 — bounded read model (backend-owned, not ODL-as-truth)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app_api.schemas.common import ApiResponseMetadata

CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID = "controller_southbound_session_truth_v2"

ControllerReachability = Literal["ok", "degraded", "unreachable", "unknown"]

ProtocolLaneId = Literal["bgp_ls", "pcep", "netconf"]

ProtocolLanePosture = Literal[
    "available",
    "partial",
    "empty",
    "degraded",
    "unreachable",
    "unsupported",
    "unknown",
]

ProtocolExposurePosture = Literal["exposed", "not_exposed", "unknown"]

ObjectVisibilityPosture = Literal["objects_visible", "scope_only", "none_visible", "unknown"]

SessionPosture = Literal[
    "established",
    "not_observed",
    "degraded",
    "unknown",
    "unsupported",
    "unreachable",
]

EvidenceStrength = Literal[
    "session_backed",
    "object_backed",
    "scope_only",
    "heuristic_only",
    "unavailable",
]

DerivationMode = Literal[
    "protocol_native",
    "controller_object_parse",
    "topology_partition_heuristic",
    "supplemental_restconf",
    "unknown",
]


class ProtocolLaneDetailV2(BaseModel):
    """One southbound lane with explicit session-truth semantics (v2)."""

    lane_id: ProtocolLaneId
    lane_posture: ProtocolLanePosture
    protocol_exposure_posture: ProtocolExposurePosture = Field(
        description="Whether YANG catalog suggests the protocol family is registered on the controller.",
    )
    object_visibility_posture: ObjectVisibilityPosture
    session_posture: SessionPosture = Field(
        description="Southbound session posture from strongest available controller evidence (may be not_observed).",
    )
    evidence_strength: EvidenceStrength
    derivation_mode: DerivationMode = Field(
        description="How this lane was derived: native session tree vs topology partition vs supplemental RESTCONF.",
    )
    observed_source: str = Field(description="Primary RESTCONF path family or parser label.")
    node_count: int = 0
    link_count: int = 0
    topology_ids: list[str] = Field(default_factory=list)
    fingerprint: str = ""
    notes: list[str] = Field(default_factory=list)
    fallback_notes: list[str] = Field(
        default_factory=list,
        description="Explicit downgrade/heuristic explanations (not generic fluff).",
    )
    explicit_non_claims: list[str] = Field(
        default_factory=lambda: [
            "Lane evidence is controller-exported only; not dataplane or forwarding truth.",
            "RESTCONF reachability and YANG module registration do not prove every southbound session is healthy.",
        ],
    )


class ControllerEvidenceSafetyFramingV2(BaseModel):
    contract_id: str = CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID
    explicit_non_claims: list[str] = Field(
        default_factory=lambda: [
            "Controller reachability (RESTCONF/YANG probe) is separate from per-protocol southbound session truth.",
            "Session posture 'established' uses bounded controller-visible hints only—not wire-level proof for every peer.",
            "BGP-LS / PCEP / NETCONF lanes do not imply TE authority, service dependency truth, or path validation.",
        ],
    )


class ControllerEvidenceResponse(ApiResponseMetadata):
    """Aggregate controller southbound session truth read model (v2)."""

    contract_id: str = CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID
    controller_reachability: ControllerReachability = Field(
        description="From RESTCONF capability/YANG-library probe—not southbound session health alone.",
    )
    controller_capability_probe_summary: str = ""
    yang_module_catalog_count: int = Field(
        default=0,
        description="Count of YANG module names read from modules-state (0 if catalog read failed).",
    )
    aggregate_fetch_notes: list[str] = Field(default_factory=list)
    bgp_ls: ProtocolLaneDetailV2
    pcep: ProtocolLaneDetailV2
    netconf: ProtocolLaneDetailV2
    persisted_snapshot_id: str | None = None
    safety_framing: ControllerEvidenceSafetyFramingV2 = Field(default_factory=ControllerEvidenceSafetyFramingV2)


class BgpLsLaneOnlyResponse(BaseModel):
    contract_id: str = CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID
    lane: ProtocolLaneDetailV2


class PcepLaneOnlyResponse(BaseModel):
    contract_id: str = CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID
    lane: ProtocolLaneDetailV2


class NetconfLaneOnlyResponse(BaseModel):
    contract_id: str = CONTROLLER_SOUTHBOUND_SESSION_TRUTH_V2_CONTRACT_ID
    lane: ProtocolLaneDetailV2
