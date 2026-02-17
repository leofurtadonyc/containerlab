from netlab.drift.diff import diff_dict


def test_diff_dict_changed_value() -> None:
    old = {"a": 1, "b": {"c": 2}}
    new = {"a": 1, "b": {"c": 3}}
    diffs = diff_dict(old, new)
    assert len(diffs) == 1
    assert diffs[0]["path"] == "b.c"
