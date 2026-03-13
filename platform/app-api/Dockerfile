FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md alembic.ini ./
COPY alembic ./alembic
COPY scripts ./scripts
COPY src ./src

RUN python3 -m pip install --upgrade pip \
    && python3 -m pip install . \
    && chmod +x /app/scripts/start-app-api.sh \
    && groupadd --system app \
    && useradd --system --gid app --create-home --home-dir /home/app app \
    && chown -R app:app /app

USER app

EXPOSE 8000

CMD ["sh", "/app/scripts/start-app-api.sh"]