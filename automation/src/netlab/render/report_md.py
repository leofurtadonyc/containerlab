from pathlib import Path


def write_markdown_report(payload: dict, out_path: Path) -> None:
    lines = ["# netlab report", "", "## Summary"]
    summary = payload.get("summary", {})
    lines.append(f"- Exit code: {summary.get('exit_code', 1)}")
    lines.append(f"- Status counts: {summary.get('counts_by_status', {})}")
    lines.append("")
    lines.append("## Results")

    grouped: dict[str, list[dict]] = {}
    for item in payload.get("results", []):
        grouped.setdefault(item.get("phase", "other"), []).append(item)

    for phase, items in grouped.items():
        lines.append(f"### {phase}")
        for item in items:
            lines.append(f"- **{item['status']}** `{item['name']}`: {item['message']}")
        lines.append("")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")
