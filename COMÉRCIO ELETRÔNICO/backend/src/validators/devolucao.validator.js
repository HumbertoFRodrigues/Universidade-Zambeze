// Regras do pedido de devolução feito pelo cliente. Funções puras: recebem a encomenda já
// carregada e lançam { status, message } (tratado pelo error-handler).

export const MOTIVOS_DEVOLUCAO = ['ARREPENDIMENTO', 'DIFERENTE_DA_DESCRICAO', 'DEFEITUOSO', 'OUTRO']
export const MAX_DESCRICAO_DEVOLUCAO = 1000
const DIA = 86400000

// encomenda: { estado, itens: [{ id, quantidade, quantidadeDevolvida }], entrega: { entregueEm } }
// prazoDias: regras comerciais da loja (prazoDevolucaoDias), opcional.
export function validarPedidoDevolucao(dados, encomenda, { agora = new Date(), prazoDias } = {}) {
  const { tipoMotivo, descricaoMotivo, itensParaDevolver } = dados ?? {}

  if (!MOTIVOS_DEVOLUCAO.includes(tipoMotivo)) {
    throw { status: 400, message: 'O motivo da devolução é inválido.' }
  }
  if (descricaoMotivo !== undefined && descricaoMotivo !== null &&
      (typeof descricaoMotivo !== 'string' || descricaoMotivo.trim().length > MAX_DESCRICAO_DEVOLUCAO)) {
    throw { status: 400, message: `A descrição não pode exceder ${MAX_DESCRICAO_DEVOLUCAO} caracteres.` }
  }
  if (!Array.isArray(itensParaDevolver) || itensParaDevolver.length === 0) {
    throw { status: 400, message: 'Indique pelo menos um produto a devolver.' }
  }
  if (encomenda.estado !== 'CONCLUIDA') {
    throw { status: 400, message: `Não é possível devolver uma encomenda no estado ${encomenda.estado}.` }
  }

  const entregueEm = encomenda.entrega?.entregueEm
  const prazo = Number(prazoDias)
  if (entregueEm && Number.isFinite(prazo) && prazo > 0 &&
      agora.getTime() > new Date(entregueEm).getTime() + prazo * DIA) {
    throw { status: 400, message: `O prazo de devolução de ${prazo} dias já terminou.` }
  }

  const vistos = new Set()
  return itensParaDevolver.map(pedido => {
    const itemEncomendaId = Number(pedido?.itemEncomendaId)
    const quantidade = Number(pedido?.quantidade)
    const item = encomenda.itens.find(linha => linha.id === itemEncomendaId)
    if (!item) throw { status: 400, message: 'Um dos produtos indicados não pertence a esta encomenda.' }
    if (vistos.has(item.id)) throw { status: 400, message: 'Cada produto só pode aparecer uma vez no pedido.' }
    vistos.add(item.id)
    const disponivel = item.quantidade - (item.quantidadeDevolvida ?? 0)
    if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > disponivel) {
      throw { status: 400, message: `A quantidade a devolver de cada produto deve estar entre 1 e ${disponivel}.` }
    }
    return { itemEncomendaId: item.id, quantidade }
  })
}

// A rejeição tem de ser justificada (CHECK devolucao_rejeicao_justificada na base de dados).
export function validarDecisaoDevolucao({ decisao, justificacaoDecisao } = {}) {
  if (!['APROVADA', 'REJEITADA'].includes(decisao)) {
    throw { status: 400, message: 'A decisão deve ser APROVADA ou REJEITADA.' }
  }
  const justificacao = typeof justificacaoDecisao === 'string' ? justificacaoDecisao.trim() : ''
  if (justificacaoDecisao !== undefined && justificacaoDecisao !== null && typeof justificacaoDecisao !== 'string') {
    throw { status: 400, message: 'A justificação é inválida.' }
  }
  if (justificacao.length > 500) throw { status: 400, message: 'A justificação não pode exceder 500 caracteres.' }
  if (decisao === 'REJEITADA' && !justificacao) {
    throw { status: 400, message: 'Indique a justificação para rejeitar a devolução.' }
  }
  return { decisao, justificacaoDecisao: justificacao || null }
}
