import * as cotacoes from '../services/cotacao.service.js'

const responder = (operacao, estado = 200) => async (req, res, next) => {
  try {
    res.status(estado).json(await operacao(req))
  } catch (error) {
    next(error)
  }
}

// Empresa (conta com perfil EMPRESA)
export const listarCotacoes = responder(req => cotacoes.listarCotacoesDaEmpresa(req.utilizador, req.query))
export const obterCotacao = responder(req => cotacoes.obterCotacaoDaEmpresa(req.utilizador, req.params.id))
export const pedirCotacao = responder(req => cotacoes.pedirCotacao(req.utilizador, req.body ?? {}), 201)
export const aceitarCotacao = responder(req => cotacoes.aceitarCotacao(req.utilizador, req.params.id, req.body ?? {}), 201)
export const validarLinhasSku = responder(req => cotacoes.validarLinhasSku(req.utilizador, req.body ?? {}))
export const recusarCotacao = responder(req => cotacoes.recusarCotacao(req.utilizador, req.params.id))

// Administração da loja
export const listarCotacoesAdmin = responder(req => cotacoes.listarCotacoesAdmin(req.query))
export const obterCotacaoAdmin = responder(req => cotacoes.obterCotacaoAdmin(req.params.id))
export const responderCotacaoAdmin = responder(req => cotacoes.responderCotacao(req.params.id, req.body ?? {}, req.admin))
export const listarDescontosGrupo = responder(() => cotacoes.listarDescontosGrupo())
export const criarDescontoGrupo = responder(req => cotacoes.criarDescontoGrupo(req.body ?? {}), 201)
export const actualizarDescontoGrupo = responder(req => cotacoes.actualizarDescontoGrupo(req.params.id, req.body ?? {}))
export const apagarDescontoGrupo = responder(req => cotacoes.apagarDescontoGrupo(req.params.id))
