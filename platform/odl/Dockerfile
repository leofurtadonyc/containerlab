FROM opendaylight/opendaylight:0.18.2@sha256:698d903f45ce089e2312b0ee90f4cf6f4fcc12b00aea934304a81b721fb04c21

USER root

COPY scripts/start-odl.sh /usr/local/bin/start-odl.sh

RUN chmod 755 /usr/local/bin/start-odl.sh

WORKDIR /opt/opendaylight

CMD ["/bin/bash", "/usr/local/bin/start-odl.sh"]