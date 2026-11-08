import { prisma } from '../lib/prisma.js'
import { ESTADOS_PEDIDO, TIPOS_PEDIDO, identificador, paginacao, validarRespostaAssistencia } from '../validators/conta.validator.js'

// Histórico de estados de uma encomenda (historico_estado_encomenda).
export async function listarHistoricoEncomendaAdmin(req, res, next) {
  try {
    const encomendaId = identificador(req.params.encomendaId, 'identificador da encomenda')
    const encomenda = await prisma.encomenda.findUnique({ where: { id: encomendaId }, select: { id: true } })
    if (!encomenda) return res.status(404).json({ message: 'Encomenda não encontrada.' })
    const historico = await prisma.historicoEstadoEncomenda.findMany({
      where: { encomendaId },
      select: {
        id: true, estadoAnterior: true, estadoNovo: true, observacao: true, criadoEm: true,
        autor: { select: { nome: true } },
      },
      orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
    })
    res.json({ historico })
  } catch (error) {
    next(error)
  }
}

// Reembolsos registados (todos simulados enquanto não houver fornecedor de pagamentos).
export async function listarReembolsosAdmin(req, res, next) {
  try {
    const pagina = paginacao(req.query, { limitePadrao: 20 })
    const [reembolsos, total] = await Promise.all([
      prisma.reembolso.findMany({
        select: {
          id: true, referenciaOperacao: true, valor: true, estado: true, simulado: true, processadoEm: true, criadoEm: true,
          responsavel: { select: { nome: true } },
          devolucao: { select: { id: true, codigoDevolucao: true } },
          pagamento: { select: { referenciaOperacao: true, encomenda: { select: { id: true, codigoEncomenda: true, nomeContacto: true } } } },
        },
        orderBy: { id: 'desc' },
        skip: pagina.skip,
        take: pagina.take,
      }),
      prisma.reembolso.count(),
    ])
    res.json({ reembolsos, total, pagina: pagina.pagina, totalPaginas: Math.max(Math.ceil(total / pagina.take), 1) })
  } catch (error) {
    next(error)
  }
}

const camposPedidoAdmin = {
  id: true, tipoPedido: true, nomeContacto: true, emailContacto: true, telefoneContacto: true,
  assunto: true, mensagem: true, estado: true, resposta: true, respondidoEm: true,
  responsavel: { select: { nome: true } },
  encomenda: { select: { id: true, codigoEncomenda: true } },
}

export async function listarPedidosAssistenciaAdmin(req, res, next) {
  try {
    const { tipo, estado } = req.query
    if (tipo !== undefined && !TIPOS_PEDIDO.includes(tipo)) return res.status(400).json({ message: 'O tipo de pedido é inválido.' })
    if (estado !== undefined && !ESTADOS_PEDIDO.includes(estado)) return res.status(400).json({ message: 'O estado do pedido é inválido.' })
    const pagina = paginacao(req.query, { limitePadrao: 20 })
    const where = { ...(tipo ? { tipoPedido: tipo } : {}), ...(estado ? { estado } : {}) }
    const [pedidos, total] = await Promise.all([
      prisma.pedidoAssistencia.findMany({ where, select: camposPedidoAdmin, orderBy: { id: 'desc' }, skip: pagina.skip, take: pagina.take }),
      prisma.pedidoAssistencia.count({ where }),
    ])
    res.json({ pedidos, total, pagina: pagina.pagina, totalPaginas: Math.max(Math.ceil(total / pagina.take), 1) })
  } catch (error) {
    next(error)
  }
}

export async function obterPedidoAssistenciaAdmin(req, res, next) {
  try {
    const pedido = await prisma.pedidoAssistencia.findUnique({
      where: { id: identificador(req.params.id, 'pedido') },
      select: camposPedidoAdmin,
    })
    if (!pedido) return res.status(404).json({ message: 'Pedido não encontrado.' })
    res.json({ pedido })
  } catch (error) {
    next(error)
  }
}

// Actualiza o estado e, quando há resposta, regista quem respondeu e quando.
export async function responderPedidoAssistenciaAdmin(req, res, next) {
  try {
    const id = identificador(req.params.id, 'pedido')
    const { estado, resposta } = validarRespostaAssistencia(req.body ?? {})
    const actual = await prisma.pedidoAssistencia.findUnique({ where: { id }, select: { estado: true } })
    if (!actual) return res.status(404).json({ message: 'Pedido não encontrado.' })
    if (actual.estado === 'FECHADO') return res.status(409).json({ message: 'O pedido está fechado e já não pode ser alterado.' })

    const pedido = await prisma.$transaction(async tx => {
      const actualizado = await tx.pedidoAssistencia.update({
        where: { id },
        data: {
          estado,
          ...(resposta ? { resposta, respondidoPor: req.admin.id, respondidoEm: new Date() } : {}),
        },
        select: camposPedidoAdmin,
      })
      await tx.registoAuditoria.create({
        data: {
          utilizadorAutorId: req.admin.id,
          accao: 'RESPOSTA_PEDIDO_ASSISTENCIA',
          tipoEntidade: 'pedido_assistencia',
          idEntidade: String(id),
          detalhes: { de: actual.estado, para: estado, respondeu: Boolean(resposta) },
        },
      })
      return actualizado
    })
    res.json({ message: 'Pedido actualizado.', pedido })
  } catch (error) {
    next(error)
  }
}
