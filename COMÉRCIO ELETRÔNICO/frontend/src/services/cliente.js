// Área do cliente: apenas endpoints que existem no backend.
// Perfil, moradas, preferências, listagem de encomendas e avaliações ainda não
// têm API; as páginas correspondentes indicam a limitação em vez de a simular.
import { authApi, encomendaClienteApi } from './api.js'

export const ESTADOS_ENCOMENDA = {
  REGISTADA: 'Registada',
  EM_PROCESSAMENTO: 'Em processamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

export const ESTADOS_ENTREGA = {
  POR_EXPEDIR: 'Por expedir',
  EM_TRANSPORTE: 'Em transporte',
  ENTREGUE: 'Entregue',
  NAO_ENTREGUE: 'Não entregue',
}

export const ESTADOS_PAGAMENTO = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  FALHADO: 'Falhado',
  REEMBOLSADO: 'Reembolsado',
}

export const ESTADOS_DEVOLUCAO = {
  SOLICITADA: 'Solicitada',
  EM_ANALISE: 'Em análise',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  PRODUTO_RECEBIDO: 'Produto recebido',
  REEMBOLSADA: 'Reembolsada',
}

export const ESTADOS_REEMBOLSO = { PENDENTE: 'Pendente', CONCLUIDO: 'Concluído', FALHADO: 'Falhado' }

export const ESTADOS_PEDIDO = { ABERTO: 'Aberto', EM_CURSO: 'Em curso', RESOLVIDO: 'Resolvido', FECHADO: 'Fechado' }

export const MOTIVOS_DEVOLUCAO = {
  ARREPENDIMENTO: 'Mudei de ideias',
  DIFERENTE_DA_DESCRICAO: 'Diferente da descrição',
  DEFEITUOSO: 'Produto com defeito',
  OUTRO: 'Outro motivo',
}

// Regra do backend em repor-palavra-passe (auth.service.js).
export const MINIMO_PALAVRA_PASSE = 6

// codigo_encomenda é VARCHAR(20) na base de dados.
export function validarCodigoEncomenda(codigo) {
  const valor = codigo.trim()
  if (!valor) return 'Indique o código da encomenda.'
  if (valor.length > 20 || !/^[A-Za-z0-9-]+$/.test(valor)) return 'O código da encomenda é inválido.'
  return ''
}

// Identificadores numéricos (SERIAL) das tabelas endereco, pagamento e devolucao.
export const idValido = id => /^[1-9]\d*$/.test(id)

export function mensagemDeErro(error) {
  if (error instanceof TypeError) return 'Não foi possível contactar o servidor. Verifique a ligação e tente novamente.'
  return error.message || 'Não foi possível concluir o pedido.'
}

export const clienteApi = {
  // Encomenda completa (itens, totais, morada e entrega). O email é sempre enviado: o backend
  // só devolve a encomenda quando coincide com o email de contacto.
  encomenda: (codigo, email, options = {}) => encomendaClienteApi.consultar(codigo, email, options),
  cancelarEncomenda: (codigo, email) => encomendaClienteApi.cancelar(codigo, email),
  pedirCodigoPalavraPasse: email => authApi.esquecer(email),
  reporPalavraPasse: (token, novaPalavraPasse) => authApi.repor({ token, novaPalavraPasse }),
}
