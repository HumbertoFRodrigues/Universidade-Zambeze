// Regras de preço da loja (funções puras, valores em centavos). O servidor é a única fonte
// de verdade: o frontend só mostra o que estas funções calculam.
//
// Ordem de aplicação:
//   Particulares (checkout): preço base → promoção activa → escalão de quantidade.
//   Cotações (preço sugerido à loja): preço base → maior desconto entre promoção e desconto
//     de grupo (não acumulam) → escalão de quantidade. O preço proposto pela loja numa cotação
//     aceite substitui todos os anteriores.
// O escalão aplica-se sobre o preço já descontado, por linha (quantidade de cada produto).

// Escalões de regrasComerciais.atacado: [{ de, ate|null, desconto (fracção 0–<1) }].
// Entradas inválidas são ignoradas, para uma configuração errada nunca gerar preços negativos.
export function escaloesValidos(escaloes) {
  if (!Array.isArray(escaloes)) return []
  return escaloes.filter(escalao =>
    Number.isSafeInteger(escalao?.de) && escalao.de >= 1 &&
    (escalao.ate === null || escalao.ate === undefined || (Number.isSafeInteger(escalao.ate) && escalao.ate >= escalao.de)) &&
    typeof escalao.desconto === 'number' && escalao.desconto >= 0 && escalao.desconto < 1)
}

// Fracção de desconto do escalão que contém a quantidade (0 se nenhum).
export function descontoEscalao(escaloes, quantidade) {
  const escalao = escaloesValidos(escaloes).find(item =>
    quantidade >= item.de && (item.ate === null || item.ate === undefined || quantidade <= item.ate))
  return escalao ? escalao.desconto : 0
}

// Desconto unitário do escalão (centavos), calculado sobre o preço já com promoção.
export function descontoEscalaoCentavos(precoCentavos, quantidade, escaloes) {
  return Math.round(precoCentavos * descontoEscalao(escaloes, quantidade))
}

// Desconto de grupo aplicável: o específico da categoria prevalece sobre o geral do grupo.
// descontos: [{ grupo, categoriaId|null, percentagem, activo }]
export function percentagemGrupo(descontos, grupo, categoriaId) {
  if (!grupo) return 0
  const activos = (descontos || []).filter(desconto => desconto.activo !== false && desconto.grupo === grupo)
  const daCategoria = categoriaId === null || categoriaId === undefined
    ? undefined
    : activos.find(desconto => desconto.categoriaId === categoriaId)
  const geral = activos.find(desconto => desconto.categoriaId === null || desconto.categoriaId === undefined)
  return Number((daCategoria || geral)?.percentagem ?? 0)
}

// Preço unitário sugerido para responder a uma cotação.
export function precoSugeridoCotacao({ precoCentavos, descontoPromocaoCentavos = 0, percentagemGrupo: percentagem = 0, quantidade, escaloes }) {
  const descontoGrupoCentavos = Math.round(precoCentavos * Number(percentagem) / 100)
  const primeiroDesconto = Math.min(precoCentavos, Math.max(descontoPromocaoCentavos, descontoGrupoCentavos, 0))
  const aposDesconto = precoCentavos - primeiroDesconto
  const escalaoCentavos = descontoEscalaoCentavos(aposDesconto, quantidade, escaloes)
  return {
    precoCentavos,
    descontoPromocaoCentavos,
    descontoGrupoCentavos,
    origemDesconto: primeiroDesconto === 0 ? null : descontoGrupoCentavos >= descontoPromocaoCentavos ? 'GRUPO' : 'PROMOCAO',
    escalao: descontoEscalao(escaloes, quantidade),
    sugeridoCentavos: Math.max(aposDesconto - escalaoCentavos, 0),
  }
}

// IVA incluído no preço (decisão da loja: os preços do catálogo incluem IVA).
// base = total / (1 + taxa), arredondada ao centavo; IVA = total − base (soma sempre exacta).
// ATENÇÃO: regra de arredondamento por validar por um contabilista.
export function ivaIncluido(totalCentavos, taxaPercentual) {
  const taxa = Number(taxaPercentual)
  if (!Number.isFinite(taxa) || taxa < 0 || taxa >= 100) throw new Error('Taxa de IVA inválida.')
  const baseCentavos = Math.round(totalCentavos * 100 / (100 + taxa))
  return { baseCentavos, ivaCentavos: totalCentavos - baseCentavos }
}

// Numeração das facturas: "FT AAAA/NNNN" (pelo menos 4 dígitos), sequencial por ano.
export function numeroFactura(ano, sequencia) {
  return `FT ${ano}/${String(sequencia).padStart(4, '0')}`
}

// Ano fiscal da emissão no fuso horário de Moçambique.
export function anoEmMocambique(data = new Date()) {
  return Number(new Intl.DateTimeFormat('en', { timeZone: 'Africa/Maputo', year: 'numeric' }).format(data))
}
