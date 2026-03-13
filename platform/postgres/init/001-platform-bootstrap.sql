-- Phase 1 Postgres bootstrap for the platform.
-- Keep this intentionally small: durable application-state direction only.
-- Metrics and time-series data belong in Prometheus, not in Postgres.

CREATE SCHEMA IF NOT EXISTS platform_app;

COMMENT ON SCHEMA platform_app IS
  'Placeholder schema for future platform application tables managed by Alembic.';
