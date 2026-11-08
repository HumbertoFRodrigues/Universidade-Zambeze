// Validação dos dados da área do cliente. Funções puras que lançam { status, message }
// (tratado pelo error-handler). Limites iguais às colunas do schema.

const erro = message => ({ status: 400, message })

function texto(valor, campo, { max, obrigatorio = false }) {
  if (valor === undefined || valor === null || valor === '') {
    if (obrigatorio) throw erro(`O campo ${campo} é obrigatório.`)
    return null
  }
  if (typeof valor !== 'string') throw erro(`O campo ${campo} é inválido.`)
  const limpo = valor.trim()
  if (obrigatorio && !limpo) throw erro(`O campo ${campo} é obrigatório.`)
  if (limpo.length > max) throw erro(`O campo ${campo} não pode exceder ${max} caracteres.`)
  return limpo || null
}

export function identificador(valor, nome = 'identificador') {
  const id = Number(valor)
  if (valor === null || valor === '' || !Number.isSafeInteger(id) || id < 0) throw erro(`O ${nome} é inválido.`)
  return id
}

export function paginacao(query = {}, { limitePadrao = 10, limiteMaximo = 50 } = {}) {
  const pagina = query.pagina === undefined ? 1 : Number(query.pagina)
  const limite = query.limite === undefined ? limitePadrao : Number(query.limite)
  if (!Number.isSafeInteger(pagina) || pagina < 1 || !Number.isSafeInteger(limite) || limite < 1) {
    throw erro('A página e o limite devem ser números inteiros positivos.')
  }
  const take = Math.min(limite, limiteMaximo)
  return { pagina, take, skip: (pagina - 1) * take }
}

// O email não é alterável aqui: é o identificador de login e das encomendas de convidado.
export function validarPerfil(dados = {}) {
  if (dados.email !== undefined) throw erro('O email da conta não pode ser alterado nesta operação.')
  return {
    nome: texto(dados.nome, 'nome', { max: 150, obrigatorio: true }),
    telefone: texto(dados.telefone, 'telefone', { max: 30, obrigatorio: true }),
  }
}

export function validarEndereco(dados = {}) {
  if (dados.predefinido !== undefined && typeof dados.predefinido !== 'boolean') {
    throw erro('O campo predefinido deve ser verdadeiro ou falso.')
  }
  return {
    etiqueta: texto(dados.etiqueta, 'etiqueta', { max: 50 }),
    nomeDestinatario: texto(dados.nomeDestinatario, 'nomeDestinatario', { max: 150, obrigatorio: true }),
    telefone: texto(dados.telefone, 'telefone', { max: 30, obrigatorio: true }),
    linhaEndereco: texto(dados.linhaEndereco, 'linhaEndereco', { max: 255, obrigatorio: true }),
    cidade: texto(dados.cidade, 'cidade', { max: 100, obrigatorio: true }),
    provincia: texto(dados.provincia, 'provincia', { max: 100, obrigatorio: true }),
    pontoReferencia: texto(dados.pontoReferencia, 'pontoReferencia', { max: 255 }),
    zonaEntregaId: identificador(dados.zonaEntregaId, 'identificador da zona de entrega'),
    predefinido: dados.predefinido === true,
  }
}

const MAX_COMENTARIO = 2000

function classificacao(valor, campo) {
  const nota = Number(valor)
  if (!Number.isSafeInteger(nota) || nota < 1 || nota > 5) throw erro(`A ${campo} deve ser um número inteiro de 1 a 5.`)
  return nota
}

// { experiencia?: { classificacao, recomenda, comentario }, produtos?: [{ itemEncomendaId, classificacao, comentario }] }
export function validarAvaliacao(dados = {}) {
  const { experiencia, produtos = [] } = dados
  if (!Array.isArray(produtos)) throw erro('A lista de produtos avaliados é inválida.')
  if (!experiencia && produtos.length === 0) throw erro('Avalie a encomenda ou pelo menos um produto.')

  let avaliacaoEncomenda = null
  if (experiencia) {
    if (typeof experiencia.recomenda !== 'boolean') throw erro('Indique se recomenda a loja.')
    avaliacaoEncomenda = {
      classificacaoExperiencia: classificacao(experiencia.classificacao, 'classificação da experiência'),
      recomenda: experiencia.recomenda,
      comentario: texto(experiencia.comentario, 'comentário', { max: MAX_COMENTARIO }),
    }
  }

  const vistos = new Set()
  const avaliacoesProdutos = produtos.map(produto => {
    const itemEncomendaId = identificador(produto?.itemEncomendaId, 'produto avaliado')
    if (vistos.has(itemEncomendaId)) throw erro('Cada produto só pode ser avaliado uma vez.')
    vistos.add(itemEncomendaId)
    return {
      itemEncomendaId,
      classificacao: classificacao(produto.classificacao, 'classificação do produto'),
      comentario: texto(produto.comentario, 'comentário', { max: MAX_COMENTARIO }),
    }
  })
  return { avaliacaoEncomenda, avaliacoesProdutos }
}

export const TIPOS_PEDIDO = ['DUVIDA', 'GARANTIA', 'RECLAMACAO']
export const ESTADOS_PEDIDO = ['ABERTO', 'EM_CURSO', 'RESOLVIDO', 'FECHADO']

export function validarPedidoAssistencia(dados = {}) {
  if (!TIPOS_PEDIDO.includes(dados.tipoPedido)) throw erro('O tipo de pedido é inválido.')
  const codigoEncomenda = texto(dados.codigoEncomenda, 'codigoEncomenda', { max: 20 })
  // Um pedido de garantia refere-se sempre a um produto comprado.
  if (dados.tipoPedido === 'GARANTIA' && !codigoEncomenda) {
    throw erro('Indique a encomenda do produto em garantia.')
  }
  return {
    tipoPedido: dados.tipoPedido,
    codigoEncomenda,
    assunto: texto(dados.assunto, 'assunto', { max: 150, obrigatorio: true }),
    mensagem: texto(dados.mensagem, 'mensagem', { max: 5000, obrigatorio: true }),
  }
}

// Resposta da loja (admin): estado obrigatório; resposta opcional, mas exigida ao resolver.
export function validarRespostaAssistencia(dados = {}) {
  if (!ESTADOS_PEDIDO.includes(dados.estado)) throw erro('O estado do pedido é inválido.')
  const resposta = texto(dados.resposta, 'resposta', { max: 5000 })
  if (dados.estado === 'RESOLVIDO' && !resposta) throw erro('Escreva a resposta ao marcar o pedido como resolvido.')
  return { estado: dados.estado, resposta }
}
