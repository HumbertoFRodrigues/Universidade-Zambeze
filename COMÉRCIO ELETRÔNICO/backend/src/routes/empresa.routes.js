import { Router } from 'express'
import { verificarSessao } from '../middlewares/auth.middleware.js'
import { exigirContaEmpresa } from '../middlewares/empresa.middleware.js'
import { obterMinhaEmpresa } from '../controllers/empresa.controller.js'

// Área da conta de empresa (dados e estado da aprovação).
export const empresaRoutes = Router()

empresaRoutes.use(verificarSessao, exigirContaEmpresa)
empresaRoutes.get('/', obterMinhaEmpresa)
