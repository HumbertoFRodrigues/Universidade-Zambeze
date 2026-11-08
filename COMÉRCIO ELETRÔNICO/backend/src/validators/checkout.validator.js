import { ErroCheckout } from '../errors/ErroCheckout.js'

// Identifica o carrinho e o cliente da encomenda.
// - tokenSessao: carrinho anónimo deste navegador (até 64 caracteres);
// - sem tokenSessao, o carrinho é o da conta com sessão iniciada;
// - utilizadorId enviado pelo cliente só é aceite se for o da sessão (nunca se confia nele);
// - clienteId (dono da encomenda) é sempre o utilizador da sessão, ou null para convidados.
export function validarIdentidade(dados, utilizadorSessao = null) {
  const temUtilizador = dados.utilizadorId !== undefined && dados.utilizadorId !== null && dados.utilizadorId !== ''
  const temToken = typeof dados.tokenSessao === 'string' && dados.tokenSessao.length > 0
  const clienteId = utilizadorSessao?.id ?? null

  if (temUtilizador && (clienteId === null || Number(dados.utilizadorId) !== clienteId)) {
    throw new ErroCheckout(403, 'O utilizador indicado não corresponde à sessão iniciada.')
  }
  if (temUtilizador && temToken) {
    throw new ErroCheckout(400, 'Indique um utilizador ou um token de sessão, mas não ambos.')
  }

  if (temToken) {
    if (dados.tokenSessao.length > 64) {
      throw new ErroCheckout(400, 'O token de sessão não pode exceder 64 caracteres.')
    }
    return { tokenSessao: dados.tokenSessao, clienteId }
  }
  if (clienteId !== null) return { utilizadorId: clienteId, clienteId }
  throw new ErroCheckout(400, 'Indique o token de sessão do carrinho ou inicie sessão.')
}

// Os identificadores começam em 0 (seed); null, '' e valores negativos continuam inválidos.
const identificadorValido = valor =>
  valor !== null && valor !== '' && Number.isSafeInteger(Number(valor)) && Number(valor) >= 0

export function validarOpcaoEntrega(zonaEntregaId, modalidadeEntregaId) {
  const zonaId = Number(zonaEntregaId)
  const modalidadeId = Number(modalidadeEntregaId)
  if (!identificadorValido(zonaEntregaId) || !identificadorValido(modalidadeEntregaId)) {
    throw new ErroCheckout(400, 'A zona e a modalidade de entrega são obrigatórias.')
  }
  return { zonaId, modalidadeId }
}

export function validarDadosContacto(dados) {
  const campos = [
    'nomeContacto',
    'emailContacto',
    'telefoneContacto',
    'entregaNomeDestinatario',
    'entregaTelefone',
    'entregaLinhaEndereco',
    'entregaCidade',
    'entregaProvincia',
  ]
  for (const campo of campos) {
    if (typeof dados[campo] !== 'string' || dados[campo].trim().length === 0) {
      throw new ErroCheckout(400, `O campo ${campo} é obrigatório.`)
    }
  }

  const limites = {
    nomeContacto: 150,
    emailContacto: 254,
    telefoneContacto: 30,
    entregaNomeDestinatario: 150,
    entregaTelefone: 30,
    entregaLinhaEndereco: 255,
    entregaCidade: 100,
    entregaProvincia: 100,
    entregaPontoReferencia: 255,
  }
  for (const [campo, limite] of Object.entries(limites)) {
    const valor = dados[campo]
    if (valor !== undefined && valor !== null &&
        (typeof valor !== 'string' || valor.trim().length > limite)) {
      throw new ErroCheckout(400, `O campo ${campo} excede o limite permitido.`)
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.emailContacto.trim())) {
    throw new ErroCheckout(400, 'O e-mail de contacto é inválido.')
  }
}

export function validarChaveIdempotencia(valor) {
  if (typeof valor !== 'string' || valor.length < 16 || valor.length > 64) {
    throw new ErroCheckout(400, 'Envie uma chave de idempotência com 16 a 64 caracteres no cabeçalho x-idempotency-key.')
  }
  return valor
}

export function validarAceiteTermos(dados) {
  if (dados.aceiteTermos !== true) {
    throw new ErroCheckout(400, 'É necessário aceitar os termos da loja para confirmar a encomenda.')
  }
}

export function validarConsultaEstadoEntrega(codigo, email) {
  if (typeof email !== 'string' || !email.trim()) {
    throw new ErroCheckout(400, 'Indique o e-mail usado na encomenda.')
  }
  return { codigo: codigo.trim(), email: email.trim() }
}

export function validarAtualizacaoEstadoEntrega(encomendaId, dados) {
  const id = Number(encomendaId)
  const { estado, recebidoPor, observacao } = dados
  if (!identificadorValido(encomendaId)) {
    throw new ErroCheckout(400, 'O identificador da encomenda é inválido.')
  }
  if (!['POR_EXPEDIR', 'EM_TRANSPORTE', 'ENTREGUE', 'NAO_ENTREGUE'].includes(estado)) {
    throw new ErroCheckout(400, 'Estado de entrega inválido.')
  }
  if (estado === 'ENTREGUE' && (typeof recebidoPor !== 'string' || !recebidoPor.trim())) {
    throw new ErroCheckout(400, 'Indique quem recebeu a encomenda para confirmar a entrega.')
  }
  if (recebidoPor !== undefined &&
      (typeof recebidoPor !== 'string' || recebidoPor.trim().length > 150)) {
    throw new ErroCheckout(400, 'O campo recebidoPor excede o limite permitido.')
  }
  if (observacao !== undefined &&
      (typeof observacao !== 'string' || observacao.trim().length > 255)) {
    throw new ErroCheckout(400, 'A observação excede o limite permitido.')
  }
  return { encomendaId: id, estado, recebidoPor, observacao }
}
