// Fichas técnicas — protecção de redes e dados.
export const fichasRedes = {
  'Firewall Fortinet FortiGate 6501F': {
    descricao: 'Firewall de próxima geração (NGFW) de classe data center, para operadores, bancos e grandes organizações com tráfego muito elevado. Inspecciona tráfego cifrado SSL, previne intrusões e aplica controlo de aplicações em tempo real. Gestão centralizada com FortiManager e subscrições FortiGuard.',
    especificacoes: { Marca: 'Fortinet', Modelo: 'FortiGate 6501F', Tipo: 'NGFW para data center', Formato: 'Chassis de bastidor', 'Interfaces': '100GE, 40GE, 25GE e 10GE', Funções: 'Firewall, IPS, controlo de aplicações, VPN IPsec/SSL, inspecção SSL', Gestão: 'FortiOS, FortiManager', Fontes: 'Redundantes', Licenças: 'Subscrições FortiGuard (vendidas à parte)' },
  },
  'Firewall Cisco ASA 5506-X': {
    descricao: 'Firewall de secretária com serviços FirePOWER, ideal para pequenas empresas e filiais. Protege a rede com firewall de estado, prevenção de intrusões e VPN para teletrabalho. Fácil de gerir através do ASDM.',
    especificacoes: { Marca: 'Cisco', Modelo: 'ASA 5506-X', Formato: 'Secretária', Portas: '8 × gigabit Ethernet', 'Débito de firewall': 'Até 750 Mbps', VPN: 'IPsec e AnyConnect', Serviços: 'FirePOWER (IPS, controlo de aplicações)', Gestão: 'ASDM, CLI' },
  },
  'Firewall Cisco ASA 5510': {
    descricao: 'Appliance de segurança 1U com firewall, VPN IPsec e prevenção de intrusões para médias empresas. Robusto e fiável, com interfaces dedicadas para LAN, WAN e DMZ. Montagem em bastidor.',
    especificacoes: { Marca: 'Cisco', Modelo: 'ASA 5510', Formato: 'Bastidor 1U', Portas: '5 × Fast Ethernet', 'Débito de firewall': 'Até 300 Mbps', VPN: 'IPsec, SSL', Funções: 'Firewall de estado, NAT, DMZ', Gestão: 'ASDM, CLI' },
  },
  'Firewall Cisco Firepower (Sourcefire) 7120': {
    descricao: 'Sistema de prevenção de intrusões (NGIPS) para proteger redes empresariais contra ataques e malware. Analisa o tráfego em profundidade e bloqueia ameaças em tempo real. Gerido pelo Firepower Management Center.',
    especificacoes: { Marca: 'Cisco', Modelo: 'Firepower 7120 (Sourcefire)', Tipo: 'NGIPS', Formato: 'Bastidor 1U', Portas: '8 × gigabit (cobre)', Funções: 'Prevenção de intrusões, detecção de malware, controlo de aplicações', Gestão: 'Firepower Management Center' },
  },
  'Firewall Fortinet FortiGate 40F': {
    descricao: 'Firewall de próxima geração de secretária para pequenos escritórios, lojas e filiais. Integra SD-WAN, IPS, filtragem web e VPN SSL num equipamento compacto. Gestão simples pela web ou pela nuvem FortiCloud.',
    especificacoes: { Marca: 'Fortinet', Modelo: 'FortiGate 40F', Formato: 'Secretária', Portas: '5 × gigabit (1 WAN, 4 LAN)', 'Débito de firewall': '5 Gbps', 'Débito IPS': '1 Gbps', VPN: 'IPsec e SSL', Funções: 'NGFW, SD-WAN, filtragem web', Gestão: 'Web, FortiCloud' },
  },
  'Token de autenticação Fortinet FortiToken 200': {
    descricao: 'Token físico que gera códigos de uso único (OTP) para autenticação de dois factores em VPN, firewalls e portais. Protege as contas mesmo que a palavra-passe seja roubada. Integra-se com FortiGate e FortiAuthenticator.',
    especificacoes: { Marca: 'Fortinet', Modelo: 'FortiToken 200', Tipo: 'Token OTP físico', Código: '6 dígitos, renovado a cada 60 s', Normas: 'OATH TOTP', Bateria: 'Aprox. 5 anos', Compatibilidade: 'FortiGate, FortiAuthenticator' },
  },
  'Switch Cisco SG200-08P PoE 8 portas': {
    descricao: 'Switch gerenciável de 8 portas gigabit, 4 delas PoE, para pequenas empresas com câmeras IP, telefones VoIP e access points. Suporta VLANs e QoS para separar e priorizar o tráfego. Gestão por interface web.',
    especificacoes: { Marca: 'Cisco', Modelo: 'SG200-08P', Portas: '8 × gigabit', 'Portas PoE': '4 (802.3af)', 'Orçamento PoE': '32 W', Gestão: 'Web (smart switch)', Funções: 'VLAN, QoS, IGMP snooping', Formato: 'Secretária' },
  },
  'Switch modular Cisco Catalyst 6509-V-E': {
    descricao: 'Chassis modular de 9 slots para o núcleo de redes empresariais de grande dimensão. Permite combinar placas de portas, supervisores e serviços com fontes redundantes. Utilizado em data centers, universidades e operadores.',
    especificacoes: { Marca: 'Cisco', Modelo: 'Catalyst 6509-V-E', Tipo: 'Chassis modular', Slots: '9', Formato: 'Bastidor 19"', Fontes: 'Redundantes', Ventilação: 'Frente para trás', Gestão: 'Cisco IOS' },
  },
  'Switch HP 1810G-8 gigabit': {
    descricao: 'Switch web-managed de 8 portas gigabit, silencioso e sem ventoinha, para escritórios e lojas. Suporta VLANs e QoS para organizar a rede. Formato de secretária.',
    especificacoes: { Marca: 'HP', Modelo: '1810G-8', Portas: '8 × gigabit', Gestão: 'Web', Funções: 'VLAN, QoS, agregação de ligações', Ventilação: 'Sem ventoinha', Formato: 'Secretária' },
  },
  'Switch Netgear ProSafe XS716T 10-Gigabit': {
    descricao: 'Switch gerenciável de 16 portas 10 Gigabit para servidores, armazenamento (NAS/SAN) e núcleo de pequenas redes. Elevado desempenho para virtualização e backups. Montagem em bastidor.',
    especificacoes: { Marca: 'Netgear', Modelo: 'ProSafe XS716T', Portas: '16 × 10GBASE-T', 'Portas SFP+': '2 (combo)', Gestão: 'Web (smart managed)', Funções: 'VLAN, QoS, LACP', Formato: 'Bastidor 1U' },
  },
  'Switch D-Link DES-1008D 8 portas': {
    descricao: 'Switch não gerido de 8 portas Fast Ethernet, plug-and-play, para pequenos escritórios e casas. Liga computadores, impressoras e câmeras sem configuração. Compacto e de baixo consumo.',
    especificacoes: { Marca: 'D-Link', Modelo: 'DES-1008D', Portas: '8 × 10/100 Mbps', Gestão: 'Não gerido', Formato: 'Secretária', Alimentação: 'Adaptador externo' },
  },
  'Switch D-Link DES-1016D 16 portas': {
    descricao: 'Switch não gerido de 16 portas Fast Ethernet com uplink, para pequenas redes de escritório e salas de formação. Instalação imediata, sem configuração.',
    especificacoes: { Marca: 'D-Link', Modelo: 'DES-1016D', Portas: '16 × 10/100 Mbps', Gestão: 'Não gerido', Formato: 'Secretária', Alimentação: 'Interna' },
  },
  'Switch TP-Link LS1005G 5 portas gigabit': {
    descricao: 'Switch de secretária com 5 portas gigabit, plug-and-play, para aumentar o número de ligações de rede em casa ou num pequeno escritório. Caixa compacta e sem ventoinha.',
    especificacoes: { Marca: 'TP-Link', Modelo: 'LS1005G', Portas: '5 × gigabit', Gestão: 'Não gerido', Formato: 'Secretária', Ventilação: 'Sem ventoinha' },
  },
  'Router MikroTik hAP ac2': {
    descricao: 'Router dual-band com 5 portas gigabit e RouterOS, com firewall avançada, VPN e gestão de largura de banda. Muito usado por pequenas empresas e prestadores de internet em Moçambique. Configurável pela app MikroTik ou pelo Winbox.',
    especificacoes: { Marca: 'MikroTik', Modelo: 'hAP ac2 (RBD52G)', Portas: '5 × gigabit', 'Wi-Fi': '802.11ac dual-band', Sistema: 'RouterOS nível 4', VPN: 'IPsec, L2TP, PPTP, WireGuard (RouterOS 7)', Alimentação: 'Adaptador ou PoE-in' },
  },
  'Router MikroTik hAP lite': {
    descricao: 'Router compacto com 4 portas e Wi-Fi 2,4 GHz, económico para pequenos escritórios, lojas e casas. Inclui RouterOS com firewall e hotspot. Alimentação por USB.',
    especificacoes: { Marca: 'MikroTik', Modelo: 'hAP lite (RB941-2nD)', Portas: '4 × 10/100 Mbps', 'Wi-Fi': '802.11n 2,4 GHz', Sistema: 'RouterOS nível 4', Alimentação: 'Micro-USB' },
  },
  'Router MikroTik RB951Ui-2HnD': {
    descricao: 'Router com 5 portas, Wi-Fi de alta potência e saída PoE na porta 5, ideal para criar hotspots em hotéis, cafés e escolas. Inclui RouterOS com controlo de utilizadores e limitação de velocidade.',
    especificacoes: { Marca: 'MikroTik', Modelo: 'RB951Ui-2HnD', Portas: '5 × 10/100 Mbps + 1 USB', 'Wi-Fi': '802.11n 2,4 GHz, alta potência', 'PoE out': 'Porta 5', Sistema: 'RouterOS nível 4', Alimentação: 'Adaptador ou PoE-in' },
  },
  'Router MikroTik Chateau 5G': {
    descricao: 'Router 5G/LTE com Wi-Fi dual-band, para ligação principal ou de reserva quando a fibra falha. Ideal para escritórios, obras e locais sem cabo. Basta inserir o cartão SIM do operador.',
    especificacoes: { Marca: 'MikroTik', Modelo: 'Chateau 5G', 'Rede móvel': '5G / LTE (SIM)', 'Wi-Fi': '802.11ac dual-band', Portas: '5 × gigabit', Sistema: 'RouterOS 7', Alimentação: 'Adaptador 12 V' },
  },
  'Router MikroTik RB2011UiAS-RM em rack': {
    descricao: 'Router de 10 portas (5 gigabit e 5 Fast Ethernet) com ecrã táctil e porta SFP, para montagem em bastidor. Indicado para escritórios e pequenos operadores que precisam de encaminhamento, VPN e firewall.',
    especificacoes: { Marca: 'MikroTik', Modelo: 'RB2011UiAS-RM', Portas: '5 × gigabit + 5 × 10/100', SFP: '1', Ecrã: 'Táctil LCD', Sistema: 'RouterOS nível 5', Formato: 'Bastidor 1U' },
  },
  'Router de bolso MikroTik mAP lite': {
    descricao: 'Ponto de acesso portátil do tamanho de uma caixa de fósforos, para criar uma rede Wi-Fi em viagem, em eventos ou em ligações temporárias. Alimentação por micro-USB.',
    especificacoes: { Marca: 'MikroTik', Modelo: 'mAP lite', Portas: '1 × 10/100 Mbps', 'Wi-Fi': '802.11n 2,4 GHz', Sistema: 'RouterOS nível 4', Alimentação: 'Micro-USB' },
  },
  'Ponte sem fios MikroTik wAP 60G': {
    descricao: 'Ligação sem fios ponto-a-ponto de 60 GHz para unir edifícios próximos com débito gigabit, sem abrir valas para cabo. Ideal para condomínios, escolas e armazéns. Equipamento de exterior.',
    especificacoes: { Marca: 'MikroTik', Modelo: 'wAP 60G', Frequência: '60 GHz', 'Débito': 'Até 1 Gbps', Alcance: 'Até 200 m', Protecção: 'Exterior', Alimentação: 'PoE' },
  },
  'Router Wi-Fi TP-Link TL-WR740N': {
    descricao: 'Router Wi-Fi N150 simples e económico para casas e pequenos escritórios. Inclui firewall SPI, controlo parental e rede de convidados. Configuração rápida pela web.',
    especificacoes: { Marca: 'TP-Link', Modelo: 'TL-WR740N', 'Wi-Fi': '802.11n, 150 Mbps', Portas: '1 WAN + 4 LAN (10/100 Mbps)', Segurança: 'WPA2, firewall SPI', Antena: '1 fixa' },
  },
  'Access Point Ubiquiti UniFi U6 Lite Wi-Fi 6': {
    descricao: 'Access point Wi-Fi 6 de tecto para escritórios, hotéis e lojas, gerido de forma centralizada pela plataforma UniFi. Suporta muitos utilizadores em simultâneo e roaming entre vários pontos de acesso. Alimentado por PoE.',
    especificacoes: { Marca: 'Ubiquiti', Modelo: 'UniFi U6 Lite', 'Wi-Fi': 'Wi-Fi 6 (802.11ax) dual-band', 'Débito máximo': '1,5 Gbps (combinado)', Utilizadores: 'Até 300', Porta: '1 × gigabit', Alimentação: 'PoE (802.3af)', Gestão: 'UniFi Network' },
  },
  'Régua com protecção APC SurgeArrest': {
    descricao: 'Régua de tomadas com protecção contra sobretensões, que protege computadores, routers e televisores de picos de corrente. Indicador de protecção activa e interruptor. Muito útil nas frequentes oscilações da rede eléctrica.',
    especificacoes: { Marca: 'APC', Linha: 'SurgeArrest', Tomadas: 'Múltiplas', Protecção: 'Contra sobretensões', Indicadores: 'Protecção activa e ligação à terra', Interruptor: 'Sim' },
  },
  'Filtro de linha Tripp Lite Isobar IB-8': {
    descricao: 'Protector de 8 tomadas com filtragem de ruído eléctrico e protecção contra sobretensões, em caixa metálica. Ideal para servidores, equipamento de rede e salas técnicas. Interruptor e disjuntor integrados.',
    especificacoes: { Marca: 'Tripp Lite', Modelo: 'Isobar IB-8', Tomadas: '8', Protecção: 'Sobretensões e filtragem de ruído', Caixa: 'Metálica', Disjuntor: 'Integrado' },
  },
  'Protectores de sobretensão CyberPower': {
    descricao: 'Protectores compactos com tomadas protegidas, para postos de trabalho com computador, monitor e impressora. Protegem contra picos e sobretensões da rede eléctrica.',
    especificacoes: { Marca: 'CyberPower', Protecção: 'Contra sobretensões', Tomadas: 'Várias protegidas', 'Portas USB': 'Conforme o modelo', Indicadores: 'LED de protecção e ligação à terra', Formato: 'Compacto', 'Tensão nominal': '230 V CA' },
  },
  'Descarregador de sobretensões DIN 40kA': {
    descricao: 'Protector contra sobretensões tipo 2 para montagem no quadro eléctrico, que protege toda a instalação contra picos causados por trovoadas e manobras na rede. Indicador visual de estado. Deve ser instalado por electricista.',
    especificacoes: { Marca: 'IMO', Tipo: 'Tipo 2', 'Corrente máxima de descarga': '40 kA', Montagem: 'Calha DIN', 'Indicador de estado': 'Sim', Normas: 'IEC 61643-11' },
  },
  'Rack de parede 12U com porta': {
    descricao: 'Bastidor de parede de 12U com porta de vidro e ventilação, para organizar switches, NVR, routers e patch panels em escritórios e lojas. Fechadura com chave e entradas de cabos.',
    especificacoes: { Marca: 'Vonder', Altura: '12U', 'Largura útil': '19"', Porta: 'Vidro temperado com fechadura', Ventilação: 'Sim', Montagem: 'Parede' },
  },
  'Patch panel Cat6 24 portas 1U': {
    descricao: 'Painel de distribuição de 24 portas Cat6 para cablagem estruturada em bastidor de 19". Organiza as ligações de rede e facilita a manutenção. Inclui identificação das portas.',
    especificacoes: { Marca: 'Vonder', Categoria: 'Cat6', Portas: '24 × RJ45', Altura: '1U', 'Largura': '19"', Ligação: 'Cravação tipo 110' },
  },
  'Rack de chão 42U para servidores': {
    descricao: 'Bastidor de chão de 42U para servidores e equipamento de rede, com portas perfuradas para boa ventilação e réguas de energia. Indicado para salas de servidores e pequenos data centers.',
    especificacoes: { Marca: 'Vonder', Altura: '42U', Dimensões: '600 × 1000 mm', Portas: 'Perfuradas, com fechadura', Ventilação: 'Portas perfuradas', 'Réguas de energia': 'Incluídas', 'Carga máxima': 'Aprox. 800 kg' },
  },
}
