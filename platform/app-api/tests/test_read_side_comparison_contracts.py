"""Cross-slice parity tests for shared read-side comparison contracts."""

from typing import get_args

from app_api.schemas.common import ComparisonToLatestPersistedStatus
from app_api.schemas.devices import InventoryComparisonSummary
from app_api.schemas.policies import PolicyCurrentComparisonResponse
from app_api.schemas.topology import TopologyComparisonSummary


def test_comparison_to_latest_persisted_status_matches_across_list_endpoints() -> None:
    """Inventory, topology, and policies list responses use the same status enum for current-vs-persisted comparison."""
    expected = get_args(ComparisonToLatestPersistedStatus)
    for model in (InventoryComparisonSummary, TopologyComparisonSummary, PolicyCurrentComparisonResponse):
        annotation = model.model_fields["status"].annotation
        assert get_args(annotation) == expected
