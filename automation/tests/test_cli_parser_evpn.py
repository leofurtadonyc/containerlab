from netlab.evidence.collectors.eos.evpn_cli import parse_evpn_summary


def test_parse_evpn_summary() -> None:
    sample = """
Neighbor            AS Session State AFI/SAFI
10.0.0.1         65000 Established   IPv4 Unicast
10.0.0.2         65000 Idle          IPv4 Unicast
"""
    parsed = parse_evpn_summary(sample)
    assert parsed["neighbors"] == 2
    assert parsed["established"] == 1
