🌐 Nokia Seamless MPLS Backbone & Traffic Engineering
Este laboratório simula uma infraestrutura de Backbone Service Provider de alta performance, utilizando o conceito de Seamless MPLS. O foco é a implementação de Segment Routing (SR-TE) com políticas de coloração para diferenciação de tráfego (SLA).

🏗️ Arquitetura do Backbone
A rede é composta por 9 nós Nokia SR OS divididos em funções estratégicas:

PE-01 a PE-04 (Provider Edge): Onde os serviços dos clientes (VPRN/VPLS) são terminados e as políticas de SR-TE são aplicadas.

ABR-01 e ABR-02 (Area Border Routers): Responsáveis pela interconexão entre as áreas do backbone, garantindo a escalabilidade do MPLS.

RR (Route Reflector): Centraliza a sinalização BGP (VPNv4/EVPN), mantendo o plano de controle leve e eficiente.

Operadoras (AS3356 & AS264075): Simulação de tráfego de trânsito IP e interconexão via roteadores Nokia.

🛠️ Stack Tecnológica
Underlay: OSPF com extensões de Traffic Engineering (TE) habilitadas.

Transporte: Segment Routing (SR-MPLS) eliminando a necessidade de protocolos legados como LDP.

Engenharia de Tráfego: SR-TE Policies baseadas em Admin-Groups (Cores):

🎨 Caminho Verde (Color 100): Rota de baixa latência via ABR-01.

🎨 Caminho Azul (Color 200): Rota de alta capacidade via ABR-02.

Serviços: VPRN e VPLS com Tunnel-Resolution direto para as políticas SR-TE.

🚦 Engenharia de Tráfego Dinâmica
Diferente do RSVP-TE tradicional, este lab utiliza Políticas Coloridas. O serviço do cliente não precisa conhecer a topologia; ele simplesmente solicita uma "cor" (SLA), e o backbone encaminha o tráfego pelo melhor caminho calculado via SR-TE.

Vantagens Implementadas:
Sinalização Simplificada: Sem manutenção de estados nos roteadores de core (P nodes).

TI-LFA (Topology-Independent Loop-Free Alternate): Proteção de rede sub-50ms nativa do Segment Routing.

Encaminhamento Baseado em Intenção: O serviço dita o caminho através da cor associada.

🚀 Guia de Operação
Verificação de Topologia SR-TE
Bash
# Verificar se o roteador enxerga as cores (Admin-Groups) dos vizinhos
show router ospf database opaque-area detail

# Validar as políticas de SR-TE ativas
show router segment-routing traffic-engineering policy
Validação de Serviço (VPRN)
Bash
# Confirmar se o serviço está "amarrado" à cor correta
show service id 10 tunnel-resolution