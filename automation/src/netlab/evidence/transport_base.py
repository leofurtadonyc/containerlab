from dataclasses import dataclass


@dataclass(slots=True)
class DataPoint:
    source: str
    payload: dict
