import * as empresas from '../services/empresa.service.js'

const responder = (operacao, estado = 200) => async (req, res, next) => {
  try {
    res.status(estado).json(await operacao(req))
  } catch (error) {
    next(error)
  }
}

export const registarEmpresa = responder(req => empresas.registarEmpresa(req.body ?? {}), 201)
export const obterMinhaEmpresa = responder(req => empresas.obterEmpresaDaConta(req.utilizador))

export const listarEmpresasAdmin = responder(req => empresas.listarEmpresas(req.query))
export const obterEmpresaAdmin = responder(req => empresas.obterEmpresa(req.params.id))
export const decidirEmpresaAdmin = responder(req => empresas.decidirEmpresa(req.params.id, req.body ?? {}, req.admin))
