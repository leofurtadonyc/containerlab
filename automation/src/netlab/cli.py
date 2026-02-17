from __future__ import annotations

import json
from pathlib import Path

import typer

from netlab.adapters.containerlab import ContainerlabAdapter
from netlab.core.logging import configure_logging
from netlab.core.model import CheckResult, CheckStatus, Severity, ValidationContext
from netlab.core.results import RunSummary
from netlab.drift.baseline import collect_baseline
from netlab.drift.config_drift import compute_config_drift
from netlab.drift.diff import diff_dict
from netlab.evidence.cli import CliTransport
from netlab.evidence.client import EvidenceClient
from netlab.evidence.gnmi import GnmiTransport
from netlab.intent.loader import load_intent
from netlab.render.report_json import write_json_report
from netlab.render.report_md import write_markdown_report
from netlab.validators.engine import run_checks

app = typer.Typer(add_completion=False)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _ctx(lab: str, profile: str) -> ValidationContext:
    root = _repo_root()
    intent = load_intent(root, lab)
    adapter = ContainerlabAdapter(root, lab)
    evidence = EvidenceClient(gnmi=GnmiTransport(), cli=CliTransport(adapter))
    return ValidationContext(lab=lab, profile=profile, intent=intent, adapter=adapter, evidence_client=evidence)


def _print_console(summary: RunSummary) -> None:
    for result in summary.results:
        typer.echo(f"[{result.phase}] {result.status.value:4} {result.name} - {result.message}")
    typer.echo(f"Exit code: {summary.exit_code}")


def _normalized_baseline(payload: dict) -> dict:
    # Exclude volatile fields that are expected to change on every run.
    normalized = dict(payload)
    normalized.pop("timestamp", None)
    return normalized


def _run_validate(ctx: ValidationContext, mode: str) -> RunSummary:
    summary = RunSummary()
    for result in run_checks(ctx, mode):
        summary.add(result)
    return summary


@app.command()
def validate(
    lab: str = typer.Option(..., "--lab"),
    mode: str = typer.Option("all", "--mode"),
    profile: str = typer.Option("fast", "--profile"),
    json_out: Path | None = typer.Option(None, "--json-out"),
    md_out: Path | None = typer.Option(None, "--md-out"),
    verbose: bool = typer.Option(False, "--verbose"),
) -> None:
    configure_logging(verbose)
    if mode == "control_plane":
        mode = "control-plane"
    if mode not in {"intent", "underlay", "control-plane", "dataplane", "all"}:
        raise typer.BadParameter("mode must be intent|underlay|control-plane|dataplane|all")

    ctx = _ctx(lab, profile)
    summary = _run_validate(ctx, mode)
    payload = summary.to_dict()
    _print_console(summary)

    out_json = json_out or Path("artifacts") / f"{lab}-validate.json"
    out_md = md_out or Path("artifacts") / f"{lab}-validate.md"
    write_json_report(payload, out_json)
    write_markdown_report(payload, out_md)
    raise typer.Exit(code=summary.exit_code)


@app.command()
def baseline(
    lab: str = typer.Option(..., "--lab"),
    out: Path = typer.Option(..., "--out"),
    profile: str = typer.Option("fast", "--profile"),
) -> None:
    ctx = _ctx(lab, profile)
    payload = collect_baseline(ctx)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    typer.echo(f"Baseline saved: {out}")


@app.command()
def drift(
    lab: str = typer.Option(..., "--lab"),
    baseline: Path = typer.Option(..., "--baseline"),
    json_out: Path | None = typer.Option(None, "--json-out"),
    md_out: Path | None = typer.Option(None, "--md-out"),
    profile: str = typer.Option("fast", "--profile"),
) -> None:
    old = json.loads(baseline.read_text(encoding="utf-8"))
    ctx = _ctx(lab, profile)
    new = collect_baseline(ctx)

    state_diffs = diff_dict(_normalized_baseline(old), _normalized_baseline(new))
    config_drift = compute_config_drift(ctx)

    summary = RunSummary()
    if state_diffs:
        summary.add(CheckResult("drift", "state drift", CheckStatus.FAIL, Severity.ERROR, f"{len(state_diffs)} differences", {"sample": state_diffs[:20]}))
    else:
        summary.add(CheckResult("drift", "state drift", CheckStatus.PASS, Severity.INFO, "No state drift"))

    if config_drift:
        summary.add(CheckResult("drift", "config drift", CheckStatus.FAIL, Severity.ERROR, f"{len(config_drift)} nodes changed", {"sample": config_drift[:20]}))
    else:
        summary.add(CheckResult("drift", "config drift", CheckStatus.PASS, Severity.INFO, "No config drift"))

    payload = summary.to_dict()
    payload["state_diffs"] = state_diffs
    payload["config_drift"] = config_drift

    out_json = json_out or Path("artifacts") / f"{lab}-drift.json"
    out_md = md_out or Path("artifacts") / f"{lab}-drift.md"
    write_json_report(payload, out_json)
    write_markdown_report(payload, out_md)
    _print_console(summary)
    raise typer.Exit(code=summary.exit_code)


if __name__ == "__main__":
    app()
