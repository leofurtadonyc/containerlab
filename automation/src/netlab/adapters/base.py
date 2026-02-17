from dataclasses import dataclass


@dataclass(slots=True)
class CmdResult:
    rc: int
    stdout: str
    stderr: str
