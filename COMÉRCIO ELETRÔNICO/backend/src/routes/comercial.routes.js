import { Router } from 'express'
import {
  obterInformacoesLoja,
  listarPoliticas,
  obterPoliticaEspecifica,
  listarFormasPagamento,
  listarOpcoesEntrega
} from '../controllers/comercial.controller.js'

export const comercialRoutes = Router()

// Informações gerais e contactos
comercialRoutes.get('/loja', obterInformacoesLoja)

// Políticas e Garantias
comercialRoutes.get('/politicas', listarPoliticas)
comercialRoutes.get('/politicas/:tipo', obterPoliticaEspecifica) // Tipos: PRIVACIDADE, TERMOS, ENTREGA, DEVOLUCAO, GARANTIA

// Checkout e Logística
comercialRoutes.get('/pagamentos', listarFormasPagamento)
comercialRoutes.get('/entregas', listarOpcoesEntrega)