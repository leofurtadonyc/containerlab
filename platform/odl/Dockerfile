FROM opendaylight/opendaylight:0.18.2@sha256:698d903f45ce089e2312b0ee90f4cf6f4fcc12b00aea934304a81b721fb04c21

USER root

RUN apt-get update \
	&& apt-get install -y --no-install-recommends iproute2 \
	&& rm -rf /var/lib/apt/lists/*

# Bake platform Karaf features into featuresBoot so they install on every Karaf start (reliable across redeploy).
# Runtime `install-karaf-features.sh` is optional (see ODL_RUNTIME_KARAF_FEATURES_INSTALL) and exists for debugging.
COPY karaf-features.list /tmp/karaf-features.list
COPY scripts/append-features-boot.sh /tmp/append-features-boot.sh
RUN chmod +x /tmp/append-features-boot.sh && /tmp/append-features-boot.sh /tmp/karaf-features.list && rm -f /tmp/append-features-boot.sh

COPY scripts/start-odl.sh /usr/local/bin/start-odl.sh
COPY scripts/install-karaf-features.sh /usr/local/bin/install-karaf-features.sh
COPY karaf-features.list /usr/local/share/odl/karaf-features.list

RUN chmod 755 /usr/local/bin/start-odl.sh /usr/local/bin/install-karaf-features.sh

WORKDIR /opt/opendaylight

CMD ["/bin/bash", "/usr/local/bin/start-odl.sh"]