import { Router } from 'express'
import { verificarSessao } from '../middlewares/auth.middleware.js'
import * as conta from '../controllers/conta.controller.js'

// Área do cliente: exige sessão e só devolve dados da conta da sessão.
export const contaRoutes = Router()

contaRoutes.use(verificarSessao)

contaRoutes.get('/perfil', conta.obterPerfil)
contaRoutes.put('/perfil', conta.actualizarPerfil)

contaRoutes.get('/enderecos', conta.listarEnderecos)
contaRoutes.post('/enderecos', conta.criarEndereco)
contaRoutes.get('/enderecos/:id', conta.obterEndereco)
contaRoutes.put('/enderecos/:id', conta.actualizarEndereco)
contaRoutes.delete('/enderecos/:id', conta.apagarEndereco)

contaRoutes.get('/encomendas', conta.listarEncomendas)
contaRoutes.get('/encomendas/:codigo/avaliacao', conta.obterAvaliacaoEncomenda)
contaRoutes.post('/encomendas/:codigo/avaliacao', conta.avaliarEncomenda)

contaRoutes.get('/pagamentos', conta.listarPagamentos)
contaRoutes.get('/pagamentos/:id', conta.obterPagamento)
contaRoutes.get('/reembolsos', conta.listarReembolsos)
contaRoutes.get('/reembolsos/:id', conta.obterReembolso)
contaRoutes.get('/devolucoes', conta.listarDevolucoes)
contaRoutes.get('/devolucoes/:id', conta.obterDevolucao)
contaRoutes.get('/avaliacoes', conta.listarAvaliacoes)

contaRoutes.get('/pedidos-assistencia', conta.listarPedidosAssistencia)
contaRoutes.post('/pedidos-assistencia', conta.criarPedidoAssistencia)
contaRoutes.get('/pedidos-assistencia/:id', conta.obterPedidoAssistencia)
