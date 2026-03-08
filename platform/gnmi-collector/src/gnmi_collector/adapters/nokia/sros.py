"""Nokia SR OS adapter placeholder."""

from dataclasses import dataclass


@dataclass(frozen=True)
class NokiaSrosAdapter:
    """Placeholder for Nokia-first collection behavior."""

    vendor_name: str = "nokia"

    def describe(self) -> str:
        """Describe the current adapter scope honestly."""
        return "Phase 1 Nokia SR OS adapter placeholder"
