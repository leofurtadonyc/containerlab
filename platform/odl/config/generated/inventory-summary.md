# ODL Southbound Rollout Inventory Summary

- Topology file: `/home/lfurtado/labs/nokia-sr-mpls/nokia-sr-mpls-lab3-full.clab.yml`
- Controller northbound/admin address: `192.168.0.232`
- Controller southbound/protocol address: `10.90.0.10/24`
- Southbound bridge: `br-odl-sb`
- ODL southbound interface: `eth1`
- Controller ASN: `64990`

| Node | Role | Mgmt IPv4 | Loopback IPv4 | Protocol Peer IPv4 | BGP-LS | PCEP | NETCONF | Startup Config |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CPE-A1 | other | 172.20.20.101 | 172.16.255.1 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CPE-A1.partial.cfg |
| CPE-A2 | other | 172.20.20.102 | 172.16.255.2 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CPE-A2.partial.cfg |
| CPE-B1 | other | 172.20.20.103 | 172.17.255.1 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CPE-B1.partial.cfg |
| CPE-B2 | other | 172.20.20.104 | 172.17.255.2 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CPE-B2.partial.cfg |
| CPE-C1 | other | 172.20.20.133 | 172.18.255.1 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CPE-C1.partial.cfg |
| CPE-C2 | other | 172.20.20.134 | 172.18.255.2 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CPE-C2.partial.cfg |
| CSC1-P1 | p | 172.20.20.121 | 100.64.255.1 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC1-P1.partial.cfg |
| CSC1-P2 | p | 172.20.20.122 | 100.64.255.2 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC1-P2.partial.cfg |
| CSC1-P3 | p | 172.20.20.123 | 100.64.255.3 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC1-P3.partial.cfg |
| CSC1-P4 | p | 172.20.20.124 | 100.64.255.4 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC1-P4.partial.cfg |
| CSC1-PE1 | pe | 172.20.20.119 | 100.64.255.11 | 10.90.0.111 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC1-PE1.partial.cfg |
| CSC1-PE2 | pe | 172.20.20.120 | 100.64.255.12 | 10.90.0.112 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC1-PE2.partial.cfg |
| CSC2-P1 | p | 172.20.20.129 | 100.66.255.1 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC2-P1.partial.cfg |
| CSC2-P2 | p | 172.20.20.130 | 100.66.255.2 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC2-P2.partial.cfg |
| CSC2-P3 | p | 172.20.20.131 | 100.66.255.3 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC2-P3.partial.cfg |
| CSC2-P4 | p | 172.20.20.132 | 100.66.255.4 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC2-P4.partial.cfg |
| CSC2-PE1 | pe | 172.20.20.127 | 100.66.255.11 | 10.90.0.211 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC2-PE1.partial.cfg |
| CSC2-PE2 | pe | 172.20.20.128 | 100.66.255.12 | 10.90.0.212 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/CSC2-PE2.partial.cfg |
| ISP1-R1 | other | 172.20.20.125 | 1.1.255.1 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/ISP1-R1.partial.cfg |
| ISP2-R1 | other | 172.20.20.126 | 2.2.255.1 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/ISP2-R1.partial.cfg |
| NOC-R1 | other | 172.20.20.105 | 10.255.0.1 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/NOC-R1.partial.cfg |
| NOC-R2 | other | 172.20.20.106 | 10.255.0.2 |  | no | no | no | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/NOC-R2.partial.cfg |
| P1 | p | 172.20.20.109 | 100.65.255.1 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P1.partial.cfg |
| P2 | p | 172.20.20.110 | 100.65.255.2 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P2.partial.cfg |
| P3 | p | 172.20.20.111 | 100.65.255.3 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P3.partial.cfg |
| P4 | p | 172.20.20.112 | 100.65.255.4 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P4.partial.cfg |
| P5 | p | 172.20.20.113 | 100.65.255.5 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P5.partial.cfg |
| P6 | p | 172.20.20.114 | 100.65.255.6 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P6.partial.cfg |
| P7 | p | 172.20.20.115 | 100.65.255.7 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P7.partial.cfg |
| P8 | p | 172.20.20.116 | 100.65.255.8 |  | no | no | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/P8.partial.cfg |
| PE1 | pe | 172.20.20.107 | 100.65.255.11 | 10.90.0.11 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/PE1.partial.cfg |
| PE2 | pe | 172.20.20.108 | 100.65.255.12 | 10.90.0.12 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/PE2.partial.cfg |
| PE3 | pe | 172.20.20.117 | 100.65.255.13 | 10.90.0.13 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/PE3.partial.cfg |
| PE4 | pe | 172.20.20.118 | 100.65.255.14 | 10.90.0.14 | yes | yes | yes | /home/lfurtado/labs/nokia-sr-mpls/configs/lab3-full/PE4.partial.cfg |
