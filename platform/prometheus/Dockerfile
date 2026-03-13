FROM prom/prometheus:v2.54.1@sha256:f6639335d34a77d9d9db382b92eeb7fc00934be8eae81dbc03b31cfe90411a94

USER root

COPY scripts/start-prometheus.sh /usr/local/bin/start-prometheus.sh

RUN chmod 755 /usr/local/bin/start-prometheus.sh

ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-prometheus.sh"]