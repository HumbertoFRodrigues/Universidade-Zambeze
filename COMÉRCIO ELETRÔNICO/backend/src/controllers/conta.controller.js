import * as conta from '../services/conta.service.js'

// Cada handler devolve o resultado do serviço; os erros { status, message } seguem para o error-handler.
const responder = (operacao, estado = 200) => async (req, res, next) => {
  try {
    res.status(estado).json(await operacao(req))
  } catch (error) {
    next(error)
  }
}

export const obterPerfil = responder(req => conta.obterPerfil(req.utilizador))
export const actualizarPerfil = responder(req => conta.actualizarPerfil(req.utilizador, req.body ?? {}))

export const listarEnderecos = responder(req => conta.listarEnderecos(req.utilizador))
export const obterEndereco = responder(req => conta.obterEndereco(req.utilizador, req.params.id))
export const criarEndereco = responder(req => conta.criarEndereco(req.utilizador, req.body ?? {}), 201)
export const actualizarEndereco = responder(req => conta.actualizarEndereco(req.utilizador, req.params.id, req.body ?? {}))
export const apagarEndereco = responder(req => conta.apagarEndereco(req.utilizador, req.params.id))

export const listarEncomendas = responder(req => conta.listarEncomendas(req.utilizador, req.query))
export const obterAvaliacaoEncomenda = responder(req => conta.obterAvaliacaoEncomenda(req.utilizador, req.params.codigo))
export const avaliarEncomenda = responder(req => conta.avaliarEncomenda(req.utilizador, req.params.codigo, req.body ?? {}), 201)

export const listarPagamentos = responder(req => conta.listarPagamentos(req.utilizador, req.query))
export const obterPagamento = responder(req => conta.obterPagamento(req.utilizador, req.params.id))
export const listarReembolsos = responder(req => conta.listarReembolsos(req.utilizador))
export const obterReembolso = responder(req => conta.obterReembolso(req.utilizador, req.params.id))
export const listarDevolucoes = responder(req => conta.listarDevolucoes(req.utilizador))
export const obterDevolucao = responder(req => conta.obterDevolucao(req.utilizador, req.params.id))
export const listarAvaliacoes = responder(req => conta.listarAvaliacoes(req.utilizador))

export const listarPedidosAssistencia = responder(req => conta.listarPedidosAssistencia(req.utilizador, req.query))
export const obterPedidoAssistencia = responder(req => conta.obterPedidoAssistencia(req.utilizador, req.params.id))
export const criarPedidoAssistencia = responder(req => conta.criarPedidoAssistencia(req.utilizador, req.body ?? {}), 201)
