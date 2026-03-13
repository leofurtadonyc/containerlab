FROM opendaylight/opendaylight:0.18.2

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY scripts/start-odl.sh /usr/local/bin/start-odl.sh

RUN chmod 755 /usr/local/bin/start-odl.sh

WORKDIR /opt/opendaylight

CMD ["/bin/bash", "/usr/local/bin/start-odl.sh"]