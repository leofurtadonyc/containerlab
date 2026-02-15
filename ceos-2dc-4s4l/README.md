
# DC1 devices
- clab-ceos-2dc-evpn-dci-dc1-leaf1
- clab-ceos-2dc-evpn-dci-dc1-leaf2
- clab-ceos-2dc-evpn-dci-dc1-leaf3
- clab-ceos-2dc-evpn-dci-dc1-leaf4
- clab-ceos-2dc-evpn-dci-dc1-spine1
- clab-ceos-2dc-evpn-dci-dc1-spine2
- clab-ceos-2dc-evpn-dci-dc1-spine3
- clab-ceos-2dc-evpn-dci-dc1-spine4
- clab-ceos-2dc-evpn-dci-dc1-router1
- clab-ceos-2dc-evpn-dci-dc1-router2

# DC2 devices
- clab-ceos-2dc-evpn-dci-dc2-leaf1
- clab-ceos-2dc-evpn-dci-dc2-leaf2
- clab-ceos-2dc-evpn-dci-dc2-leaf3
- clab-ceos-2dc-evpn-dci-dc2-leaf4
- clab-ceos-2dc-evpn-dci-dc2-spine1
- clab-ceos-2dc-evpn-dci-dc2-spine2
- clab-ceos-2dc-evpn-dci-dc2-spine3
- clab-ceos-2dc-evpn-dci-dc2-spine4
- clab-ceos-2dc-evpn-dci-dc2-router1
- clab-ceos-2dc-evpn-dci-dc2-router2

# IP addressing proposal for services (used in host exec blocks)

VLAN 10 (stretched L2 across both DCs, all leaves)
- Subnet: 192.168.10.0/24
- Anycast GW (later, on leaves): 192.168.10.1/24

Hosts:
- clab-ceos-2dc-evpn-dci-dc1-host1 192.168.10.11/24
- clab-ceos-2dc-evpn-dci-dc1-host2 192.168.10.12/24
- clab-ceos-2dc-evpn-dci-dc1-host3 192.168.10.13/24
- clab-ceos-2dc-evpn-dci-dc1-host4 192.168.10.14/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.21/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.22/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.23/24
- clab-ceos-2dc-evpn-dci-dc2-host1 192.168.10.24/24

“VLAN 20” service group A (dc*-host1 + dc*-host3 L2 within each DC; routed between DCs)
- DC1 subnet: 192.168.20.0/24 (GW 192.168.20.1)
- dc1-host1 192.168.20.11/24
- dc1-host3 192.168.20.13/24

DC2 subnet: 192.168.120.0/24 (GW 192.168.120.1)
- dc2-host1 192.168.120.21/24
- dc2-host3 192.168.120.23/24

“VLAN 30” service group B
This matches the following intent: “host2 + host4 L2 within DC; routed between DCs”.

DC1 subnet: 192.168.30.0/24 (GW 192.168.30.1)
- dc1-host2 192.168.30.12/24
- dc1-host4 192.168.30.14/24

DC2 subnet: 192.168.130.0/24 (GW 192.168.130.1)
- dc2-host2 192.168.130.22/24
- dc2-host4 192.168.130.24/24