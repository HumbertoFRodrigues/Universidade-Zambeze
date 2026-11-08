// Estados reais definidos no schema Prisma (EstadoEncomenda, EstadoPagamento, EstadoEntrega).
import { ESTADOS_ENCOMENDA, ESTADOS_ENTREGA } from '../services/cliente.js'

export { ESTADOS_ENCOMENDA, ESTADOS_ENTREGA }

export const ESTADOS_PAGAMENTO = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  FALHADO: 'Falhado',
  REEMBOLSADO: 'Reembolsado',
}

export const CLASSES_ENCOMENDA = {
  REGISTADA: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  EM_PROCESSAMENTO: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  CONCLUIDA: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  CANCELADA: 'bg-red-100 text-red-700 hover:bg-red-100',
}

export const CLASSES_PAGAMENTO = {
  PENDENTE: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  CONFIRMADO: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  FALHADO: 'bg-red-100 text-red-700 hover:bg-red-100',
  REEMBOLSADO: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
}

export const CLASSES_ENTREGA = {
  POR_EXPEDIR: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  EM_TRANSPORTE: 'bg-sky-100 text-sky-700 hover:bg-sky-100',
  ENTREGUE: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  NAO_ENTREGUE: 'bg-red-100 text-red-700 hover:bg-red-100',
}

// historico_estado_encomenda.observacao e entrega.observacao são VARCHAR(255).
export const MAX_OBSERVACAO = 255

// Quando a encomenda não tem pagamento, o backend devolve pagamentoEstado 'PENDENTE'
// por omissão; a referência vazia indica que não existe registo de pagamento.
export const temPagamento = encomenda => Boolean(encomenda?.pagamentoReferencia)

export const caminhoEncomenda = (codigo, sub = '') =>
  `/admin/encomendas/${encodeURIComponent(codigo)}${sub ? `/${sub}` : ''}`

export const caminhoPagamento = referencia => `/admin/pagamentos/${encodeURIComponent(referencia)}`

// A entrega é 1:1 com a encomenda e o endpoint usa o id da encomenda.
export const caminhoEntrega = (encomendaId, sub = '') => `/admin/entregas/${encomendaId}${sub ? `/${sub}` : ''}`

// Transições aceites por atualizarEstadoEntrega (checkout.service.js).
// POR_EXPEDIR → ENTREGUE só é aceite em levantamento na loja; a API não indica
// a modalidade, por isso essa decisão fica com o servidor.
export const TRANSICOES_ENTREGA = {
  POR_EXPEDIR: ['EM_TRANSPORTE', 'NAO_ENTREGUE'],
  EM_TRANSPORTE: ['ENTREGUE', 'NAO_ENTREGUE'],
  NAO_ENTREGUE: ['EM_TRANSPORTE'],
  ENTREGUE: [],
}

// recebidoPor é VARCHAR(150).
export const MAX_RECEBIDO_POR = 150

export const entregaEditavel = encomenda => encomenda.estado !== 'CANCELADA' && encomenda.entregaEstado !== 'ENTREGUE'

export const podeConfirmarEntrega = encomenda =>
  encomenda.estado !== 'CANCELADA' && ['EM_TRANSPORTE', 'POR_EXPEDIR'].includes(encomenda.entregaEstado)
