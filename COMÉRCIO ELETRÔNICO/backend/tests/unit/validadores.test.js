import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validarIdentidade, validarOpcaoEntrega } from '../../src/validators/checkout.validator.js'
import { validarDecisaoDevolucao, validarPedidoDevolucao } from '../../src/validators/devolucao.validator.js'
import {
  paginacao,
  validarAvaliacao,
  validarEndereco,
  validarPedidoAssistencia,
  validarPerfil,
  validarRespostaAssistencia,
} from '../../src/validators/conta.validator.js'

const rejeita = (funcao, status, mensagem) => assert.throws(funcao, erro => {
  assert.equal(erro.status, status)
  if (mensagem) assert.match(erro.message, mensagem)
  return true
})

test('identidade do carrinho: token, sessão e utilizadorId nunca confiado sem sessão', () => {
  assert.deepEqual(validarIdentidade({ tokenSessao: 'abc' }), { tokenSessao: 'abc', clienteId: null })
  assert.deepEqual(validarIdentidade({ tokenSessao: 'abc' }, { id: 7 }), { tokenSessao: 'abc', clienteId: 7 })
  assert.deepEqual(validarIdentidade({}, { id: 7 }), { utilizadorId: 7, clienteId: 7 })
  assert.deepEqual(validarIdentidade({ utilizadorId: 7 }, { id: 7 }), { utilizadorId: 7, clienteId: 7 })
  rejeita(() => validarIdentidade({ utilizadorId: 7 }), 403)
  rejeita(() => validarIdentidade({ utilizadorId: 8 }, { id: 7 }), 403)
  rejeita(() => validarIdentidade({}), 400)
  rejeita(() => validarIdentidade({ tokenSessao: 'x'.repeat(65) }), 400)
})

test('opção de entrega aceita o id 0 e rejeita vazios e negativos', () => {
  assert.deepEqual(validarOpcaoEntrega(0, 0), { zonaId: 0, modalidadeId: 0 })
  assert.deepEqual(validarOpcaoEntrega('3', 2), { zonaId: 3, modalidadeId: 2 })
  for (const invalido of [null, '', -1, 'a', 1.5, undefined]) rejeita(() => validarOpcaoEntrega(invalido, 1), 400)
})

const encomenda = {
  estado: 'CONCLUIDA',
  entrega: { entregueEm: '2026-10-20T10:00:00Z' },
  itens: [{ id: 1, quantidade: 3, quantidadeDevolvida: 1 }, { id: 2, quantidade: 1, quantidadeDevolvida: 0 }],
}
const pedido = itens => ({ tipoMotivo: 'DEFEITUOSO', itensParaDevolver: itens })
const agora = new Date('2026-10-22T10:00:00Z')

test('pedido de devolução valida itens, quantidades, motivo, estado e prazo', () => {
  assert.deepEqual(
    validarPedidoDevolucao(pedido([{ itemEncomendaId: 1, quantidade: 2 }]), encomenda, { agora, prazoDias: 7 }),
    [{ itemEncomendaId: 1, quantidade: 2 }],
  )
  rejeita(() => validarPedidoDevolucao(pedido([{ itemEncomendaId: 1, quantidade: 3 }]), encomenda, { agora }), 400, /entre 1 e 2/)
  rejeita(() => validarPedidoDevolucao(pedido([{ itemEncomendaId: 99, quantidade: 1 }]), encomenda, { agora }), 400, /não pertence/)
  rejeita(() => validarPedidoDevolucao(pedido([{ itemEncomendaId: 2, quantidade: 1 }, { itemEncomendaId: 2, quantidade: 1 }]), encomenda, { agora }), 400, /uma vez/)
  rejeita(() => validarPedidoDevolucao(pedido([{ itemEncomendaId: 2, quantidade: 0 }]), encomenda, { agora }), 400)
  rejeita(() => validarPedidoDevolucao(pedido([]), encomenda, { agora }), 400)
  rejeita(() => validarPedidoDevolucao({ ...pedido([{ itemEncomendaId: 2, quantidade: 1 }]), tipoMotivo: 'OUTRA_COISA' }, encomenda, { agora }), 400, /motivo/)
  rejeita(() => validarPedidoDevolucao(pedido([{ itemEncomendaId: 2, quantidade: 1 }]), { ...encomenda, estado: 'REGISTADA' }, { agora }), 400, /estado/)
  rejeita(
    () => validarPedidoDevolucao(pedido([{ itemEncomendaId: 2, quantidade: 1 }]), encomenda, { agora: new Date('2026-11-01T00:00:00Z'), prazoDias: 7 }),
    400, /prazo/,
  )
})

test('decisão de devolução exige justificação ao rejeitar', () => {
  assert.deepEqual(validarDecisaoDevolucao({ decisao: 'APROVADA' }), { decisao: 'APROVADA', justificacaoDecisao: null })
  assert.deepEqual(validarDecisaoDevolucao({ decisao: 'REJEITADA', justificacaoDecisao: ' Fora do prazo ' }), { decisao: 'REJEITADA', justificacaoDecisao: 'Fora do prazo' })
  rejeita(() => validarDecisaoDevolucao({ decisao: 'REJEITADA' }), 400, /justificação/)
  rejeita(() => validarDecisaoDevolucao({ decisao: 'TALVEZ' }), 400)
  rejeita(() => validarDecisaoDevolucao({ decisao: 'APROVADA', justificacaoDecisao: 'x'.repeat(501) }), 400)
})

test('perfil e endereço respeitam campos obrigatórios e limites do schema', () => {
  assert.deepEqual(validarPerfil({ nome: ' Ana ', telefone: '840000000' }), { nome: 'Ana', telefone: '840000000' })
  rejeita(() => validarPerfil({ nome: 'Ana', telefone: '84', email: 'outro@x.y' }), 400, /email/)
  rejeita(() => validarPerfil({ nome: '', telefone: '84' }), 400)
  rejeita(() => validarPerfil({ nome: 'x'.repeat(151), telefone: '84' }), 400)

  const endereco = { nomeDestinatario: 'Ana', telefone: '84', linhaEndereco: 'Rua 1', cidade: 'Maputo', provincia: 'Maputo', zonaEntregaId: 0 }
  assert.equal(validarEndereco(endereco).zonaEntregaId, 0)
  assert.equal(validarEndereco(endereco).predefinido, false)
  rejeita(() => validarEndereco({ ...endereco, cidade: ' ' }), 400)
  rejeita(() => validarEndereco({ ...endereco, zonaEntregaId: '' }), 400)
  rejeita(() => validarEndereco({ ...endereco, predefinido: 'sim' }), 400)
})

test('avaliação: classificações de 1 a 5, sem produtos repetidos', () => {
  const ok = validarAvaliacao({ experiencia: { classificacao: 5, recomenda: true }, produtos: [{ itemEncomendaId: 3, classificacao: 4 }] })
  assert.equal(ok.avaliacaoEncomenda.classificacaoExperiencia, 5)
  assert.deepEqual(ok.avaliacoesProdutos, [{ itemEncomendaId: 3, classificacao: 4, comentario: null }])
  rejeita(() => validarAvaliacao({}), 400)
  rejeita(() => validarAvaliacao({ produtos: [{ itemEncomendaId: 3, classificacao: 6 }] }), 400)
  rejeita(() => validarAvaliacao({ experiencia: { classificacao: 4 } }), 400, /recomenda/)
  rejeita(() => validarAvaliacao({ produtos: [{ itemEncomendaId: 3, classificacao: 4 }, { itemEncomendaId: 3, classificacao: 2 }] }), 400)
})

test('pedidos de assistência e resposta da loja', () => {
  assert.equal(validarPedidoAssistencia({ tipoPedido: 'DUVIDA', assunto: 'Prazo', mensagem: 'Quando chega?' }).codigoEncomenda, null)
  rejeita(() => validarPedidoAssistencia({ tipoPedido: 'GARANTIA', assunto: 'A', mensagem: 'B' }), 400, /encomenda/)
  rejeita(() => validarPedidoAssistencia({ tipoPedido: 'OUTRO', assunto: 'A', mensagem: 'B' }), 400)
  rejeita(() => validarPedidoAssistencia({ tipoPedido: 'DUVIDA', assunto: '', mensagem: 'B' }), 400)
  assert.deepEqual(validarRespostaAssistencia({ estado: 'EM_CURSO' }), { estado: 'EM_CURSO', resposta: null })
  rejeita(() => validarRespostaAssistencia({ estado: 'RESOLVIDO' }), 400, /resposta/)
  rejeita(() => validarRespostaAssistencia({ estado: 'APAGADO' }), 400)
})

test('paginação com limites', () => {
  assert.deepEqual(paginacao({}), { pagina: 1, take: 10, skip: 0 })
  assert.deepEqual(paginacao({ pagina: '3', limite: '500' }), { pagina: 3, take: 50, skip: 100 })
  rejeita(() => paginacao({ pagina: '0' }), 400)
  rejeita(() => paginacao({ limite: 'x' }), 400)
})
