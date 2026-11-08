import express, { Router } from 'express'
import { sessaoOpcional } from '../middlewares/auth.middleware.js'
import { permitirEmpresaSoEmCotacoes } from '../middlewares/empresa.middleware.js'
import { limitePagamentos } from '../middlewares/limite-tentativas.middleware.js'
import * as pagamentoController from '../controllers/pagamento.controller.js'

export const pagamentoRoutes = Router()

pagamentoRoutes.post('/simular', limitePagamentos, sessaoOpcional, permitirEmpresaSoEmCotacoes, pagamentoController.simular)
pagamentoRoutes.post('/mpesa', limitePagamentos, sessaoOpcional, permitirEmpresaSoEmCotacoes, pagamentoController.pagarMpesa)
pagamentoRoutes.post(
  '/transferencia', limitePagamentos, sessaoOpcional, permitirEmpresaSoEmCotacoes,
  express.raw({ type: ['image/*', 'application/pdf'], limit: '3mb' }), pagamentoController.enviarComprovativo,
)
