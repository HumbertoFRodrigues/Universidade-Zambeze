import assert from 'node:assert/strict'
import { test } from 'node:test'
import { descontoEscalao, descontoEscalaoCentavos, escaloesValidos, percentagemGrupo, precoSugeridoCotacao } from '../../src/services/precos.js'
import { cotacaoAceitavel, validarPedidoCotacao, validarRespostaCotacao } from '../../src/validators/cotacao.validator.js'

const rejeita = (funcao, status, mensagem) => assert.throws(funcao, erro => {
  assert.equal(erro.status, status)
  if (mensagem) assert.match(erro.message, mensagem)
  return true
})

// Os mesmos escalões do seed (regrasComerciais.atacado).
const escaloes = [
  { de: 1, ate: 9, desconto: 0 },
  { de: 10, ate: 49, desconto: 0.07 },
  { de: 50, ate: 199, desconto: 0.13 },
  { de: 200, ate: null, desconto: 0.2 },
]

test('escalões de quantidade: limites de cada escalão e configuração inválida ignorada', () => {
  assert.equal(descontoEscalao(escaloes, 1), 0)
  assert.equal(descontoEscalao(escaloes, 9), 0)
  assert.equal(descontoEscalao(escaloes, 10), 0.07)
  assert.equal(descontoEscalao(escaloes, 49), 0.07)
  assert.equal(descontoEscalao(escaloes, 50), 0.13)
  assert.equal(descontoEscalao(escaloes, 5000), 0.2)
  assert.equal(descontoEscalaoCentavos(100000, 10, escaloes), 7000)
  assert.equal(descontoEscalao(undefined, 100), 0)
  assert.deepEqual(escaloesValidos([{ de: 1, ate: 5, desconto: 1.5 }, { de: 0, desconto: 0.1 }, { de: 2, ate: 1, desconto: 0.1 }]), [])
})

test('desconto de grupo: o da categoria prevalece sobre o geral; inactivos e outros grupos são ignorados', () => {
  const descontos = [
    { grupo: 'EMPRESA', categoriaId: null, percentagem: '5.00', activo: true },
    { grupo: 'REVENDEDOR', categoriaId: null, percentagem: '10.00', activo: true },
    { grupo: 'REVENDEDOR', categoriaId: 7, percentagem: '15.00', activo: true },
    { grupo: 'REVENDEDOR', categoriaId: 8, percentagem: '30.00', activo: false },
  ]
  assert.equal(percentagemGrupo(descontos, 'EMPRESA', 7), 5)
  assert.equal(percentagemGrupo(descontos, 'REVENDEDOR', 7), 15)
  assert.equal(percentagemGrupo(descontos, 'REVENDEDOR', 8), 10)
  assert.equal(percentagemGrupo(descontos, 'REVENDEDOR', null), 10)
  assert.equal(percentagemGrupo(descontos, null, 7), 0)
})

test('preço sugerido: base → maior entre promoção e grupo (sem acumular) → escalão', () => {
  // 1000,00 MT, grupo 10%, sem promoção, 50 unidades (−13%): 1000 → 900 → 783.
  const grupo = precoSugeridoCotacao({ precoCentavos: 100000, percentagemGrupo: 10, quantidade: 50, escaloes })
  assert.equal(grupo.sugeridoCentavos, 78300)
  assert.equal(grupo.origemDesconto, 'GRUPO')
  // Promoção de 150 MT é maior do que o grupo (100 MT): usa só a promoção. 850 → −7% = 790,50.
  const promocao = precoSugeridoCotacao({ precoCentavos: 100000, descontoPromocaoCentavos: 15000, percentagemGrupo: 10, quantidade: 10, escaloes })
  assert.equal(promocao.sugeridoCentavos, 79050)
  assert.equal(promocao.origemDesconto, 'PROMOCAO')
  // Sem descontos nem escalão.
  const normal = precoSugeridoCotacao({ precoCentavos: 100000, quantidade: 1, escaloes })
  assert.equal(normal.sugeridoCentavos, 100000)
  assert.equal(normal.origemDesconto, null)
})

test('pedido de cotação: itens válidos, sem repetidos, quantidades e preços positivos', () => {
  const pedido = validarPedidoCotacao({ itens: [{ produtoId: 'p1', quantidade: '20', precoPedido: '99.999' }, { produtoId: 'p2', quantidade: 5 }], notas: ' urgente ' })
  assert.deepEqual(pedido.itens, [{ produtoId: 'p1', quantidade: 20, precoPedido: 100 }, { produtoId: 'p2', quantidade: 5, precoPedido: null }])
  assert.equal(pedido.notasCliente, 'urgente')
  rejeita(() => validarPedidoCotacao({ itens: [] }), 400)
  rejeita(() => validarPedidoCotacao({ itens: [{ produtoId: 'p1', quantidade: 1 }, { produtoId: 'p1', quantidade: 2 }] }), 400, /uma vez/)
  rejeita(() => validarPedidoCotacao({ itens: [{ produtoId: 'p1', quantidade: 0 }] }), 400, /quantidade/)
  rejeita(() => validarPedidoCotacao({ itens: [{ produtoId: 'p1', quantidade: 1, precoPedido: -5 }] }), 400, /preço/)
})

test('resposta da loja: preço para todos os itens e validade futura até 180 dias', () => {
  const agora = new Date('2026-10-25T10:00:00Z')
  const itens = [{ id: 1 }, { id: 2 }]
  const resposta = validarRespostaCotacao({ validaAte: '2026-11-09T23:59:59Z', itens: [{ itemId: 1, precoProposto: 10 }, { itemId: 2, precoProposto: '25.5' }] }, itens, agora)
  assert.deepEqual(resposta.itens, [{ id: 1, precoProposto: 10 }, { id: 2, precoProposto: 25.5 }])
  rejeita(() => validarRespostaCotacao({ validaAte: '2026-11-09T00:00:00Z', itens: [{ itemId: 1, precoProposto: 10 }] }, itens, agora), 400, /todos/)
  rejeita(() => validarRespostaCotacao({ validaAte: '2026-10-24T00:00:00Z', itens: [{ itemId: 1, precoProposto: 10 }, { itemId: 2, precoProposto: 1 }] }, itens, agora), 400, /futura/)
  rejeita(() => validarRespostaCotacao({ validaAte: '2027-06-01T00:00:00Z', itens: [{ itemId: 1, precoProposto: 10 }, { itemId: 2, precoProposto: 1 }] }, itens, agora), 400, /180/)
  rejeita(() => validarRespostaCotacao({ validaAte: '2026-11-09T00:00:00Z', itens: [{ itemId: 1, precoProposto: 0 }, { itemId: 2, precoProposto: 1 }] }, itens, agora), 400)
  rejeita(() => validarRespostaCotacao({ validaAte: '2026-11-09T00:00:00Z', itens: [{ itemId: 9, precoProposto: 1 }, { itemId: 2, precoProposto: 1 }] }, itens, agora), 400, /não pertence/)
})

test('aceitação só de propostas respondidas e dentro da validade', () => {
  const agora = new Date('2026-10-25T10:00:00Z')
  assert.equal(cotacaoAceitavel({ estado: 'RESPONDIDA', validaAte: '2026-10-30T00:00:00Z' }, agora), null)
  assert.equal(cotacaoAceitavel({ estado: 'RESPONDIDA', validaAte: '2026-10-20T00:00:00Z' }, agora), 'EXPIRADA')
  assert.equal(cotacaoAceitavel({ estado: 'PEDIDA', validaAte: null }, agora), 'PEDIDA')
  assert.equal(cotacaoAceitavel({ estado: 'ACEITE', validaAte: '2026-10-30T00:00:00Z' }, agora), 'ACEITE')
})
