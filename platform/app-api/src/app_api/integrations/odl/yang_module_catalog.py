"""Fetch YANG module name set from ODL for protocol exposure hints (not session truth by itself)."""

from __future__ import annotations

import json
from typing import Any

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app_api.integrations.odl.client import OdlClient, get_odl_client


def fetch_yang_module_names(client: OdlClient | None = None) -> tuple[set[str], list[str]]:
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
        return set(), notes
    except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        notes.append(f"YANG library read failed: {str(exc)[:160]}.")
        return set(), notes

    if not isinstance(payload, dict):
        return set(), notes + ["Unexpected modules-state shape."]
    ms = payload.get("ietf-yang-library:modules-state", {})
    if not isinstance(ms, dict):
        return set(), notes + ["modules-state payload not a dict."]
    modules = ms.get("module", [])
    if not isinstance(modules, list):
        return set(), notes + ["modules-state.module not a list."]
    names: set[str] = set()
    for item in modules:
        if isinstance(item, dict):
            name = item.get("name")
            if isinstance(name, str) and name:
                names.add(name.lower())
    notes.append(f"Catalogued {len(names)} YANG module name(s) for exposure hints.")
    return names, notes


def module_hints_for_lanes(module_names: set[str]) -> dict[str, bool]:
    """Heuristic: which protocol families appear registered (not operational session proof)."""
    joined = " ".join(sorted(module_names))
    return {
        "bgp_ls_family": any(
            x in joined for x in ("bgp", "bgp-linkstate", "linkstate", "bgpcep", "bmp")
        ),
        "pcep_family": "pcep" in joined,
        "netconf_family": any(
            x in joined for x in ("netconf", "netconf-node", "topology-netconf", "ietf-netconf")
        ),
    }
