"""Bounded startup warm-up for read-side caches and sync history.

Invoked from FastAPI lifespan in ``app_api.main`` before the server accepts traffic.
"""

from logging import getLogger

from app_api.services.devices import build_devices_list_response
from app_api.services.policies import build_policies_list_response
from app_api.services.topology import build_topology_response

logger = getLogger(__name__)


def warm_read_side() -> None:
    """Best-effort warm-up of the current bounded read-side slices."""
    warmup_steps = [
        ("devices", build_devices_list_response),
        ("topology", build_topology_response),
        ("policies", build_policies_list_response),
    ]
    for name, builder in warmup_steps:
        try:
            builder()
            logger.info("Completed bounded startup warm-up for %s.", name)
        except Exception:
            logger.exception("Failed bounded startup warm-up for %s.", name)


if __name__ == "__main__":
    warm_read_side()
