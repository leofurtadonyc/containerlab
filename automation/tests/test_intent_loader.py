from pathlib import Path

from netlab.intent.loader import load_intent


def test_load_intent_ceos_4s4l() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    intent = load_intent(repo_root, "ceos-4s4l")
    assert "leaf1" in intent.inventory["nodes"]
    assert len(intent.checks) > 0
    assert intent.gnmi.username == "clab"
