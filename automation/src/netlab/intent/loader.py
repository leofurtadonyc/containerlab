from __future__ import annotations

from pathlib import Path

from netlab.core.errors import IntentValidationError
from netlab.utils.yaml import load_yaml

from .schema import CheckDef, GnmiDefaults, IntentModel


def _required(data: dict, key: str):
    if key not in data:
        raise IntentValidationError(f"Missing required key: {key}")
    return data[key]


def load_intent(repo_root: Path, lab: str) -> IntentModel:
    path = repo_root / lab / "intent" / "intent.yml"
    data = load_yaml(path)

    inventory = dict(_required(data, "inventory"))
    services = dict(data.get("services", {}))

    check_list = _required(data, "checks")
    if not isinstance(check_list, list):
        raise IntentValidationError("checks must be a list")

    checks: list[CheckDef] = []
    for item in check_list:
        if not isinstance(item, dict):
            raise IntentValidationError("each check entry must be a mapping")
        checks.append(
            CheckDef(
                name=str(_required(item, "name")),
                phase=str(_required(item, "phase")),
                kind=str(_required(item, "kind")),
                severity=str(item.get("severity", "ERROR")),
                params=dict(item.get("params", {})),
            )
        )

    gnmi_data = data.get("gnmi", {})
    gnmi = GnmiDefaults(
        port=int(gnmi_data.get("port", 6030)),
        username=str(gnmi_data.get("username", "clab")),
        password=str(gnmi_data.get("password", "clab")),
    )

    return IntentModel(
        lab_name=lab,
        gnmi=gnmi,
        inventory=inventory,
        services=services,
        checks=checks,
        raw=data,
    )
