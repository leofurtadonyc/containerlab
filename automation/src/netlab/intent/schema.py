from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class GnmiDefaults:
    port: int = 6030
    username: str = "clab"
    password: str = "clab"


@dataclass(slots=True)
class RackDomain:
    vlan: int
    subnet: str
    gw: str
    vni: int


@dataclass(slots=True)
class TenantIntent:
    name: str
    vrf: str
    vlan10_vni: int
    vlan10_gw: str
    rack_a: RackDomain
    rack_b: RackDomain
    isolation_type: str
    isolation_interface: str


@dataclass(slots=True)
class DCIIntent:
    routers_dc1: list[str] = field(default_factory=list)
    routers_dc2: list[str] = field(default_factory=list)
    interdc_links: list[str] = field(default_factory=list)


@dataclass(slots=True)
class IntentModel:
    lab_name: str
    spines: list[str]
    leaves: dict[str, list[str]]
    hosts: dict[str, list[str]]
    tenant1: TenantIntent
    gnmi: GnmiDefaults
    dci: DCIIntent | None = None
