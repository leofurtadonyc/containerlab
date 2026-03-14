FROM postgres:16@sha256:78df81b1442dcc764c1104154da7162635e40cfffe67579c42a1c1b96dfc209c

COPY scripts/start-postgres.sh /usr/local/bin/start-postgres.sh

RUN chmod 755 /usr/local/bin/start-postgres.sh

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=12 CMD pg_isready -U "$${POSTGRES_USER:-platform}" -d "$${POSTGRES_DB:-platform}" || exit 1

ENTRYPOINT ["/usr/local/bin/start-postgres.sh"]