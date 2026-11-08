import { randomBytes } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { formatarDinheiro, paraCentavos } from '../utils/dinheiro.js'
import { enviarEmail } from '../utils/email.js'
import { identificador, paginacao } from '../validators/conta.validator.js'
import { validarDadosContacto, validarOpcaoEntrega } from '../validators/checkout.validator.js'
import { ESTADOS_COTACAO, cotacaoAceitavel, normalizarLinhasSku, validarPedidoCotacao, validarRespostaCotacao } from '../validators/cotacao.validator.js'
import { percentagemGrupo, precoSugeridoCotacao } from './precos.js'
import { dadosFiscaisEncomenda } from './factura.service.js'

const camposCotacao = {
  id: true,
  codigo: true,
  estado: true,
  notasCliente: true,
  notasLoja: true,
  validaAte: true,
  respondidaEm: true,
  decididaEm: true,
  criadoEm: true,
  encomenda: { select: { id: true, codigoEncomenda: true, estado: true, valorTotal: true, emailContacto: true, factura: { select: { numero: true } } } },
  itens: {
    select: {
      id: true, quantidade: true, precoPedido: true, precoProposto: true,
      produto: { select: { id: true, nome: true, codigo: true, slug: true, preco: true, categoriaId: true } },
    },
    orderBy: { id: 'asc' },
  },
}

const camposAdmin = {
  ...camposCotacao,
  empresa: { select: { id: true, nome: true, nuit: true, tipoCliente: true, estado: true, email: true } },
  responsavel: { select: { nome: true } },
}

// Totais calculados no servidor a partir dos preços propostos.
function comTotais(cotacao) {
  const propostos = cotacao.itens.every(item => item.precoProposto !== null)
  const totalCentavos = cotacao.itens.reduce((soma, item) => soma + paraCentavos(item.precoProposto ?? 0) * item.quantidade, 0)
  return { ...cotacao, totalProposto: propostos ? formatarDinheiro(totalCentavos) : null }
}

// Propostas cuja validade passou ficam EXPIRADAS (verificado sempre que as cotações são lidas ou usadas).
async function expirarVencidas(client = prisma) {
  await client.cotacao.updateMany({
    where: { estado: 'RESPONDIDA', validaAte: { lt: new Date() } },
    data: { estado: 'EXPIRADA' },
  })
}

// A empresa da conta da sessão. Pedir e aceitar exige a empresa APROVADA.
async function empresaDaConta(utilizador, { exigirAprovada = false } = {}) {
  const empresa = await prisma.empresa.findUnique({ where: { utilizadorId: utilizador.id } })
  if (!empresa) throw { status: 403, message: 'Esta conta não tem empresa associada.' }
  if (exigirAprovada && empresa.estado !== 'APROVADA') {
    throw { status: 403, message: empresa.estado === 'PENDENTE'
      ? 'A empresa ainda aguarda aprovação da loja; só depois pode pedir cotações.'
      : 'A conta da empresa está suspensa. Contacte a loja.' }
  }
  return empresa
}

async function cotacaoDaEmpresa(empresa, id, select = camposCotacao) {
  const cotacao = await prisma.cotacao.findFirst({ where: { id: identificador(id, 'identificador da cotação'), empresaId: empresa.id }, select })
  if (!cotacao) throw { status: 404, message: 'Cotação não encontrada.' }
  return cotacao
}

// ==================== Empresa (cliente) ====================

export async function listarCotacoesDaEmpresa(utilizador, query = {}) {
  const empresa = await empresaDaConta(utilizador)
  await expirarVencidas()
  const pagina = paginacao(query, { limitePadrao: 20 })
  const where = { empresaId: empresa.id }
  const [cotacoes, total] = await Promise.all([
    prisma.cotacao.findMany({ where, select: camposCotacao, orderBy: { id: 'desc' }, skip: pagina.skip, take: pagina.take }),
    prisma.cotacao.count({ where }),
  ])
  return { cotacoes: cotacoes.map(comTotais), total, pagina: pagina.pagina, totalPaginas: Math.max(Math.ceil(total / pagina.take), 1) }
}

export async function obterCotacaoDaEmpresa(utilizador, id) {
  const empresa = await empresaDaConta(utilizador)
  await expirarVencidas()
  return { cotacao: comTotais(await cotacaoDaEmpresa(empresa, id)) }
}

export async function pedirCotacao(utilizador, dados) {
  const empresa = await empresaDaConta(utilizador, { exigirAprovada: true })
  const pedido = validarPedidoCotacao(dados)
  const produtos = await prisma.produto.findMany({
    where: { id: { in: pedido.itens.map(item => item.produtoId) }, activo: true },
    select: { id: true },
  })
  if (produtos.length !== pedido.itens.length) throw { status: 400, message: 'Um dos produtos não existe ou está inactivo.' }

  const cotacao = await prisma.cotacao.create({
    data: {
      codigo: `COT-${randomBytes(5).toString('hex').toUpperCase()}`,
      empresaId: empresa.id,
      utilizadorId: utilizador.id,
      notasCliente: pedido.notasCliente,
      itens: { create: pedido.itens },
    },
    select: camposCotacao,
  })
  return { message: 'Pedido de cotação enviado. A loja vai responder com os preços.', cotacao: comTotais(cotacao) }
}

// Encomenda rápida por SKU: valida cada linha (SKU existente e activo, quantidade, stock) e
// devolve o resultado linha a linha. Não grava nada: as linhas válidas preenchem o pedido de cotação.
export async function validarLinhasSku(utilizador, dados = {}) {
  await empresaDaConta(utilizador, { exigirAprovada: true })
  const linhas = normalizarLinhasSku(dados.linhas)
  const skus = linhas.filter(linha => !linha.erro).map(linha => linha.sku)
  const produtos = skus.length
    ? await prisma.produto.findMany({
        where: { OR: skus.map(sku => ({ codigo: { equals: sku, mode: 'insensitive' } })) },
        select: { id: true, codigo: true, nome: true, slug: true, preco: true, activo: true, quantidadeStock: true },
      })
    : []
  const resultado = linhas.map(linha => {
    if (linha.erro) return { ...linha, valida: false }
    const produto = produtos.find(item => item.codigo?.toUpperCase() === linha.sku.toUpperCase())
    if (!produto || !produto.activo) return { ...linha, valida: false, erro: 'SKU inexistente ou produto indisponível.' }
    if (produto.quantidadeStock < linha.quantidade) {
      return { ...linha, valida: false, erro: `Sem stock suficiente (disponível: ${produto.quantidadeStock}).` }
    }
    const { quantidadeStock: _stock, activo: _activo, ...publico } = produto
    return { ...linha, valida: true, erro: null, produto: publico }
  })
  return { linhas: resultado, validas: resultado.filter(linha => linha.valida).length, invalidas: resultado.filter(linha => !linha.valida).length }
}

export async function recusarCotacao(utilizador, id) {
  const empresa = await empresaDaConta(utilizador)
  await expirarVencidas()
  const cotacao = await cotacaoDaEmpresa(empresa, id)
  const motivo = cotacaoAceitavel(cotacao)
  if (motivo) throw { status: 409, message: `A cotação não pode ser recusada (estado: ${motivo}).` }
  const actualizada = await prisma.cotacao.updateMany({
    where: { id: cotacao.id, estado: 'RESPONDIDA' },
    data: { estado: 'RECUSADA', decididaEm: new Date() },
  })
  if (actualizada.count !== 1) throw { status: 409, message: 'A cotação foi alterada entretanto.' }
  return { message: 'Proposta recusada.' }
}

// Aceitar cria a encomenda com os preços propostos (a empresa nunca usa o carrinho).
// Numa transacção: marca a cotação ACEITE (uma única vez), valida a entrega, desconta o stock,
// cria a encomenda, os movimentos de stock e o histórico. A empresa paga a seguir (ver pagamento.routes.js).
export async function aceitarCotacao(utilizador, id, dados = {}) {
  const empresa = await empresaDaConta(utilizador, { exigirAprovada: true })
  await expirarVencidas()
  const cotacao = await cotacaoDaEmpresa(empresa, id)
  const motivo = cotacaoAceitavel(cotacao)
  if (motivo) throw { status: 409, message: `A proposta não pode ser aceite (estado: ${motivo}).` }

  if (dados.aceiteTermos !== true) throw { status: 400, message: 'É necessário aceitar os termos da loja.' }
  const { zonaId, modalidadeId } = validarOpcaoEntrega(dados.zonaEntregaId, dados.modalidadeEntregaId)
  const contacto = {
    nomeContacto: empresa.nome,
    emailContacto: empresa.email,
    telefoneContacto: empresa.telefone,
    entregaNomeDestinatario: typeof dados.entregaNomeDestinatario === 'string' && dados.entregaNomeDestinatario.trim() ? dados.entregaNomeDestinatario : empresa.nome,
    entregaTelefone: typeof dados.entregaTelefone === 'string' && dados.entregaTelefone.trim() ? dados.entregaTelefone : empresa.telefone,
    entregaLinhaEndereco: dados.entregaLinhaEndereco,
    entregaCidade: dados.entregaCidade,
    entregaProvincia: dados.entregaProvincia,
    entregaPontoReferencia: dados.entregaPontoReferencia,
  }
  try {
    validarDadosContacto(contacto)
  } catch (error) {
    throw { status: error.status ?? 400, message: error.message }
  }

  return prisma.$transaction(async tx => {
    const marcada = await tx.cotacao.updateMany({
      where: { id: cotacao.id, estado: 'RESPONDIDA', validaAte: { gte: new Date() } },
      data: { estado: 'ACEITE', decididaEm: new Date() },
    })
    if (marcada.count !== 1) throw { status: 409, message: 'A proposta já foi decidida ou expirou.' }

    const [tarifa, configuracao, politicaTermos] = await Promise.all([
      tx.tarifaFrete.findUnique({
        where: { zonaEntregaId_modalidadeEntregaId: { zonaEntregaId: zonaId, modalidadeEntregaId: modalidadeId } },
        include: { zonaEntrega: true, modalidadeEntrega: true },
      }),
      tx.configuracaoLoja.findUnique({ where: { id: 1 }, select: { codigoMoeda: true } }),
      tx.politicaLoja.findUnique({ where: { tipoPolitica: 'TERMOS' }, select: { versao: true } }),
    ])
    if (!tarifa?.activo || !tarifa.zonaEntrega.activo || !tarifa.modalidadeEntrega.activo) {
      throw { status: 422, message: 'Não existe uma tarifa activa para esta zona e modalidade.' }
    }

    let subtotalCentavos = 0
    for (const item of cotacao.itens) {
      const produto = await tx.produto.findUnique({ where: { id: item.produto.id }, select: { activo: true, codigoMoeda: true } })
      if (!produto?.activo) throw { status: 409, message: `O produto ${item.produto.nome} já não está disponível.` }
      if (produto.codigoMoeda !== configuracao?.codigoMoeda) throw { status: 409, message: 'A moeda do produto não corresponde à da loja.' }
      const descontado = await tx.produto.updateMany({
        where: { id: item.produto.id, activo: true, quantidadeStock: { gte: item.quantidade } },
        data: { quantidadeStock: { decrement: item.quantidade } },
      })
      if (descontado.count !== 1) throw { status: 409, message: `Stock insuficiente para o produto ${item.produto.nome}.` }
      subtotalCentavos += paraCentavos(item.precoProposto) * item.quantidade
    }
    const freteCentavos = paraCentavos(tarifa.valor)
    const limpo = valor => (typeof valor === 'string' && valor.trim() ? valor.trim() : null)

    // IVA incluído e dados fiscais da empresa (NUIT e morada de facturação).
    const fiscal = await dadosFiscaisEncomenda(tx, subtotalCentavos + freteCentavos, {
      nome: empresa.nome,
      nuit: empresa.nuit,
      morada: [empresa.rua, empresa.bairro, empresa.cidade, empresa.provincia].join(', '),
    })

    const encomenda = await tx.encomenda.create({
      data: {
        ...fiscal,
        codigoEncomenda: `ENC-${randomBytes(8).toString('hex').toUpperCase()}`,
        // Uma cotação só gera uma encomenda.
        chaveIdempotencia: `cotacao-${cotacao.codigo}`,
        utilizadorId: utilizador.id,
        estado: 'REGISTADA',
        nomeContacto: contacto.nomeContacto,
        emailContacto: contacto.emailContacto.toLowerCase(),
        telefoneContacto: contacto.telefoneContacto,
        entregaNomeDestinatario: contacto.entregaNomeDestinatario.trim(),
        entregaTelefone: contacto.entregaTelefone.trim(),
        entregaLinhaEndereco: contacto.entregaLinhaEndereco.trim(),
        entregaCidade: contacto.entregaCidade.trim(),
        entregaProvincia: contacto.entregaProvincia.trim(),
        entregaPontoReferencia: limpo(contacto.entregaPontoReferencia),
        zonaEntregaId: zonaId,
        modalidadeEntregaId: modalidadeId,
        valorSubtotal: formatarDinheiro(subtotalCentavos),
        totalDesconto: '0.00',
        valorFrete: formatarDinheiro(freteCentavos),
        valorTotal: formatarDinheiro(subtotalCentavos + freteCentavos),
        termosAceitesEm: new Date(),
        versaoTermos: politicaTermos?.versao ?? null,
        itens: {
          create: cotacao.itens.map(item => ({
            produtoId: item.produto.id,
            nomeProduto: item.produto.nome,
            codigoProduto: item.produto.codigo ?? item.produto.id,
            quantidade: item.quantidade,
            // O preço negociado substitui o preço de catálogo e os descontos.
            precoUnitario: item.precoProposto,
            descontoUnitario: '0.00',
            nomePromocao: `Cotação ${cotacao.codigo}`,
          })),
        },
        historicoEstados: { create: { estadoNovo: 'REGISTADA', observacao: `Encomenda criada pela aceitação da cotação ${cotacao.codigo}.` } },
        entrega: { create: { estado: 'POR_EXPEDIR' } },
      },
      include: { itens: true },
    })

    for (const linha of encomenda.itens) {
      const produto = await tx.produto.findUniqueOrThrow({ where: { id: linha.produtoId }, select: { quantidadeStock: true } })
      await tx.movimentoStock.create({
        data: {
          produtoId: linha.produtoId,
          tipoMovimento: 'VENDA',
          variacaoQuantidade: -linha.quantidade,
          stockApos: produto.quantidadeStock,
          itemEncomendaId: linha.id,
        },
      })
    }
    await tx.cotacao.update({ where: { id: cotacao.id }, data: { encomendaId: encomenda.id } })

    return {
      message: 'Proposta aceite. A encomenda foi criada — pode pagar agora.',
      encomenda: {
        id: encomenda.id,
        codigoEncomenda: encomenda.codigoEncomenda,
        valorSubtotal: encomenda.valorSubtotal,
        valorFrete: encomenda.valorFrete,
        valorTotal: encomenda.valorTotal,
        estado: encomenda.estado,
        nomeContacto: encomenda.nomeContacto,
        emailContacto: encomenda.emailContacto,
        telefoneContacto: encomenda.telefoneContacto,
      },
    }
  }, { timeout: 20000 })
}

// ==================== Administração da loja ====================

export async function listarCotacoesAdmin(query = {}) {
  const { estado } = query
  if (estado !== undefined && !ESTADOS_COTACAO.includes(estado)) throw { status: 400, message: 'O estado é inválido.' }
  await expirarVencidas()
  const pagina = paginacao(query, { limitePadrao: 20 })
  const where = estado ? { estado } : {}
  const [cotacoes, total] = await Promise.all([
    prisma.cotacao.findMany({ where, select: camposAdmin, orderBy: { id: 'desc' }, skip: pagina.skip, take: pagina.take }),
    prisma.cotacao.count({ where }),
  ])
  return { cotacoes: cotacoes.map(comTotais), total, pagina: pagina.pagina, totalPaginas: Math.max(Math.ceil(total / pagina.take), 1) }
}

// Maior desconto de promoção activa (centavos) de um produto, com a mesma regra do checkout.
function descontoPromocao(produto, promocoes) {
  const preco = paraCentavos(produto.preco)
  let maior = 0
  for (const promocao of promocoes) {
    const aplica = (promocao.categoriaId !== null && promocao.categoriaId === produto.categoriaId) ||
      promocao.produtos.some(item => item.produtoId === produto.id)
    if (!aplica) continue
    const valor = paraCentavos(promocao.valorDesconto)
    const desconto = promocao.tipoDesconto === 'PERCENTAGEM' ? Math.round(preco * valor / 10000) : valor
    maior = Math.max(maior, Math.min(preco, Math.max(0, desconto)))
  }
  return maior
}

// Detalhe para o administrador, com o preço sugerido de cada item (services/precos.js).
export async function obterCotacaoAdmin(id) {
  await expirarVencidas()
  const cotacao = await prisma.cotacao.findUnique({ where: { id: identificador(id, 'identificador da cotação') }, select: camposAdmin })
  if (!cotacao) throw { status: 404, message: 'Cotação não encontrada.' }

  const agora = new Date()
  const [descontos, configuracao, promocoes] = await Promise.all([
    prisma.descontoGrupo.findMany({ where: { grupo: cotacao.empresa.tipoCliente, activo: true } }),
    prisma.configuracaoLoja.findUnique({ where: { id: 1 }, select: { regrasComerciais: true } }),
    prisma.promocao.findMany({
      where: {
        activo: true, inicioEm: { lte: agora }, fimEm: { gt: agora },
        OR: [
          { categoriaId: { in: cotacao.itens.map(item => item.produto.categoriaId).filter(valor => valor !== null) } },
          { produtos: { some: { produtoId: { in: cotacao.itens.map(item => item.produto.id) } } } },
        ],
      },
      include: { produtos: { select: { produtoId: true } } },
    }),
  ])
  const escaloes = configuracao?.regrasComerciais?.atacado
  const itens = cotacao.itens.map(item => {
    const percentagem = percentagemGrupo(descontos, cotacao.empresa.tipoCliente, item.produto.categoriaId)
    const sugestao = precoSugeridoCotacao({
      precoCentavos: paraCentavos(item.produto.preco),
      descontoPromocaoCentavos: descontoPromocao(item.produto, promocoes),
      percentagemGrupo: percentagem,
      quantidade: item.quantidade,
      escaloes,
    })
    return {
      ...item,
      sugestao: {
        percentagemGrupo: percentagem,
        descontoPromocao: formatarDinheiro(sugestao.descontoPromocaoCentavos),
        descontoGrupo: formatarDinheiro(sugestao.descontoGrupoCentavos),
        origemDesconto: sugestao.origemDesconto,
        escalao: sugestao.escalao,
        precoSugerido: formatarDinheiro(sugestao.sugeridoCentavos),
      },
    }
  })
  return { cotacao: comTotais({ ...cotacao, itens }) }
}

export async function responderCotacao(id, dados, admin) {
  const cotacaoId = identificador(id, 'identificador da cotação')
  const cotacao = await prisma.cotacao.findUnique({
    where: { id: cotacaoId },
    select: { id: true, codigo: true, estado: true, itens: { select: { id: true } }, empresa: { select: { nome: true, email: true } } },
  })
  if (!cotacao) throw { status: 404, message: 'Cotação não encontrada.' }
  if (cotacao.estado !== 'PEDIDA') throw { status: 409, message: 'Só é possível responder a cotações pedidas.' }
  const resposta = validarRespostaCotacao(dados, cotacao.itens)

  await prisma.$transaction(async tx => {
    const marcada = await tx.cotacao.updateMany({
      where: { id: cotacaoId, estado: 'PEDIDA' },
      data: { estado: 'RESPONDIDA', validaAte: resposta.validaAte, notasLoja: resposta.notasLoja, respondidaPor: admin.id, respondidaEm: new Date() },
    })
    if (marcada.count !== 1) throw { status: 409, message: 'A cotação foi respondida entretanto.' }
    for (const item of resposta.itens) {
      await tx.itemCotacao.update({ where: { id: item.id }, data: { precoProposto: item.precoProposto } })
    }
    await tx.registoAuditoria.create({
      data: { utilizadorAutorId: admin.id, accao: 'RESPOSTA_COTACAO', tipoEntidade: 'cotacao', idEntidade: String(cotacaoId), detalhes: { validaAte: resposta.validaAte } },
    })
  })

  const emailEnviado = await enviarEmail({
    para: cotacao.empresa.email,
    assunto: `Proposta para a cotação ${cotacao.codigo} - EasyShop`,
    texto: `Olá,\n\nA loja respondeu à cotação ${cotacao.codigo} da empresa ${cotacao.empresa.nome}.\nA proposta é válida até ${resposta.validaAte.toLocaleDateString('pt-PT')}.\n\nInicie sessão para ver os preços e aceitar ou recusar a proposta.`,
  })
  return { message: 'Proposta enviada à empresa.', emailEnviado, ...(await obterCotacaoAdmin(cotacaoId)) }
}

// ==================== Descontos por grupo ====================

const GRUPOS = ['EMPRESA', 'REVENDEDOR']

function validarDescontoGrupo(dados = {}) {
  if (!GRUPOS.includes(dados.grupo)) throw { status: 400, message: 'O grupo deve ser EMPRESA ou REVENDEDOR.' }
  const percentagem = Number(dados.percentagem)
  if (!Number.isFinite(percentagem) || percentagem <= 0 || percentagem >= 100) {
    throw { status: 400, message: 'A percentagem deve estar entre 0 e 100.' }
  }
  const categoriaId = dados.categoriaId === undefined || dados.categoriaId === null || dados.categoriaId === ''
    ? null
    : identificador(dados.categoriaId, 'identificador da categoria')
  if (dados.activo !== undefined && typeof dados.activo !== 'boolean') throw { status: 400, message: 'O campo activo é inválido.' }
  return { grupo: dados.grupo, percentagem: Math.round(percentagem * 100) / 100, categoriaId, activo: dados.activo ?? true }
}

const camposDesconto = { id: true, grupo: true, percentagem: true, activo: true, categoria: { select: { id: true, nome: true } } }

export async function listarDescontosGrupo() {
  const descontos = await prisma.descontoGrupo.findMany({ select: camposDesconto, orderBy: [{ grupo: 'asc' }, { categoriaId: 'asc' }] })
  return { descontos }
}

async function gravarDesconto(operacao) {
  try {
    return await operacao()
  } catch (error) {
    if (error?.code === 'P2002') throw { status: 409, message: 'Já existe um desconto para este grupo e categoria.' }
    if (error?.code === 'P2003') throw { status: 400, message: 'A categoria não existe.' }
    throw error
  }
}

export async function criarDescontoGrupo(dados) {
  const desconto = validarDescontoGrupo(dados)
  return { message: 'Desconto criado.', desconto: await gravarDesconto(() => prisma.descontoGrupo.create({ data: desconto, select: camposDesconto })) }
}

export async function actualizarDescontoGrupo(id, dados) {
  const descontoId = identificador(id, 'identificador do desconto')
  const desconto = validarDescontoGrupo(dados)
  const existe = await prisma.descontoGrupo.findUnique({ where: { id: descontoId }, select: { id: true } })
  if (!existe) throw { status: 404, message: 'Desconto não encontrado.' }
  return { message: 'Desconto actualizado.', desconto: await gravarDesconto(() => prisma.descontoGrupo.update({ where: { id: descontoId }, data: desconto, select: camposDesconto })) }
}

export async function apagarDescontoGrupo(id) {
  const descontoId = identificador(id, 'identificador do desconto')
  const apagado = await prisma.descontoGrupo.deleteMany({ where: { id: descontoId } })
  if (apagado.count !== 1) throw { status: 404, message: 'Desconto não encontrado.' }
  return { message: 'Desconto apagado.' }
}
