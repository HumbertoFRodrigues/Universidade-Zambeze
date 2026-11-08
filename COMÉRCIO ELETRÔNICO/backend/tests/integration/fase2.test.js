// Testes de integração da Fase 2: servidor em processo + base de dados real (seed).
// Tudo o que é criado é apagado no fim; o stock é reposto pelo cancelamento da encomenda.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomBytes } from 'node:crypto'
import { app } from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'

const PALAVRA_PASSE = process.env.SEED_PASSWORD || 'EasyShopTeste!2026'
const EMAIL_CLIENTE = 'cliente080@easyshop.test'
const EMAIL_ADMIN = 'admin1@easyshop.test'

let servidor
let base
let cliente
let admin
const criados = { enderecos: [], pedidos: [], encomendas: [], carrinhos: [], avaliacoesProduto: [], avaliacoesEncomenda: [], stock: [] }

async function pedir(caminho, { metodo = 'GET', token, corpo, cabecalhos = {} } = {}) {
  const headers = { ...cabecalhos }
  if (token) headers.Authorization = `Bearer ${token}`
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  const resposta = await fetch(base + caminho, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) })
  return { status: resposta.status, corpo: await resposta.json().catch(() => null) }
}

async function entrar(email) {
  const { status, corpo } = await pedir('/auth/login', { metodo: 'POST', corpo: { email, palavraPasse: PALAVRA_PASSE } })
  assert.equal(status, 200, `login de ${email}`)
  return { token: corpo.token, ...corpo.utilizador }
}

const novoToken = () => randomBytes(24).toString('base64url')

before(async () => {
  servidor = app.listen(0)
  await new Promise(resolver => servidor.once('listening', resolver))
  base = `http://127.0.0.1:${servidor.address().port}/api`
  cliente = await entrar(EMAIL_CLIENTE)
  admin = await entrar(EMAIL_ADMIN)
})

after(async () => {
  await prisma.avaliacaoProduto.deleteMany({ where: { id: { in: criados.avaliacoesProduto } } })
  await prisma.avaliacaoEncomenda.deleteMany({ where: { id: { in: criados.avaliacoesEncomenda } } })
  for (const { produtoId, quantidade } of criados.stock) {
    await prisma.produto.update({ where: { id: produtoId }, data: { quantidadeStock: { increment: quantidade } } })
  }
  const encomendaIds = criados.encomendas
  if (encomendaIds.length) {
    const itens = await prisma.itemEncomenda.findMany({ where: { encomendaId: { in: encomendaIds } }, select: { id: true } })
    await prisma.movimentoStock.deleteMany({ where: { itemEncomendaId: { in: itens.map(item => item.id) } } })
    await prisma.historicoEstadoEncomenda.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.entrega.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.registoAuditoria.deleteMany({ where: { tipoEntidade: 'encomenda', idEntidade: { in: encomendaIds.map(String) } } })
    await prisma.itemEncomenda.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.encomenda.deleteMany({ where: { id: { in: encomendaIds } } })
  }
  await prisma.registoAuditoria.deleteMany({ where: { tipoEntidade: 'pedido_assistencia', idEntidade: { in: criados.pedidos.map(String) } } })
  await prisma.pedidoAssistencia.deleteMany({ where: { id: { in: criados.pedidos } } })
  await prisma.endereco.deleteMany({ where: { id: { in: criados.enderecos } } })
  await prisma.carrinho.deleteMany({ where: { tokenSessao: { in: criados.carrinhos } } })
  await new Promise(resolver => servidor.close(resolver))
  await prisma.$disconnect()
})

test('a área do cliente exige sessão e não permite alterar o email', async () => {
  assert.equal((await pedir('/conta/perfil')).status, 401)
  const perfil = await pedir('/conta/perfil', { token: cliente.token })
  assert.equal(perfil.status, 200)
  assert.equal(perfil.corpo.utilizador.email, EMAIL_CLIENTE)
  assert.equal(perfil.corpo.utilizador.hashPalavraPasse, undefined)

  const { nome, telefone } = perfil.corpo.utilizador
  const igual = await pedir('/conta/perfil', { metodo: 'PUT', token: cliente.token, corpo: { nome, telefone } })
  assert.equal(igual.status, 200)
  const comEmail = await pedir('/conta/perfil', { metodo: 'PUT', token: cliente.token, corpo: { nome, telefone, email: 'x@y.z' } })
  assert.equal(comEmail.status, 400)
})

test('endereços: criar, actualizar, isolamento entre contas e apagar', async () => {
  const zona = await prisma.zonaEntrega.findFirst({ where: { activo: true }, orderBy: { id: 'asc' } })
  const dados = { nomeDestinatario: 'Teste Fase 2', telefone: '840000001', linhaEndereco: 'Rua de teste, 1', cidade: 'Maputo', provincia: 'Maputo', zonaEntregaId: zona.id }

  const invalido = await pedir('/conta/enderecos', { metodo: 'POST', token: cliente.token, corpo: { ...dados, cidade: '' } })
  assert.equal(invalido.status, 400)

  const criado = await pedir('/conta/enderecos', { metodo: 'POST', token: cliente.token, corpo: dados })
  assert.equal(criado.status, 201)
  const id = criado.corpo.endereco.id
  criados.enderecos.push(id)
  assert.equal((await prisma.endereco.findUnique({ where: { id } })).utilizadorId, cliente.id)

  const outraConta = await pedir(`/conta/enderecos/${id}`, { token: admin.token })
  assert.equal(outraConta.status, 404)

  const actualizado = await pedir(`/conta/enderecos/${id}`, { metodo: 'PUT', token: cliente.token, corpo: { ...dados, cidade: 'Matola', predefinido: true } })
  assert.equal(actualizado.status, 200)
  assert.equal(actualizado.corpo.endereco.cidade, 'Matola')
  assert.equal(await prisma.endereco.count({ where: { utilizadorId: cliente.id, predefinido: true } }), 1)

  assert.equal((await pedir(`/conta/enderecos/${id}`, { metodo: 'DELETE', token: cliente.token })).status, 200)
  assert.equal(await prisma.endereco.findUnique({ where: { id } }), null)
})

test('carrinho: utilizadorId sem sessão é recusado e itens só mudam no próprio carrinho', async () => {
  const produto = await prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gte: 10 } }, orderBy: { id: 'asc' } })
  const tokenA = novoToken()
  const tokenB = novoToken()
  criados.carrinhos.push(tokenA, tokenB)

  assert.equal((await pedir(`/carrinho?utilizadorId=${cliente.id}`)).status, 403)
  assert.equal((await pedir('/carrinho')).status, 400)

  const adicionado = await pedir('/carrinho/itens', { metodo: 'POST', corpo: { tokenSessao: tokenA, produtoId: produto.id, quantidade: 1 } })
  assert.equal(adicionado.status, 200)
  const carrinhoA = await pedir(`/carrinho?tokenSessao=${tokenA}`)
  const item = carrinhoA.corpo.itens[0]
  assert.equal(item.quantidade, 1)

  const alheio = await pedir(`/carrinho/itens/${item.id}`, { metodo: 'PUT', corpo: { tokenSessao: tokenB, quantidade: 5 } })
  assert.equal(alheio.status, 404)
  const apagarAlheio = await pedir(`/carrinho/itens/${item.id}?tokenSessao=${tokenB}`, { metodo: 'DELETE' })
  assert.equal(apagarAlheio.status, 404)
  assert.equal((await prisma.itemCarrinho.findUnique({ where: { id: item.id } })).quantidade, 1)

  const quantidadeInvalida = await pedir(`/carrinho/itens/${item.id}`, { metodo: 'PUT', corpo: { tokenSessao: tokenA, quantidade: 1.5 } })
  assert.equal(quantidadeInvalida.status, 400)
  const proprio = await pedir(`/carrinho/itens/${item.id}`, { metodo: 'PUT', corpo: { tokenSessao: tokenA, quantidade: 2 } })
  assert.equal(proprio.status, 200)
})

async function dadosCheckout(tokenSessao) {
  const tarifa = await prisma.tarifaFrete.findFirst({ where: { activo: true, zonaEntrega: { activo: true }, modalidadeEntrega: { activo: true } } })
  return {
    tokenSessao,
    zonaEntregaId: tarifa.zonaEntregaId,
    modalidadeEntregaId: tarifa.modalidadeEntregaId,
    nomeContacto: cliente.nome,
    emailContacto: EMAIL_CLIENTE,
    telefoneContacto: '840000002',
    entregaNomeDestinatario: cliente.nome,
    entregaTelefone: '840000002',
    entregaLinhaEndereco: 'Rua de teste, 2',
    entregaCidade: 'Maputo',
    entregaProvincia: 'Maputo',
    aceiteTermos: true,
  }
}

test('checkout com sessão liga a encomenda à conta, desconta stock e o cancelamento repõe-no', async () => {
  const tokenA = criados.carrinhos[0]
  const carrinho = await pedir(`/carrinho?tokenSessao=${tokenA}`)
  const { produtoId, quantidade } = carrinho.corpo.itens[0]
  const stockAntes = (await prisma.produto.findUnique({ where: { id: produtoId } })).quantidadeStock
  const tarifa = await prisma.tarifaFrete.findFirst({ where: { activo: true, zonaEntrega: { activo: true }, modalidadeEntrega: { activo: true } } })

  const dados = {
    tokenSessao: tokenA,
    zonaEntregaId: tarifa.zonaEntregaId,
    modalidadeEntregaId: tarifa.modalidadeEntregaId,
    nomeContacto: cliente.nome,
    emailContacto: EMAIL_CLIENTE,
    telefoneContacto: '840000002',
    entregaNomeDestinatario: cliente.nome,
    entregaTelefone: '840000002',
    entregaLinhaEndereco: 'Rua de teste, 2',
    entregaCidade: 'Maputo',
    entregaProvincia: 'Maputo',
    aceiteTermos: true,
  }
  const outro = await pedir('/checkout/confirmar', {
    metodo: 'POST', corpo: { ...dados, utilizadorId: admin.id }, cabecalhos: { 'x-idempotency-key': novoToken() },
  })
  assert.equal(outro.status, 403, 'utilizadorId de outra pessoa sem sessão')

  const confirmado = await pedir('/checkout/confirmar', {
    metodo: 'POST', token: cliente.token, corpo: dados, cabecalhos: { 'x-idempotency-key': novoToken() },
  })
  assert.equal(confirmado.status, 201)
  const { codigoEncomenda, id } = confirmado.corpo.encomenda
  criados.encomendas.push(id)
  assert.equal((await prisma.encomenda.findUnique({ where: { id } })).utilizadorId, cliente.id)
  assert.equal((await prisma.produto.findUnique({ where: { id: produtoId } })).quantidadeStock, stockAntes - quantidade)

  const lista = await pedir('/conta/encomendas?limite=50', { token: cliente.token })
  assert.ok(lista.corpo.encomendas.some(encomenda => encomenda.codigoEncomenda === codigoEncomenda))

  assert.equal((await pedir(`/encomendas/${codigoEncomenda}`)).status, 400, 'sem email nem sessão')
  assert.equal((await pedir(`/encomendas/${codigoEncomenda}`, { token: admin.token })).status, 404, 'sessão de outra conta')
  assert.equal((await pedir(`/encomendas/${codigoEncomenda}`, { token: cliente.token })).status, 200)

  const pagamentoSemProva = await pedir('/pagamentos/simular', {
    metodo: 'POST', corpo: { codigoEncomenda, formaPagamentoId: 0, valorPago: confirmado.corpo.encomenda.valorTotal },
  })
  assert.equal(pagamentoSemProva.status, 400)
  const pagamentoEmailErrado = await pedir('/pagamentos/simular', {
    metodo: 'POST', corpo: { codigoEncomenda, formaPagamentoId: 0, valorPago: confirmado.corpo.encomenda.valorTotal, emailContacto: 'outro@x.y' },
  })
  assert.equal(pagamentoEmailErrado.status, 404)
  assert.equal(await prisma.pagamento.count({ where: { encomendaId: id } }), 0)

  const cancelada = await pedir(`/encomendas/${codigoEncomenda}/cancelar`, { metodo: 'POST', token: cliente.token, corpo: {} })
  assert.equal(cancelada.status, 200)
  assert.equal((await prisma.produto.findUnique({ where: { id: produtoId } })).quantidadeStock, stockAntes)
})

test('avaliação de encomenda concluída: valida, grava e impede repetição', async () => {
  // O seed já avaliou todas as encomendas concluídas com conta: cria-se uma e conclui-se pelo admin.
  const produto = await prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gte: 10 } }, orderBy: { id: 'desc' } })
  const token = novoToken()
  criados.carrinhos.push(token)
  await pedir('/carrinho/itens', { metodo: 'POST', corpo: { tokenSessao: token, produtoId: produto.id, quantidade: 1 } })
  const confirmado = await pedir('/checkout/confirmar', {
    metodo: 'POST', token: cliente.token, corpo: await dadosCheckout(token), cabecalhos: { 'x-idempotency-key': novoToken() },
  })
  assert.equal(confirmado.status, 201)
  const { id, codigoEncomenda, itens } = confirmado.corpo.encomenda
  criados.encomendas.push(id)
  criados.stock.push({ produtoId: produto.id, quantidade: 1 })

  const caminho = `/conta/encomendas/${codigoEncomenda}/avaliacao`
  const corpo = { experiencia: { classificacao: 4, recomenda: true, comentario: 'Teste' }, produtos: [{ itemEncomendaId: itens[0].id, classificacao: 5 }] }
  assert.equal((await pedir(caminho, { metodo: 'POST', token: cliente.token, corpo })).status, 400, 'ainda não concluída')

  assert.equal((await pedir(`/admin/encomendas/${id}`, { metodo: 'PATCH', token: admin.token, corpo: { estado: 'CONCLUIDA' } })).status, 200)

  assert.equal((await pedir(caminho, { metodo: 'POST', token: cliente.token, corpo: { produtos: [{ itemEncomendaId: itens[0].id, classificacao: 9 }] } })).status, 400)
  assert.equal((await pedir(caminho, { metodo: 'POST', token: admin.token, corpo })).status, 404, 'conta que não é dona')

  const gravada = await pedir(caminho, { metodo: 'POST', token: cliente.token, corpo })
  assert.equal(gravada.status, 201)
  const avaliacaoEncomenda = await prisma.avaliacaoEncomenda.findUnique({ where: { encomendaId: id } })
  const avaliacaoProduto = await prisma.avaliacaoProduto.findUnique({ where: { itemEncomendaId: itens[0].id } })
  criados.avaliacoesEncomenda.push(avaliacaoEncomenda.id)
  criados.avaliacoesProduto.push(avaliacaoProduto.id)
  assert.equal(avaliacaoProduto.classificacao, 5)

  assert.equal((await pedir(caminho, { metodo: 'POST', token: cliente.token, corpo })).status, 409)
  const estado = await pedir(caminho, { token: cliente.token })
  assert.equal(estado.corpo.encomenda.avaliacao.classificacaoExperiencia, 4)
  const minhas = await pedir('/conta/avaliacoes', { token: cliente.token })
  assert.ok(minhas.corpo.produtos.some(avaliacao => avaliacao.id === avaliacaoProduto.id))
})

test('pedido de devolução recusa itens de outra encomenda', async () => {
  const encomenda = await prisma.encomenda.findFirst({ where: { estado: 'CONCLUIDA', emailContacto: EMAIL_CLIENTE } })
  if (!encomenda) return
  const resposta = await pedir('/devolucoes', {
    metodo: 'POST',
    token: cliente.token,
    corpo: { codigoEncomenda: encomenda.codigoEncomenda, tipoMotivo: 'DEFEITUOSO', itensParaDevolver: [{ itemEncomendaId: 999999, quantidade: 1 }] },
  })
  assert.equal(resposta.status, 400)
  assert.equal((await pedir('/devolucoes', { metodo: 'POST', corpo: { codigoEncomenda: encomenda.codigoEncomenda } })).status, 400)
})

test('pedidos de assistência: cliente cria, admin responde, cliente vê a resposta', async () => {
  const criado = await pedir('/conta/pedidos-assistencia', {
    metodo: 'POST', token: cliente.token, corpo: { tipoPedido: 'DUVIDA', assunto: 'Teste Fase 2', mensagem: 'Pergunta de teste.' },
  })
  assert.equal(criado.status, 201)
  const id = criado.corpo.pedido.id
  criados.pedidos.push(id)
  assert.equal((await prisma.pedidoAssistencia.findUnique({ where: { id } })).emailContacto, EMAIL_CLIENTE)

  assert.equal((await pedir(`/admin/pedidos-assistencia/${id}`, { metodo: 'PATCH', token: cliente.token, corpo: { estado: 'FECHADO' } })).status, 403)
  assert.equal((await pedir(`/admin/pedidos-assistencia/${id}`, { metodo: 'PATCH', token: admin.token, corpo: { estado: 'RESOLVIDO' } })).status, 400)
  const respondido = await pedir(`/admin/pedidos-assistencia/${id}`, {
    metodo: 'PATCH', token: admin.token, corpo: { estado: 'RESOLVIDO', resposta: 'Resposta de teste.' },
  })
  assert.equal(respondido.status, 200)

  const visto = await pedir(`/conta/pedidos-assistencia/${id}`, { token: cliente.token })
  assert.equal(visto.corpo.pedido.resposta, 'Resposta de teste.')
  assert.equal(visto.corpo.pedido.estado, 'RESOLVIDO')
  assert.equal((await pedir(`/conta/pedidos-assistencia/${id}`, { token: admin.token })).status, 404)
})

test('admin: histórico da encomenda e reembolsos exigem perfil de administrador', async () => {
  const encomenda = await prisma.encomenda.findFirst({ orderBy: { id: 'asc' } })
  assert.equal((await pedir(`/admin/encomendas/${encomenda.id}/historico`, { token: cliente.token })).status, 403)
  const historico = await pedir(`/admin/encomendas/${encomenda.id}/historico`, { token: admin.token })
  assert.equal(historico.status, 200)
  assert.ok(Array.isArray(historico.corpo.historico))
  const reembolsos = await pedir('/admin/reembolsos', { token: admin.token })
  assert.equal(reembolsos.status, 200)
  assert.equal(typeof reembolsos.corpo.total, 'number')
})
