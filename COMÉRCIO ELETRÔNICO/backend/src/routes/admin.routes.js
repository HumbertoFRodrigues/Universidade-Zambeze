import { Router } from 'express'
import * as pagamentoController from '../controllers/pagamento.controller.js'
import { listarAvaliacoesAdmin, moderarAvaliacao } from '../controllers/avaliacoes.controller.js'
import { actualizarPromocaoAdmin, criarPromocaoAdmin, listarPromocoesAdmin, obterPromocaoAdmin } from '../controllers/promocoes.controller.js'
import { listarAuditoriaAdmin, listarHistoricoPagamentosAdmin, listarMovimentosStockAdmin } from '../controllers/admin-consultas.controller.js'
import { verificarAdmin } from '../middlewares/admin.middleware.js'
import {
  criarCategoria,
  atualizarPrecoProduto,
  gerirStockProduto,
  listarStockBaixo,
} from '../controllers/admin.controller.js'
import { atualizarEstadoEntrega } from '../controllers/checkout.controller.js'
import {
  actualizarCategoria,
  actualizarConfiguracaoAdmin,
  actualizarEncomendaAdmin,
  actualizarPoliticaAdmin,
  actualizarProdutoAdmin,
  criarProdutoAdmin,
  desactivarCategoria,
  desactivarProdutoAdmin,
  listarCategoriasAdmin,
  listarEncomendasAdmin,
  listarProdutosAdmin,
  obterConfiguracaoAdmin,
  obterPainelAdmin,
} from '../controllers/admin-management.controller.js'
import {
  listarDevolucoesAdmin,
  analisarDevolucaoAdmin,
  registarRececaoProdutoAdmin,
  processarReembolsoSimuladoAdmin
} from '../controllers/devolucao.controller.js'
import {
  listarTodosPagamentosAdmin,
  alternarEstadoPagamentoAdmin
} from '../controllers/admin-management.controller.js'

import {
  listarHistoricoEncomendaAdmin,
  listarPedidosAssistenciaAdmin,
  listarReembolsosAdmin,
  obterPedidoAssistenciaAdmin,
  responderPedidoAssistenciaAdmin,
} from '../controllers/admin-atendimento.controller.js'

import { decidirEmpresaAdmin, listarEmpresasAdmin, obterEmpresaAdmin } from '../controllers/empresa.controller.js'

import {
  actualizarDescontoGrupo,
  apagarDescontoGrupo,
  criarDescontoGrupo,
  listarCotacoesAdmin,
  listarDescontosGrupo,
  obterCotacaoAdmin,
  responderCotacaoAdmin,
} from '../controllers/cotacao.controller.js'

import { emitirFacturaAdmin, listarFacturasAdmin, pdfFacturaAdmin } from '../controllers/factura.controller.js'

export const adminRoutes = Router()

// Aplicar o middleware de administrador em todas as rotas abaixo
adminRoutes.use(verificarAdmin)

// Consultas só de leitura (histórico de pagamentos, movimentos de stock, auditoria)
adminRoutes.get('/pagamentos/historico', listarHistoricoPagamentosAdmin)
adminRoutes.get('/stock/movimentos', listarMovimentosStockAdmin)
adminRoutes.get('/auditoria', listarAuditoriaAdmin)

adminRoutes.get('/painel', obterPainelAdmin)
adminRoutes.get('/configuracao', obterConfiguracaoAdmin)
adminRoutes.put('/configuracao', actualizarConfiguracaoAdmin)
adminRoutes.put('/politicas/:tipo', actualizarPoliticaAdmin)

// Categorias
adminRoutes.get('/categorias', listarCategoriasAdmin)
adminRoutes.post('/categorias', criarCategoria)
adminRoutes.put('/categorias/:categoriaId', actualizarCategoria)
adminRoutes.delete('/categorias/:categoriaId', desactivarCategoria)

// Produtos
adminRoutes.get('/produtos', listarProdutosAdmin)
adminRoutes.post('/produtos', criarProdutoAdmin)
adminRoutes.get('/produtos/stock-baixo', listarStockBaixo)
adminRoutes.put('/produtos/:produtoId', actualizarProdutoAdmin)
adminRoutes.delete('/produtos/:produtoId', desactivarProdutoAdmin)

// Preços (com histórico)
adminRoutes.put('/produtos/:produtoId/preco', atualizarPrecoProduto)

// Stock (Entradas, Ajustes e Relatório de Stock Baixo)
adminRoutes.put('/produtos/:produtoId/stock', gerirStockProduto)

// Encomendas
adminRoutes.get('/encomendas', listarEncomendasAdmin)
adminRoutes.patch('/encomendas/:encomendaId', actualizarEncomendaAdmin)
adminRoutes.get('/encomendas/:encomendaId/historico', listarHistoricoEncomendaAdmin)

// Entregas
adminRoutes.patch('/encomendas/:encomendaId/entrega', atualizarEstadoEntrega)

// Devoluções
adminRoutes.get('/devolucoes', listarDevolucoesAdmin)
adminRoutes.patch('/devolucoes/:id/decisao', analisarDevolucaoAdmin)
adminRoutes.patch('/devolucoes/:id/rececao', registarRececaoProdutoAdmin)
adminRoutes.post('/devolucoes/:id/reembolso', processarReembolsoSimuladoAdmin)

// Empresas (B2B): aprovar ou suspender
adminRoutes.get('/empresas', listarEmpresasAdmin)
adminRoutes.get('/empresas/:id', obterEmpresaAdmin)
adminRoutes.patch('/empresas/:id/estado', decidirEmpresaAdmin)

// Cotações B2B e descontos por grupo (preço sugerido)
adminRoutes.get('/cotacoes', listarCotacoesAdmin)
adminRoutes.get('/cotacoes/:id', obterCotacaoAdmin)
adminRoutes.patch('/cotacoes/:id/responder', responderCotacaoAdmin)
adminRoutes.get('/descontos-grupo', listarDescontosGrupo)
adminRoutes.post('/descontos-grupo', criarDescontoGrupo)
adminRoutes.put('/descontos-grupo/:id', actualizarDescontoGrupo)
adminRoutes.delete('/descontos-grupo/:id', apagarDescontoGrupo)

// Facturas (modelo por validar por contabilista)
adminRoutes.get('/facturas', listarFacturasAdmin)
adminRoutes.get('/facturas/:id/pdf', pdfFacturaAdmin)
adminRoutes.post('/encomendas/:encomendaId/factura', emitirFacturaAdmin)

// Reembolsos registados
adminRoutes.get('/reembolsos', listarReembolsosAdmin)

// Pedidos de assistência (dúvidas, garantias e reclamações)
adminRoutes.get('/pedidos-assistencia', listarPedidosAssistenciaAdmin)
adminRoutes.get('/pedidos-assistencia/:id', obterPedidoAssistenciaAdmin)
adminRoutes.patch('/pedidos-assistencia/:id', responderPedidoAssistenciaAdmin)

// Pagamentos
adminRoutes.get('/pagamentos', listarTodosPagamentosAdmin)
adminRoutes.patch('/pagamentos/:id/estado', alternarEstadoPagamentoAdmin)
// Transferências bancárias em análise (comprovativo enviado pelo cliente)
adminRoutes.get('/transferencias', pagamentoController.listarTransferencias)
adminRoutes.get('/transferencias/:id/comprovativo', pagamentoController.verComprovativo)
adminRoutes.post('/transferencias/:id/confirmar', pagamentoController.confirmarTransferencia)
adminRoutes.post('/transferencias/:id/rejeitar', pagamentoController.rejeitarTransferencia)

// Moderação das avaliações de produtos (pendentes, aprovadas, rejeitadas)
adminRoutes.get('/avaliacoes', listarAvaliacoesAdmin)
adminRoutes.patch('/avaliacoes/:id/estado', moderarAvaliacao)

// Promoções (campanhas como Black Friday): criar, editar, activar e desactivar
adminRoutes.get('/promocoes', listarPromocoesAdmin)
adminRoutes.get('/promocoes/:id', obterPromocaoAdmin)
adminRoutes.post('/promocoes', criarPromocaoAdmin)
adminRoutes.patch('/promocoes/:id', actualizarPromocaoAdmin)
