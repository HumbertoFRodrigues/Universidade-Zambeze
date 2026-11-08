export function obterEscalao(escaloes = [], quantidade) {
  return escaloes.find(escalao =>
    quantidade >= escalao.de && (escalao.ate == null || quantidade <= escalao.ate)
  ) || escaloes[0] || { desconto: 0 }
}

export function precoComDesconto(unitario, quantidade, escaloes = []) {
  const desconto = Number(obterEscalao(escaloes, quantidade).desconto) || 0
  return Math.round(Number(unitario) * (1 - desconto))
}

export function textoEscalao(escalao) {
  return escalao.ate == null ? `${escalao.de} ou mais` : `${escalao.de} a ${escalao.ate}`
}
