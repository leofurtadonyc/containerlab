"""Small in-process cache helpers for collector snapshot reads."""

from collections.abc import Callable
from threading import Condition
from time import monotonic
from typing import Generic, TypeVar


SnapshotT = TypeVar("SnapshotT")


class SnapshotCache(Generic[SnapshotT]):
    """Reuse recent collector snapshots briefly and collapse concurrent fetches."""

    def __init__(self) -> None:
        self._condition = Condition()
        self._snapshot: SnapshotT | None = None
        self._snapshot_key: tuple[object, ...] | None = None
        self._cached_at: float = 0.0
        self._ttl_seconds: int = 0
        self._in_flight = False

    def clear(self) -> None:
        """Reset the cache state, primarily for tests."""
        with self._condition:
            self._snapshot = None
            self._snapshot_key = None
            self._cached_at = 0.0
            self._ttl_seconds = 0
            self._in_flight = False
            self._condition.notify_all()

    def get_or_load(
        self,
        *,
        snapshot_key: tuple[object, ...],
        ttl_seconds: int,
        ttl_resolver: Callable[[SnapshotT], int] | None = None,
        loader: Callable[[], SnapshotT],
    ) -> SnapshotT:
        """Return a cached snapshot when fresh enough, otherwise load one."""
        if ttl_seconds <= 0:
            return loader()

        with self._condition:
            while self._in_flight:
                self._condition.wait()

            if self._is_fresh(snapshot_key=snapshot_key, ttl_seconds=ttl_seconds):
                return self._snapshot  # type: ignore[return-value]

            self._in_flight = True

        try:
            snapshot = loader()
        finally:
            with self._condition:
                self._in_flight = False
                self._condition.notify_all()

        with self._condition:
            self._snapshot = snapshot
            self._snapshot_key = snapshot_key
            self._cached_at = monotonic()
            self._ttl_seconds = max(0, ttl_resolver(snapshot) if ttl_resolver else ttl_seconds)
            return snapshot

    def _is_fresh(self, *, snapshot_key: tuple[object, ...], ttl_seconds: int) -> bool:
        if self._snapshot is None or self._snapshot_key != snapshot_key:
            return False
        if self._ttl_seconds <= 0:
            return False
        effective_ttl_seconds = self._ttl_seconds
        return monotonic() - self._cached_at <= effective_ttl_seconds