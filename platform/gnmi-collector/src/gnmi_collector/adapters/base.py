"""Base adapter contracts for vendor-specific collector code."""

from typing import Protocol


class GnmiAdapter(Protocol):
    """Common contract for vendor-specific gNMI adapters."""

    vendor_name: str

    def describe(self) -> str:
        """Return a short description of the adapter scope."""
