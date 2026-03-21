"""Bounded ODL integration client for backend-owned read enrichment."""

from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app_api.config.settings import get_settings


@dataclass(frozen=True)
class OdlClientConfig:
    """Minimal configuration for the ODL integration boundary."""

    base_url: str
    username: str
    password: str
    timeout_seconds: int = 3


@dataclass(frozen=True)
class OdlControllerObservation:
    """Normalized bounded ODL controller observation for product use."""

    observation_state: Literal["ok", "degraded", "unreachable", "unknown"]
    observed_source: str
    observation_summary: str
    observed_capabilities: list[str]
    notes: list[str]


@dataclass(frozen=True)
class OdlClient:
    """Small RESTCONF client for bounded ODL capability discovery."""

    config: OdlClientConfig

    def _build_headers(self) -> dict[str, str]:
        token = base64.b64encode(
            f"{self.config.username}:{self.config.password}".encode("utf-8")
        ).decode("ascii")
        return {
            "Authorization": f"Basic {token}",
            "Accept": "application/json",
        }

    def _read_json(self, path: str) -> dict[str, Any]:
        request = Request(
            url=f"{self.config.base_url.rstrip('/')}{path}",
            headers=self._build_headers(),
        )
        with urlopen(request, timeout=self.config.timeout_seconds) as response:
            payload = response.read().decode("utf-8")
        return json.loads(payload)

    def read_controller_observation(self) -> OdlControllerObservation:
        """Return one bounded controller-side observation for Platform Health."""
        observed_source = "odl_restconf_capability_probe"
        try:
            modules_payload = self._read_json("/rests/data/ietf-yang-library:modules-state")
            operations_payload = self._read_json("/rests/operations")
        except HTTPError as exc:
            if exc.code in {401, 403}:
                return OdlControllerObservation(
                    observation_state="degraded",
                    observed_source=observed_source,
                    observation_summary=(
                        "ODL RESTCONF is reachable, but the configured backend "
                        "credentials could not read bounded controller capability data."
                    ),
                    observed_capabilities=[],
                    notes=[
                        "The backend keeps ODL bounded to read-only capability discovery on this path.",
                        "Controller-side topology or protocol helpers are not trusted or exposed without successful authenticated reads.",
                    ],
                )
            return OdlControllerObservation(
                observation_state="degraded",
                observed_source=observed_source,
                observation_summary=(
                    "ODL RESTCONF responded unexpectedly during the bounded "
                    "controller capability probe."
                ),
                observed_capabilities=[],
                notes=[f"ODL returned HTTP {exc.code} while the backend probed controller-side capability data."],
            )
        except (URLError, TimeoutError, json.JSONDecodeError):
            return OdlControllerObservation(
                observation_state="unreachable",
                observed_source=observed_source,
                observation_summary=(
                    "The backend could not complete the bounded ODL RESTCONF "
                    "capability probe."
                ),
                observed_capabilities=[],
                notes=[
                    "ODL remains optional input only; product APIs do not depend on it as the sole source of truth.",
                    "This observation does not affect collector-backed inventory, topology, or policy read paths.",
                ],
            )

        modules = modules_payload.get("ietf-yang-library:modules-state", {}).get(
            "module", []
        )
        operations = operations_payload.get("ietf-restconf:operations", {})
        module_names = {
            item.get("name", "") for item in modules if isinstance(item, dict)
        }
        operation_names = {
            name for name in operations.keys() if isinstance(name, str)
        }

        observed_capabilities = ["restconf", "yang_library"]
        if any(name.startswith("ietf-netconf:") for name in operation_names):
            observed_capabilities.append("netconf_operations")

        notes: list[str] = [
            (
                f"Observed {len(module_names)} YANG modules and "
                f"{len(operation_names)} RESTCONF operations from the running controller."
            ),
        ]
        protocol_hints = {
            "controller_topology_models": any(
                "network-topology" in name for name in module_names
            ),
            "bgp_helpers": any("bgp" in name for name in module_names | operation_names),
            "bmp_helpers": any("bmp" in name for name in module_names | operation_names),
            "pcep_helpers": any(
                "pcep" in name for name in module_names | operation_names
            ),
        }
        for capability_name, present in protocol_hints.items():
            if present:
                observed_capabilities.append(capability_name)

        absent_hints = [
            label.replace("_", " ")
            for label, present in protocol_hints.items()
            if not present
        ]
        if absent_hints:
            notes.append(
                "No bounded controller-side evidence was observed yet for "
                + ", ".join(absent_hints)
                + "."
            )

        return OdlControllerObservation(
            observation_state="ok",
            observed_source=observed_source,
            observation_summary=(
                "ODL RESTCONF is reachable and contributes a bounded controller capability "
                "probe to platform health only: reachability plus YANG/RESTCONF hints—not SR topology "
                "or policy truth, and not a substitute for collector-backed read paths."
            ),
            observed_capabilities=observed_capabilities,
            notes=notes,
        )


def get_odl_client() -> OdlClient:
    """Return the configured bounded ODL client."""
    settings = get_settings()
    return OdlClient(
        config=OdlClientConfig(
            base_url=settings.odl_url,
            username=settings.odl_username,
            password=settings.odl_password,
            timeout_seconds=settings.odl_timeout_seconds,
        )
    )
