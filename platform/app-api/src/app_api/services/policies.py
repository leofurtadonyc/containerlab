"""Policy inventory service helpers."""

from datetime import UTC, datetime

from app_api.config.settings import get_settings
from app_api.models.policy import CandidatePath, PolicyInventoryRecord
from app_api.schemas.policies import (
    CandidatePathRecord,
    PoliciesListResponse,
    PolicyRecord,
)


def _build_policy_inventory() -> list[PolicyInventoryRecord]:
    """Build the backend-owned normalized policy inventory scaffold."""
    return [
        PolicyInventoryRecord(
            policy_id="sr-policy-edge-pe-1-to-core",
            policy_name="Edge PE 1 to Core",
            headend="edge-pe-1",
            endpoint="core-p-placeholder",
            color=100,
            candidate_paths=[
                CandidatePath(
                    name="primary",
                    path_state="unknown",
                    preference=100,
                    notes=[
                        "Candidate path structure is scaffolded before controller-backed path data exists."
                    ],
                )
            ],
            intent_state="declared",
            observed_state="unknown",
            support_state="not_implemented_in_platform",
            health_state="unknown",
            source="platform_policy_placeholder",
            notes=[
                "Policy inventory is intentionally read-only in Phase 1.",
                "Support and observed state remain explicit until deeper SR policy integration exists.",
            ],
        ),
        PolicyInventoryRecord(
            policy_id="sr-policy-edge-pe-1-to-remote",
            policy_name="Edge PE 1 to Remote",
            headend="edge-pe-1",
            endpoint="remote-site-placeholder",
            color=200,
            candidate_paths=[],
            intent_state="unknown",
            observed_state="inactive",
            support_state="unknown",
            health_state="degraded",
            source="platform_policy_placeholder",
            notes=[
                "This placeholder record demonstrates incomplete knowledge handling.",
                "No vendor-native SR policy payload is exposed through the API contract.",
            ],
        ),
    ]


def build_policies_list_response() -> PoliciesListResponse:
    """Build the Phase 1 policy inventory response from a normalized backend model."""
    settings = get_settings()
    policies = _build_policy_inventory()
    items = [
        PolicyRecord(
            policy_id=policy.policy_id,
            policy_name=policy.policy_name,
            headend=policy.headend,
            endpoint=policy.endpoint,
            color=policy.color,
            candidate_paths=[
                CandidatePathRecord(
                    name=path.name,
                    path_state=path.path_state,
                    preference=path.preference,
                    notes=path.notes,
                )
                for path in policy.candidate_paths
            ],
            intent_state=policy.intent_state,
            observed_state=policy.observed_state,
            support_state=policy.support_state,
            health_state=policy.health_state,
            source=policy.source,
            notes=policy.notes,
        )
        for policy in policies
    ]
    return PoliciesListResponse(
        service="app-api",
        version=settings.app_version,
        phase="phase_1_skeleton",
        generated_at=datetime.now(UTC),
        data_status="normalized_scaffold",
        summary=(
            "Phase 1 policy inventory is served from a backend-owned normalized read "
            "model with explicit support, observed, and unknown states."
        ),
        count=len(items),
        items=items,
    )
