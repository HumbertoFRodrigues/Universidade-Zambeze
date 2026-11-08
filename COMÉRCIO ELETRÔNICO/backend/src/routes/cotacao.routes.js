import { Router } from 'express'
import { verificarSessao } from '../middlewares/auth.middleware.js'
import { exigirContaEmpresa } from '../middlewares/empresa.middleware.js'
import * as cotacoes from '../controllers/cotacao.controller.js'

// Cotações da conta de empresa. Pedir e aceitar exigem a empresa APROVADA (validado no serviço).
export const cotacaoRoutes = Router()

cotacaoRoutes.use(verificarSessao, exigirContaEmpresa)
cotacaoRoutes.get('/', cotacoes.listarCotacoes)
cotacaoRoutes.post('/', cotacoes.pedirCotacao)
// Encomenda rápida por SKU (antes de '/:id'): valida linhas "SKU, quantidade".
cotacaoRoutes.post('/sku', cotacoes.validarLinhasSku)
cotacaoRoutes.get('/:id', cotacoes.obterCotacao)
cotacaoRoutes.post('/:id/aceitar', cotacoes.aceitarCotacao)
cotacaoRoutes.post('/:id/recusar', cotacoes.recusarCotacao)
