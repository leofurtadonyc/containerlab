FROM postgres:16

COPY scripts/start-postgres.sh /usr/local/bin/start-postgres.sh

RUN chmod 755 /usr/local/bin/start-postgres.sh

ENTRYPOINT ["/usr/local/bin/start-postgres.sh"]