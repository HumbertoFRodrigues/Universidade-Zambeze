import { Router } from 'express'
import { sessaoOpcional } from '../middlewares/auth.middleware.js'
import { bloquearContaEmpresa } from '../middlewares/empresa.middleware.js'
import {
  consultarCarrinho,
  adicionarItemCarrinho,
  atualizarItemCarrinho,
  removerItemCarrinho,
} from '../controllers/carrinho.controller.js'

export const carrinhoRoutes = Router()

// A sessão (quando existe) identifica a conta; sem sessão usa-se o tokenSessao.
carrinhoRoutes.use(sessaoOpcional, bloquearContaEmpresa)

carrinhoRoutes.get('/', consultarCarrinho)
carrinhoRoutes.post('/itens', adicionarItemCarrinho)
carrinhoRoutes.put('/itens/:itemId', atualizarItemCarrinho)
carrinhoRoutes.delete('/itens/:itemId', removerItemCarrinho)