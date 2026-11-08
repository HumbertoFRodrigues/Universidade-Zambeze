import { Router } from 'express'
import { sessaoOpcional } from '../middlewares/auth.middleware.js'
import * as encomendaController from '../controllers/encomenda.controller.js'

export const encomendaRoutes = Router()

encomendaRoutes.use(sessaoOpcional)

encomendaRoutes.get('/:codigo', encomendaController.consultar)
encomendaRoutes.get('/:codigo/factura', encomendaController.factura)
encomendaRoutes.post('/:codigo/cancelar', encomendaController.cancelar)