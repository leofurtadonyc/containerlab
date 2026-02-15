# Default credentials to Arista switches
- User: clab
- Password: clab

# Default credentials to Arista switches
None. You should use docker to get into the hosts:

```
docker exec -it clab-ceos-4s4l-l4h1 bash
docker exec -it clab-ceos-4s4l-l4h2 bash
docker exec -it clab-ceos-4s4l-l4h3 bash
docker exec -it clab-ceos-4s4l-l4h4 bash
```

# Scenario: “Two racks, two tenants, L2 stretch + L3 gateways everywhere”

- We’ll treat (leaf1, leaf2) as Rack A and (leaf3, leaf4) as Rack B.
- Each rack has a dual-homed server pair (our hosts), and each server is dual-homed via ESI-LAG to the rack leaf pair (all-active).

# Host placement

**Rack A (leaf1 + leaf2):**
- host1 dual-homed to leaf1/leaf2
- host2 dual-homed to leaf1/leaf2

**Rack B (leaf3 + leaf4):**
- host3 dual-homed to leaf3/leaf4
- host4 dual-homed to leaf3/leaf4

# “Two VLANs per host”

Each host gets two logical networks:
- VLAN 10 = “App” (L2VNI 10100)
- VLAN 20 = “DB” (L2VNI 10200)

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
- What happens to MAC learning when we shut one leaf link vs the other vs the whole leaf

## 2) L3 routing within a VRF (inter-VLAN routing)

- Goal: route between VLAN 10 and VLAN 20 for the same tenant.
- Create VRF TENANT1
- Put VLAN10 SVI + VLAN20 SVI in the VRF on all leaves
- Use distributed anycast gateway (same GW IP per VLAN everywhere)
- Route VLAN10 ↔ VLAN20 locally at the ingress leaf (common DC behavior)

What we’ll explore:
- EVPN Type-5 routes (IP prefixes) if we advertise tenant prefixes that way
- or integrated routing and bridging (symmetric IRB) where the VRF uses an L3VNI
- How “default gateway” works under EVPN with multi-homed hosts

# 3) Dual-homed host behavior: all-active forwarding + failure domains

This is the “why ESI exists” part.

We can deliberately test:
- Single link failure (host ↔ leaf link down): should keep forwarding, minimal disruption
- One leaf down (leaf1 shutdown): host1/host2 still up via leaf2
- DF changes (if we use EVPN MH for bridging): verify who becomes DF for BUM replication
- Traffic hashing across both uplinks (LACP) from host perspective

4) Multi-tenant policy separation (optional but very educational)

Keep it simple but powerful:
- VLAN10 and VLAN20 are in TENANT1

Add TENANT2 later with VLAN110/VLAN120 and confirm:
- MAC/IP routes and ARP suppression separation per VRF
- No L2 leakage, no L3 route leaking unless configured

# Suggested addressing (so we can run meaningful tests)

## VLAN 10 (“App”): stretched L2 across both racks
- Subnet: 192.168.10.0/24
- GW (anycast): 192.168.10.1

Example hosts:
- host1: 192.168.10.11
- host2: 192.168.10.12
- host3: 192.168.10.13
- host4: 192.168.10.14

## VLAN 20 (“DB”): also stretched or kept local depending on what we want

Two good variants:

**Variant A (stretched too): good for pure L2 learning exercises**
- Subnet 192.168.20.0/24, GW 192.168.20.1

**Variant B (rack-local): better to explore L3 + EVPN Type-5 routing**
- Rack A VLAN20: 192.168.20.0/24 (host1/2 live here)
- Rack B VLAN20: 192.168.30.0/24 (host3/4 live here)

Then we route between racks using EVPN Type-5 (or use connected redistribution + overlay)

If our goal is “best explore L2 and L3,” Variant B gives us more signal:
- VLAN10 tests L2 stretching and EVPN MAC behavior
- VLAN20 tests L3 routing across the fabric (prefix routing)

A simple “lab storyline” (what we do step-by-step)

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

# Regarding the BGP design of this topology
And why I put each leaf in its own ASN (65101–65104) while all spines share one ASN (65000).

That pattern is a very common eBGP Clos choice:

Spines share one ASN (e.g., 65000) so they look like a single “core AS” for the pod. Each leaf (or each leaf pair / rack) gets its own ASN so every leaf–spine session is true eBGP, and we get BGP’s native loop-prevention and clearer troubleshooting.

Several Arista’s ATD EVPN labs also describe spines as EVPN “Route Servers” that receive EVPN routes from leaves and naturally propagate them across the fabric in an eBGP design. So the intent was:

- Underlay: leaf↔spine eBGP for loopbacks and p2p
- Overlay: leaf↔spine eBGP EVPN, with spines acting as route servers (not VTEPs)

This Multi-AS (unique leaf ASNs; spines share one ASN) has the following pros and cons:

a) Pros
- Clean eBGP loop prevention (no special knobs).
- Easy to see where routes originate (AS-path tells us which leaf/rack).
- Scales cleanly; matches how many operators run eBGP Clos.

b) Cons / gotcha
- If we use route-target … auto, we can accidentally generate different RTs per leaf (because “auto” often derives from ASN), which will break EVPN import/export across leaves — which may lead us to no imported MAC/IP routes.
- In multi-AS we should either:
    - set RTs explicitly, or
    - Use an RT scheme that’s not tied to varying ASNs.

# Verifying the lab

## IP addresses on hosts (i.e., host1)
```
~/labs/ceos-4s4l$ docker exec -it clab-ceos-4s4l-l4h1 bash
bash-5.0# 
bash-5.0# ifconfig
bond0     Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          inet6 addr: fe80::a8c1:abff:fe74:353a/64 Scope:Link
          UP BROADCAST RUNNING MASTER MULTICAST  MTU:1500  Metric:1
          RX packets:364 errors:0 dropped:10 overruns:0 frame:0
          TX packets:50 errors:0 dropped:1 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:45336 (44.2 KiB)  TX bytes:4740 (4.6 KiB)

bond0.10  Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          inet addr:192.168.10.11  Bcast:0.0.0.0  Mask:255.255.255.0
          inet6 addr: fe80::a8c1:abff:fe74:353a/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:3 errors:0 dropped:0 overruns:0 frame:0
          TX packets:11 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:168 (168.0 B)  TX bytes:866 (866.0 B)

bond0.20  Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          inet addr:192.168.20.11  Bcast:0.0.0.0  Mask:255.255.255.0
          inet6 addr: fe80::a8c1:abff:fe74:353a/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:1 errors:0 dropped:0 overruns:0 frame:0
          TX packets:11 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:56 (56.0 B)  TX bytes:866 (866.0 B)

eth0      Link encap:Ethernet  HWaddr 22:F1:E6:5E:61:86  
          inet addr:172.20.20.8  Bcast:172.20.20.255  Mask:255.255.255.0
          inet6 addr: 3fff:172:20:20::8/64 Scope:Global
          inet6 addr: fe80::20f1:e6ff:fe5e:6186/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:216 errors:0 dropped:63 overruns:0 frame:0
          TX packets:17 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:28490 (27.8 KiB)  TX bytes:1330 (1.2 KiB)

eth1      Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          UP BROADCAST RUNNING SLAVE MULTICAST  MTU:1500  Metric:1
          RX packets:148 errors:0 dropped:0 overruns:0 frame:0
          TX packets:17 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:18225 (17.7 KiB)  TX bytes:1784 (1.7 KiB)

eth2      Link encap:Ethernet  HWaddr AA:C1:AB:74:35:3A  
          UP BROADCAST RUNNING SLAVE MULTICAST  MTU:1500  Metric:1
          RX packets:216 errors:0 dropped:0 overruns:0 frame:0
          TX packets:34 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:27111 (26.4 KiB)  TX bytes:3046 (2.9 KiB)

lo        Link encap:Local Loopback  
          inet addr:127.0.0.1  Mask:255.0.0.0
          inet6 addr: ::1/128 Scope:Host
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)
```
## Ping tests
```
bash-5.0# ping 192.168.10.12
PING 192.168.10.12 (192.168.10.12) 56(84) bytes of data.
64 bytes from 192.168.10.12: icmp_seq=1 ttl=64 time=10.9 ms
64 bytes from 192.168.10.12: icmp_seq=2 ttl=64 time=0.582 ms
64 bytes from 192.168.10.12: icmp_seq=3 ttl=64 time=0.485 ms
^C
--- 192.168.10.12 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2045ms
rtt min/avg/max/mdev = 0.485/3.972/10.850/4.863 ms
```
```
bash-5.0# ping 192.168.10.13
PING 192.168.10.13 (192.168.10.13) 56(84) bytes of data.
64 bytes from 192.168.10.13: icmp_seq=1 ttl=64 time=7.72 ms
64 bytes from 192.168.10.13: icmp_seq=2 ttl=64 time=3.94 ms
64 bytes from 192.168.10.13: icmp_seq=3 ttl=64 time=2.62 ms
^C
--- 192.168.10.13 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 2.622/4.763/7.724/2.161 ms
```
```
bash-5.0# ping 192.168.10.14
PING 192.168.10.14 (192.168.10.14) 56(84) bytes of data.
64 bytes from 192.168.10.14: icmp_seq=1 ttl=64 time=7.03 ms
64 bytes from 192.168.10.14: icmp_seq=2 ttl=64 time=2.10 ms
64 bytes from 192.168.10.14: icmp_seq=3 ttl=64 time=2.13 ms
^C
--- 192.168.10.14 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
```
```
bash-5.0# ping 192.168.20.12
PING 192.168.20.12 (192.168.20.12) 56(84) bytes of data.
64 bytes from 192.168.20.12: icmp_seq=1 ttl=64 time=1.52 ms
64 bytes from 192.168.20.12: icmp_seq=2 ttl=64 time=0.542 ms
^C
--- 192.168.20.12 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1004ms
rtt min/avg/max/mdev = 0.542/1.031/1.520/0.489 ms
```
```
bash-5.0# ping 192.168.30.13
PING 192.168.30.13 (192.168.30.13) 56(84) bytes of data.
64 bytes from 192.168.30.13: icmp_seq=1 ttl=64 time=27.2 ms
64 bytes from 192.168.30.13: icmp_seq=2 ttl=64 time=3.70 ms
64 bytes from 192.168.30.13: icmp_seq=3 ttl=64 time=3.01 ms
^C
--- 192.168.30.13 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 3.013/11.312/27.228/11.257 ms
```
```
bash-5.0# ping 192.168.30.14
PING 192.168.30.14 (192.168.30.14) 56(84) bytes of data.
64 bytes from 192.168.30.14: icmp_seq=1 ttl=64 time=22.9 ms
64 bytes from 192.168.30.14: icmp_seq=2 ttl=64 time=4.48 ms
64 bytes from 192.168.30.14: icmp_seq=3 ttl=64 time=6.42 ms
^C
--- 192.168.30.14 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 4.476/11.268/22.906/8.267 ms
```
## Switch interfaces (i.e., leaf1)
```
ssh lfurtado@clab-ceos-4s4l-leaf1

leaf1#show interfaces description 
Interface                      Status         Protocol           Description
Et1                            up             up                 to-spine1
Et2                            up             up                 to-spine2
Et3                            up             up                 to-spine3
Et4                            up             up                 to-spine4
Et5                            up             up                 to-host1 (l4h1)
Et6                            up             up                 to-host2 (l4h2)
Et7                            up             up                 
Lo0                            up             up                 
Lo1                            up             up                 
Ma0                            up             up                 
Po11                           up             up                 ESI-LAG to-host1 (l4h1) on leaf1/leaf2
Po12                           up             up                 ESI-LAG to-host2 (l4h2) on leaf1/leaf2
Vl10                           up             up                 
Vl20                           up             up                 
Vl4094                         down           lowerlayerdown     
Vl4097                         up             up                 
Vx1                            up             up                 
```
```
leaf1#show ip interface brief 
                                                                                      Address
Interface         IP Address            Status       Protocol                  MTU    Owner  
----------------- --------------------- ------------ -------------------- ----------- -------
Ethernet1         10.0.0.0/31           up           up                       1500           
Ethernet2         10.0.0.2/31           up           up                       1500           
Ethernet3         10.0.0.4/31           up           up                       1500           
Ethernet4         10.0.0.6/31           up           up                       1500           
Loopback0         10.255.1.1/32         up           up                      65535           
Loopback1         10.255.2.1/32         up           up                      65535           
Management0       172.20.20.10/24       up           up                       1500           
Vlan10            192.168.10.1/24       up           up                       1500           
Vlan20            192.168.20.1/24       up           up                       1500           
Vlan4094          10.255.10.1/32        down         lowerlayerdown           1500           
Vlan4097          unassigned            up           up                       9164
```
```
leaf1#show port-channel detailed 
Port Channel Port-Channel11 (Fallback State: Unconfigured):
Minimum links: unconfigured
Maximum links: unconfigured
Minimum speed: unconfigured
Current weight/Max weight: 1/16
  Active Ports:
       Port            Time Became Active       Protocol       Mode         Weight    State
    --------------- ------------------------ -------------- ------------ ------------ -----
       Ethernet5       2:13:18                  LACP           Active         1       Rx,Tx

Port Channel Port-Channel12 (Fallback State: Unconfigured):
Minimum links: unconfigured
Maximum links: unconfigured
Minimum speed: unconfigured
Current weight/Max weight: 1/16
  Active Ports:
       Port            Time Became Active       Protocol       Mode         Weight    State
    --------------- ------------------------ -------------- ------------ ------------ -----
       Ethernet6       2:13:19                  LACP           Active         1       Rx,Tx
```
## BGP sessions and routes (i.e., leaf1)
```
leaf1#show bgp summary
BGP summary information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Neighbor            AS Session State AFI/SAFI                AFI/SAFI State   NLRI Rcd   NLRI Acc   NLRI Adv
---------- ----------- ------------- ----------------------- -------------- ---------- ---------- ----------
10.0.0.1         65000 Established   IPv4 Unicast            Negotiated              7          7          5
10.0.0.3         65000 Established   IPv4 Unicast            Negotiated              7          7         11
10.0.0.5         65000 Established   IPv4 Unicast            Negotiated              7          7         11
10.0.0.7         65000 Established   IPv4 Unicast            Negotiated              7          7         11
10.255.0.1       65000 Established   L2VPN EVPN              Negotiated             49         49         43
10.255.0.2       65000 Established   L2VPN EVPN              Negotiated             49         49         62
10.255.0.3       65000 Established   L2VPN EVPN              Negotiated             49         49         54
10.255.0.4       65000 Established   L2VPN EVPN              Negotiated             49         49         56
```
```
leaf1#show bgp evpn 
BGP routing table information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Route status codes: * - valid, > - active, S - Stale, E - ECMP head, e - ECMP
                    c - Contributing to ECMP, % - Pending best path selection
Origin codes: i - IGP, e - EGP, ? - incomplete
AS Path Attributes: Or-ID - Originator ID, C-LST - Cluster List, LL Nexthop - Link Local Nexthop

          Network                Next Hop              Metric  LocPref Weight  Path
 * >      RD: 10.255.1.1:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.2.1:1 auto-discovery 0000:0000:0000:0011:1111
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0011:1111
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.1:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 auto-discovery 0 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.2.1:1 auto-discovery 0000:0000:0000:0012:2222
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 auto-discovery 0000:0000:0000:0012:2222
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0013:3333
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 auto-discovery 0 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 auto-discovery 0000:0000:0000:0014:4444
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10 mac-ip aac1.ab34.3328
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 mac-ip aac1.ab34.3328
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:10 mac-ip aac1.ab74.353a
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 mac-ip aac1.ab74.353a
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 mac-ip aac1.ab74.353a
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.1:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 mac-ip aac1.ab74.353a 192.168.10.11
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 mac-ip aac1.abcf.ee07
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10 imet 10.255.2.1
                                 -                     -       -       0       i
 * >      RD: 10.255.1.1:20 imet 10.255.2.1
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:10 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.1.2:20 imet 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:10 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 imet 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:10 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 imet 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.2.1:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.1
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0011:1111 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.2.1:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.1
                                 -                     -       -       0       i
 * >Ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 *  ec    RD: 10.255.2.2:1 ethernet-segment 0000:0000:0000:0012:2222 10.255.2.2
                                 10.255.2.2            -       100     0       65000 65102 i
 * >Ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0013:3333 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.2.3:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.3
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.2.4:1 ethernet-segment 0000:0000:0000:0014:4444 10.255.2.4
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.10.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.20.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
```
## Overall functioning of the EVPN-VXLAN
```
leaf1#show vxlan vni 
VNI to VLAN Mapping for Vxlan1
VNI         VLAN       Source       Interface            802.1Q Tag
----------- ---------- ------------ -------------------- ----------
10100       10         static       Port-Channel11       10        
                                    Port-Channel12       10        
                                    Vxlan1               10        
10200       20         static       Port-Channel11       20        
                                    Port-Channel12       20        
                                    Vxlan1               20        


VNI to dynamic VLAN Mapping for Vxlan1
VNI         VLAN       VRF           Source       
----------- ---------- ------------- ------------ 
10000       4097       TENANT1       evpn         
```
```
leaf1#show vxlan vtep detail 
Remote VTEPS for Vxlan1:

VTEP             Learned Via         MAC Address Learning       Tunnel Type(s)
---------------- ------------------- -------------------------- --------------
10.255.2.2       control plane       control plane              flood         
10.255.2.3       control plane       control plane              unicast, flood
10.255.2.4       control plane       control plane              unicast, flood

Total number of remote VTEPS:  3
```
```
leaf1# show vxlan address-table 
          Vxlan Mac Address Table
----------------------------------------------------------------------

VLAN  Mac Address     Type      Prt  VTEP             Moves   Last Move
----  -----------     ----      ---  ----             -----   ---------
  10  aac1.abcf.ee07  EVPN      Vx1  10.255.2.3       1       0:07:02 ago
                                     10.255.2.4     
  10  aac1.abd4.c664  EVPN      Vx1  10.255.2.3       2       0:07:30 ago
                                     10.255.2.4     
Total Remote Mac Addresses for this criterion: 2
```
```
leaf1#show bgp evpn route-type mac-ip vni 10300
BGP routing table information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Route status codes: * - valid, > - active, S - Stale, E - ECMP head, e - ECMP
                    c - Contributing to ECMP, % - Pending best path selection
Origin codes: i - IGP, e - EGP, ? - incomplete
AS Path Attributes: Or-ID - Originator ID, C-LST - Cluster List, LL Nexthop - Link Local Nexthop

          Network                Next Hop              Metric  LocPref Weight  Path
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abcf.ee07 192.168.30.13
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664
                                 10.255.2.4            -       100     0       65000 65104 i
 * >Ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 *  ec    RD: 10.255.1.3:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.3            -       100     0       65000 65103 i
 * >Ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
 *  ec    RD: 10.255.1.4:20 mac-ip aac1.abd4.c664 192.168.30.14
                                 10.255.2.4            -       100     0       65000 65104 i
```
```
leaf1#show mac address-table vlan 20
          Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports      Moves   Last Move
----    -----------       ----        -----      -----   ---------
  20    001c.7300.0001    STATIC      Cpu
  20    aac1.ab34.3328    DYNAMIC     Po12       3       0:05:31 ago
  20    aac1.ab74.353a    DYNAMIC     Po11       3       0:05:44 ago
Total Mac Addresses for this criterion: 3

          Multicast Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       ----        -----
Total Mac Addresses for this criterion: 0
```
```
leaf1#show mac address-table vlan 10
          Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports      Moves   Last Move
----    -----------       ----        -----      -----   ---------
  10    001c.7300.0001    STATIC      Cpu
  10    aac1.ab34.3328    DYNAMIC     Po12       3       0:05:51 ago
  10    aac1.ab74.353a    DYNAMIC     Po11       3       0:05:59 ago
  10    aac1.abcf.ee07    DYNAMIC     Vx1        1       0:05:02 ago
  10    aac1.abd4.c664    DYNAMIC     Vx1        2       0:05:29 ago
Total Mac Addresses for this criterion: 5

          Multicast Mac Address Table
------------------------------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       ----        -----
Total Mac Addresses for this criterion: 0
```
```
leaf1#show bgp evpn route-type ip-prefix
BGP routing table information for VRF default
Router identifier 10.255.1.1, local AS number 65101
Route status codes: * - valid, > - active, S - Stale, E - ECMP head, e - ECMP
                    c - Contributing to ECMP, % - Pending best path selection
Origin codes: i - IGP, e - EGP, ? - incomplete
AS Path Attributes: Or-ID - Originator ID, C-LST - Cluster List, LL Nexthop - Link Local Nexthop

          Network                Next Hop              Metric  LocPref Weight  Path
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.10.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.10.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 * >      RD: 10.255.1.1:10000 ip-prefix 192.168.20.0/24
                                 -                     -       -       0       i
 * >      RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 *        RD: 10.255.1.2:10000 ip-prefix 192.168.20.0/24
                                 10.255.2.2            -       100     0       65000 65102 i
 * >      RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 *        RD: 10.255.1.3:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.3            -       100     0       65000 65103 i
 * >      RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
 *        RD: 10.255.1.4:10000 ip-prefix 192.168.30.0/24
                                 10.255.2.4            -       100     0       65000 65104 i
```
```
leaf1#show ip route vrf TENANT1 192.168.20.0/24

VRF: TENANT1
Source Codes:
       C - connected, S - static, K - kernel,
       O - OSPF, O IA - OSPF inter area, O E1 - OSPF external type 1,
       O E2 - OSPF external type 2, O N1 - OSPF NSSA external type 1,
       O N2 - OSPF NSSA external type2, O3 - OSPFv3,
       O3 IA - OSPFv3 inter area, O3 E1 - OSPFv3 external type 1,
       O3 E2 - OSPFv3 external type 2,
       O3 N1 - OSPFv3 NSSA external type 1,
       O3 N2 - OSPFv3 NSSA external type2, B - Other BGP Routes,
       B I - iBGP, B E - eBGP, R - RIP, I L1 - IS-IS level 1,
       I L2 - IS-IS level 2, A B - BGP Aggregate,
       A O - OSPF Summary, NG - Nexthop Group Static Route,
       V - VXLAN Control Service, M - Martian,
       DH - DHCP client installed default route,
       DP - Dynamic Policy Route, L - VRF Leaked,
       G  - gRIBI, RC - Route Cache Route,
       CL - CBF Leaked Route

 C        192.168.20.0/24
           directly connected, Vlan20
```
```
leaf1#show ip route vrf TENANT1 192.168.30.0/24

VRF: TENANT1
Source Codes:
       C - connected, S - static, K - kernel,
       O - OSPF, O IA - OSPF inter area, O E1 - OSPF external type 1,
       O E2 - OSPF external type 2, O N1 - OSPF NSSA external type 1,
       O N2 - OSPF NSSA external type2, O3 - OSPFv3,
       O3 IA - OSPFv3 inter area, O3 E1 - OSPFv3 external type 1,
       O3 E2 - OSPFv3 external type 2,
       O3 N1 - OSPFv3 NSSA external type 1,
       O3 N2 - OSPFv3 NSSA external type2, B - Other BGP Routes,
       B I - iBGP, B E - eBGP, R - RIP, I L1 - IS-IS level 1,
       I L2 - IS-IS level 2, A B - BGP Aggregate,
       A O - OSPF Summary, NG - Nexthop Group Static Route,
       V - VXLAN Control Service, M - Martian,
       DH - DHCP client installed default route,
       DP - Dynamic Policy Route, L - VRF Leaked,
       G  - gRIBI, RC - Route Cache Route,
       CL - CBF Leaked Route

 B E      192.168.30.0/24 [200/0]
           via VTEP 10.255.2.4 VNI 10000 router-mac 00:1c:73:0a:07:ed local-interface Vxlan1
```