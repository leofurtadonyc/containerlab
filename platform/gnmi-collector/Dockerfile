FROM python:3.12-slim@sha256:ccc7089399c8bb65dd1fb3ed6d55efa538a3f5e7fca3f5988ac3b5b87e593bf0

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md requirements.lock.txt ./
COPY scripts ./scripts
COPY configs ./configs
COPY src ./src

RUN python3 -m pip install --upgrade pip==26.0.1 setuptools==82.0.1 \
    && python3 -m pip install --no-build-isolation -c requirements.lock.txt . \
    && chmod +x /app/scripts/start-gnmi-collector.sh \
    && groupadd --system app \
    && useradd --system --gid app --create-home --home-dir /home/app app \
    && chown -R app:app /app

USER app

EXPOSE 9804

HEALTHCHECK --interval=15s --timeout=3s --start-period=25s --retries=6 CMD ["python3", "-c", "import os, urllib.request; port = os.environ.get('COLLECTOR_METRICS_PORT', '9804'); response = urllib.request.urlopen(f'http://127.0.0.1:{port}/metrics', timeout=2); raise SystemExit(0 if response.status == 200 else 1)"]

CMD ["sh", "/app/scripts/start-gnmi-collector.sh"]