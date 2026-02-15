# Scenario: “Two racks, two tenants, L2 stretch + L3 gateways everywhere”

We’ll treat (leaf1, leaf2) as Rack A and (leaf3, leaf4) as Rack B.
Each rack has a dual-homed server pair (your hosts), and each server is dual-homed via ESI-LAG to the rack leaf pair (all-active).

# Host placement

Rack A (leaf1 + leaf2):
host1 dual-homed to leaf1/leaf2
host2 dual-homed to leaf1/leaf2

Rack B (leaf3 + leaf4):
host3 dual-homed to leaf3/leaf4
host4 dual-homed to leaf3/leaf4

# “Two VLANs per host”

Each host gets two logical networks:
VLAN 10 = “App” (L2VNI 10100)
VLAN 20 = “DB” (L2VNI 10200)

On the hosts, we’ll present these as either:

- Two VLAN subinterfaces (e.g., bond0.10, bond0.20) over a single ESI-LAG, or
- Two separate bonds (less common in real DCs; I’d stick with one bond + VLAN tags)

This gives us a clean way to test L2/L3 behavior per segment while keeping the "physical" Containerlab topology wiring identical.

# What we’ll build in the fabric (services we can explore)

## 1) L2 bridging across racks (same VLAN, different rack)

- Goal: prove EVPN L2 reachability and all-active multi-homing behavior.
- VLAN 10 is stretched across both racks
- host1 (Rack A) ↔ host3 (Rack B) same subnet, same VLAN 10
- Traffic should traverse VXLAN between VTEPs (leafs) and MACs should be learned via EVPN

What we’ll explore:

- EVPN Type-2 MAC/IP routes
- split-horizon and DF election behavior per ESI
- What happens to MAC learning when you shut one leaf link vs the other vs the whole leaf

## 2) L3 routing within a VRF (inter-VLAN routing)

- Goal: route between VLAN 10 and VLAN 20 for the same tenant.
- Create VRF TENANT1
- Put VLAN10 SVI + VLAN20 SVI in the VRF on all leaves
- Use distributed anycast gateway (same GW IP per VLAN everywhere)
- Route VLAN10 ↔ VLAN20 locally at the ingress leaf (common DC behavior)

What we’ll explore:

- EVPN Type-5 routes (IP prefixes) if you advertise tenant prefixes that way
- or integrated routing and bridging (symmetric IRB) where the VRF uses an L3VNI
- How “default gateway” works under EVPN with multi-homed hosts

# 3) Dual-homed host behavior: all-active forwarding + failure domains

This is the “why ESI exists” part.

We can deliberately test:

- Single link failure (host ↔ leaf link down): should keep forwarding, minimal disruption
- One leaf down (leaf1 shutdown): host1/host2 still up via leaf2
- DF changes (if you use EVPN MH for bridging): verify who becomes DF for BUM replication
- Traffic hashing across both uplinks (LACP) from host perspective

4) Multi-tenant policy separation (optional but very educational)

Keep it simple but powerful:

- VLAN10 and VLAN20 are in TENANT1

Add TENANT2 later with VLAN110/VLAN120 and confirm:

- MAC/IP routes and ARP suppression separation per VRF
- No L2 leakage, no L3 route leaking unless configured

# Suggested addressing (so we can run meaningful tests)

## VLAN 10 (“App”): stretched L2 across both racks
Subnet: 192.168.10.0/24
GW (anycast): 192.168.10.1

Example hosts:
host1: 192.168.10.11
host2: 192.168.10.12
host3: 192.168.10.13
host4: 192.168.10.14

## VLAN 20 (“DB”): also stretched or kept local depending on what you want

Two good variants:
Variant A (stretched too): good for pure L2 learning exercises
Subnet 192.168.20.0/24, GW 192.168.20.1

Variant B (rack-local): better to explore L3 + EVPN Type-5 routing
Rack A VLAN20: 192.168.20.0/24 (host1/2 live here)
Rack B VLAN20: 192.168.30.0/24 (host3/4 live here)

Then we route between racks using EVPN Type-5 (or use connected redistribution + overlay)

If your goal is “best explore L2 and L3,” Variant B gives you more signal:
- VLAN10 tests L2 stretching and EVPN MAC behavior
- VLAN20 tests L3 routing across the fabric (prefix routing)

A simple “lab storyline” (what you do step-by-step)

1) Bring up EVPN + VXLAN + ESI-LAG on hosts and leaves
2) Validate host bond/LACP: host sees both links active
3) Ping within VLAN10 across racks: host1 ↔ host3
4) Generate BUM: ARP, broadcast ping, watch EVPN behavior
5) Route VLAN10 ↔ VLAN20 inside TENANT1 (host1 to host1’s VLAN20 IP)
6) Route across racks on VLAN20 (Variant B) and confirm EVPN prefix distribution
7) Fail one link, then fail one leaf—observe reconvergence and traffic continuity

# Why this scenario matches EVPN all-active ESI (and not EVPN-MLAG)

Our dual-homed hosts are the multi-homing use case. We avoid the “single logical VTEP” MLAG abstraction and instead exercise:

a) EVPN Ethernet Segment (ES)
b) DF election
c) split-horizon
d) all-active load-sharing