import { Router } from 'express'
import { sessaoOpcional } from '../middlewares/auth.middleware.js'
import { bloquearContaEmpresa } from '../middlewares/empresa.middleware.js'
import { solicitarDevolucao } from '../controllers/devolucao.controller.js'

export const devolucaoRoutes = Router()

// Rota pública para os clientes solicitarem uma devolução
// O cliente identifica a encomenda pelo email de contacto ou pela sessão.
devolucaoRoutes.post('/', sessaoOpcional, bloquearContaEmpresa, solicitarDevolucao)