// Integração B2B (Fase 2+3): escalões no checkout, cotações e encomenda a partir da cotação.
// Servidor em processo + base de dados real (seed). Tudo o que é criado é apagado no fim
// e o stock vendido pelas encomendas de teste é reposto. Nenhum email real é enviado.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomBytes } from 'node:crypto'

process.env.SMTP_HOST = '127.0.0.1'
process.env.SMTP_PORT = '9'

const { app } = await import('../../src/app.js')
const { prisma } = await import('../../src/lib/prisma.js')

const PALAVRA_PASSE = process.env.SEED_PASSWORD || 'EasyShopTeste!2026'
let servidor
let base
let admin
let empresa
let empresaPendente
let cliente
let produtos
const criados = { cotacoes: [], encomendas: [], stock: [], carrinhos: [] }

async function pedir(caminho, { metodo = 'GET', token, corpo } = {}) {
  const headers = {}
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

const emDias = dias => new Date(Date.now() + dias * 86400000).toISOString()

before(async () => {
  servidor = app.listen(0)
  await new Promise(resolver => servidor.once('listening', resolver))
  base = `http://127.0.0.1:${servidor.address().port}/api`
  admin = await entrar('admin1@easyshop.test')
  empresa = await entrar('empresa1@easyshop.test')
  empresaPendente = await entrar('empresa3@easyshop.test')
  cliente = await entrar('cliente080@easyshop.test')
  produtos = await prisma.produto.findMany({ where: { activo: true, quantidadeStock: { gte: 40 } }, orderBy: { id: 'desc' }, take: 2 })
  assert.equal(produtos.length, 2)
})

after(async () => {
  const cotacoes = await prisma.cotacao.findMany({ where: { id: { in: criados.cotacoes } }, select: { encomendaId: true } })
  const encomendaIds = [...new Set([...criados.encomendas, ...cotacoes.map(c => c.encomendaId).filter(id => id !== null)])]
  await prisma.registoAuditoria.deleteMany({ where: { tipoEntidade: 'cotacao', idEntidade: { in: criados.cotacoes.map(String) } } })
  await prisma.cotacao.deleteMany({ where: { id: { in: criados.cotacoes } } })
  if (encomendaIds.length) {
    const itens = await prisma.itemEncomenda.findMany({ where: { encomendaId: { in: encomendaIds } } })
    for (const item of itens) {
      await prisma.produto.update({ where: { id: item.produtoId }, data: { quantidadeStock: { increment: item.quantidade } } })
    }
    await prisma.movimentoStock.deleteMany({ where: { itemEncomendaId: { in: itens.map(item => item.id) } } })
    await prisma.historicoEstadoEncomenda.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.entrega.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.itemEncomenda.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.encomenda.deleteMany({ where: { id: { in: encomendaIds } } })
  }
  await prisma.carrinho.deleteMany({ where: { tokenSessao: { in: criados.carrinhos } } })
  await new Promise(resolver => servidor.close(resolver))
  await prisma.$disconnect()
})

test('checkout de particular aplica no servidor o escalão de quantidade (−7% a partir de 10)', async () => {
  const produto = produtos[0]
  const tarifa = await prisma.tarifaFrete.findFirst({ where: { activo: true, zonaEntrega: { activo: true }, modalidadeEntrega: { activo: true } } })
  const cotar = async quantidade => {
    const token = randomBytes(24).toString('base64url')
    criados.carrinhos.push(token)
    assert.equal((await pedir('/carrinho/itens', { metodo: 'POST', corpo: { tokenSessao: token, produtoId: produto.id, quantidade } })).status, 200)
    const resposta = await pedir('/checkout/calcular-frete', { metodo: 'POST', corpo: { tokenSessao: token, zonaEntregaId: tarifa.zonaEntregaId, modalidadeEntregaId: tarifa.modalidadeEntregaId } })
    assert.equal(resposta.status, 200)
    return resposta.corpo.itens[0]
  }
  const nove = await cotar(9)
  const dez = await cotar(10)
  const preco = Math.round(Number(nove.precoUnitario) * 100)
  const promocao = Math.round(Number(nove.descontoUnitario) * 100)
  const esperado = Math.round((preco - promocao) * 0.07)
  assert.equal(Math.round(Number(dez.descontoUnitario) * 100) - promocao, esperado)
  assert.match(dez.promocao, /quantidade/)
})

test('só empresas aprovadas pedem cotações', async () => {
  const corpo = { itens: [{ produtoId: produtos[0].id, quantidade: 20 }] }
  assert.equal((await pedir('/cotacoes', { metodo: 'POST', token: cliente.token, corpo })).status, 403)
  assert.equal((await pedir('/cotacoes', { metodo: 'POST', corpo })).status, 401)
  const pendente = await pedir('/cotacoes', { metodo: 'POST', token: empresaPendente.token, corpo })
  assert.equal(pendente.status, 403)
  assert.match(pendente.corpo.message, /aprovação/)
  assert.equal((await pedir('/cotacoes', { metodo: 'POST', token: empresa.token, corpo: { itens: [{ produtoId: 'nao-existe', quantidade: 2 }] } })).status, 400)
})

test('cotação completa: pedido → resposta com preço sugerido → aceitação cria a encomenda', async () => {
  const [a, b] = produtos
  const pedido = await pedir('/cotacoes', {
    metodo: 'POST', token: empresa.token,
    corpo: { itens: [{ produtoId: a.id, quantidade: 12 }, { produtoId: b.id, quantidade: 3, precoPedido: 10 }], notas: 'Teste de integração' },
  })
  assert.equal(pedido.status, 201)
  const cotacao = pedido.corpo.cotacao
  criados.cotacoes.push(cotacao.id)
  assert.equal(cotacao.estado, 'PEDIDA')
  assert.equal(cotacao.totalProposto, null)

  // A empresa não pode aceitar antes da resposta; outra conta não vê a cotação.
  assert.equal((await pedir(`/cotacoes/${cotacao.id}/aceitar`, { metodo: 'POST', token: empresa.token, corpo: {} })).status, 409)
  assert.equal((await pedir(`/cotacoes/${cotacao.id}`, { token: empresaPendente.token })).status, 404)
  assert.equal((await pedir(`/admin/cotacoes/${cotacao.id}`, { token: empresa.token })).status, 403)

  // Preço sugerido: grupo EMPRESA (5% no seed) e escalão para 12 unidades (−7%).
  const detalhe = await pedir(`/admin/cotacoes/${cotacao.id}`, { token: admin.token })
  assert.equal(detalhe.status, 200)
  const itemA = detalhe.corpo.cotacao.itens.find(item => item.produto.id === a.id)
  assert.equal(itemA.sugestao.escalao, 0.07)
  assert.ok(Number(itemA.sugestao.precoSugerido) < Number(a.preco))

  const itens = detalhe.corpo.cotacao.itens
  const incompleta = await pedir(`/admin/cotacoes/${cotacao.id}/responder`, { metodo: 'PATCH', token: admin.token, corpo: { validaAte: emDias(10), itens: [{ itemId: itens[0].id, precoProposto: 5 }] } })
  assert.equal(incompleta.status, 400)
  const passada = await pedir(`/admin/cotacoes/${cotacao.id}/responder`, { metodo: 'PATCH', token: admin.token, corpo: { validaAte: emDias(-1), itens: itens.map(item => ({ itemId: item.id, precoProposto: 5 })) } })
  assert.equal(passada.status, 400)

  const propostas = itens.map(item => ({ itemId: item.id, precoProposto: Number(item.sugestao.precoSugerido) }))
  const respondida = await pedir(`/admin/cotacoes/${cotacao.id}/responder`, { metodo: 'PATCH', token: admin.token, corpo: { validaAte: emDias(10), notasLoja: 'Teste', itens: propostas } })
  assert.equal(respondida.status, 200)
  assert.equal(respondida.corpo.cotacao.estado, 'RESPONDIDA')
  assert.equal((await pedir(`/admin/cotacoes/${cotacao.id}/responder`, { metodo: 'PATCH', token: admin.token, corpo: { validaAte: emDias(10), itens: propostas } })).status, 409)

  const tarifa = await prisma.tarifaFrete.findFirst({ where: { activo: true, zonaEntrega: { activo: true }, modalidadeEntrega: { activo: true } } })
  const entrega = {
    zonaEntregaId: tarifa.zonaEntregaId, modalidadeEntregaId: tarifa.modalidadeEntregaId,
    entregaLinhaEndereco: 'Estaleiro de teste', entregaCidade: 'Maputo', entregaProvincia: 'Maputo Cidade', aceiteTermos: true,
  }
  assert.equal((await pedir(`/cotacoes/${cotacao.id}/aceitar`, { metodo: 'POST', token: empresa.token, corpo: { ...entrega, aceiteTermos: false } })).status, 400)
  assert.equal((await pedir(`/cotacoes/${cotacao.id}/aceitar`, { metodo: 'POST', token: empresa.token, corpo: { ...entrega, entregaCidade: '' } })).status, 400)

  const stockAntes = await prisma.produto.findMany({ where: { id: { in: [a.id, b.id] } }, select: { id: true, quantidadeStock: true } })
  const aceite = await pedir(`/cotacoes/${cotacao.id}/aceitar`, { metodo: 'POST', token: empresa.token, corpo: entrega })
  assert.equal(aceite.status, 201)
  const encomenda = await prisma.encomenda.findUnique({ where: { id: aceite.corpo.encomenda.id }, include: { itens: true } })
  criados.encomendas.push(encomenda.id)

  // A encomenda usa os preços propostos, é da conta da empresa e desconta o stock.
  assert.equal(encomenda.utilizadorId, empresa.id)
  assert.equal(encomenda.estado, 'REGISTADA')
  const subtotal = propostas.reduce((soma, proposta) => {
    const item = itens.find(linha => linha.id === proposta.itemId)
    return soma + Math.round(proposta.precoProposto * 100) * item.quantidade
  }, 0)
  assert.equal(Math.round(Number(encomenda.valorSubtotal) * 100), subtotal)
  assert.equal(Number(encomenda.valorTotal), Number(encomenda.valorSubtotal) + Number(encomenda.valorFrete))
  for (const linha of encomenda.itens) {
    const proposta = propostas.find(p => itens.find(i => i.id === p.itemId).produto.id === linha.produtoId)
    assert.equal(Number(linha.precoUnitario), proposta.precoProposto)
    const antes = stockAntes.find(produto => produto.id === linha.produtoId).quantidadeStock
    assert.equal((await prisma.produto.findUnique({ where: { id: linha.produtoId } })).quantidadeStock, antes - linha.quantidade)
  }
  const gravada = await prisma.cotacao.findUnique({ where: { id: cotacao.id } })
  assert.equal(gravada.estado, 'ACEITE')
  assert.equal(gravada.encomendaId, encomenda.id)

  // Aceitar outra vez não cria outra encomenda; a encomenda aparece na conta da empresa.
  assert.equal((await pedir(`/cotacoes/${cotacao.id}/aceitar`, { metodo: 'POST', token: empresa.token, corpo: entrega })).status, 409)
  const encomendas = await pedir('/conta/encomendas?limite=50', { token: empresa.token })
  assert.ok(encomendas.corpo.encomendas.some(linha => linha.codigoEncomenda === encomenda.codigoEncomenda))
  // A empresa continua sem poder pagar ou usar o carrinho directamente.
  assert.equal((await pedir('/pagamentos/simular', { metodo: 'POST', token: empresa.token, corpo: { codigoEncomenda: encomenda.codigoEncomenda } })).status, 403)
})

test('propostas fora da validade expiram e já não podem ser aceites nem recusadas', async () => {
  const pedido = await pedir('/cotacoes', { metodo: 'POST', token: empresa.token, corpo: { itens: [{ produtoId: produtos[1].id, quantidade: 5 }] } })
  const cotacao = pedido.corpo.cotacao
  criados.cotacoes.push(cotacao.id)
  const detalhe = await pedir(`/admin/cotacoes/${cotacao.id}`, { token: admin.token })
  const itens = detalhe.corpo.cotacao.itens.map(item => ({ itemId: item.id, precoProposto: 100 }))
  assert.equal((await pedir(`/admin/cotacoes/${cotacao.id}/responder`, { metodo: 'PATCH', token: admin.token, corpo: { validaAte: emDias(5), itens } })).status, 200)

  // Simula a passagem do tempo: a validade termina no passado.
  await prisma.cotacao.update({ where: { id: cotacao.id }, data: { validaAte: new Date(Date.now() - 60000) } })
  const vista = await pedir(`/cotacoes/${cotacao.id}`, { token: empresa.token })
  assert.equal(vista.corpo.cotacao.estado, 'EXPIRADA')
  assert.equal((await pedir(`/cotacoes/${cotacao.id}/aceitar`, { metodo: 'POST', token: empresa.token, corpo: {} })).status, 409)
  assert.equal((await pedir(`/cotacoes/${cotacao.id}/recusar`, { metodo: 'POST', token: empresa.token })).status, 409)
})

test('a empresa pode recusar uma proposta válida', async () => {
  const pedido = await pedir('/cotacoes', { metodo: 'POST', token: empresa.token, corpo: { itens: [{ produtoId: produtos[1].id, quantidade: 2 }] } })
  const cotacao = pedido.corpo.cotacao
  criados.cotacoes.push(cotacao.id)
  const detalhe = await pedir(`/admin/cotacoes/${cotacao.id}`, { token: admin.token })
  const itens = detalhe.corpo.cotacao.itens.map(item => ({ itemId: item.id, precoProposto: 50 }))
  await pedir(`/admin/cotacoes/${cotacao.id}/responder`, { metodo: 'PATCH', token: admin.token, corpo: { validaAte: emDias(5), itens } })
  assert.equal((await pedir(`/cotacoes/${cotacao.id}/recusar`, { metodo: 'POST', token: empresa.token })).status, 200)
  assert.equal((await prisma.cotacao.findUnique({ where: { id: cotacao.id } })).estado, 'RECUSADA')
})

test('descontos por grupo: só o admin gere, com percentagem válida e sem duplicados', async () => {
  assert.equal((await pedir('/admin/descontos-grupo', { token: empresa.token })).status, 403)
  const lista = await pedir('/admin/descontos-grupo', { token: admin.token })
  assert.equal(lista.status, 200)
  assert.equal((await pedir('/admin/descontos-grupo', { metodo: 'POST', token: admin.token, corpo: { grupo: 'EMPRESA', percentagem: 150 } })).status, 400)
  // O seed já tem o desconto geral do grupo EMPRESA.
  assert.equal((await pedir('/admin/descontos-grupo', { metodo: 'POST', token: admin.token, corpo: { grupo: 'EMPRESA', percentagem: 8 } })).status, 409)
})
