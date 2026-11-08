// Validação das cotações B2B. Funções puras que lançam { status, message }.

export const ESTADOS_COTACAO = ['PEDIDA', 'RESPONDIDA', 'ACEITE', 'RECUSADA', 'EXPIRADA']
export const MAX_ITENS_COTACAO = 50
export const MAX_QUANTIDADE = 100000
export const MAX_VALIDADE_DIAS = 180
const MAX_PRECO = 1e9
const MAX_NOTAS = 2000
const DIA = 86400000

const erro = message => ({ status: 400, message })

function notas(valor, rotulo) {
  if (valor === undefined || valor === null || valor === '') return null
  if (typeof valor !== 'string') throw erro(`${rotulo} são inválidas.`)
  const limpo = valor.trim()
  if (limpo.length > MAX_NOTAS) throw erro(`${rotulo} não podem exceder ${MAX_NOTAS} caracteres.`)
  return limpo || null
}

function preco(valor, rotulo) {
  const numero = Number(valor)
  if (valor === null || valor === '' || !Number.isFinite(numero) || numero <= 0 || numero > MAX_PRECO) {
    throw erro(`${rotulo} deve ser um valor positivo.`)
  }
  // Valores monetários com 2 casas decimais.
  return Math.round(numero * 100) / 100
}

// { itens: [{ produtoId, quantidade, precoPedido? }], notas? }
export function validarPedidoCotacao(dados = {}) {
  const { itens } = dados
  if (!Array.isArray(itens) || itens.length === 0) throw erro('Indique pelo menos um produto.')
  if (itens.length > MAX_ITENS_COTACAO) throw erro(`Uma cotação pode ter no máximo ${MAX_ITENS_COTACAO} produtos.`)
  const vistos = new Set()
  const linhas = itens.map(item => {
    if (typeof item?.produtoId !== 'string' || !item.produtoId.trim()) throw erro('Um dos produtos é inválido.')
    const produtoId = item.produtoId.trim()
    if (vistos.has(produtoId)) throw erro('Cada produto só pode aparecer uma vez na cotação.')
    vistos.add(produtoId)
    const quantidade = Number(item.quantidade)
    if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > MAX_QUANTIDADE) {
      throw erro(`A quantidade de cada produto deve estar entre 1 e ${MAX_QUANTIDADE}.`)
    }
    const temPreco = item.precoPedido !== undefined && item.precoPedido !== null && item.precoPedido !== ''
    return { produtoId, quantidade, precoPedido: temPreco ? preco(item.precoPedido, 'O preço pedido') : null }
  })
  return { itens: linhas, notasCliente: notas(dados.notas, 'As notas') }
}

// Resposta da loja: um preço proposto para cada item e a validade da proposta.
// itensCotacao: [{ id }] da cotação; agora: data de referência.
export function validarRespostaCotacao(dados = {}, itensCotacao, agora = new Date()) {
  const validaAte = new Date(dados.validaAte)
  if (typeof dados.validaAte !== 'string' || !Number.isFinite(validaAte.getTime())) throw erro('Indique a validade da proposta.')
  if (validaAte.getTime() <= agora.getTime()) throw erro('A validade da proposta tem de ser uma data futura.')
  if (validaAte.getTime() > agora.getTime() + MAX_VALIDADE_DIAS * DIA) {
    throw erro(`A validade da proposta não pode exceder ${MAX_VALIDADE_DIAS} dias.`)
  }
  if (!Array.isArray(dados.itens)) throw erro('Indique o preço proposto de cada produto.')
  const propostas = new Map()
  for (const item of dados.itens) {
    const id = Number(item?.itemId)
    if (!itensCotacao.some(linha => linha.id === id)) throw erro('Um dos produtos não pertence a esta cotação.')
    if (propostas.has(id)) throw erro('Cada produto só pode ter um preço proposto.')
    propostas.set(id, preco(item.precoProposto, 'O preço proposto'))
  }
  if (propostas.size !== itensCotacao.length) throw erro('Indique o preço proposto de todos os produtos.')
  return {
    validaAte,
    notasLoja: notas(dados.notasLoja, 'As notas da loja'),
    itens: itensCotacao.map(linha => ({ id: linha.id, precoProposto: propostas.get(linha.id) })),
  }
}

// Uma proposta só pode ser aceite enquanto está RESPONDIDA e dentro da validade.
export function cotacaoAceitavel(cotacao, agora = new Date()) {
  if (cotacao.estado === 'RESPONDIDA' && cotacao.validaAte && new Date(cotacao.validaAte) < agora) return 'EXPIRADA'
  return cotacao.estado === 'RESPONDIDA' ? null : cotacao.estado
}

export const MAX_LINHAS_SKU = 200

// Encomenda rápida por SKU: [{ sku, quantidade }] (texto colado ou CSV lido no navegador).
// Devolve as linhas normalizadas com o erro de formato de cada uma (o stock é verificado depois).
export function normalizarLinhasSku(linhas) {
  if (!Array.isArray(linhas) || linhas.length === 0) throw erro('Indique pelo menos uma linha "SKU, quantidade".')
  if (linhas.length > MAX_LINHAS_SKU) throw erro(`São permitidas no máximo ${MAX_LINHAS_SKU} linhas.`)
  const vistos = new Set()
  return linhas.map((linha, indice) => {
    const sku = typeof linha?.sku === 'string' ? linha.sku.trim() : ''
    const quantidade = Number(linha?.quantidade)
    let erroLinha = null
    if (!sku || sku.length > 50) erroLinha = 'SKU em falta ou inválido.'
    else if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > MAX_QUANTIDADE) erroLinha = `Quantidade inválida (1 a ${MAX_QUANTIDADE}).`
    else if (vistos.has(sku.toUpperCase())) erroLinha = 'SKU repetido noutra linha.'
    if (sku) vistos.add(sku.toUpperCase())
    return { linha: indice + 1, sku, quantidade: Number.isSafeInteger(quantidade) ? quantidade : null, erro: erroLinha }
  })
}
