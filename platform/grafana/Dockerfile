FROM grafana/grafana:11.2.2@sha256:d5133220d770aba5cb655147b619fa8770b90f41d8489a821d33b1cd34d16f89

USER root

COPY scripts/start-grafana.sh /usr/local/bin/start-grafana.sh

RUN chmod 755 /usr/local/bin/start-grafana.sh

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=12 CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-grafana.sh"]