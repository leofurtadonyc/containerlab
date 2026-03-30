FROM python:3.12-slim@sha256:ccc7089399c8bb65dd1fb3ed6d55efa538a3f5e7fca3f5988ac3b5b87e593bf0

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md alembic.ini requirements.lock.txt ./
COPY alembic ./alembic
COPY scripts ./scripts
COPY src ./src

RUN python3 -m pip install --upgrade pip==26.0.1 setuptools==82.0.1 \
    && python3 -m pip install --no-build-isolation -c requirements.lock.txt . \
    && chmod +x /app/scripts/start-app-api.sh \
    && groupadd --system app \
    && useradd --system --gid app --create-home --home-dir /home/app app \
    && chown -R app:app /app

USER app

EXPOSE 8000

# start-period must cover alembic + FastAPI lifespan read-side warm-up before the server accepts connections.
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=6 CMD ["python3", "-c", "import os, urllib.request; port = os.environ.get('API_PORT', '8000'); response = urllib.request.urlopen(f'http://127.0.0.1:{port}/api/v1/health', timeout=2); raise SystemExit(0 if response.status == 200 else 1)"]

CMD ["sh", "/app/scripts/start-app-api.sh"]