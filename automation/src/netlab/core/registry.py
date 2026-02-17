from __future__ import annotations

from collections import defaultdict
from typing import Callable

from .model import CheckResult, ValidationContext

ValidatorFn = Callable[[ValidationContext], list[CheckResult]]


class ValidatorRegistry:
    def __init__(self) -> None:
        self._validators: dict[str, list[ValidatorFn]] = defaultdict(list)

    def register(self, phase: str, fn: ValidatorFn) -> None:
        self._validators[phase].append(fn)

    def get(self, phase: str) -> list[ValidatorFn]:
        return self._validators.get(phase, [])
