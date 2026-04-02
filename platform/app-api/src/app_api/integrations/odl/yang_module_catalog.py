"""Fetch YANG module name set from ODL for protocol exposure hints (not session truth by itself)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Literal

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app_api.integrations.odl.client import OdlClient, get_odl_client


ProtocolExposurePosture = Literal["exposed", "not_exposed", "unknown"]


@dataclass(frozen=True)
class YangModuleCatalogResult:
    """Result of a bounded YANG-library read used only for exposure hints."""

    status: Literal["ok", "unavailable"]
    module_names: set[str]
    notes: list[str] = field(default_factory=list)


def fetch_yang_module_names(client: OdlClient | None = None) -> YangModuleCatalogResult:
    """Return lowercase module name strings from ietf-yang-library modules-state."""
    notes: list[str] = []
    c = client or get_odl_client()
    request = Request(
        url=f"{c.config.base_url.rstrip('/')}/rests/data/ietf-yang-library:modules-state",
        headers=c._build_headers(),
    )
    try:
        with urlopen(request, timeout=c.config.timeout_seconds) as response:
            raw = response.read().decode("utf-8")
        payload = json.loads(raw)
    except HTTPError as exc:
        notes.append(f"YANG library read returned HTTP {exc.code}.")
        return YangModuleCatalogResult(status="unavailable", module_names=set(), notes=notes)
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        notes.append(f"YANG library read failed: {str(exc)[:160]}.")
        return YangModuleCatalogResult(status="unavailable", module_names=set(), notes=notes)

    if not isinstance(payload, dict):
        return YangModuleCatalogResult(
            status="unavailable",
            module_names=set(),
            notes=notes + ["Unexpected modules-state shape."],
        )
    ms = payload.get("ietf-yang-library:modules-state", {})
    if not isinstance(ms, dict):
        return YangModuleCatalogResult(
            status="unavailable",
            module_names=set(),
            notes=notes + ["modules-state payload not a dict."],
        )
    modules = ms.get("module", [])
    if not isinstance(modules, list):
        return YangModuleCatalogResult(
            status="unavailable",
            module_names=set(),
            notes=notes + ["modules-state.module not a list."],
        )
    names: set[str] = set()
    for item in modules:
        if isinstance(item, dict):
            name = item.get("name")
            if isinstance(name, str) and name:
                names.add(name.lower())
    notes.append(f"Catalogued {len(names)} YANG module name(s) for exposure hints.")
    return YangModuleCatalogResult(status="ok", module_names=names, notes=notes)


def module_hints_for_lanes(catalog: YangModuleCatalogResult) -> dict[str, ProtocolExposurePosture]:
    """Heuristic: which protocol families appear registered (not operational session proof)."""
    if catalog.status != "ok":
        return {
            "bgp_ls_family": "unknown",
            "pcep_family": "unknown",
            "netconf_family": "unknown",
        }

    joined = " ".join(sorted(catalog.module_names))
    return {
        "bgp_ls_family": (
            "exposed"
            if any(x in joined for x in ("bgp", "bgp-linkstate", "linkstate", "bgpcep", "bmp"))
            else "not_exposed"
        ),
        "pcep_family": "exposed" if "pcep" in joined else "not_exposed",
        "netconf_family": (
            "exposed"
            if any(x in joined for x in ("netconf", "netconf-node", "topology-netconf", "ietf-netconf"))
            else "not_exposed"
        ),
    }
