import { prisma } from '../lib/prisma.js'

// Consultas administrativas só de leitura: histórico de pagamentos, movimentos de stock e auditoria.

const ESTADOS_PAGAMENTO = ['PENDENTE', 'CONFIRMADO', 'FALHADO', 'REEMBOLSADO']
const TIPOS_MOVIMENTO = ['ENTRADA', 'AJUSTE', 'VENDA', 'REPOSICAO_CANCELAMENTO', 'REPOSICAO_DEVOLUCAO']

function paginacao(query, limitePadrao = 20, limiteMaximo = 100) {
  const pagina = query.pagina === undefined ? 1 : Number(query.pagina)
  const limite = query.limite === undefined ? limitePadrao : Number(query.limite)
  if (!Number.isSafeInteger(pagina) || pagina < 1 || !Number.isSafeInteger(limite) || limite < 1) {
    throw { status: 400, message: 'Os parâmetros de paginação não são válidos.' }
  }
  const take = Math.min(limite, limiteMaximo)
  return { pagina, take, skip: (pagina - 1) * take }
}

const resposta = (lista, total, { pagina, take }) => ({ pagina, limite: take, total, totalPaginas: Math.ceil(total / take) })

export async function listarHistoricoPagamentosAdmin(req, res) {
  const pag = paginacao(req.query, 50)
  const where = {}
  if (req.query.estado !== undefined && req.query.estado !== '') {
    if (!ESTADOS_PAGAMENTO.includes(req.query.estado)) return res.status(400).json({ message: 'Estado de pagamento inválido.' })
    where.estado = req.query.estado
  }
  const termo = typeof req.query.pesquisa === 'string' ? req.query.pesquisa.trim().slice(0, 100) : ''
  if (termo) {
    where.OR = [
      { referenciaOperacao: { contains: termo, mode: 'insensitive' } },
      { encomenda: { codigoEncomenda: { contains: termo, mode: 'insensitive' } } },
      { encomenda: { nomeContacto: { contains: termo, mode: 'insensitive' } } },
      { encomenda: { emailContacto: { contains: termo, mode: 'insensitive' } } },
    ]
  }
  const [pagamentos, total] = await Promise.all([
    prisma.pagamento.findMany({
      where,
      orderBy: { id: 'desc' },
      take: pag.take,
      skip: pag.skip,
      select: {
        id: true, referenciaOperacao: true, estado: true, valor: true, valorReembolsado: true, simulado: true,
        motivoFalha: true, confirmadoEm: true, comprovativoUrl: true,
        formaPagamento: { select: { nome: true } },
        encomenda: { select: { codigoEncomenda: true, nomeContacto: true, emailContacto: true, estado: true, valorTotal: true, criadoEm: true } },
        reembolsos: { select: { valor: true, estado: true } },
      },
    }),
    prisma.pagamento.count({ where }),
  ])
  res.json({
    pagamentos: pagamentos.map(({ comprovativoUrl, reembolsos, ...p }) => ({
      ...p,
      valor: Number(p.valor),
      valorReembolsado: Number(p.valorReembolsado),
      metodo: p.formaPagamento?.nome || null,
      temComprovativo: Boolean(comprovativoUrl),
      reembolsos: { total: reembolsos.length, valor: reembolsos.reduce((soma, r) => soma + Number(r.valor), 0) },
      encomenda: { ...p.encomenda, valorTotal: Number(p.encomenda.valorTotal) },
    })),
    ...resposta(pagamentos, total, pag),
  })
}

export async function listarMovimentosStockAdmin(req, res) {
  const pag = paginacao(req.query, 50)
  const where = {}
  if (req.query.tipo !== undefined && req.query.tipo !== '') {
    if (!TIPOS_MOVIMENTO.includes(req.query.tipo)) return res.status(400).json({ message: 'Tipo de movimento inválido.' })
    where.tipoMovimento = req.query.tipo
  }
  if (typeof req.query.produtoId === 'string' && req.query.produtoId.trim()) where.produtoId = req.query.produtoId.trim().slice(0, 100)
  const [movimentos, total] = await Promise.all([
    prisma.movimentoStock.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: pag.take,
      skip: pag.skip,
      select: {
        id: true, tipoMovimento: true, variacaoQuantidade: true, stockApos: true, motivo: true, criadoEm: true,
        produto: { select: { id: true, nome: true, codigo: true } },
        autor: { select: { nome: true } },
      },
    }),
    prisma.movimentoStock.count({ where }),
  ])
  res.json({
    movimentos: movimentos.map(m => ({ ...m, id: String(m.id), autor: m.autor?.nome || null })),
    ...resposta(movimentos, total, pag),
  })
}

export async function listarAuditoriaAdmin(req, res) {
  const pag = paginacao(req.query, 20)
  const where = {}
  if (typeof req.query.tipoEntidade === 'string' && req.query.tipoEntidade.trim()) where.tipoEntidade = req.query.tipoEntidade.trim().slice(0, 50)
  if (typeof req.query.idEntidade === 'string' && req.query.idEntidade.trim()) where.idEntidade = req.query.idEntidade.trim().slice(0, 50)
  const [registos, total] = await Promise.all([
    prisma.registoAuditoria.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: pag.take,
      skip: pag.skip,
      select: { id: true, accao: true, tipoEntidade: true, idEntidade: true, detalhes: true, criadoEm: true, autor: { select: { nome: true } } },
    }),
    prisma.registoAuditoria.count({ where }),
  ])
  res.json({
    registos: registos.map(r => ({ ...r, id: String(r.id), autor: r.autor?.nome || null })),
    ...resposta(registos, total, pag),
  })
}
