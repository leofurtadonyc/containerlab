FROM debian:latest

ENV DEBIAN_FRONTEND=noninteractive

# Instalação consolidada: RADIUS + Ferramentas de Diagnóstico e Performance
RUN apt-get update && apt-get install -y \
    freeradius \
    freeradius-utils \
    iputils-ping \
    iproute2 \
    tcpdump \
    traceroute \
    iperf3 \
    curl \
    python3-pip \
    net-tools \
    vim \
    mtr-tiny \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# O correto é apenas o comando, sem as referências:
RUN pip install --break-system-packages scapy

# Configuração de diretório e cópia de arquivos (RADIUS)
COPY users /etc/freeradius/3.0/users

WORKDIR /root
CMD ["freeradius", "-X"]