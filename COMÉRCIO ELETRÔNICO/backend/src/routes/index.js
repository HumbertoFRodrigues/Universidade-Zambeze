import express, { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { listarAvaliacoesProduto, listarProdutos, obterProduto } from '../controllers/produtos.controller.js'
import { authRoutes } from './auth.routes.js'
import { carrinhoRoutes } from './carrinho.routes.js'
import { adminRoutes } from './admin.routes.js'
import { checkoutRoutes } from './checkout.routes.js'
import { listarCategorias, listarPoliticas, obterConfiguracaoPublica } from '../controllers/public.controller.js'
import { encomendaRoutes } from './encomenda.routes.js' 
import { pagamentoRoutes } from './pagamento.routes.js'
import { devolucaoRoutes } from './devolucao.routes.js'
import { comercialRoutes } from './comercial.routes.js'
import { contaRoutes } from './conta.routes.js'
import { empresaRoutes } from './empresa.routes.js'
import { cotacaoRoutes } from './cotacao.routes.js'
import { sessaoOpcional, verificarSessao } from '../middlewares/auth.middleware.js'
import { avaliarProduto, enviarImagemAvaliacao, minhaAvaliacao } from '../controllers/avaliacoes.controller.js'
import { promocoesDestaque } from '../controllers/promocoes.controller.js'

export const routes = Router()

routes.get('/health', async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`
  response.json({ status: 'ok', database: 'connected' })
})

// Módulo de produtos
routes.get(['/produtos', '/products'], listarProdutos)
routes.get(['/produtos/:slug', '/products/:slug'], obterProduto)
routes.get('/produtos/:slug/avaliacoes', listarAvaliacoesProduto)
routes.get('/produtos/:slug/avaliacoes/minha', verificarSessao, minhaAvaliacao)
routes.post('/produtos/:slug/avaliacoes', verificarSessao, avaliarProduto)
routes.post('/produtos/:slug/avaliacoes/imagens', verificarSessao, express.raw({ type: 'image/*', limit: '3mb' }), enviarImagemAvaliacao)
routes.get('/categorias', listarCategorias)
routes.get('/politicas', listarPoliticas)
routes.get('/configuracao-publica', obterConfiguracaoPublica)
routes.get('/promocoes/destaque', sessaoOpcional, promocoesDestaque)

// Módulo de carrinho
routes.use('/carrinho', carrinhoRoutes)

// Módulo de autenticação
routes.use('/auth', authRoutes)

// Módulo administrativo
routes.use('/admin', adminRoutes)

// Módulo de encomendas
routes.use('/encomendas', encomendaRoutes) 

// Módulo de pagamentos (ANTES DA ROTA '/')
routes.use('/pagamentos', pagamentoRoutes)

// Módulo de devoluções
routes.use('/devolucoes', devolucaoRoutes)

// Módulo comercial
routes.use('/comercial', comercialRoutes)

// Área do cliente (perfil, endereços, encomendas, pagamentos, devoluções, avaliações, assistência)
routes.use('/conta', contaRoutes)

// Conta de empresa (B2B)
routes.use('/empresa', empresaRoutes)
routes.use('/cotacoes', cotacaoRoutes)

// Rotas de checkout
routes.use('/', checkoutRoutes)