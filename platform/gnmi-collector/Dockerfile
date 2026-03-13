FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md ./
COPY configs ./configs
COPY src ./src

RUN python3 -m pip install --upgrade pip \
    && python3 -m pip install . \
    && groupadd --system app \
    && useradd --system --gid app --create-home --home-dir /home/app app \
    && chown -R app:app /app

USER app

EXPOSE 9804

CMD ["sh", "-lc", "uvicorn gnmi_collector.main:app --host 0.0.0.0 --port ${COLLECTOR_METRICS_PORT:-9804}"]