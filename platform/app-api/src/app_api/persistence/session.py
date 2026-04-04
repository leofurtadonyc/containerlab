"""SQLAlchemy session helpers for backend persistence."""

from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app_api.config.settings import get_settings


@lru_cache
def get_engine():
    """Return the shared SQLAlchemy engine for backend persistence."""
    settings = get_settings()
    return create_engine(
        settings.get_sqlalchemy_database_url(),
        pool_pre_ping=True,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_timeout=settings.database_pool_timeout_seconds,
        pool_recycle=settings.database_pool_recycle_seconds,
    )


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    """Return the shared SQLAlchemy session factory."""
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def create_session() -> Session:
    """Create a new SQLAlchemy session."""
    return get_session_factory()()
