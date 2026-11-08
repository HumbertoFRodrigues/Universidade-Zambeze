// Mostra o preço em meticais (MZN)
export function formatPrice(price, currency = 'MZN') {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency }).format(Number(price))
}

// Valor extra que a cor escolhida acrescenta ao preço
export function extraDaCor(produto, corId) {
    const cor = (produto.cores || []).find(c => c.id === corId)
    return cor ? cor.extra : 0
}

// Menor preço entre os modelos do produto
export function precoBase(produto) {
    const lista = (produto.modelos || []).map(m => m.preco)
    if (lista.length) return Math.min(...lista)
    return Number(produto.precoPromocional ?? produto.preco)
}

// Preço final: preço do modelo escolhido mais o extra da cor
export function precoFinal(produto, indiceModelo = 0, corId = null) {
    const modelo = (produto.modelos || [])[indiceModelo]
    const base = modelo ? modelo.preco : Number(produto.precoPromocional ?? produto.preco)
    return base + extraDaCor(produto, corId)
}