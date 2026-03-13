"""Audit-style history API endpoints."""

from fastapi import APIRouter

from app_api.schemas.audit_history import AuditHistoryResponse
from app_api.services.audit_history import build_audit_history_response

router = APIRouter(tags=["audit-history"])


@router.get("/audit-history", response_model=AuditHistoryResponse)
def list_audit_history() -> AuditHistoryResponse:
    """Return bounded platform-recorded audit-style sync history."""
    return build_audit_history_response()
