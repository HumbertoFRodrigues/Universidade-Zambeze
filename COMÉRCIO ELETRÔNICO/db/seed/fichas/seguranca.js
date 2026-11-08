// Fichas técnicas — incêndios, sinalização, soldadura, CCTV, controlo de acessos, alarmes e cofres.
export const fichasSeguranca = {
  'Extintor ABC 6kg pó químico': {
    descricao: 'Extintor portátil de pó químico ABC para incêndios de sólidos, líquidos inflamáveis e gases, e eficaz em equipamento eléctrico até 1000 V. É o extintor mais versátil para escritórios, lojas, armazéns, viaturas pesadas e residências. Fornecido com suporte de parede e manómetro de pressão.',
    especificacoes: { Marca: 'Vonder', 'Agente extintor': 'Pó químico ABC (fosfato monoamónico)', Capacidade: '6 kg', 'Classes de fogo': 'A, B, C', Pressurização: 'Permanente (azoto), com manómetro', 'Tempo de descarga': 'Aprox. 15 s', Alcance: '4–6 m', 'Peso total': 'Aprox. 9,5 kg', 'Conteúdo da embalagem': 'Extintor e suporte de parede', Normas: 'EN 3' },
  },
  'Extintor CO2 5kg (par)': {
    descricao: 'Par de extintores de dióxido de carbono de 5 kg, indicados para salas de servidores, quadros eléctricos, laboratórios e cozinhas industriais. O CO2 não deixa resíduos e não danifica equipamento electrónico. Difusor anti-gelo para manuseamento seguro.',
    especificacoes: { Marca: 'Protege', 'Agente extintor': 'Dióxido de carbono (CO2)', Capacidade: '5 kg por unidade', Quantidade: '2 unidades', 'Classes de fogo': 'B, eléctrico', Difusor: 'Anti-gelo', Alcance: '2–3 m', 'Peso total': 'Aprox. 14 kg por unidade', Normas: 'EN 3' },
  },
  'Manta corta-fogo 1.2×1.2m': {
    descricao: 'Manta em fibra de vidro para abafar pequenos incêndios em cozinhas, laboratórios e oficinas, ou para envolver uma pessoa com a roupa a arder. Bolsa de parede com abertura rápida por fitas. Reutilizável se não estiver danificada.',
    especificacoes: { Marca: 'Jactone', Material: 'Fibra de vidro', Dimensões: '1,2 × 1,2 m', Embalagem: 'Bolsa de parede com fitas de abertura rápida', 'Classes de fogo': 'F (óleos de cozinha), pequenos fogos A e B', Normas: 'EN 1869' },
  },
  'Extintor ABC 9kg com sinalização': {
    descricao: 'Extintor de pó químico ABC de 9 kg para áreas de maior risco, como armazéns, oficinas e fábricas. Fornecido com placa de sinalização fotoluminescente e suporte de parede. Pressão permanente com manómetro.',
    especificacoes: { Marca: 'FogoSeguro', 'Agente extintor': 'Pó químico ABC', Capacidade: '9 kg', 'Classes de fogo': 'A, B, C', Pressurização: 'Permanente, com manómetro', 'Tempo de descarga': 'Aprox. 20 s', Alcance: '5–7 m', 'Conteúdo da embalagem': 'Extintor, suporte e sinal fotoluminescente', Normas: 'EN 3' },
  },
  'Extintor de espuma AFFF 9L': {
    descricao: 'Extintor de espuma AFFF para incêndios em sólidos e líquidos inflamáveis, como combustíveis, tintas e solventes. Indicado para postos de combustível, garagens, oficinas e armazéns de produtos inflamáveis. A espuma forma uma película que impede a reignição.',
    especificacoes: { Marca: 'Jactone', 'Agente extintor': 'Espuma AFFF', Capacidade: '9 litros', 'Classes de fogo': 'A, B', Pressurização: 'Permanente, com manómetro', Alcance: '4–6 m', Normas: 'EN 3' },
  },
  'Carretel de mangueira 25m com armário': {
    descricao: 'Carretel de mangueira semi-rígida de 25 m com agulheta regulável (jacto e nevoeiro), instalado em armário metálico vermelho. Primeira linha de intervenção em edifícios, armazéns e fábricas, ligada à rede de incêndio. Montagem em parede.',
    especificacoes: { Marca: 'Protege', 'Comprimento da mangueira': '25 m', 'Diâmetro da mangueira': '25 mm', Agulheta: 'Regulável (jacto / nevoeiro)', Armário: 'Aço pintado a vermelho, com visor', Montagem: 'Parede', Normas: 'EN 671-1' },
  },
  'Extintor automático de tecto 6kg': {
    descricao: 'Extintor de pó ABC que dispara automaticamente quando a ampola térmica atinge a temperatura de activação. Protege salas técnicas, quadros eléctricos, cozinhas e pequenos armazéns sem intervenção humana. Montagem no tecto.',
    especificacoes: { Marca: 'FogoSeguro', 'Agente extintor': 'Pó químico ABC', Capacidade: '6 kg', Activação: 'Automática por ampola térmica (68 °C)', 'Área protegida': 'Aprox. 9–12 m²', Montagem: 'Tecto', 'Classes de fogo': 'A, B, C' },
  },
  'Kit primeiros socorros industrial 50 pessoas': {
    descricao: 'Mala de primeiros socorros para locais de trabalho com até 50 pessoas, com material para feridas, queimaduras, entorses e hemorragias. Mala em ABS com suporte de parede e compartimentos organizados. Indicada para obras, fábricas, escritórios e lojas.',
    especificacoes: { Marca: 'Cederroth', Capacidade: 'Até 50 pessoas', Mala: 'ABS com suporte de parede', Conteúdo: 'Pensos, compressas, ligaduras, adesivo, tesoura, luvas, manta térmica, solução de limpeza', 'Recarga': 'Componentes vendidos em separado', Dimensões: 'Aprox. 40 × 30 × 15 cm', 'Montagem': 'Parede ou transporte pela pega', Normas: 'DIN 13169' },
  },
  'Cones de sinalização 75cm (par)': {
    descricao: 'Par de cones de 75 cm em PVC flexível com faixas reflectoras, para sinalizar obras em estrada, parques de estacionamento e zonas de carga. A base pesada evita que tombem com o vento. Visíveis de dia e de noite.',
    especificacoes: { Marca: 'Vonder', Altura: '75 cm', Material: 'PVC flexível', Cor: 'Laranja', 'Faixas reflectoras': '2', Base: 'Pesada, anti-vento', Quantidade: '2 unidades' },
  },
  'Sinal proibido fumar alumínio 20×30cm': {
    descricao: 'Sinal de proibição "Proibido fumar" em alumínio lacado com impressão UV resistente ao sol e à humidade. Indicado para armazéns, postos de combustível, cozinhas e edifícios públicos. Furos para aparafusar.',
    especificacoes: { Marca: 'Sinalux', Pictograma: 'P002 Proibido fumar', Material: 'Alumínio lacado', Dimensões: '20 × 30 cm', Impressão: 'UV, resistente ao exterior', Fixação: '4 furos', Normas: 'ISO 7010' },
  },
  'Estação lava-olhos de emergência de parede': {
    descricao: 'Estação de parede com frascos de solução salina para lavagem ocular imediata após contacto com químicos, poeiras ou corpos estranhos. Inclui espelho e instruções visíveis. Obrigatória em laboratórios, oficinas e armazéns de químicos.',
    especificacoes: { Marca: 'Cederroth', Conteúdo: '2 frascos de solução salina de 500 ml', Suporte: 'Parede, com espelho', 'Validade da solução': '3 anos (fechada)', Material: 'Polipropileno', Normas: 'EN 15154-4' },
  },
  'Barreira de obra com sinal de entrada': {
    descricao: 'Barreira modular em polietileno laranja com placa informativa, para delimitar estaleiros, valas e zonas de acesso restrito. As barreiras encaixam umas nas outras e enchem-se com água ou areia para ganhar estabilidade. Leves para transportar.',
    especificacoes: { Marca: 'Vonder', Material: 'Polietileno', Cor: 'Laranja', Dimensões: '2 m × 1 m', Estabilização: 'Enchimento com água ou areia', Ligação: 'Encaixe modular', Sinalização: 'Placa "Entrada da obra"' },
  },
  'Máscara de soldadura 3M Speedglas 100': {
    descricao: 'Máscara de soldadura com filtro auto-escurecedor, ideal para quem está a começar ou faz soldadura ocasional. Escurece automaticamente ao detectar o arco e volta ao tom claro no fim. Leve e equilibrada.',
    especificacoes: { Marca: '3M', Modelo: 'Speedglas 100V', 'Tom claro': 'DIN 3', 'Tons escuros': 'DIN 8–12', 'Área de visão': '44 × 93 mm', 'Sensores de arco': '2', Alimentação: 'Baterias de lítio substituíveis', Normas: 'EN 175, EN 379' },
  },
  'Luvas de soldadura Lincoln Electric vermelhas': {
    descricao: 'Luvas de cano alto em couro para soldadura MIG/MAG e eléctrodo, com forro térmico e costuras em Kevlar. Protegem contra salpicos de metal, calor radiante e chamas. Muito resistentes ao uso intenso.',
    especificacoes: { Marca: 'Lincoln Electric', Material: 'Couro de bovino', Forro: 'Algodão térmico', Costuras: 'Kevlar', Comprimento: '35 cm', Cor: 'Vermelho', Tamanhos: 'L, XL', Normas: 'EN 12477 tipo A, EN 407' },
  },
  'Máscara Miller Classic de soldadura': {
    descricao: 'Máscara de soldadura auto-escurecedora com 4 sensores de arco, adequada a MIG, TIG e eléctrodo, incluindo TIG de baixa amperagem. Regulação de sensibilidade e atraso. Confortável para uso diário em oficinas e estaleiros.',
    especificacoes: { Marca: 'Miller', Linha: 'Classic', 'Tom claro': 'DIN 3', 'Tons escuros': 'DIN 8–13', 'Sensores de arco': '4', 'Área de visão': '97 × 60 mm', Alimentação: 'Bateria e célula solar', Normas: 'EN 175, EN 379' },
  },
  'Casaco ignífugo para soldador': {
    descricao: 'Casaco em algodão com tratamento ignífugo, que protege contra salpicos de soldadura, chamas e calor. Fecho com botões de pressão cobertos para não prenderem faíscas. Indicado para soldadores e serralheiros.',
    especificacoes: { Marca: 'ESAB', Material: 'Algodão com tratamento ignífugo', Fecho: 'Botões de pressão cobertos', Cor: 'Azul-marinho', Tamanhos: 'M a 3XL', Normas: 'EN ISO 11611 classe 1, EN ISO 11612' },
  },
  'Máscara de soldadura manual vermelha': {
    descricao: 'Máscara de soldadura de cabeça com visor basculante e vidro DIN 11, uma solução simples e económica para soldadura com eléctrodo. O visor levanta-se para inspeccionar a peça sem tirar a máscara. Arnês ajustável.',
    especificacoes: { Marca: 'Vonder', Tipo: 'Passiva, visor basculante', Vidro: 'DIN 11', 'Área de visão': '108 × 50 mm', Material: 'Polipropileno', Cor: 'Vermelho', Normas: 'EN 175' },
  },
  'Máscara ESAB Sentinel A50': {
    descricao: 'Máscara de soldadura premium com ecrã a cores e regulação digital, memória de 8 configurações e excelente qualidade óptica. Ajuste confortável e fácil de usar. Para soldadores profissionais em todos os processos.',
    especificacoes: { Marca: 'ESAB', Modelo: 'Sentinel A50', 'Tom claro': 'DIN 4', 'Tons escuros': 'DIN 5–8 e 9–13', 'Área de visão': '100 × 60 mm', 'Classe óptica': '1/1/1/2', Comandos: 'Ecrã táctil a cores', Memórias: '8', Normas: 'EN 175, EN 379' },
  },
  'Câmera bi-espectro Hikvision DS-2TD4167 PTZ': {
    descricao: 'Câmera PTZ bi-espectro que combina imagem térmica e imagem óptica, para vigilância de perímetros extensos, parques industriais, portos e armazéns de combustível. Detecta intrusões a longa distância mesmo na escuridão total ou com fumo. Inclui detecção de incêndio por temperatura.',
    especificacoes: { Marca: 'Hikvision', Modelo: 'DS-2TD4167', Tipo: 'PTZ bi-espectro (térmica + óptica)', 'Sensor óptico': '4 MP', Zoom: 'Óptico até 36×', 'Funções inteligentes': 'Detecção de intrusão e de incêndio', Rotação: '360° contínuos', Protecção: 'IP66', Alimentação: '24 V CA / PoE', Compressão: 'H.265+' },
  },
  'Câmera bullet Dahua IPC-HFW2431S 4MP': {
    descricao: 'Câmera IP bullet de 4 MP com infravermelhos até 80 m, para exteriores de casas, lojas, armazéns e parques de estacionamento. Compressão H.265+ que reduz o espaço ocupado no disco do NVR. Alimentada por PoE e resistente a chuva e poeira.',
    especificacoes: { Marca: 'Dahua', Modelo: 'IPC-HFW2431S-S', Tipo: 'Bullet IP', Resolução: '4 MP (2688 × 1520)', Lente: '3,6 mm fixa', 'Alcance IR': '80 m', Compressão: 'H.265+, H.264', 'Armazenamento local': 'microSD até 256 GB', Protecção: 'IP67', Alimentação: '12 V CC / PoE (802.3af)' },
  },
  'Câmera dome TP-Link VIGI C240 4MP': {
    descricao: 'Câmera IP dome de 4 MP para interiores, com visão nocturna e detecção inteligente de pessoas e veículos. Gestão gratuita através da app VIGI e compatível com NVR VIGI. Ideal para lojas, escritórios e recepções.',
    especificacoes: { Marca: 'TP-Link', Modelo: 'VIGI C240', Tipo: 'Dome IP', Resolução: '4 MP', Lente: '2,8 mm', 'Alcance IR': '30 m', 'Detecção inteligente': 'Pessoas e veículos', Compressão: 'H.265+', Alimentação: 'PoE (802.3af) / 12 V CC', Gestão: 'App VIGI, NVR VIGI' },
  },
  'Câmera PTZ Hikvision DS-2DE2A404IW 4MP': {
    descricao: 'Mini câmera PTZ de 4 MP com zoom óptico 4× e rotação de 360°, para vigiar áreas amplas com uma só câmera: pátios, armazéns e entradas. Seguimento automático de pessoas e veículos. Infravermelhos até 20 m.',
    especificacoes: { Marca: 'Hikvision', Modelo: 'DS-2DE2A404IW-DE3', Tipo: 'Mini PTZ IP', Resolução: '4 MP', Zoom: 'Óptico 4×', 'Alcance IR': '20 m', Rotação: 'Pan 360°, tilt 90°', 'Funções inteligentes': 'Seguimento automático, detecção de intrusão', Protecção: 'IP66', Alimentação: '12 V CC / PoE' },
  },
  'Câmera dome anti-vandalismo Dahua IK10': {
    descricao: 'Câmera dome IP para exterior com cúpula anti-vandalismo IK10, resistente a golpes e tentativas de sabotagem. Indicada para escolas, lojas, bancos e espaços públicos. Infravermelhos até 30 m.',
    especificacoes: { Marca: 'Dahua', Tipo: 'Dome IP anti-vandalismo', Resolução: '4 MP', Lente: '2,8 mm', 'Alcance IR': '30 m', 'Resistência a impactos': 'IK10', Protecção: 'IP67', Compressão: 'H.265+', Alimentação: 'PoE / 12 V CC' },
  },
  'NVR PoE 8 canais Hikvision DS-7608NI-K2/8P': {
    descricao: 'Gravador de vídeo em rede (NVR) com 8 portas PoE integradas: as câmeras ligam-se directamente e recebem energia pelo mesmo cabo. Grava até 8 MP por canal, com saída 4K e acesso remoto pela app Hik-Connect. Ideal para lojas, escritórios e residências.',
    especificacoes: { Marca: 'Hikvision', Modelo: 'DS-7608NI-K2/8P', Canais: '8 IP', 'Portas PoE': '8', 'Resolução máxima': '8 MP por canal', 'Saída de vídeo': 'HDMI 4K, VGA', Discos: '2 SATA, até 10 TB cada', Compressão: 'H.265+', 'Acesso remoto': 'App Hik-Connect' },
  },
  'NVR PoE 16 canais Dahua NVR4216-16P': {
    descricao: 'NVR de 16 canais com 16 portas PoE, para instalações médias como escolas, armazéns e condomínios. Suporta câmeras até 4K e funções de análise de vídeo. Dois discos SATA para gravação prolongada.',
    especificacoes: { Marca: 'Dahua', Modelo: 'NVR4216-16P-4KS2', Canais: '16 IP', 'Portas PoE': '16', 'Resolução máxima': '4K (8 MP) por canal', Discos: '2 SATA, até 10 TB cada', Compressão: 'H.265+', 'Saída de vídeo': 'HDMI 4K, VGA', 'Acesso remoto': 'App DMSS' },
  },
  'DVR Hikvision DS-7208HUHI-K1 8 canais': {
    descricao: 'Gravador híbrido Turbo HD de 8 canais, compatível com câmeras analógicas (HD-TVI, AHD, CVI, CVBS) e IP. Excelente opção para modernizar instalações antigas aproveitando a cablagem coaxial existente. Detecção de pessoas e veículos (AcuSense).',
    especificacoes: { Marca: 'Hikvision', Modelo: 'DS-7208HUHI-K1', Canais: '8 analógicos + IP adicionais', Compatibilidade: 'HD-TVI, AHD, HD-CVI, CVBS e IP', 'Resolução máxima': '5 MP', Discos: '1 SATA, até 10 TB', Compressão: 'H.265 Pro+', 'Saída de vídeo': 'HDMI, VGA' },
  },
  'Servidor de vídeo SISS VPU 3400': {
    descricao: 'Unidade de processamento de vídeo de 8 canais para centrais de monitorização e salas de controlo. Recebe streams de câmeras IP e distribui-os para ecrãs e operadores. Montagem em bastidor.',
    especificacoes: { Marca: 'SISS', Modelo: 'VPU 3400', Canais: '8', Montagem: 'Bastidor', 'Interfaces de rede': 'Ethernet gigabit', Utilização: 'Centrais de monitorização' },
  },
  'Disco rígido Seagate SkyHawk 4TB': {
    descricao: 'Disco rígido optimizado para videovigilância, preparado para gravar 24 horas por dia em NVR e DVR. O firmware ImagePerfect reduz a perda de imagens durante a gravação contínua. Suporta até 64 câmeras.',
    especificacoes: { Marca: 'Seagate', Modelo: 'SkyHawk ST4000VX', Capacidade: '4 TB', Formato: '3,5"', Interface: 'SATA 6 Gb/s', 'Carga de trabalho': '180 TB/ano', Funcionamento: '24/7', 'Câmeras suportadas': 'Até 64' },
  },
  'Disco WD Purple Pro 6TB': {
    descricao: 'Disco rígido WD Purple Pro para gravadores de vídeo com inteligência artificial, preparado para gravação contínua e análise de vídeo. Elevada fiabilidade para sistemas de grande dimensão. Suporta até 64 câmeras e 32 streams de IA.',
    especificacoes: { Marca: 'Western Digital', Modelo: 'WD Purple Pro', Capacidade: '6 TB', Formato: '3,5"', Interface: 'SATA 6 Gb/s', 'Carga de trabalho': '550 TB/ano', Cache: '256 MB', MTBF: '2,5 milhões de horas' },
  },
  'Kit Dahua 8 câmeras 4MP + NVR com monitor': {
    descricao: 'Kit completo de videovigilância com 8 câmeras IP de 4 MP, NVR de 8 canais com PoE, disco rígido e monitor. Solução pronta a instalar para lojas, armazéns e moradias, com visualização no telemóvel. A EasyShop pode orçamentar a instalação.',
    especificacoes: { Marca: 'Dahua', Câmeras: '8 × IP 4 MP com IR 30 m', Gravador: 'NVR 8 canais com 8 portas PoE', Disco: '2 TB incluído', Monitor: '22" Full HD', Compressão: 'H.265+', 'Acesso remoto': 'App DMSS', 'Conteúdo da embalagem': '8 câmeras, NVR, disco, monitor, fontes e cabos de rede' },
  },
  'Switch PoE 48 portas Hikvision DS-3E0550': {
    descricao: 'Switch PoE gigabit de 48 portas para grandes instalações de câmeras IP, alimentando-as pelo cabo de rede. Uplinks para ligação ao núcleo da rede e montagem em bastidor de 19". Ideal para fábricas, escolas e centros comerciais.',
    especificacoes: { Marca: 'Hikvision', Modelo: 'DS-3E0550', 'Portas PoE': '48 × gigabit', Uplinks: '2 × SFP', Normas: '802.3af/at', Montagem: 'Bastidor 19", 1U', Gestão: 'Não gerido' },
  },
  'Switch PoE 5 portas Netgear GS305P': {
    descricao: 'Switch de secretária com 5 portas gigabit, 4 delas PoE+, para pequenas instalações de câmeras IP, telefones VoIP ou access points. Plug-and-play, sem configuração. Caixa metálica silenciosa.',
    especificacoes: { Marca: 'Netgear', Modelo: 'GS305P', Portas: '5 × gigabit', 'Portas PoE': '4 (PoE+)', 'Orçamento PoE': '63 W', Gestão: 'Não gerido', Caixa: 'Metálica, sem ventoinha' },
  },
  'Leitor de impressão digital ZKTeco SF100': {
    descricao: 'Leitor biométrico para controlo de acesso de uma porta, com impressão digital, cartão e código. Ideal para escritórios, salas técnicas e armazéns. Liga a fechaduras electromagnéticas e botões de saída.',
    especificacoes: { Marca: 'ZKTeco', Modelo: 'SF100', Verificação: 'Impressão digital, cartão RFID, PIN', Capacidade: '1500 impressões digitais', Comunicação: 'TCP/IP, Wiegand', Alimentação: '12 V CC', Instalação: 'Embutir / parede' },
  },
  'Terminal biométrico ZKTeco F22 WiFi': {
    descricao: 'Terminal de controlo de assiduidade e acesso com impressão digital, cartão e Wi-Fi. Regista entradas e saídas dos trabalhadores e exporta relatórios de assiduidade. Muito usado em empresas, escolas e obras.',
    especificacoes: { Marca: 'ZKTeco', Modelo: 'F22', Verificação: 'Impressão digital, cartão, PIN', 'Capacidade de utilizadores': '3000', 'Registos': '100 000', Comunicação: 'Wi-Fi, TCP/IP, USB', Ecrã: '2,4" a cores', Alimentação: '12 V CC' },
  },
  'Torniquete tripé ZKTeco TS2000 inox': {
    descricao: 'Torniquete de tripé semi-automático em aço inoxidável para controlo de passagem de pessoas em entradas de empresas, fábricas e estádios. Integra leitor RFID e liga a sistemas de assiduidade. Os braços descem em caso de emergência.',
    especificacoes: { Marca: 'ZKTeco', Modelo: 'TS2000', Tipo: 'Tripé, semi-automático', Material: 'Aço inoxidável 304', Leitor: 'RFID integrado', 'Velocidade de passagem': '30 pessoas/min', Emergência: 'Braço desce em falta de energia', Alimentação: '220 V CA' },
  },
  'Torniquete de altura total ZKTeco FHT2300': {
    descricao: 'Torniquete de altura total para controlo rigoroso de acessos em estaleiros, fábricas, estádios e instalações sem vigilância permanente. Impede saltos e passagens indevidas. Liga a leitores biométricos ou de cartão.',
    especificacoes: { Marca: 'ZKTeco', Modelo: 'FHT2300', Tipo: 'Altura total', Material: 'Aço inoxidável', 'Sentido de passagem': 'Bidireccional', Leitores: 'Compatível com biometria e RFID', Altura: 'Aprox. 2,2 m', Alimentação: '220 V CA' },
  },
  'Speed gate ZKTeco SBTL5000': {
    descricao: 'Barreira de passagem rápida com portas de vidro e sensores infravermelhos anti-intrusão, para recepções de escritórios, bancos e edifícios corporativos. Leitor de cartão integrado e abertura em menos de um segundo. Aspecto moderno e elegante.',
    especificacoes: { Marca: 'ZKTeco', Série: 'SBTL5000', Tipo: 'Speed gate', Material: 'Aço inoxidável e vidro acrílico', Sensores: 'Infravermelhos anti-intrusão', Leitor: 'RFID integrado', 'Tempo de abertura': '< 1 s', Alimentação: '220 V CA' },
  },
  'Fechadura electromagnética 280kg': {
    descricao: 'Fechadura electromagnética de 12 V com força de retenção de 280 kg, para portas controladas por leitor biométrico, teclado ou intercomunicador. Sensor de estado da porta e LED indicador. Abre automaticamente em falta de energia (segurança contra incêndio).',
    especificacoes: { Marca: 'Vonder', 'Força de retenção': '280 kg (600 lb)', Alimentação: '12 V CC', Consumo: '500 mA', 'Sensor de porta': 'Sim', Material: 'Alumínio anodizado', Funcionamento: 'Fail-safe (abre sem energia)' },
  },
  'Central DSC PowerSeries NEO HS2032': {
    descricao: 'Central de alarme profissional de 32 zonas com comunicador IP integrado e aplicação móvel. Suporta sensores com e sem fios PowerG de longo alcance. Indicada para empresas, lojas e moradias com várias áreas.',
    especificacoes: { Marca: 'DSC', Modelo: 'PowerSeries NEO HS2032', Zonas: 'Até 32', Partições: '4', Comunicação: 'IP integrado; GSM opcional', 'Sensores sem fios': 'PowerG', Utilizadores: '95 códigos', Alimentação: '16,5 V CA com bateria de reserva' },
  },
  'Sensor PIR Visonic NEXT+ MCW': {
    descricao: 'Detector de movimento infravermelho sem fios com imunidade a animais de estimação até 38 kg. Óptica de alta precisão que reduz falsos alarmes. Fácil de instalar em casas, escritórios e lojas.',
    especificacoes: { Marca: 'Visonic', Modelo: 'NEXT+ MCW', Tipo: 'PIR sem fios', Alcance: '12 m', 'Imunidade a animais': 'Até 38 kg', Alimentação: 'Bateria de lítio 3 V', Montagem: 'Parede ou canto' },
  },
  'Sensor de movimento de tecto 360° Bosch': {
    descricao: 'Detector PIR de tecto com cobertura circular de 360°, ideal para salas amplas, armazéns e lojas onde a montagem em parede não é prática. Discreto e de baixo perfil.',
    especificacoes: { Marca: 'Bosch', Tipo: 'PIR de tecto', Cobertura: '360°', 'Diâmetro de detecção': 'Até 7 m (a 2,4 m de altura)', 'Altura de montagem': '2,4–5 m', Alimentação: '12 V CC' },
  },
  'Sirene exterior de alta potência 120dB': {
    descricao: 'Sirene de mastro de alta potência para alertas de evacuação e alarme em fábricas, estaleiros, escolas e condomínios. Corpo em alumínio resistente à intempérie. Ligação à central de alarme ou a um botão de emergência.',
    especificacoes: { Marca: 'Ajax', 'Pressão sonora': '120 dB a 1 m', Material: 'Alumínio', Protecção: 'IP65', Montagem: 'Mastro ou parede', Alimentação: '12 V CC' },
  },
  'Kit de alarme Ring Alarm 5 peças': {
    descricao: 'Kit de alarme sem fios para casas e pequenos escritórios, com central, teclado, sensor de porta, sensor de movimento e extensor de alcance. Instalação simples e controlo pelo telemóvel. Avisa imediatamente quando um sensor dispara.',
    especificacoes: { Marca: 'Ring', Modelo: 'Ring Alarm (2.ª geração)', 'Conteúdo da embalagem': 'Central, teclado, sensor de contacto, sensor de movimento, extensor', Comunicação: 'Wi-Fi / Ethernet', 'Protocolo dos sensores': 'Z-Wave', 'Sirene': '104 dB na central', 'Bateria de reserva': 'Sim, na central (até 24 h)', Gestão: 'App Ring' },
  },
  'Central Paradox SP7000 16 zonas': {
    descricao: 'Central de alarme Paradox de 16 zonas, expansível até 32, com função StayD que mantém a casa protegida enquanto os ocupantes estão dentro. Comunicador IP opcional para acesso remoto. Muito usada em moradias e lojas.',
    especificacoes: { Marca: 'Paradox', Modelo: 'SP7000', Zonas: '16 (expansível a 32)', Partições: '2', 'Comunicação': 'IP opcional (IP150)', Utilizadores: '32 códigos', Alimentação: '16,5 V CA com bateria de reserva' },
  },
  'Detector de fumo óptico de tecto': {
    descricao: 'Detector de fumo óptico com alarme sonoro de 85 dB, para detecção precoce de incêndio em casas, escritórios e quartos de hotel. Bateria de longa duração e botão de teste. Montagem no tecto.',
    especificacoes: { Marca: 'Ajax', Tipo: 'Óptico (fotoeléctrico)', 'Alarme sonoro': '85 dB', Alimentação: 'Bateria de longa duração', 'Botão de teste': 'Sim', Montagem: 'Tecto', Normas: 'EN 14604' },
  },
  'Cofre electrónico Yale YSV/390 de secretária': {
    descricao: 'Cofre electrónico de secretária com teclado digital e chave de emergência, para guardar dinheiro, documentos e pequenos valores em casa ou no escritório. Pré-furado para ancoragem ao chão ou à parede. Alerta de bateria fraca.',
    especificacoes: { Marca: 'Yale', Modelo: 'YSV/390', Fechadura: 'Electrónica com chave de emergência', Capacidade: '38 litros', 'Espessura da porta': '6 mm', Ancoragem: 'Chão e parede (parafusos incluídos)', Alimentação: '4 pilhas AA' },
  },
  'Cofre Sentry SFW123GDC anti-fogo': {
    descricao: 'Cofre resistente ao fogo durante 60 minutos e à água, para proteger documentos, passaportes, dinheiro e discos. Fechadura digital programável. Indicado para escritórios e residências.',
    especificacoes: { Marca: 'Sentry Safe', Modelo: 'SFW123GDC', Capacidade: '34 litros', 'Resistência ao fogo': '60 min (até 927 °C)', 'Resistência à água': 'Submersão 24 h', Fechadura: 'Digital com chave', Peso: 'Aprox. 39 kg' },
  },
  'Cofre de escritório Chubbsafes com chave e código': {
    descricao: 'Cofre de alta segurança para escritórios com dupla fechadura: chave e código electrónico. Paredes reforçadas e sistema anti-arrombamento. Indicado para guardar dinheiro, cheques e documentos importantes.',
    especificacoes: { Marca: 'Chubbsafes', Fechaduras: 'Chave + electrónica', Capacidade: 'Aprox. 60 litros', 'Espessura da porta': '10 mm', Ancoragem: 'Chão', Certificação: 'EN 14450 S2' },
  },
  'Cofre de hotel Yale YSB/250 para roupeiro': {
    descricao: 'Cofre compacto para quartos de hotel e roupeiros, com visor digital e código de 3 a 8 dígitos. Cabe um portátil de 15", passaportes e dinheiro. Fixação ao chão ou à parede.',
    especificacoes: { Marca: 'Yale', Modelo: 'YSB/250', Capacidade: '16 litros', Fechadura: 'Electrónica com visor', Código: '3 a 8 dígitos', Ancoragem: 'Chão e parede', Alimentação: '4 pilhas AA' },
  },
  'Armário de segurança para armas': {
    descricao: 'Armário em aço de 3 mm para guarda segura de armas longas, com fechadura de 3 pontos e prateleira separada para munições. Indicado para empresas de segurança privada e caçadores licenciados. Pré-furado para ancoragem.',
    especificacoes: { Marca: 'Vonder', Capacidade: '5 armas longas', 'Espessura do aço': '3 mm', Fechadura: '3 pontos, com chave', Compartimento: 'Prateleira para munições com fechadura', Ancoragem: 'Chão e parede' },
  },
  'Cofre de chão Chubbsafes Elements Air 50': {
    descricao: 'Cofre de pé Chubbsafes Elements Air com fechadura de chave e porta reforçada, para escritórios, lojas e residências. Prateleira interior ajustável. Ancoragem ao chão incluída.',
    especificacoes: { Marca: 'Chubbsafes', Modelo: 'Elements Air 50', Capacidade: '50 litros', Fechadura: 'Chave', Prateleiras: '1 ajustável', Ancoragem: 'Chão (parafusos incluídos)', Certificação: 'EN 14450 S1' },
  },
}
