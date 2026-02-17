from typing import Any


def diff_dict(old: dict[str, Any], new: dict[str, Any], prefix: str = "") -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    keys = sorted(set(old) | set(new))
    for key in keys:
        path = f"{prefix}.{key}" if prefix else key
        if key not in old:
            out.append({"path": path, "type": "added", "new": new[key]})
            continue
        if key not in new:
            out.append({"path": path, "type": "removed", "old": old[key]})
            continue
        ov, nv = old[key], new[key]
        if isinstance(ov, dict) and isinstance(nv, dict):
            out.extend(diff_dict(ov, nv, path))
        elif ov != nv:
            out.append({"path": path, "type": "changed", "old": ov, "new": nv})
    return out
