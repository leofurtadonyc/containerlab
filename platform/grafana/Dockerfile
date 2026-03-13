FROM grafana/grafana:11.2.2

USER root

COPY scripts/start-grafana.sh /usr/local/bin/start-grafana.sh

RUN chmod 755 /usr/local/bin/start-grafana.sh

USER grafana

ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-grafana.sh"]