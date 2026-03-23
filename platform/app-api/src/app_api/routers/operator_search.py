"""Global operator search API (operator_search_pivot_v1)."""

from fastapi import APIRouter, HTTPException, Query

from app_api.schemas.operator_search import OperatorSearchResponse
from app_api.services.operator_search import build_operator_search_response

router = APIRouter(tags=["operator-search"])


@router.get("/operator-search", response_model=OperatorSearchResponse)
def operator_search(
    q: str = Query(
        ...,
        description="Required search string (trimmed). Whitespace-only is rejected.",
    ),
) -> OperatorSearchResponse:
    """Bounded search across normalized Phase 2 device, policy, topology, and capability list fields."""
    stripped = q.strip()
    if not stripped:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["query", "q"],
                    "msg": "Query must not be empty or whitespace-only after trim.",
                    "type": "value_error",
                }
            ],
        )
    return build_operator_search_response(stripped)
