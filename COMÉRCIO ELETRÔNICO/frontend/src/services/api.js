const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = localStorage.getItem('token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body = options.body
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const response = await fetch(baseUrl + path, { ...options, headers, body })
  if (response.status === 401 && !path.endsWith('/login')) {
    window.dispatchEvent(new Event('auth:unauthorized'))
  }
  if (response.status === 204) return null

  const data = await response.json().catch(() => ({}))
  // IP bloqueado após tentativas de login falhadas: o site inteiro mostra "Acesso restrito".
  if (response.status === 429 && data.bloqueado) {
    window.dispatchEvent(new CustomEvent('acesso:restrito', { detail: { segundos: data.segundos || 50 } }))
  }
  if (!response.ok) {
    const erro = new Error(data.message || 'Não foi possível concluir o pedido.')
    erro.status = response.status
    throw erro
  }
  return data
}

// Descarrega um ficheiro (por exemplo, o PDF de uma factura) com a sessão actual.
export async function descarregar(path, nomeFicheiro) {
  const headers = new Headers()
  const token = localStorage.getItem('token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(baseUrl + path, { headers })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const erro = new Error(data.message || 'Não foi possível descarregar o ficheiro.')
    erro.status = response.status
    throw erro
  }
  const url = URL.createObjectURL(await response.blob())
  const ligacao = document.createElement('a')
  ligacao.href = url
  ligacao.download = nomeFicheiro
  document.body.appendChild(ligacao)
  ligacao.click()
  ligacao.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function queryString(parametros = {}) {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === null || valor === '') continue
    const nome = { search: 'pesquisa', limit: 'limite' }[chave] || chave
    params.set(nome, String(valor))
  }
  return params.toString()
}

const enviar = (method, body) => ({ method, body })

export const authApi = {
  async login({ email, password, palavraPasse }) {
    const resposta = await api('/auth/login', enviar('POST', { email, palavraPasse: palavraPasse || password }))
    return { token: resposta.token, user: resposta.utilizador }
  },
  me: () => api('/auth/me').then(resposta => resposta.utilizador),
  logout: () => api('/auth/logout', enviar('POST')),
  registar: dados => api('/auth/registar', enviar('POST', {
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    palavraPasse: dados.palavraPasse || dados.senha,
    aceitePrivacidade: dados.aceitePrivacidade ?? true,
  })),
  // Conta de empresa (B2B): fica PENDENTE até a loja aprovar.
  registarEmpresa: dados => api('/auth/registar-empresa', enviar('POST', dados)),
  esquecer: email => api('/auth/esquecer-palavra-passe', enviar('POST', { email })),
  repor: dados => api('/auth/repor-palavra-passe', enviar('POST', dados)),
}

export const produtosApi = {
  listar: (parametros, opcoes) => api(`/admin/produtos?${queryString(parametros)}`, opcoes),
  // O backend não expõe GET /admin/produtos/:id; percorre-se a listagem administrativa
  // (que inclui produtos inactivos) até encontrar o identificador.
  async obter(id, opcoes) {
    for (let pagina = 1; ; pagina += 1) {
      const resposta = await produtosApi.listar({ pagina, limite: 50 }, opcoes)
      const produto = (resposta.produtos || []).find(item => item.id === id)
      if (produto) return produto
      if (pagina >= (resposta.totalPaginas || 0)) return null
    }
  },
  // Carrega todos os produtos (activos e inactivos) página a página.
  async listarTodos(opcoes) {
    const produtos = []
    for (let pagina = 1; ; pagina += 1) {
      const resposta = await produtosApi.listar({ pagina, limite: 50 }, opcoes)
      produtos.push(...(resposta.produtos || []))
      if (pagina >= (resposta.totalPaginas || 0)) return produtos
    }
  },
  criar: dados => api('/admin/produtos', enviar('POST', dados)),
  actualizar: (id, dados) => api(`/admin/produtos/${encodeURIComponent(id)}`, enviar('PUT', dados)),
  alterarPreco: (id, dados) => api(`/admin/produtos/${encodeURIComponent(id)}/preco`, enviar('PUT', dados)),
  // tipoMovimento: 'ENTRADA' ou 'AJUSTE'; o backend regista o movimento e a auditoria.
  movimentarStock: (id, dados) => api(`/admin/produtos/${encodeURIComponent(id)}/stock`, enviar('PUT', dados)),
  stockBaixo: opcoes => api('/admin/produtos/stock-baixo', opcoes),
  apagar: id => api(`/admin/produtos/${encodeURIComponent(id)}`, enviar('DELETE')),
}

export const categoriasApi = {
  listar: () => api('/categorias'),
  listarAdmin: opcoes => api('/admin/categorias', opcoes),
  // Catálogo público: devolve apenas produtos activos da categoria.
  produtosActivos: (id, parametros, opcoes) => api(`/produtos?${queryString({ ...parametros, categoria: id })}`, opcoes),
  criar: dados => api('/admin/categorias', enviar('POST', dados)),
  actualizar: (id, dados) => api(`/admin/categorias/${encodeURIComponent(id)}`, enviar('PUT', dados)),
  apagar: id => api(`/admin/categorias/${encodeURIComponent(id)}`, enviar('DELETE')),
}

export const encomendasApi = {
  listar: (parametros, opcoes) => api(`/admin/encomendas?${queryString(parametros)}`, opcoes),
  // Não existe GET /admin/encomendas/:codigo: pesquisa-se pelo código (que também
  // procura no nome e email do cliente) e escolhe-se a correspondência exacta.
  async obterPorCodigo(codigo, opcoes) {
    const resposta = await encomendasApi.listar({ pesquisa: codigo, limite: 50 }, opcoes)
    const lista = resposta.encomendas || []
    return lista.find(item => item.codigo === codigo)
      || lista.find(item => item.codigo.toLowerCase() === codigo.toLowerCase())
      || null
  },
  // Carrega todas as encomendas página a página (máx. 50 por pedido).
  async listarTodas(opcoes) {
    const encomendas = []
    for (let pagina = 1; ; pagina += 1) {
      const resposta = await encomendasApi.listar({ pagina, limite: 50 }, opcoes)
      encomendas.push(...(resposta.encomendas || []))
      if (pagina >= (resposta.totalPaginas || 0)) return encomendas
    }
  },
  actualizar: (id, dados) => api(`/admin/encomendas/${encodeURIComponent(id)}`, enviar('PATCH', dados)),
}

export const entregasApi = {
  // Aplica as transições permitidas no backend (atualizarEstadoEntrega).
  actualizar: (encomendaId, dados) => api(`/admin/encomendas/${encodeURIComponent(encomendaId)}/entrega`, enviar('PATCH', dados)),
  // Datas, quem recebeu e observação; exige o email de contacto da encomenda.
  consultar: (codigo, email, opcoes) => api(`/encomendas/${encodeURIComponent(codigo)}/entrega?${queryString({ email })}`, opcoes),
}

// Não existem endpoints administrativos de avaliações (nem moderação no schema).
// Usam-se os endpoints públicos, que só abrangem produtos activos.
export const avaliacoesApi = {
  // Catálogo público: cada produto traz a média (nota) e o total de avaliações.
  async produtosAvaliados(opcoes) {
    const produtos = []
    for (let pagina = 1; ; pagina += 1) {
      const resposta = await api(`/produtos?${queryString({ pagina, limite: 50, ordenar: 'nome-asc' })}`, opcoes)
      produtos.push(...(resposta.produtos || []).filter(produto => produto.avaliacoes > 0))
      if (pagina >= (resposta.totalPaginas || 0)) return produtos
    }
  },
  produto: (slug, opcoes) => api(`/produtos/${encodeURIComponent(slug)}`, opcoes),
  doProduto: (slug, parametros, opcoes) => api(`/produtos/${encodeURIComponent(slug)}/avaliacoes?${queryString(parametros)}`, opcoes),
  // Cliente: se pode avaliar e o estado da sua avaliação; enviar fica PENDENTE até aprovação.
  minha: (slug, opcoes) => api(`/produtos/${encodeURIComponent(slug)}/avaliacoes/minha`, opcoes),
  enviar: (slug, dados) => api(`/produtos/${encodeURIComponent(slug)}/avaliacoes`, enviar('POST', dados)),
  // Fotografia da avaliação: corpo binário com o tipo do ficheiro; devolve { url }.
  enviarFoto: (slug, ficheiro) => api(`/produtos/${encodeURIComponent(slug)}/avaliacoes/imagens`, { method: 'POST', headers: { 'Content-Type': ficheiro.type }, body: ficheiro }),
  // Administrador: fila de moderação.
  listarModeracao: (estado, opcoes) => api(`/admin/avaliacoes?${queryString({ estado })}`, opcoes),
  moderar: (id, estado, motivo) => api(`/admin/avaliacoes/${encodeURIComponent(id)}/estado`, enviar('PATCH', { estado, motivo })),
}

// Carrinho persistido no backend, identificado pelo tokenSessao (segredo aleatório deste
// navegador). O backend só altera itens do carrinho desse token.
export const carrinhoApi = {
  consultar: (tokenSessao, opcoes) => api(`/carrinho?${queryString({ tokenSessao })}`, opcoes),
  adicionar: (tokenSessao, produtoId, quantidade) =>
    api('/carrinho/itens', enviar('POST', { tokenSessao, produtoId, quantidade })),
  actualizar: (tokenSessao, itemId, quantidade) =>
    api(`/carrinho/itens/${encodeURIComponent(itemId)}`, enviar('PUT', { tokenSessao, quantidade })),
  remover: (tokenSessao, itemId) =>
    api(`/carrinho/itens/${encodeURIComponent(itemId)}?${queryString({ tokenSessao })}`, enviar('DELETE')),
}

export const checkoutApi = {
  // Tarifas activas: zona, modalidade, frete e prazo.
  opcoesEntrega: opcoes => api('/entregas/opcoes', opcoes),
  // Subtotal, descontos de promoções, frete e total calculados pelo servidor.
  calcularFrete: (dados, opcoes) => api('/checkout/calcular-frete', { ...opcoes, ...enviar('POST', dados) }),
  // A chave de idempotência evita encomendas duplicadas se o pedido for repetido.
  confirmar: (dados, chaveIdempotencia) => api('/checkout/confirmar', {
    ...enviar('POST', dados),
    headers: { 'x-idempotency-key': chaveIdempotencia },
  }),
  formasPagamento: opcoes => api('/comercial/pagamentos', opcoes),
  // Pagamento simulado (formas com forma.simulado = true).
  simularPagamento: dados => api('/pagamentos/simular', enviar('POST', dados)),
  // Pagamento real M-Pesa C2B — bloqueia até 2,5 min enquanto espera PIN.
  pagarMpesa: (dados, signal) => api('/pagamentos/mpesa', { ...enviar('POST', dados), signal }),
  enviarComprovativo: ({ codigoEncomenda, emailContacto, formaPagamentoId }, ficheiro) => api(
    `/pagamentos/transferencia?${new URLSearchParams({ codigo: codigoEncomenda, email: emailContacto, forma: String(formaPagamentoId) })}`,
    { method: 'POST', headers: { 'Content-Type': ficheiro.type || 'application/octet-stream' }, body: ficheiro },
  ),
}

// Encomendas pelo código + email de contacto (o email é sempre enviado).
export const encomendaClienteApi = {
  consultar: (codigo, email, opcoes) =>
    api(`/encomendas/${encodeURIComponent(codigo)}?${queryString({ email })}`, opcoes),
  cancelar: (codigo, email) => api(`/encomendas/${encodeURIComponent(codigo)}/cancelar`, enviar('POST', { email })),
}

export const devolucoesApi = {
  // itensParaDevolver: [{ itemEncomendaId, quantidade }]
  solicitar: dados => api('/devolucoes', enviar('POST', dados)),
  listarAdmin: opcoes => api('/admin/devolucoes', opcoes),
  decidir: (id, dados) => api(`/admin/devolucoes/${encodeURIComponent(id)}/decisao`, enviar('PATCH', dados)),
  registarRececao: id => api(`/admin/devolucoes/${encodeURIComponent(id)}/rececao`, enviar('PATCH')),
  // Reembolso simulado no backend (reembolso.simulado = true).
  reembolsar: id => api(`/admin/devolucoes/${encodeURIComponent(id)}/reembolso`, enviar('POST')),
}

// GET/PATCH /admin/pagamentos gerem as formas de pagamento (não os pagamentos efectuados).
export const formasPagamentoAdminApi = {
  listar: opcoes => api('/admin/pagamentos', opcoes),
  alterarEstado: (id, activo) => api(`/admin/pagamentos/${encodeURIComponent(id)}/estado`, enviar('PATCH', { activo })),
}

// Promoções (campanhas como Black Friday): por categoria inteira ou por produtos escolhidos.
export const promocoesAdminApi = {
  listar: opcoes => api('/admin/promocoes', opcoes),
  obter: (id, opcoes) => api(`/admin/promocoes/${encodeURIComponent(id)}`, opcoes),
  criar: dados => api('/admin/promocoes', enviar('POST', dados)),
  actualizar: (id, dados) => api(`/admin/promocoes/${encodeURIComponent(id)}`, enviar('PATCH', dados)),
}

// Transferências bancárias com comprovativo, em análise pelo administrador.
export const transferenciasAdminApi = {
  listar: opcoes => api('/admin/transferencias', opcoes),
  comprovativo: id => descarregar(`/admin/transferencias/${encodeURIComponent(id)}/comprovativo`, `comprovativo-${id}`),
  confirmar: id => api(`/admin/transferencias/${encodeURIComponent(id)}/confirmar`, enviar('POST')),
  rejeitar: (id, motivo) => api(`/admin/transferencias/${encodeURIComponent(id)}/rejeitar`, enviar('POST', { motivo })),
}

// Área do cliente (exige sessão; o backend só devolve dados da própria conta).
export const contaApi = {
  perfil: opcoes => api('/conta/perfil', opcoes),
  actualizarPerfil: dados => api('/conta/perfil', enviar('PUT', dados)),
  enderecos: opcoes => api('/conta/enderecos', opcoes),
  endereco: (id, opcoes) => api(`/conta/enderecos/${encodeURIComponent(id)}`, opcoes),
  criarEndereco: dados => api('/conta/enderecos', enviar('POST', dados)),
  actualizarEndereco: (id, dados) => api(`/conta/enderecos/${encodeURIComponent(id)}`, enviar('PUT', dados)),
  apagarEndereco: id => api(`/conta/enderecos/${encodeURIComponent(id)}`, enviar('DELETE')),
  encomendas: (parametros, opcoes) => api(`/conta/encomendas?${queryString(parametros)}`, opcoes),
  avaliacaoEncomenda: (codigo, opcoes) => api(`/conta/encomendas/${encodeURIComponent(codigo)}/avaliacao`, opcoes),
  avaliarEncomenda: (codigo, dados) => api(`/conta/encomendas/${encodeURIComponent(codigo)}/avaliacao`, enviar('POST', dados)),
  pagamentos: (parametros, opcoes) => api(`/conta/pagamentos?${queryString(parametros)}`, opcoes),
  pagamento: (id, opcoes) => api(`/conta/pagamentos/${encodeURIComponent(id)}`, opcoes),
  reembolsos: opcoes => api('/conta/reembolsos', opcoes),
  reembolso: (id, opcoes) => api(`/conta/reembolsos/${encodeURIComponent(id)}`, opcoes),
  devolucoes: opcoes => api('/conta/devolucoes', opcoes),
  devolucao: (id, opcoes) => api(`/conta/devolucoes/${encodeURIComponent(id)}`, opcoes),
  avaliacoes: opcoes => api('/conta/avaliacoes', opcoes),
  // tipo: DUVIDA, GARANTIA ou RECLAMACAO
  pedidos: (tipo, opcoes) => api(`/conta/pedidos-assistencia?${queryString({ tipo })}`, opcoes),
  pedido: (id, opcoes) => api(`/conta/pedidos-assistencia/${encodeURIComponent(id)}`, opcoes),
  criarPedido: dados => api('/conta/pedidos-assistencia', enviar('POST', dados)),
}

export const atendimentoAdminApi = {
  historicoEncomenda: (id, opcoes) => api(`/admin/encomendas/${encodeURIComponent(id)}/historico`, opcoes),
  reembolsos: (parametros, opcoes) => api(`/admin/reembolsos?${queryString(parametros)}`, opcoes),
  pedidos: (parametros, opcoes) => api(`/admin/pedidos-assistencia?${queryString(parametros)}`, opcoes),
  pedido: (id, opcoes) => api(`/admin/pedidos-assistencia/${encodeURIComponent(id)}`, opcoes),
  responderPedido: (id, dados) => api(`/admin/pedidos-assistencia/${encodeURIComponent(id)}`, enviar('PATCH', dados)),
}

// Conta de empresa: dados e estado da aprovação.
export const empresaApi = {
  minha: opcoes => api('/empresa', opcoes),
}

export const empresasAdminApi = {
  listar: (parametros, opcoes) => api(`/admin/empresas?${queryString(parametros)}`, opcoes),
  obter: (id, opcoes) => api(`/admin/empresas/${encodeURIComponent(id)}`, opcoes),
  // estado: APROVADA ou SUSPENSA (suspender exige motivo); a empresa recebe um email.
  decidir: (id, dados) => api(`/admin/empresas/${encodeURIComponent(id)}/estado`, enviar('PATCH', dados)),
}

// Cotações da conta de empresa aprovada. Os preços e totais vêm sempre do servidor.
export const cotacoesApi = {
  listar: (parametros, opcoes) => api(`/cotacoes?${queryString(parametros)}`, opcoes),
  obter: (id, opcoes) => api(`/cotacoes/${encodeURIComponent(id)}`, opcoes),
  // { itens: [{ produtoId, quantidade, precoPedido? }], notas? }
  criar: dados => api('/cotacoes', enviar('POST', dados)),
  // Cria a encomenda com os preços propostos: { zonaEntregaId, modalidadeEntregaId, entrega…, aceiteTermos }
  aceitar: (id, dados) => api(`/cotacoes/${encodeURIComponent(id)}/aceitar`, enviar('POST', dados)),
  recusar: id => api(`/cotacoes/${encodeURIComponent(id)}/recusar`, enviar('POST')),
  // Encomenda rápida: valida linhas [{ sku, quantidade }] e devolve o resultado de cada uma.
  validarSku: linhas => api('/cotacoes/sku', enviar('POST', { linhas })),
}

export const cotacoesAdminApi = {
  listar: (parametros, opcoes) => api(`/admin/cotacoes?${queryString(parametros)}`, opcoes),
  // Inclui o preço sugerido de cada item (grupo, promoção e escalão).
  obter: (id, opcoes) => api(`/admin/cotacoes/${encodeURIComponent(id)}`, opcoes),
  // { validaAte, notasLoja?, itens: [{ itemId, precoProposto }] }
  responder: (id, dados) => api(`/admin/cotacoes/${encodeURIComponent(id)}/responder`, enviar('PATCH', dados)),
  descontos: opcoes => api('/admin/descontos-grupo', opcoes),
  criarDesconto: dados => api('/admin/descontos-grupo', enviar('POST', dados)),
  actualizarDesconto: (id, dados) => api(`/admin/descontos-grupo/${encodeURIComponent(id)}`, enviar('PUT', dados)),
  apagarDesconto: id => api(`/admin/descontos-grupo/${encodeURIComponent(id)}`, enviar('DELETE')),
}

// Facturas (emitidas quando o pagamento é confirmado). Modelo por validar por contabilista.
const ficheiroFactura = numero => `${String(numero).replace(/[^A-Za-z0-9]+/g, '-')}.pdf`
export const facturasApi = {
  // Acesso como a encomenda: email de contacto ou sessão do dono.
  daEncomenda: (codigo, email, numero) =>
    descarregar(`/encomendas/${encodeURIComponent(codigo)}/factura?${queryString({ email })}`, ficheiroFactura(numero)),
  listarAdmin: (parametros, opcoes) => api(`/admin/facturas?${queryString(parametros)}`, opcoes),
  pdfAdmin: (id, numero) => descarregar(`/admin/facturas/${encodeURIComponent(id)}/pdf`, ficheiroFactura(numero)),
  emitir: encomendaId => api(`/admin/encomendas/${encodeURIComponent(encomendaId)}/factura`, enviar('POST')),
}

export const configuracaoApi = {
  // Registo único ConfiguracaoLoja; responde 404 enquanto não tiver sido criado.
  obter: opcoes => api('/admin/configuracao', opcoes),
  // nomeMarca é obrigatório; os restantes campos só mudam se forem enviados.
  actualizar: dados => api('/admin/configuracao', enviar('PUT', dados)),
  politicas: opcoes => api('/politicas', opcoes),
  // Cada gravação incrementa a versão da política.
  actualizarPolitica: (tipo, dados) => api(`/admin/politicas/${encodeURIComponent(tipo)}`, enviar('PUT', dados)),
  // Público: apenas tarifas activas de zonas e modalidades activas.
  opcoesEntrega: opcoes => api('/entregas/opcoes', opcoes),
}
// Consultas administrativas só de leitura: histórico de pagamentos, movimentos de stock e auditoria.
export const consultasAdminApi = {
  pagamentos: (parametros, opcoes) => api(`/admin/pagamentos/historico?${queryString(parametros)}`, opcoes),
  async todosPagamentos(opcoes) {
    const lista = []
    for (let pagina = 1; ; pagina += 1) {
      const resposta = await consultasAdminApi.pagamentos({ pagina, limite: 100 }, opcoes)
      lista.push(...(resposta.pagamentos || []))
      if (pagina >= (resposta.totalPaginas || 0)) return lista
    }
  },
  movimentos: (parametros, opcoes) => api(`/admin/stock/movimentos?${queryString(parametros)}`, opcoes),
  auditoria: (parametros, opcoes) => api(`/admin/auditoria?${queryString(parametros)}`, opcoes),
}
