// Utilitários partilhados pelas páginas administrativas de produtos.

// O PUT /admin/produtos/:id substitui descrição, especificações e garantia pelo que
// for enviado, por isso cada actualização parte sempre do produto completo.
// Preço e stock não são alterados aqui: têm fluxos próprios com histórico.
export function payloadProduto(produto, alteracoes = {}) {
  return {
    nome: produto.nome,
    slug: produto.slug,
    codigo: produto.codigo || '',
    marca: produto.marca || '',
    categoriaId: produto.categoria?.id ?? null,
    descricao: produto.descricao || '',
    especificacoes: produto.especificacoes ?? {},
    garantia: produto.garantia || '',
    preco: produto.preco,
    activo: produto.activo,
    ...(produto.limiarStockBaixo !== null && produto.limiarStockBaixo !== undefined
      ? { limiarStockBaixo: produto.limiarStockBaixo }
      : {}),
    ...alteracoes,
  }
}

// O backend devolve erro interno se a categoria faltar numa actualização.
export const AVISO_SEM_CATEGORIA = 'Este produto não tem categoria. Defina-a na página de edição antes de guardar outras alterações.'

// preco é Decimal(12, 2) no schema: até 10 dígitos inteiros e 2 decimais, maior que zero.
export function precoValido(valor) {
  const texto = String(valor ?? '').trim().replace(',', '.')
  return /^\d{1,10}(\.\d{1,2})?$/.test(texto) && Number(texto) > 0
}

export function limiarEfectivo(produto) {
  return produto?.limiarStockBaixo ?? 5
}

export function estadoStockAdmin(produto) {
  const stock = Number(produto?.quantidadeStock || 0)
  if (stock <= 0) return { etiqueta: 'Esgotado', classe: 'bg-red-100 text-red-700 hover:bg-red-100' }
  if (stock <= limiarEfectivo(produto)) return { etiqueta: 'Stock baixo', classe: 'bg-amber-100 text-amber-700 hover:bg-amber-100' }
  return { etiqueta: 'Em stock', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' }
}

export function formatarValorEspecificacao(valor) {
  if (valor === null || valor === undefined) return ''
  return typeof valor === 'object' ? JSON.stringify(valor) : String(valor)
}

// A loja pública lê as especificações como objecto { nome: valor }.
export function especificacoesParaLista(especificacoes) {
  if (!especificacoes || typeof especificacoes !== 'object' || Array.isArray(especificacoes)) return []
  return Object.entries(especificacoes).map(([nome, valor]) => ({ nome, valor: formatarValorEspecificacao(valor) }))
}

// Converte a lista editada de volta para objecto, preservando o tipo original
// (por exemplo números) dos valores que não foram alterados.
export function listaParaEspecificacoes(lista, original = {}) {
  const resultado = {}
  for (const item of lista) {
    const nome = String(item.nome || '').trim()
    const valor = String(item.valor || '').trim()
    if (!nome && !valor) continue
    if (!nome) throw new Error('Todas as especificações com valor precisam de um nome.')
    if (Object.hasOwn(resultado, nome)) throw new Error(`A especificação "${nome}" está repetida.`)
    const anterior = original && typeof original === 'object' ? original[nome] : undefined
    resultado[nome] = anterior !== undefined && formatarValorEspecificacao(anterior) === valor ? anterior : valor
  }
  return resultado
}

export function dataHoraLegivel(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })
}
