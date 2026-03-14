FROM prom/prometheus:v2.54.1@sha256:f6639335d34a77d9d9db382b92eeb7fc00934be8eae81dbc03b31cfe90411a94

USER root

COPY scripts/start-prometheus.sh /usr/local/bin/start-prometheus.sh

RUN chmod 755 /usr/local/bin/start-prometheus.sh

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=12 CMD wget -q -O /dev/null http://127.0.0.1:9090/-/ready || exit 1

ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-prometheus.sh"]