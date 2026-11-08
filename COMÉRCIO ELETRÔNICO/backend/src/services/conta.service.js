import { prisma } from '../lib/prisma.js'
import {
  identificador,
  paginacao,
  validarAvaliacao,
  validarEndereco,
  validarPedidoAssistencia,
  validarPerfil,
  TIPOS_PEDIDO,
} from '../validators/conta.validator.js'

// Encomendas do cliente: as feitas com a conta e as de convidado com o mesmo email de contacto
// (a mesma regra de acesso de GET /encomendas/:codigo?email=).
export function encomendasDoCliente(utilizador) {
  return {
    OR: [
      { utilizadorId: utilizador.id },
      { utilizadorId: null, emailContacto: { equals: utilizador.email, mode: 'insensitive' } },
    ],
  }
}

const naoEncontrado = message => ({ status: 404, message })

function paginado(chave, lista, total, { pagina, take }) {
  return { [chave]: lista, total, pagina, totalPaginas: Math.max(Math.ceil(total / take), 1) }
}

// ==================== Perfil ====================

const camposPerfil = { id: true, nome: true, email: true, telefone: true, perfil: true, criadoEm: true }

export async function obterPerfil(utilizador) {
  return { utilizador: await prisma.utilizador.findUnique({ where: { id: utilizador.id }, select: camposPerfil }) }
}

export async function actualizarPerfil(utilizador, dados) {
  const perfil = validarPerfil(dados)
  const actualizado = await prisma.utilizador.update({ where: { id: utilizador.id }, data: perfil, select: camposPerfil })
  return { message: 'Perfil actualizado.', utilizador: actualizado }
}

// ==================== Endereços ====================

const incluirZona = { zonaEntrega: { select: { id: true, nome: true, activo: true } } }

async function enderecoDoCliente(utilizador, id) {
  const endereco = await prisma.endereco.findFirst({
    where: { id: identificador(id, 'endereço'), utilizadorId: utilizador.id },
    include: incluirZona,
  })
  if (!endereco) throw naoEncontrado('Endereço não encontrado.')
  return endereco
}

async function validarZona(zonaEntregaId) {
  const zona = await prisma.zonaEntrega.findUnique({ where: { id: zonaEntregaId }, select: { activo: true } })
  if (!zona?.activo) throw { status: 400, message: 'A zona de entrega não existe ou está inactiva.' }
}

export async function listarEnderecos(utilizador) {
  const enderecos = await prisma.endereco.findMany({
    where: { utilizadorId: utilizador.id },
    include: incluirZona,
    orderBy: [{ predefinido: 'desc' }, { id: 'asc' }],
  })
  return { enderecos }
}

export async function obterEndereco(utilizador, id) {
  return { endereco: await enderecoDoCliente(utilizador, id) }
}

// Só pode haver um endereço predefinido por cliente (índice endereco_predefinido_unico).
export async function criarEndereco(utilizador, dados) {
  const endereco = validarEndereco(dados)
  await validarZona(endereco.zonaEntregaId)
  const criado = await prisma.$transaction(async tx => {
    const total = await tx.endereco.count({ where: { utilizadorId: utilizador.id } })
    const predefinido = endereco.predefinido || total === 0
    if (predefinido) await tx.endereco.updateMany({ where: { utilizadorId: utilizador.id }, data: { predefinido: false } })
    return tx.endereco.create({ data: { ...endereco, predefinido, utilizadorId: utilizador.id }, include: incluirZona })
  })
  return { message: 'Endereço guardado.', endereco: criado }
}

export async function actualizarEndereco(utilizador, id, dados) {
  const actual = await enderecoDoCliente(utilizador, id)
  const endereco = validarEndereco(dados)
  await validarZona(endereco.zonaEntregaId)
  const actualizado = await prisma.$transaction(async tx => {
    if (endereco.predefinido) {
      await tx.endereco.updateMany({ where: { utilizadorId: utilizador.id, NOT: { id: actual.id } }, data: { predefinido: false } })
    }
    // Retirar a marca ao único predefinido deixaria o cliente sem predefinido: mantém-se.
    const predefinido = endereco.predefinido || actual.predefinido
    return tx.endereco.update({ where: { id: actual.id }, data: { ...endereco, predefinido }, include: incluirZona })
  })
  return { message: 'Endereço actualizado.', endereco: actualizado }
}

export async function apagarEndereco(utilizador, id) {
  const actual = await enderecoDoCliente(utilizador, id)
  await prisma.$transaction(async tx => {
    await tx.endereco.delete({ where: { id: actual.id } })
    // Se era o predefinido, o endereço mais antigo passa a sê-lo.
    if (actual.predefinido) {
      const seguinte = await tx.endereco.findFirst({ where: { utilizadorId: utilizador.id }, orderBy: { id: 'asc' } })
      if (seguinte) await tx.endereco.update({ where: { id: seguinte.id }, data: { predefinido: true } })
    }
  })
  return { message: 'Endereço apagado.' }
}

// ==================== Encomendas ====================

export async function listarEncomendas(utilizador, query) {
  const pagina = paginacao(query)
  const where = encomendasDoCliente(utilizador)
  const [encomendas, total] = await Promise.all([
    prisma.encomenda.findMany({
      where,
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
      skip: pagina.skip,
      take: pagina.take,
      select: {
        codigoEncomenda: true,
        estado: true,
        valorTotal: true,
        criadoEm: true,
        entrega: { select: { estado: true } },
        _count: { select: { itens: true } },
      },
    }),
    prisma.encomenda.count({ where }),
  ])
  const lista = encomendas.map(({ _count, ...encomenda }) => ({ ...encomenda, totalItens: _count.itens }))
  return paginado('encomendas', lista, total, pagina)
}

async function encomendaDoCliente(utilizador, codigo, include) {
  if (typeof codigo !== 'string' || !codigo.trim()) throw { status: 400, message: 'Código da encomenda é obrigatório.' }
  const encomenda = await prisma.encomenda.findFirst({
    where: { AND: [{ codigoEncomenda: codigo.trim() }, encomendasDoCliente(utilizador)] },
    include,
  })
  if (!encomenda) throw naoEncontrado('Encomenda não encontrada.')
  return encomenda
}

// ==================== Pagamentos e reembolsos ====================

const camposPagamento = {
  id: true,
  referenciaOperacao: true,
  valor: true,
  valorReembolsado: true,
  estado: true,
  simulado: true,
  motivoFalha: true,
  confirmadoEm: true,
  formaPagamento: { select: { nome: true } },
  encomenda: { select: { codigoEncomenda: true } },
}

export async function listarPagamentos(utilizador, query) {
  const pagina = paginacao(query)
  const where = { encomenda: encomendasDoCliente(utilizador) }
  const [pagamentos, total] = await Promise.all([
    prisma.pagamento.findMany({ where, select: camposPagamento, orderBy: { id: 'desc' }, skip: pagina.skip, take: pagina.take }),
    prisma.pagamento.count({ where }),
  ])
  return paginado('pagamentos', pagamentos, total, pagina)
}

export async function obterPagamento(utilizador, id) {
  const pagamento = await prisma.pagamento.findFirst({
    where: { id: identificador(id, 'pagamento'), encomenda: encomendasDoCliente(utilizador) },
    select: {
      ...camposPagamento,
      reembolsos: { select: { id: true, referenciaOperacao: true, valor: true, estado: true, simulado: true, processadoEm: true } },
    },
  })
  if (!pagamento) throw naoEncontrado('Pagamento não encontrado.')
  return { pagamento }
}

const camposReembolso = {
  id: true,
  referenciaOperacao: true,
  valor: true,
  estado: true,
  simulado: true,
  processadoEm: true,
  criadoEm: true,
  devolucao: { select: { id: true, codigoDevolucao: true } },
  pagamento: { select: { id: true, referenciaOperacao: true, encomenda: { select: { codigoEncomenda: true } } } },
}

export async function listarReembolsos(utilizador) {
  const reembolsos = await prisma.reembolso.findMany({
    where: { pagamento: { encomenda: encomendasDoCliente(utilizador) } },
    select: camposReembolso,
    orderBy: { id: 'desc' },
  })
  return { reembolsos }
}

export async function obterReembolso(utilizador, id) {
  const reembolso = await prisma.reembolso.findFirst({
    where: { id: identificador(id, 'reembolso'), pagamento: { encomenda: encomendasDoCliente(utilizador) } },
    select: camposReembolso,
  })
  if (!reembolso) throw naoEncontrado('Reembolso não encontrado.')
  return { reembolso }
}

// ==================== Devoluções ====================

const camposDevolucao = {
  id: true,
  codigoDevolucao: true,
  tipoMotivo: true,
  descricaoMotivo: true,
  estado: true,
  justificacaoDecisao: true,
  decididoEm: true,
  recebidoEm: true,
  criadoEm: true,
  encomenda: { select: { codigoEncomenda: true } },
  itens: { select: { id: true, quantidade: true, itemEncomenda: { select: { nomeProduto: true } } } },
  reembolso: { select: { id: true, valor: true, estado: true, simulado: true, processadoEm: true } },
}

export async function listarDevolucoes(utilizador) {
  const devolucoes = await prisma.devolucao.findMany({
    where: { encomenda: encomendasDoCliente(utilizador) },
    select: camposDevolucao,
    orderBy: { criadoEm: 'desc' },
  })
  return { devolucoes }
}

export async function obterDevolucao(utilizador, id) {
  const devolucao = await prisma.devolucao.findFirst({
    where: { id: identificador(id, 'pedido de devolução'), encomenda: encomendasDoCliente(utilizador) },
    select: camposDevolucao,
  })
  if (!devolucao) throw naoEncontrado('Pedido de devolução não encontrado.')
  return { devolucao }
}

// ==================== Avaliações ====================

export async function listarAvaliacoes(utilizador) {
  const [produtos, encomendas] = await Promise.all([
    prisma.avaliacaoProduto.findMany({
      where: { OR: [{ utilizadorId: utilizador.id }, { itemEncomenda: { encomenda: encomendasDoCliente(utilizador) } }] },
      select: {
        id: true, classificacao: true, comentario: true, criadoEm: true, estado: true, motivoRejeicao: true,
        produto: { select: { nome: true, slug: true } },
        itemEncomenda: {
          select: { nomeProduto: true, produto: { select: { slug: true } }, encomenda: { select: { codigoEncomenda: true } } },
        },
      },
      orderBy: { criadoEm: 'desc' },
    }).then(lista => lista.map(({ produto, itemEncomenda, ...avaliacao }) => ({
      ...avaliacao,
      itemEncomenda: itemEncomenda ?? { nomeProduto: produto.nome, produto: { slug: produto.slug }, encomenda: null },
    }))),
    prisma.avaliacaoEncomenda.findMany({
      where: { encomenda: encomendasDoCliente(utilizador) },
      select: { id: true, classificacaoExperiencia: true, recomenda: true, comentario: true, encomenda: { select: { codigoEncomenda: true } } },
      orderBy: { id: 'desc' },
    }),
  ])
  return { produtos, encomendas }
}

// Estado da avaliação de uma encomenda: produtos comprados e avaliações já feitas.
export async function obterAvaliacaoEncomenda(utilizador, codigo) {
  const encomenda = await encomendaDoCliente(utilizador, codigo, {
    itens: { select: { id: true, nomeProduto: true, quantidade: true, avaliacao: { select: { classificacao: true, comentario: true } } } },
    avaliacao: { select: { classificacaoExperiencia: true, recomenda: true, comentario: true } },
  })
  return {
    encomenda: {
      codigoEncomenda: encomenda.codigoEncomenda,
      estado: encomenda.estado,
      podeAvaliar: encomenda.estado === 'CONCLUIDA',
      avaliacao: encomenda.avaliacao,
      itens: encomenda.itens,
    },
  }
}

// Só encomendas concluídas; cada produto e a experiência só podem ser avaliados uma vez.
export async function avaliarEncomenda(utilizador, codigo, dados) {
  const { avaliacaoEncomenda, avaliacoesProdutos } = validarAvaliacao(dados)
  const encomenda = await encomendaDoCliente(utilizador, codigo, {
    itens: { select: { id: true, produtoId: true, avaliacao: { select: { id: true } } } },
    avaliacao: { select: { id: true } },
  })
  const jaAvaliados = new Set((await prisma.avaliacaoProduto.findMany({
    where: { utilizadorId: utilizador.id, produtoId: { in: encomenda.itens.map(item => item.produtoId) } },
    select: { produtoId: true },
  })).map(avaliacao => avaliacao.produtoId))
  if (encomenda.estado !== 'CONCLUIDA') {
    throw { status: 400, message: 'Só é possível avaliar encomendas concluídas.' }
  }
  if (avaliacaoEncomenda && encomenda.avaliacao) throw { status: 409, message: 'A experiência desta encomenda já foi avaliada.' }
  for (const produto of avaliacoesProdutos) {
    const item = encomenda.itens.find(linha => linha.id === produto.itemEncomendaId)
    if (!item) throw { status: 400, message: 'Um dos produtos avaliados não pertence a esta encomenda.' }
    if (item.avaliacao || jaAvaliados.has(item.produtoId)) throw { status: 409, message: 'Um dos produtos já foi avaliado.' }
    produto.produtoId = item.produtoId
    produto.utilizadorId = utilizador.id
  }

  try {
    await prisma.$transaction(async tx => {
      if (avaliacaoEncomenda) await tx.avaliacaoEncomenda.create({ data: { ...avaliacaoEncomenda, encomendaId: encomenda.id } })
      if (avaliacoesProdutos.length) await tx.avaliacaoProduto.createMany({ data: avaliacoesProdutos })
    })
  } catch (error) {
    // Duas submissões em simultâneo: os índices únicos impedem avaliações repetidas.
    if (error?.code === 'P2002') throw { status: 409, message: 'Esta avaliação já foi registada.' }
    throw error
  }
  return { message: avaliacoesProdutos.length ? 'Avaliação registada. Obrigado! As avaliações dos produtos ficam visíveis depois de aprovadas pela loja.' : 'Avaliação registada. Obrigado!' }
}

// ==================== Pedidos de assistência ====================

const camposPedido = {
  id: true,
  tipoPedido: true,
  assunto: true,
  mensagem: true,
  estado: true,
  resposta: true,
  respondidoEm: true,
  encomenda: { select: { codigoEncomenda: true } },
}

export async function listarPedidosAssistencia(utilizador, query = {}) {
  if (query.tipo !== undefined && !TIPOS_PEDIDO.includes(query.tipo)) {
    throw { status: 400, message: 'O tipo de pedido é inválido.' }
  }
  const pedidos = await prisma.pedidoAssistencia.findMany({
    where: { utilizadorId: utilizador.id, ...(query.tipo ? { tipoPedido: query.tipo } : {}) },
    select: camposPedido,
    orderBy: { id: 'desc' },
  })
  return { pedidos }
}

export async function obterPedidoAssistencia(utilizador, id) {
  const pedido = await prisma.pedidoAssistencia.findFirst({
    where: { id: identificador(id, 'pedido'), utilizadorId: utilizador.id },
    select: camposPedido,
  })
  if (!pedido) throw naoEncontrado('Pedido não encontrado.')
  return { pedido }
}

export async function criarPedidoAssistencia(utilizador, dados) {
  const pedido = validarPedidoAssistencia(dados)
  let encomendaId = null
  if (pedido.codigoEncomenda) {
    const encomenda = await encomendaDoCliente(utilizador, pedido.codigoEncomenda, undefined)
    encomendaId = encomenda.id
  }
  const criado = await prisma.pedidoAssistencia.create({
    data: {
      tipoPedido: pedido.tipoPedido,
      utilizadorId: utilizador.id,
      encomendaId,
      // Contacto da conta: não é aceite um email diferente do da sessão.
      nomeContacto: utilizador.nome,
      emailContacto: utilizador.email,
      telefoneContacto: utilizador.telefone || null,
      assunto: pedido.assunto,
      mensagem: pedido.mensagem,
    },
    select: camposPedido,
  })
  return { message: 'Pedido enviado à loja.', pedido: criado }
}
