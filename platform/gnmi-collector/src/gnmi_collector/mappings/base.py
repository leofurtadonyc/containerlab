"""Shared mapping contracts for normalized collector outputs."""

from typing import Any, Protocol


class MappingStage(Protocol):
    """Contract for raw-to-normalized transformation stages."""

    def map_record(self, raw_record: dict[str, Any]) -> dict[str, Any]:
        """Map a raw record into a normalized placeholder structure."""
