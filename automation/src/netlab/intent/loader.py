from __future__ import annotations

from pathlib import Path

from netlab.core.errors import IntentValidationError
from netlab.utils.yaml import load_yaml

from .schema import DCIIntent, GnmiDefaults, IntentModel, RackDomain, TenantIntent


def _required(data: dict, key: str):
    if key not in data:
        raise IntentValidationError(f"Missing required key: {key}")
    return data[key]


def load_intent(repo_root: Path, lab: str) -> IntentModel:
    path = repo_root / lab / "intent" / "intent.yml"
    data = load_yaml(path)

    tenant_data = _required(data, "tenant1")
    tenant = TenantIntent(
        name="tenant1",
        vrf=_required(tenant_data, "vrf"),
        vlan10_vni=int(_required(tenant_data, "vlan10")["vni"]),
        vlan10_gw=str(_required(tenant_data, "vlan10")["gw"]),
        rack_a=RackDomain(**_required(tenant_data, "rackA_domain")),
        rack_b=RackDomain(**_required(tenant_data, "rackB_domain")),
        isolation_type=str(_required(tenant_data, "isolation")["type"]),
        isolation_interface=str(_required(tenant_data, "isolation")["interface"]),
    )

    gnmi_data = data.get("gnmi", {})
    gnmi = GnmiDefaults(
        port=int(gnmi_data.get("port", 6030)),
        username=str(gnmi_data.get("username", "clab")),
        password=str(gnmi_data.get("password", "clab")),
    )

    dci = None
    if "dci" in data:
        d = data["dci"]
        dci = DCIIntent(
            routers_dc1=list(d.get("routers_dc1", [])),
            routers_dc2=list(d.get("routers_dc2", [])),
            interdc_links=list(d.get("interdc_links", [])),
        )

    return IntentModel(
        lab_name=lab,
        spines=list(_required(data, "spines")),
        leaves=dict(_required(data, "leaves")),
        hosts=dict(_required(data, "hosts")),
        tenant1=tenant,
        gnmi=gnmi,
        dci=dci,
    )
