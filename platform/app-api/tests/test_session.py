from app_api.config.settings import get_settings
from app_api.persistence import session as session_module


def test_get_engine_applies_configured_pool_settings(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://platform:change_me@postgres:5432/platform")
    monkeypatch.setenv("DATABASE_POOL_SIZE", "17")
    monkeypatch.setenv("DATABASE_MAX_OVERFLOW", "9")
    monkeypatch.setenv("DATABASE_POOL_TIMEOUT_SECONDS", "7")
    monkeypatch.setenv("DATABASE_POOL_RECYCLE_SECONDS", "321")

    get_settings.cache_clear()
    session_module.get_engine.cache_clear()
    session_module.get_session_factory.cache_clear()

    captured: dict[str, object] = {}

    def fake_create_engine(url: str, **kwargs: object) -> object:
        captured["url"] = url
        captured["kwargs"] = kwargs
        return object()

    monkeypatch.setattr(session_module, "create_engine", fake_create_engine)

    try:
        session_module.get_engine()
    finally:
        session_module.get_engine.cache_clear()
        session_module.get_session_factory.cache_clear()
        get_settings.cache_clear()

    assert captured["url"] == "postgresql+psycopg://platform:change_me@postgres:5432/platform"
    assert captured["kwargs"] == {
        "pool_pre_ping": True,
        "pool_size": 17,
        "max_overflow": 9,
        "pool_timeout": 7,
        "pool_recycle": 321,
    }