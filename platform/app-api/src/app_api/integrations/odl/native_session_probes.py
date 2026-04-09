"""Bounded RESTCONF probes for protocol-native session/oper hints (ODL release-dependent)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app_api.integrations.odl.client import OdlClient, get_odl_client
from app_api.integrations.odl.network_topology_common import http_error_body, is_restconf_unknown_element


# Keys and values that indicate real controller-observed session state rather than config-only trees.
_SESSION_STATUS_KEYS = (
    "session-state",
    "session_state",
    "oper-state",
    "oper_state",
    "conn-state",
    "connection-state",
    "tcp-state",
    "sync-state",
    "status",
    "state",
)
_SESSION_POSITIVE_VALUES = (
    "established",
    "up",
    "connected",
    "synced",
)


def _value_has_positive_session_signal(value: Any, parent_key: str) -> bool:
    if isinstance(value, str):
        normalized = value.lower().replace("_", "-")
        return any(token == normalized for token in _SESSION_POSITIVE_VALUES)
    if isinstance(value, dict):
        for key, nested in value.items():
            lowered = str(key).lower().replace("_", "-")
            if any(token in lowered for token in _SESSION_STATUS_KEYS):
                if _value_has_positive_session_signal(nested, lowered):
                    return True
    if isinstance(value, list):
        return any(_value_has_positive_session_signal(item, parent_key) for item in value[:200])
    return False


def _walk_session_hints(obj: Any, depth: int = 0, parent_key: str = "") -> bool:
    if depth > 40:
        return False
    if isinstance(obj, dict):
        for k, v in obj.items():
            lk = str(k).lower().replace("_", "-")
            if "peer-group" in lk:
                continue
            if any(token in lk for token in _SESSION_STATUS_KEYS):
                if _value_has_positive_session_signal(v, lk):
                    return True
            if _walk_session_hints(v, depth + 1, lk):
                return True
    elif isinstance(obj, list):
        for item in obj[:200]:
            if _walk_session_hints(item, depth + 1, parent_key):
                return True
    elif parent_key and any(token in parent_key for token in _SESSION_STATUS_KEYS):
        return _value_has_positive_session_signal(obj, parent_key)
    return False


@dataclass(frozen=True)
class NativeSessionProbeResult:
    """Outcome of one optional protocol-native RESTCONF GET."""

    path_used: str | None
    payload: dict[str, Any] | None
    has_session_oper_hints: bool
    notes: list[str] = field(default_factory=list)


def _get_json(client: OdlClient, path: str) -> dict[str, Any] | None:
    request = Request(
        url=f"{client.config.base_url.rstrip('/')}{path}",
        headers=client._build_headers(),
    )
    try:
        with urlopen(request, timeout=client.config.timeout_seconds) as response:
            raw = response.read().decode("utf-8")
        out = json.loads(raw)
        return out if isinstance(out, dict) else None
    except HTTPError as exc:
        body = http_error_body(exc)
        if exc.code in {404, 400} and (exc.code == 404 or is_restconf_unknown_element(body)):
            return None
        raise
    except (URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def probe_bgp_ls_native(client: OdlClient | None = None) -> NativeSessionProbeResult:
    """Try stronger-than-topology BGP-related RESTCONF trees when registered."""
    c = client or get_odl_client()
    candidates = (
        "/rests/data/ietf-bgp:bgp",
        "/rests/data/openconfig-network-instance:network-instances",
        "/rests/data/bgp-linkstate:bgp-linkstate",
    )
    notes: list[str] = []
    for path in candidates:
        try:
            payload = _get_json(c, path)
        except HTTPError as exc:
            notes.append(f"BGP native probe {path}: HTTP {exc.code}.")
            continue
        if payload is None:
            continue
        hints = _walk_session_hints(payload)
        notes.append(
            f"BGP native probe succeeded on {path}; session/oper hints={'present' if hints else 'not detected'}."
        )
        return NativeSessionProbeResult(path_used=path, payload=payload, has_session_oper_hints=hints, notes=notes)
    notes.append("No BGP native RESTCONF candidate returned usable JSON (module may be absent).")
    return NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=notes)


def probe_pcep_native(client: OdlClient | None = None) -> NativeSessionProbeResult:
    """Try PCEP session/peer oriented RESTCONF when registered."""
    c = client or get_odl_client()
    candidates = (
        "/rests/data/ietf-pcep:pcep",
        "/rests/data/pcep-topology:pcep-topology",
        "/rests/data/opendaylight-pcep:pcep",
    )
    notes: list[str] = []
    for path in candidates:
        try:
            payload = _get_json(c, path)
        except HTTPError as exc:
            notes.append(f"PCEP native probe {path}: HTTP {exc.code}.")
            continue
        if payload is None:
            continue
        hints = _walk_session_hints(payload)
        notes.append(
            f"PCEP native probe succeeded on {path}; session/oper hints={'present' if hints else 'not detected'}."
        )
        return NativeSessionProbeResult(path_used=path, payload=payload, has_session_oper_hints=hints, notes=notes)
    notes.append("No PCEP native RESTCONF candidate returned usable JSON (module may be absent).")
    return NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=notes)


def probe_netconf_native(client: OdlClient | None = None) -> NativeSessionProbeResult:
    """Try NETCONF connector / node topology for management session hints."""
    c = client or get_odl_client()
    candidates = (
        "/rests/data/netconf-node-topology:netconf-node-topology",
        "/rests/data/network-topology-netconf:network-topology",
        "/rests/data/ietf-netconf-monitoring:netconf-state",
    )
    notes: list[str] = []
    for path in candidates:
        try:
            payload = _get_json(c, path)
        except HTTPError as exc:
            notes.append(f"NETCONF native probe {path}: HTTP {exc.code}.")
            continue
        if payload is None:
            continue
        hints = _walk_session_hints(payload)
        notes.append(
            f"NETCONF native probe succeeded on {path}; session/oper hints={'present' if hints else 'not detected'}."
        )
        return NativeSessionProbeResult(path_used=path, payload=payload, has_session_oper_hints=hints, notes=notes)
    notes.append("No NETCONF native RESTCONF candidate returned usable JSON (module may be absent).")
    return NativeSessionProbeResult(path_used=None, payload=None, has_session_oper_hints=False, notes=notes)
