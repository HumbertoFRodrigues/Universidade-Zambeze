import { Router } from 'express'
import { sessaoOpcional } from '../middlewares/auth.middleware.js'
import { bloquearContaEmpresa } from '../middlewares/empresa.middleware.js'
import {
  calcularFrete,
  confirmarCheckout,
  listarOpcoesEntrega,
  obterEstadoEntrega,
} from '../controllers/checkout.controller.js'

export const checkoutRoutes = Router()

checkoutRoutes.get('/entregas/opcoes', listarOpcoesEntrega)
checkoutRoutes.post('/checkout/calcular-frete', sessaoOpcional, bloquearContaEmpresa, calcularFrete)
checkoutRoutes.post('/checkout/confirmar', sessaoOpcional, bloquearContaEmpresa, confirmarCheckout)
checkoutRoutes.get('/encomendas/:codigo/entrega', obterEstadoEntrega)
