FROM prom/prometheus:v2.54.1

USER root

COPY scripts/start-prometheus.sh /usr/local/bin/start-prometheus.sh

RUN chmod 755 /usr/local/bin/start-prometheus.sh

USER nobody

ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-prometheus.sh"]