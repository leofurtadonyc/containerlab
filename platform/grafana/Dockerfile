FROM grafana/grafana:11.2.2@sha256:d5133220d770aba5cb655147b619fa8770b90f41d8489a821d33b1cd34d16f89

USER root

COPY scripts/start-grafana.sh /usr/local/bin/start-grafana.sh

RUN chmod 755 /usr/local/bin/start-grafana.sh

ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-grafana.sh"]