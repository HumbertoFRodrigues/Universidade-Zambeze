import { createHash, scryptSync } from 'node:crypto'
import { anoEmMocambique, ivaIncluido, numeroFactura } from '../../backend/src/services/precos.js'
import { POLITICAS } from './politicas.js'
import { catalogo } from './catalogo.js'
import { fichas } from './fichas.js'

const DIA = 86400000
const id = indice => (indice)
const dinheiro = centavos => (centavos / 100).toFixed(2)
const hash = valor => createHash('sha256').update(valor).digest('hex')
const escolher = (valores, indice) => valores[indice % valores.length]


// Cada produto usa a sua fotografia em frontend/public/imagens/produtos/<slug do nome>.jpg
// (Wikimedia Commons, créditos em imagens/produtos/CREDITOS.md). Ilustrativas, não oficiais.
export const slugFoto = nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function criarDadosSeed({ referencia = new Date(), palavraPasse = 'EasyShopTeste!2026' } = {}) {
  if (!(referencia instanceof Date) || !Number.isFinite(referencia.getTime())) throw new Error('SEED_REFERENCE_DATE inválida.')
  if (palavraPasse.length < 12) throw new Error('SEED_PASSWORD deve ter pelo menos 12 caracteres.')
  const base = new Date(referencia)
  base.setUTCHours(0, 0, 0, 0)
  const data = dias => new Date(base.getTime() + dias * DIA)
  const dados = Object.fromEntries([
    'categoria', 'produto', 'imagemProduto', 'utilizador', 'endereco', 'tokenRecuperacao', 'sessaoAutenticacao',
    'carrinho', 'itemCarrinho', 'encomenda', 'itemEncomenda', 'historicoEstadoEncomenda',
    'formaPagamento', 'pagamento', 'zonaEntrega', 'modalidadeEntrega', 'tarifaFrete',
    'entrega', 'promocao', 'promocaoProduto', 'movimentoStock', 'avaliacaoProduto',
    'avaliacaoEncomenda', 'pedidoAssistencia', 'devolucao', 'itemDevolucao', 'reembolso',
    'configuracaoLoja', 'politicaLoja', 'registoAuditoria', 'empresa', 'descontoGrupo', 'cotacao', 'itemCotacao', 'factura', 'serieFactura',
  ].map(modelo => [modelo, []]))
  const adicionar = (modelo, linha) => { dados[modelo].push(linha); return linha }
  const movimentos = []
  const precos = new Map()
  const metasItens = new Map()
  const raizes = new Map()
  for (const [grupo] of catalogo) {
    if (!raizes.has(grupo)) {
      const categoria = adicionar('categoria', { id: id(dados.categoria.length), nome: grupo, activo: true })
      raizes.set(grupo, categoria)
    }
  }
  let numeroProduto = 0
  catalogo.forEach(([grupo, nomeCategoria, produtos]) => {
    const categoria = adicionar('categoria', {
      id: id(dados.categoria.length), nome: nomeCategoria, categoriaPaiId: raizes.get(grupo).id, activo: true,
    })
    produtos.forEach(([nome, marca, centavos, material, descricao], variante) => {
      numeroProduto++
      const produto = adicionar('produto', {
        id: `seed-easyshop-produto-${String(numeroProduto).padStart(3, '0')}`,
        slug: `seed-${nomeCategoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replaceAll(' ', '-')}-${numeroProduto}`,
        codigo: `SEED-ES-${String(numeroProduto).padStart(4, '0')}`,
        nome, marca, descricao: fichas[nome]?.descricao || descricao,
        especificacoes: { material, categoria: nomeCategoria, ...fichas[nome]?.especificacoes },
        garantia: grupo.startsWith('Proteção de Redes') || grupo.startsWith('Videovigil') || grupo.startsWith('Alarmes') || grupo.startsWith('Controlo')
          ? 'Garantia de 12 meses contra defeitos de fabrico.'
          : grupo.startsWith('Cofres') ? 'Garantia de 24 meses no mecanismo de fecho.' : 'Garantia do fabricante contra defeitos de fabrico.',
        preco: dinheiro(centavos), codigoMoeda: 'MZN',
        // Um produto esgotado e um com stock baixo por subcategoria, para testar a disponibilidade.
        quantidadeStock: variante === 1 ? 0 : variante === 2 ? 3 : 30 + variante * 3,
        limiarStockBaixo: 5, categoriaId: categoria.id, activo: !(produtos.length >= 9 && variante === produtos.length - 1),
        criadoEm: data(-160 + numeroProduto / 20), actualizadoEm: data(-1),
      })
      precos.set(produto.id, centavos)
      const propria = `produtos/${slugFoto(nome)}.jpg`
      adicionar('imagemProduto', {
        id: id(dados.imagemProduto.length), produtoId: produto.id,
        // Em produção só existe o build do frontend, por isso não se verifica o ficheiro aqui.
        url: `/imagens/${propria}`,
        textoAlternativo: `Imagem ilustrativa de ${nome.toLowerCase()}`,
        ordem: 0, principal: true,
      })
    })
  })
  adicionar('categoria', { id: id(dados.categoria.length), nome: 'Arquivo de EPI descontinuado', activo: false })

  const nomes = ['Ana', 'Carlos', 'Celina', 'Dário', 'Ester', 'Fátima', 'Gabriel', 'Helena', 'Isabel', 'João', 'Lúcia', 'Mateus']
  const apelidos = ['Matos', 'Mabunda', 'Chissano', 'Nhantumbo', 'Mucavele', 'Chauque', 'Nhampossa', 'Sitoe', 'Macuácua', 'Bila']
  for (let indice = 0; indice < 124; indice++) {
    const admin = indice < 4
    const numero = admin ? indice + 1 : indice - 3
    const email = admin ? `admin${numero}@easyshop.test` : `cliente${String(numero).padStart(3, '0')}@easyshop.test`
    const sal = hash(`easyshop-seed-v1:${email}`).slice(0, 32)
    const chave = scryptSync(palavraPasse, Buffer.from(sal, 'hex'), 64, { N: 16384, r: 8, p: 1 }).toString('hex')
    adicionar('utilizador', {
      id: id(indice), nome: admin ? `Administrador Demo ${numero}` : `${escolher(nomes, numero)} ${escolher(apelidos, Math.floor(numero / 12))} ${numero}`,
      email, telefone: `+258840${String(numero + (admin ? 500 : 0)).padStart(6, '0')}`,
      hashPalavraPasse: `scrypt$16384$8$1$${sal}$${chave}`,
      perfil: admin ? 'ADMINISTRADOR' : 'CLIENTE', activo: admin || numero % 17 !== 0,
      privacidadeAceiteEm: data(-200), criadoEm: data(-200), actualizadoEm: data(-2),
    })
  }
  const admins = dados.utilizador.slice(0, 4)
  const clientes = dados.utilizador.slice(4)
  const locais = [
    ['Maputo', 'Maputo Cidade'], ['Matola', 'Maputo'], ['Xai-Xai', 'Gaza'], ['Inhambane', 'Inhambane'],
    ['Beira', 'Sofala'], ['Chimoio', 'Manica'], ['Tete', 'Tete'], ['Quelimane', 'Zambézia'],
    ['Nampula', 'Nampula'], ['Pemba', 'Cabo Delgado'],
  ]
  locais.forEach(([cidade, provincia], indice) => adicionar('zonaEntrega', {
    id: id(indice), nome: `${cidade} (${provincia})`, descricao: `Entregas em ${cidade} e arredores, província de ${provincia}.`, activo: true,
  }))
  ;['Entrega normal', 'Entrega expresso', 'Levantamento na loja', 'Entrega agendada'].forEach((nome, indice) => adicionar('modalidadeEntrega', {
    id: id(indice), nome, levantamentoLoja: indice === 2, activo: true,
  }))
  dados.zonaEntrega.forEach((zona, indiceZona) => dados.modalidadeEntrega.forEach((modalidade, indiceModalidade) => adicionar('tarifaFrete', {
    zonaEntregaId: zona.id, modalidadeEntregaId: modalidade.id,
    valor: dinheiro(indiceModalidade === 2 ? 0 : 15000 + indiceZona * 2500 + indiceModalidade * 10000),
    prazoDias: indiceModalidade === 2 ? 1 : 2 + indiceZona % 5,
    activo: !(indiceZona > 6 && indiceModalidade === 1),
  })))
  ;[
    ['NUMERARIO', 'Numerário (contra-entrega)', true],
    ['MPESA', 'M-Pesa', true],
    ['EMOLA', 'e-Mola', true],
    ['TRANSFERENCIA', 'Transferência Bancária', true],
    ['CARTAO', 'Cartão Visa / Mastercard', true],
    ['DESACTIVADO', 'Método desactivado (teste)', false],
  ].forEach(([codigo, nome, activo], indice) => adicionar('formaPagamento', {
    id: id(indice), codigo, nome, simulado: true, activo,
  }))
  clientes.forEach((cliente, indice) => {
    const [cidade, provincia] = escolher(locais, indice)
    for (let endereco = 0; endereco < 2; endereco++) adicionar('endereco', {
      id: id(dados.endereco.length), utilizadorId: cliente.id, etiqueta: endereco ? 'Trabalho' : 'Casa',
      nomeDestinatario: cliente.nome, telefone: cliente.telefone, linhaEndereco: `Rua de Teste ${indice + 1}, Nº ${10 + endereco}`,
      cidade, provincia, pontoReferencia: 'Edifício fictício de demonstração',
      zonaEntregaId: escolher(dados.zonaEntrega, indice).id, predefinido: endereco === 0,
    })
  })
  clientes.filter(cliente => cliente.activo).slice(0, 12).forEach((cliente, indice) => {
    // Sessões históricas (expiradas ou revogadas): nunca dão acesso, servem para testar a auditoria de sessões.
    if (indice < 6) adicionar('sessaoAutenticacao', {
      id: `seed-sessao-${indice + 1}`, utilizadorId: cliente.id, hashToken: hash(`easyshop-sessao-historica-${indice + 1}`),
      criadoEm: data(-30 + indice), expiraEm: data(-23 + indice), revogadoEm: indice % 2 ? data(-25 + indice) : null,
    })
    for (let caso = 0; caso < 3; caso++) adicionar('tokenRecuperacao', {
      id: id(dados.tokenRecuperacao.length), utilizadorId: cliente.id,
      hashToken: hash(`easyshop-demo-token-${indice + 1}-${caso + 1}`),
      criadoEm: data(caso === 0 ? 0 : -3), expiraEm: data(caso === 0 ? 1 : -1), usadoEm: caso === 2 ? data(-2) : null,
    })
  })

  adicionar('configuracaoLoja', {
    id: 1, nomeMarca: 'EasyShop Segurança', designacaoLegal: 'EasyShop — Loja de Segurança e Proteção',
    sobre: 'Loja especializada em equipamentos de segurança: EPI, videovigilância, controlo de acessos, alarmes, redes e proteção física.',
    morada: 'Av. Julius Nyerere, Nº 1500, Maputo', referenciaLocalizacao: 'Junto à rotunda da Av. Julius Nyerere com a Av. Mao Tsé-Tung',
    telefone: '+258840000000', email: 'loja@easyshop.test', horarioAtendimento: 'Segunda a sábado, 08:00–18:00',
    codigoMoeda: 'MZN', taxaIva: '16.00', nuit: '400000001', actualizadoEm: data(-1),
    regrasComerciais: {
      prazoDevolucaoDias: 7,
      prazosEntrega: { cidade: '1 a 2 dias úteis', nacional: '3 a 7 dias úteis' },
      atacado: [
        { de: 1, ate: 9, desconto: 0 },
        { de: 10, ate: 49, desconto: 0.07 },
        { de: 50, ate: 199, desconto: 0.13 },
        { de: 200, ate: null, desconto: 0.2 },
      ],
      guiasTamanho: {
        'botas-seguranca': {
          colunas: ['Número', 'Comprimento do pé'],
          linhas: [['38', '24,5 cm'], ['39', '25 cm'], ['40', '25,5 cm'], ['41', '26,5 cm'], ['42', '27 cm'], ['43', '27,5 cm'], ['44', '28,5 cm']],
          dica: 'Meça o pé de manhã, do calcanhar ao dedo maior. Se ficar entre dois números, escolha o maior.',
        },
        'luvas-anticorte': {
          colunas: ['Tamanho', 'Contorno da mão'],
          linhas: [['P', '16 a 18 cm'], ['M', '19 a 21 cm'], ['G', '22 a 24 cm']],
          dica: 'Meça à volta da palma da mão, sem o polegar.',
        },
        'colete-refletor': {
          colunas: ['Tamanho', 'Peito'],
          linhas: [['S', '88 a 96 cm'], ['M', '96 a 104 cm'], ['L', '104 a 112 cm'], ['XL', '112 a 120 cm'], ['XXL', '120 a 128 cm']],
          dica: 'Meça à volta do peito, por cima da roupa que vai usar.',
        },
      },
      vendedor: {
        nome: '[NOME DO VENDEDOR]',
        nuit: '[NUIT]',
        endereco: '[ENDEREÇO]',
        enderecoArmazem: '[ENDEREÇO DO ARMAZÉM]',
        telefone: '+258840000000',
        telefoneWhatsapp: '+258840000000',
        email: 'loja@easyshop.test',
        emailPrivacidade: 'loja@easyshop.test',
        prazoRespostaPrivacidade: '30',
        dataPublicacao: '15/10/2026',
        horario: 'Segunda a sexta, 08h00 às 17h00; sábado, 08h00 às 12h00',
      },
    },
  })
  ;POLITICAS.forEach(([tipo, titulo, conteudo], indice) => adicionar('politicaLoja', {
    id: id(indice), tipoPolitica: tipo, titulo, conteudo,
    versao: 1, actualizadoPor: admins[0].id, actualizadoEm: data(-180),
  }))
  const porNome = inicio => {
    const produto = dados.produto.find(linha => linha.nome.startsWith(inicio))
    if (!produto) throw new Error(`Produto de campanha inexistente: ${inicio}`)
    return produto
  }
  // [nome, descrição, tipo, valor, início (dias), fim (dias), activo, produtos]
  // Cada campanha tem os seus próprios produtos; as três últimas cobrem expirada, futura e desactivada.
  const campanhas = [
    ['Semana da Segurança de Redes', 'Firewalls, switches, routers e Wi-Fi empresarial com 15% de desconto.', 'PERCENTAGEM', '15.00', -1, 14, true,
      ['Firewall Cisco ASA 5506-X', 'Firewall Fortinet FortiGate 40F', 'Switch Cisco SG200-08P', 'Router MikroTik hAP ac2', 'Access Point Ubiquiti UniFi U6 Lite']],
    ['Kit Videovigilância Empresas', 'Câmeras e gravadores para proteger a sua empresa.', 'PERCENTAGEM', '12.00', -2, 21, true,
      ['Câmera bullet Dahua', 'Câmera dome TP-Link VIGI', 'NVR PoE 8 canais Hikvision', 'Disco WD Purple Pro']],
    ['Proteja o seu escritório', 'Controlo de acessos e alarmes com 10% de desconto.', 'PERCENTAGEM', '10.00', -3, 18, true,
      ['Terminal biométrico ZKTeco F22', 'Sensor PIR Visonic', 'Kit de alarme Ring Alarm']],
    ['Proteção eléctrica para a sua rede', 'Menos 500 MT em protectores de sobretensão e racks.', 'FIXO', '500.00', -4, 25, true,
      ['Filtro de linha Tripp Lite', 'Rack de parede 12U']],
    ['Campanha EPI em obra', 'Capacete, calçado, luvas e óculos para equipar a equipa da obra.', 'PERCENTAGEM', '10.00', -6, 30, true,
      ['Capacete Delta Plus Diamond V', 'Bota Portwest Steelite', 'Luva anti-vibração Honeywell', 'Óculos Delta Plus Blow2']],
    ['Incêndios: esteja preparado', 'Extintores e mantas corta-fogo para casa e empresa.', 'PERCENTAGEM', '8.00', -8, 7, true,
      ['Extintor CO2 5kg', 'Extintor ABC 9kg', 'Manta corta-fogo']],
    ['Proteção auditiva — campanha de inverno', 'Campanha terminada.', 'PERCENTAGEM', '10.00', -120, -30, true,
      ['Abafador 3M Peltor Optime III', 'Tampões auriculares 3M', 'Colete refletivo classe 2']],
    ['Cofres: proteja os seus valores', 'Campanha agendada.', 'PERCENTAGEM', '10.00', 10, 40, true,
      ['Cofre Sentry SFW123GDC', 'Cofre de hotel Yale']],
    ['Trabalho em altura', 'Campanha suspensa.', 'FIXO', '1500.00', -5, 20, false,
      ['Arnês Honeywell Miller', 'Talabarte Delta Plus']],
  ]
  campanhas.forEach(([nome, descricao, tipoDesconto, valorDesconto, inicio, fim, activo, produtos], indice) => {
    const promocao = adicionar('promocao', {
      id: id(indice), nome, descricao, tipoDesconto, valorDesconto,
      inicioEm: data(inicio), fimEm: data(fim), activo, categoriaId: null,
    })
    produtos.map(porNome)
      .filter(produto => tipoDesconto !== 'FIXO' || precos.get(produto.id) > Number(valorDesconto) * 100 * 4)
      .forEach(produto => adicionar('promocaoProduto', { promocaoId: promocao.id, produtoId: produto.id }))
  })
  const descontoPromocao = (promocao, preco) => promocao.tipoDesconto === 'PERCENTAGEM'
    ? Math.round(preco * Number(promocao.valorDesconto) / 100)
    : Math.min(Math.round(Number(promocao.valorDesconto) * 100), preco)

  const compraveis = dados.produto.filter(produto => produto.activo && produto.quantidadeStock > 5)
  for (let indice = 0; indice < 80; indice++) {
    const convidado = indice >= 60
    const carrinho = adicionar('carrinho', {
      id: id(indice), utilizadorId: convidado ? null : clientes[indice].id,
      tokenSessao: convidado ? `easyshop-seed-sessao-${indice + 1}` : null,
      criadoEm: data(-4), actualizadoEm: data(-1),
    })
    if (indice % 4 === 0) continue
    for (let item = 0; item < 1 + indice % 5; item++) {
      const produto = escolher(compraveis, indice * 7 + item * 13)
      adicionar('itemCarrinho', { id: id(dados.itemCarrinho.length), carrinhoId: carrinho.id, produtoId: produto.id, quantidade: 1 + item % 3 })
    }
  }

  const tarifasActivas = dados.tarifaFrete.filter(tarifa => tarifa.activo)
  const pagamentosPorEncomenda = new Map()
  for (let indice = 0; indice < 240; indice++) {
    const caso = indice % 8
    const estado = escolher(['REGISTADA', 'REGISTADA', 'EM_PROCESSAMENTO', 'EM_PROCESSAMENTO', 'CONCLUIDA', 'CONCLUIDA', 'CANCELADA', 'CONCLUIDA'], caso)
    const dias = -90 + Math.floor(indice / 3)
    const cliente = indice % 5 === 0 ? null : escolher(clientes, indice)
    const tarifa = escolher(tarifasActivas, indice)
    const zonaIndice = dados.zonaEntrega.findIndex(zona => zona.id === tarifa.zonaEntregaId)
    const [cidade, provincia] = locais[zonaIndice]
    const encomenda = adicionar('encomenda', {
      id: id(indice), codigoEncomenda: `SEED-ENC-${String(indice + 1).padStart(4, '0')}`,
      chaveIdempotencia: `easyshop-seed-checkout-${indice + 1}`, utilizadorId: cliente?.id ?? null, estado,
      nomeContacto: cliente?.nome || `Convidado Demo ${indice + 1}`, emailContacto: cliente?.email || `convidado${indice + 1}@easyshop.test`,
      telefoneContacto: cliente?.telefone || '+258840000001', entregaNomeDestinatario: cliente?.nome || `Convidado Demo ${indice + 1}`,
      entregaTelefone: cliente?.telefone || '+258840000001', entregaLinhaEndereco: `Rua de Testes, Nº ${indice + 1}`,
      entregaCidade: cidade, entregaProvincia: provincia, entregaPontoReferencia: 'Referência fictícia guardada no checkout',
      zonaEntregaId: tarifa.zonaEntregaId, modalidadeEntregaId: tarifa.modalidadeEntregaId,
      valorSubtotal: '0.00', totalDesconto: '0.00', valorFrete: tarifa.valor, valorTotal: '0.00',
      termosAceitesEm: data(dias), versaoTermos: 1, criadoEm: data(dias),
      actualizadoEm: data(dias + (estado === 'CONCLUIDA' ? 5 : estado === 'REGISTADA' ? 0 : 1)),
    })
    let subtotal = 0
    let descontos = 0
    for (let linha = 0; linha < 2 + indice % 4; linha++) {
      const produto = escolher(compraveis, indice * 7 + linha * 13)
      const preco = precos.get(produto.id)
      const promocao = indice % 3 === 0 ? null : dados.promocao.find(promo =>
        promo.activo && promo.inicioEm <= encomenda.criadoEm && promo.fimEm > encomenda.criadoEm &&
        (promo.categoriaId === produto.categoriaId || dados.promocaoProduto.some(assoc => assoc.promocaoId === promo.id && assoc.produtoId === produto.id)))
      const desconto = !promocao ? 0 : descontoPromocao(promocao, preco)
      const quantidade = 1 + (indice + linha) % 3
      const item = adicionar('itemEncomenda', {
        id: id(dados.itemEncomenda.length), encomendaId: encomenda.id, produtoId: produto.id,
        nomeProduto: produto.nome, codigoProduto: produto.codigo, quantidade,
        precoUnitario: dinheiro(preco), descontoUnitario: dinheiro(desconto),
        promocaoId: promocao?.id ?? null, nomePromocao: promocao?.nome ?? null, quantidadeDevolvida: 0,
      })
      metasItens.set(item.id, { preco, desconto })
      subtotal += preco * quantidade
      descontos += desconto * quantidade
      movimentos.push({ produtoId: produto.id, tipoMovimento: 'VENDA', variacaoQuantidade: -quantidade, itemEncomendaId: item.id, criadoEm: data(dias) })
      if (estado === 'CANCELADA') movimentos.push({ produtoId: produto.id, tipoMovimento: 'REPOSICAO_CANCELAMENTO', variacaoQuantidade: quantidade, itemEncomendaId: item.id, criadoEm: data(dias + 1) })
    }
    encomenda.valorSubtotal = dinheiro(subtotal)
    encomenda.totalDesconto = dinheiro(descontos)
    encomenda.valorTotal = dinheiro(subtotal - descontos + Math.round(Number(tarifa.valor) * 100))
    const estados = estado === 'REGISTADA' ? ['REGISTADA'] : estado === 'CANCELADA' ? ['REGISTADA', 'CANCELADA'] : estado === 'CONCLUIDA' ? ['REGISTADA', 'EM_PROCESSAMENTO', 'CONCLUIDA'] : ['REGISTADA', 'EM_PROCESSAMENTO']
    estados.forEach((novo, posicao) => adicionar('historicoEstadoEncomenda', {
      id: id(dados.historicoEstadoEncomenda.length), encomendaId: encomenda.id, estadoAnterior: estados[posicao - 1] || null,
      estadoNovo: novo, alteradoPor: posicao ? admins[0].id : null,
      observacao: novo === 'CANCELADA' ? 'Cancelamento simulado com reposição de stock.' : 'Transição de demonstração.',
      criadoEm: data(dias + (posicao === 2 ? 5 : posicao)),
    }))
    const confirmado = estado === 'CONCLUIDA' || estado === 'EM_PROCESSAMENTO'
    if (confirmado && indice % 5 === 0) adicionar('pagamento', {
      id: id(dados.pagamento.length), encomendaId: encomenda.id, formaPagamentoId: escolher(dados.formaPagamento.slice(0, 5), indice).id,
      referenciaOperacao: `SEED-PAG-FALHA-${indice + 1}`, valor: encomenda.valorTotal, valorReembolsado: '0.00',
      estado: 'FALHADO', simulado: true, motivoFalha: 'Falha simulada antes de nova tentativa.', confirmadoEm: null,
    })
    const pagamento = adicionar('pagamento', {
      id: id(dados.pagamento.length), encomendaId: encomenda.id, formaPagamentoId: escolher(dados.formaPagamento.slice(0, 5), indice).id,
      referenciaOperacao: `SEED-PAG-${indice + 1}`, valor: encomenda.valorTotal, valorReembolsado: '0.00',
      estado: confirmado ? 'CONFIRMADO' : caso === 1 || estado === 'CANCELADA' ? 'FALHADO' : 'PENDENTE',
      simulado: true, motivoFalha: confirmado || caso === 0 ? null : 'Operação não concluída no cenário de teste.',
      confirmadoEm: confirmado ? data(dias + 0.25) : null,
    })
    pagamentosPorEncomenda.set(encomenda.id, pagamento)
    adicionar('entrega', {
      id: id(indice), encomendaId: encomenda.id,
      estado: estado === 'CONCLUIDA' ? 'ENTREGUE' : estado === 'EM_PROCESSAMENTO' ? (caso === 3 ? 'NAO_ENTREGUE' : 'EM_TRANSPORTE') : 'POR_EXPEDIR',
      expedidoEm: confirmado ? data(dias + 2) : null, entregueEm: estado === 'CONCLUIDA' ? data(dias + 5) : null,
      recebidoPor: estado === 'CONCLUIDA' ? encomenda.entregaNomeDestinatario : null,
      observacao: caso === 3 ? 'Destinatário ausente; aguarda nova tentativa.' : 'Entrega simulada.',
    })
  }

  const concluidas = dados.encomenda.filter(encomenda => encomenda.estado === 'CONCLUIDA')
  concluidas.slice(0, 60).forEach((encomenda, indice) => {
    const estado = escolher(['SOLICITADA', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'PRODUTO_RECEBIDO', 'REEMBOLSADA'], indice)
    const dias = (encomenda.criadoEm - base) / DIA
    const recebida = estado === 'PRODUTO_RECEBIDO' || estado === 'REEMBOLSADA'
    const devolucao = adicionar('devolucao', {
      id: id(indice), codigoDevolucao: `SEED-DEV-${String(indice + 1).padStart(4, '0')}`, encomendaId: encomenda.id,
      tipoMotivo: escolher(['ARREPENDIMENTO', 'DIFERENTE_DA_DESCRICAO', 'DEFEITUOSO', 'OUTRO'], indice),
      descricaoMotivo: 'Motivo fictício para testar o processo de devolução.', estado,
      justificacaoDecisao: estado === 'REJEITADA' ? 'Pedido fora das condições fictícias deste cenário.' : null,
      decididoPor: ['SOLICITADA', 'EM_ANALISE'].includes(estado) ? null : admins[1].id,
      decididoEm: ['SOLICITADA', 'EM_ANALISE'].includes(estado) ? null : data(dias + 7), recebidoEm: recebida ? data(dias + 8) : null,
      criadoEm: data(dias + 6), actualizadoEm: data(dias + (estado === 'REEMBOLSADA' ? 9 : recebida ? 8 : 7)),
    })
    const itens = dados.itemEncomenda.filter(item => item.encomendaId === encomenda.id)
    const total = estado === 'REEMBOLSADA' && indice % 10 === 9
    let valor = 0
    for (const item of total ? itens : itens.slice(0, 1)) {
      const quantidade = total ? item.quantidade : Math.min(2, item.quantidade)
      const linha = adicionar('itemDevolucao', {
        id: id(dados.itemDevolucao.length), devolucaoId: devolucao.id, itemEncomendaId: item.id, quantidade,
        resultadoVerificacao: recebida ? (indice % 4 === 0 ? 'NAO_REVENDAVEL' : 'REVENDAVEL') : 'PENDENTE',
      })
      if (estado !== 'REJEITADA') item.quantidadeDevolvida += quantidade
      const meta = metasItens.get(item.id)
      valor += (meta.preco - meta.desconto) * quantidade
      if (linha.resultadoVerificacao === 'REVENDAVEL') movimentos.push({
        produtoId: item.produtoId, tipoMovimento: 'REPOSICAO_DEVOLUCAO', variacaoQuantidade: quantidade,
        itemDevolucaoId: linha.id, criadoEm: data(dias + 8),
      })
    }
    if (recebida) {
      const pagamento = pagamentosPorEncomenda.get(encomenda.id)
      const estadoReembolso = estado === 'REEMBOLSADA' ? 'CONCLUIDO' : indice % 2 ? 'FALHADO' : indice % 4 ? 'PENDENTE' : 'FALHADO'
      adicionar('reembolso', {
        id: id(dados.reembolso.length), devolucaoId: devolucao.id, pagamentoId: pagamento.id,
        referenciaOperacao: `SEED-REEMB-${indice + 1}`, valor: dinheiro(valor), estado: estadoReembolso,
        simulado: true, processadoPor: estadoReembolso === 'PENDENTE' ? null : admins[2].id,
        processadoEm: estadoReembolso === 'PENDENTE' ? null : data(dias + 9), criadoEm: data(dias + 8),
      })
      if (estadoReembolso === 'CONCLUIDO') {
        pagamento.valorReembolsado = dinheiro(valor)
        pagamento.estado = 'REEMBOLSADO'
      }
    }
  })

  concluidas.forEach((encomenda, indice) => {
    const itens = dados.itemEncomenda.filter(item => item.encomendaId === encomenda.id)
    const dias = (encomenda.criadoEm - base) / DIA
    itens.forEach((item, linha) => adicionar('avaliacaoProduto', {
      id: id(dados.avaliacaoProduto.length), itemEncomendaId: item.id, produtoId: item.produtoId,
      utilizadorId: encomenda.utilizadorId ?? null, classificacao: 1 + (indice + linha) % 5,
      comentario: escolher(['O equipamento parece adequado para uso profissional.', 'Boa relação entre qualidade e preço.', 'A entrega do equipamento poderia ser mais rápida.', 'O EPI corresponde à descrição.', 'A experiência com o artigo ficou abaixo do esperado.'], indice + linha),
      // A última de cada encomenda fica por moderar, para demonstrar a aprovação no painel.
      estado: linha === itens.length - 1 && indice % 4 === 0 ? 'PENDENTE' : 'APROVADA',
      moderadoEm: linha === itens.length - 1 && indice % 4 === 0 ? null : data(dias + 7),
      // Algumas avaliações aprovadas trazem a fotografia do produto, para o carrossel de fotografias.
      imagens: linha === 0 && indice < 6
        ? [`/imagens/produtos/${slugFoto(dados.produto.find(produto => produto.id === item.produtoId).nome)}.jpg`]
        : [],
      criadoEm: data(dias + 6), actualizadoEm: data(dias + 6),
    }))
    adicionar('avaliacaoEncomenda', {
      id: id(indice), encomendaId: encomenda.id, classificacaoExperiencia: 1 + indice % 5,
      recomenda: indice % 5 >= 2, comentario: 'Avaliação fictícia da compra de equipamentos de proteção.',
    })
  })

  // Fecha o livro de stock: saldo inicial + movimentos = quantidadeStock.
  dados.produto.forEach((produto, indice) => {
    const eventos = movimentos.filter(movimento => movimento.produtoId === produto.id)
    if (produto.quantidadeStock > 0 && indice % 7 === 0) eventos.push({
      produtoId: produto.id, tipoMovimento: 'AJUSTE', variacaoQuantidade: -2,
      motivo: 'Ajuste fictício após contagem de inventário.', criadoPor: admins[0].id, criadoEm: data(-110),
    })
    const inicial = produto.quantidadeStock - eventos.reduce((saldo, evento) => saldo + evento.variacaoQuantidade, 0)
    if (inicial > 0) eventos.push({
      produtoId: produto.id, tipoMovimento: 'ENTRADA', variacaoQuantidade: inicial,
      motivo: 'Entrada inicial de demonstração.', criadoPor: admins[0].id, criadoEm: data(-140),
    })
    eventos.sort((a, b) => a.criadoEm - b.criadoEm)
    let saldo = 0
    for (const evento of eventos) {
      saldo += evento.variacaoQuantidade
      if (saldo < 0) throw new Error(`Stock de demonstração negativo para ${produto.codigo}`)
      adicionar('movimentoStock', { id: BigInt(id(dados.movimentoStock.length)), ...evento, stockApos: saldo })
    }
    if (saldo !== produto.quantidadeStock) throw new Error('Livro de stock inconsistente.')
  })

  for (let indice = 0; indice < 48; indice++) {
    const encomenda = indice % 3 ? escolher(dados.encomenda, indice) : null
    const cliente = encomenda ? dados.utilizador.find(utilizador => utilizador.id === encomenda.utilizadorId) : indice % 4 ? escolher(clientes, indice) : null
    const estado = escolher(['ABERTO', 'EM_CURSO', 'RESOLVIDO', 'FECHADO'], indice)
    adicionar('pedidoAssistencia', {
      id: id(indice), tipoPedido: escolher(['DUVIDA', 'GARANTIA', 'RECLAMACAO'], indice),
      utilizadorId: cliente?.id ?? null, encomendaId: encomenda?.id ?? null,
      nomeContacto: encomenda?.nomeContacto || cliente?.nome || `Visitante Demo ${indice + 1}`, emailContacto: encomenda?.emailContacto || cliente?.email || `assistencia${indice + 1}@easyshop.test`,
      telefoneContacto: cliente?.telefone ?? null, assunto: `Dúvida sobre EPI — pedido ${indice + 1}`,
      mensagem: 'Mensagem fictícia sobre escolha, utilização ou troca de equipamento de proteção individual.', estado,
      resposta: estado === 'ABERTO' ? null : 'Resposta fictícia da equipa de assistência sobre equipamentos de proteção.',
      respondidoPor: estado === 'ABERTO' ? null : admins[3].id, respondidoEm: estado === 'ABERTO' ? null : data(-1),
    })
  }
  for (let indice = 0; indice < 300; indice++) {
    const produto = escolher(dados.produto, indice)
    adicionar('registoAuditoria', {
      id: BigInt(id(indice)), utilizadorAutorId: escolher(admins, indice).id,
      accao: escolher(['CRIAR_PRODUTO', 'ALTERAR_PRECO', 'AJUSTAR_STOCK', 'DESACTIVAR_PRODUTO', 'ACTUALIZAR_POLITICA'], indice),
      tipoEntidade: indice % 5 === 4 ? 'politica_loja' : 'produto',
      idEntidade: indice % 5 === 4 ? String(escolher(dados.politicaLoja, indice).id) : produto.id,
      detalhes: { demonstracao: true, observacao: 'Registo fictício para testar pesquisa e paginação de auditoria.' }, criadoEm: data(-100 + indice / 4),
    })
  }

  // Contas de empresa (B2B) de demonstração: duas aprovadas (uma revendedora) e uma pendente.
  // Usam a mesma palavra-passe do seed; os NUIT são fictícios.
  ;[
    ['Construtora Limpopo Demo, Lda', '400123456', 'EMPRESA', 'APROVADA', 'Av. Eduardo Mondlane, 1200', 'Alto Maé', 'Maputo', 'Maputo Cidade'],
    ['Segurança Total Revenda Demo, Lda', '400654321', 'REVENDEDOR', 'APROVADA', 'Rua do Bagamoyo, 45', 'Baixa', 'Beira', 'Sofala'],
    ['Minas do Norte Demo, SA', '400987654', 'EMPRESA', 'PENDENTE', 'Av. Paulo Samuel Kankhomba, 310', 'Central', 'Nampula', 'Nampula'],
  ].forEach(([nome, nuit, tipoCliente, estado, rua, bairro, cidade, provincia], indice) => {
    const email = `empresa${indice + 1}@easyshop.test`
    const sal = hash(`easyshop-seed-v1:${email}`).slice(0, 32)
    const chave = scryptSync(palavraPasse, Buffer.from(sal, 'hex'), 64, { N: 16384, r: 8, p: 1 }).toString('hex')
    const telefone = `+258860${String(indice + 1).padStart(6, '0')}`
    const conta = adicionar('utilizador', {
      // Faixa reservada (9001+): não colide com contas criadas pela aplicação na mesma base de dados.
      id: id(9001 + indice), nome, email, telefone,
      hashPalavraPasse: `scrypt$16384$8$1$${sal}$${chave}`,
      perfil: 'EMPRESA', activo: true,
      privacidadeAceiteEm: data(-40 + indice), criadoEm: data(-40 + indice), actualizadoEm: data(-2),
    })
    const aprovada = estado !== 'PENDENTE'
    adicionar('empresa', {
      id: id(indice), utilizadorId: conta.id, nome, nuit, rua, bairro, cidade, provincia, telefone, email, tipoCliente, estado,
      decididoPor: aprovada ? admins[0].id : null, decididoEm: aprovada ? data(-35 + indice) : null,
      criadoEm: data(-40 + indice), actualizadoEm: data(-2),
    })
  })

  // Descontos por grupo (preço sugerido nas cotações): geral por grupo e um por categoria.
  const categoriaLuvas = dados.categoria.find(categoria => categoria.nome === 'Luvas de proteção')
  ;[['EMPRESA', null, '5.00'], ['REVENDEDOR', null, '10.00'], ['REVENDEDOR', categoriaLuvas.id, '15.00']]
    .forEach(([grupo, categoriaId, percentagem], indice) => adicionar('descontoGrupo', {
      id: id(indice), grupo, categoriaId, percentagem, activo: true, criadoEm: data(-30), actualizadoEm: data(-30),
    }))

  // Uma cotação respondida (válida 15 dias) da empresa aprovada do tipo EMPRESA.
  const empresaDemo = dados.empresa[0]
  adicionar('cotacao', {
    id: id(0), codigo: 'COT-SEED00001', empresaId: empresaDemo.id, utilizadorId: empresaDemo.utilizadorId,
    estado: 'RESPONDIDA', notasCliente: 'Material para uma obra em Maputo (demonstração).',
    notasLoja: 'Preços para entrega em lote único.', validaAte: data(15),
    respondidaPor: admins[0].id, respondidaEm: data(-1), criadoEm: data(-3), actualizadoEm: data(-1),
  })
  ;[[dados.produto[25], 40], [dados.produto[2], 30]].forEach(([produto, quantidade], indice) => {
    const preco = precos.get(produto.id)
    adicionar('itemCotacao', {
      id: id(indice), cotacaoId: 0, produtoId: produto.id, quantidade,
      precoPedido: null, precoProposto: dinheiro(Math.round(preco * 0.85)),
    })
  })

  // Facturas de demonstração para as 3 primeiras encomendas com pagamento confirmado
  // (numeração por ano, sem saltos). Modelo de factura por validar por contabilista.
  const loja = dados.configuracaoLoja[0]
  const pagos = dados.pagamento
    .filter(pagamento => pagamento.estado === 'CONFIRMADO' && pagamento.confirmadoEm)
    .sort((a, b) => a.confirmadoEm - b.confirmadoEm || a.id - b.id)
    .slice(0, 3)
  const series = new Map()
  pagos.forEach((pagamento, indice) => {
    const encomenda = dados.encomenda.find(linha => linha.id === pagamento.encomendaId)
    const ano = anoEmMocambique(pagamento.confirmadoEm)
    const sequencia = (series.get(ano) || 0) + 1
    series.set(ano, sequencia)
    const totalCentavos = Math.round(Number(encomenda.valorTotal) * 100)
    const { baseCentavos, ivaCentavos } = ivaIncluido(totalCentavos, 16)
    adicionar('factura', {
      id: id(indice), numero: numeroFactura(ano, sequencia), ano, sequencia, encomendaId: encomenda.id,
      emitidaEm: pagamento.confirmadoEm,
      vendedorNome: loja.designacaoLegal, vendedorNuit: loja.nuit, vendedorMorada: loja.morada,
      clienteNome: encomenda.nomeContacto, clienteNuit: null,
      clienteMorada: [encomenda.entregaLinhaEndereco, encomenda.entregaCidade, encomenda.entregaProvincia].join(', '),
      subtotal: encomenda.valorSubtotal, totalDesconto: encomenda.totalDesconto, valorFrete: encomenda.valorFrete,
      baseTributavel: dinheiro(baseCentavos), taxaIva: '16.00', valorIva: dinheiro(ivaCentavos), total: encomenda.valorTotal,
      codigoMoeda: 'MZN',
    })
  })
  for (const [ano, ultimoNumero] of series) adicionar('serieFactura', { ano, ultimoNumero })
  return dados
}

export function resumirDados(dados) {
  return Object.fromEntries(Object.entries(dados).map(([modelo, linhas]) => [modelo, linhas.length]))
}
