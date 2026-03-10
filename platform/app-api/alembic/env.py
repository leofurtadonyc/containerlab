"""Alembic environment for the backend skeleton."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app_api.config.settings import get_settings
from app_api.models.base import target_metadata
from app_api.persistence import tables as persistence_tables

del persistence_tables


config = context.config
config.set_main_option("sqlalchemy.url", get_settings().get_sqlalchemy_database_url())

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
