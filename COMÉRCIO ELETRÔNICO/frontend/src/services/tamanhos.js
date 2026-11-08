// Diz como se chama a escolha: "Número" para botas (38, 39...) e "Tamanho" para o resto (S, M, L...)
export function rotuloTamanho(tamanhos = []) {
    return tamanhos.length && tamanhos.every(t => !Number.isNaN(Number(t))) ? 'Número' : 'Tamanho'
}