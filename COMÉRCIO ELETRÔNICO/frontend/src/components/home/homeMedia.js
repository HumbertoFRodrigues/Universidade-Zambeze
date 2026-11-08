// Imagens da página inicial: categorias em public/imagens/categorias/ (partilhadas com os produtos do seed)
// e logótipos em public/imagens/home/marcas/.
// public/imagens/home/hero.jpg e equipa.jpg: Unsplash (photo-1587582423116-ec07293f0395 e
// photo-1541888946425-d81bb19240f5), Licença Unsplash, que não exige atribuição.
// Origem: Wikimedia Commons. As licenças CC BY-SA exigem a indicação de autor e licença (ver CREDITOS_IMAGENS).
// A API não tem imagens de categoria nem logótipos de marca; a associação é feita pelo nome.

const normalizar = texto => String(texto || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()

const CATEGORIAS = [
  // Subcategorias específicas primeiro (a primeira correspondência ganha).
  { termos: ['oculos'], src: '/imagens/categorias/oculos-protecao.jpg', alt: 'Óculos de protecção' },
  { termos: ['calcado', 'bota'], src: '/imagens/categorias/calcado-seguranca.jpg', alt: 'Calçado de segurança' },
  { termos: ['soldadura'], src: '/imagens/categorias/soldadura.jpg', alt: 'Máscara de soldadura' },
  { termos: ['electrica', 'eletrica', 'racks'], src: '/imagens/produtos/regua-com-proteccao-apc-surgearrest.jpg', alt: 'Régua com protecção contra sobretensões' },
  { termos: ['cabeca', 'face', 'capacete'], src: '/imagens/categorias/cabeca-face.jpg', alt: 'Capacete de segurança amarelo' },
  { termos: ['auditiv', 'ouvido', 'ruido'], src: '/imagens/categorias/auditiva.jpg', alt: 'Protectores auriculares de concha' },
  { termos: ['incendio', 'fogo', 'extintor'], src: '/imagens/categorias/incendios.jpg', alt: 'Extintor de incêndio montado na parede' },
  { termos: ['queda', 'altura', 'arnes'], src: '/imagens/categorias/quedas.jpg', alt: 'Trabalhador com arnês de protecção contra quedas' },
  { termos: ['visibilidade', 'corporal', 'colete', 'vestuario'], src: '/imagens/categorias/visibilidade.jpg', alt: 'Colete reflector de alta visibilidade' },
  { termos: ['maos', 'braco', 'luva'], src: '/imagens/categorias/maos-bracos.jpg', alt: 'Luvas de protecção de vários materiais' },
  { termos: ['respirat', 'mascara', 'respirador'], src: '/imagens/categorias/respiratoria.jpg', alt: 'Meia-máscara respiratória com filtros' },
  { termos: ['sinaliza', 'emergencia', 'socorro'], src: '/imagens/categorias/sinalizacao.jpg', alt: 'Placa com sinais de segurança obrigatórios' },
  { termos: ['videovigilancia', 'cctv', 'camera', 'nvr', 'dvr'], src: '/imagens/categorias/videovigilancia.jpg', alt: 'Câmera de videovigilância IP' },
  { termos: ['acesso', 'biometr', 'fechadura', 'rfid'], src: '/imagens/categorias/controlo-acessos.jpg', alt: 'Terminal biométrico de controlo de acessos' },
  { termos: ['alarme', 'deteccao', 'sensor', 'sirene'], src: '/imagens/categorias/alarmes.jpg', alt: 'Central de alarme de segurança' },
  { termos: ['cofre', 'seguranca fisica', 'armario'], src: '/imagens/categorias/cofres.jpg', alt: 'Cofre-forte com a porta aberta' },
  { termos: ['rede', 'dados', 'firewall', 'switch', 'router', 'ups'], src: '/imagens/categorias/redes.jpg', alt: 'Equipamento de rede e segurança informática' },
]

// Devolve a imagem associada ao nome da categoria, ou null quando não há correspondência.
export function imagemCategoria(nome) {
  const chave = normalizar(nome)
  return CATEGORIAS.find(item => item.termos.some(termo => chave.includes(termo))) || null
}

const LOGOS = {
  '3m': '/imagens/home/marcas/3m.png',
  ansell: '/imagens/home/marcas/ansell.png',
  bolle: '/imagens/home/marcas/bolle.jpg',
  caterpillar: '/imagens/home/marcas/cat.png',
  // O ficheiro original é quadrado com muito espaço em branco; mostra-se apenas a faixa do texto.
  cederroth: { src: '/imagens/home/marcas/cederroth.jpg', estilo: { width: '100%', maxHeight: 'none', aspectRatio: '300 / 56', objectFit: 'cover' } },
  // Logótipo empilhado (símbolo e texto): precisa de mais altura para ficar legível.
  'delta plus': { src: '/imagens/home/marcas/deltaplus.png', estilo: { maxHeight: '66px' } },
  esab: '/imagens/home/marcas/esab.png',
  honeywell: '/imagens/home/marcas/honeywell.png',
  'lincoln electric': '/imagens/home/marcas/lincoln.png',
  msa: '/imagens/home/marcas/msa.png',
  uvex: '/imagens/home/marcas/uvex.png',
  hikvision: '/imagens/home/marcas/hikvision.png',
  'tp-link': '/imagens/home/marcas/tplink.png',
  cisco: '/imagens/home/marcas/cisco.png',
  fortinet: '/imagens/home/marcas/fortinet.png',
  ubiquiti: '/imagens/home/marcas/ubiquiti.png',
  apc: '/imagens/home/marcas/apc.png',
  samsung: '/imagens/home/marcas/samsung.png',
  'd-link': '/imagens/home/marcas/dlink.png',
  mikrotik: '/imagens/home/marcas/mikrotik.png',
  sophos: '/imagens/home/marcas/sophos.png',
}

// Logótipo da marca ({ src, estilo }), ou null quando não existe um logótipo verificado.
export function logoMarca(nome) {
  const logo = LOGOS[normalizar(nome).trim()]
  if (!logo) return null
  return typeof logo === 'string' ? { src: logo, estilo: undefined } : logo
}

export const CREDITOS_IMAGENS = [
  ['Capacete de segurança', 'Wasiul Bahar', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Safety_helmet_at_AERD.jpg'],
  ['Protectores auriculares', 'SeppVei', 'Domínio público', 'https://commons.wikimedia.org/wiki/File:Peltor_Optime_III.JPG'],
  ['Extintor', 'Swethasakthivel', 'CC0', 'https://commons.wikimedia.org/wiki/File:Fire_extinguisher_bottle.jpg'],
  ['Arnês de segurança', 'SafetyEdition', 'CC0', 'https://commons.wikimedia.org/wiki/File:Safety_Harness.jpg'],
  ['Colete reflector', 'Magnus Mertens', 'CC BY-SA 2.0 de', 'https://commons.wikimedia.org/wiki/File:Warnweste_gelb.jpg'],
  ['Luvas de protecção', 'Work-psa', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Chemikalienschutzhandschuhe.JPG'],
  ['Meia-máscara respiratória', 'Jcallah', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:P100_ovm_respirator.jpg'],
  ['Sinais de segurança', 'TeWeBs', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Safety_Signs.JPG'],
  // Fotografias usadas nas imagens dos produtos (categorias sem imagem na página inicial).
  ['Óculos de protecção', 'Jacek Halicki', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:2023_Okulary_ochronne_(1).jpg'],
  ['Calçado de segurança', 'Francis Flinch', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:S3_safety_footwear.jpg'],
  ['Máscara de soldadura', 'Ergonomidesign', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Speedglas.jpg'],
  ['Kit de primeiros socorros', 'Friedrich Haag', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Erste_Hilfe_003_2026_02_17.jpg'],
  ['Câmeras de videovigilância', 'Tamasflex', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:CCTV_Cameras.png'],
  ['Leitor biométrico', 'ArshadM1991', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:What_is_rd-service_in_fingerprint_biometric.jpg'],
  ['Sensor de alarme', 'Desconhecido', 'Domínio público', 'https://commons.wikimedia.org/wiki/File:Burglar_alarm.JPG'],
  ['Cofre-forte', 'P199', 'Domínio público', 'https://commons.wikimedia.org/wiki/File:Bank_vault_1901.jpg'],
  ['Bastidor de rede', 'Jon Parise', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:RIT_CSH_-_Network_Rack_(183803274).jpg'],
  // Fotografias dos produtos: ver frontend/public/imagens/produtos/CREDITOS.md.
]
