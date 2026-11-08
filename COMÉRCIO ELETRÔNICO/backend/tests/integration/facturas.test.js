// Integração B2B (Fases 5 e 6): encomenda rápida por SKU, IVA e facturas.
// Servidor em processo + base de dados real. No fim apaga o que criou, repõe o stock
// e devolve o contador da série ao valor anterior (a numeração real fica sem saltos).
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { randomBytes } from 'node:crypto'

process.env.SMTP_HOST = '127.0.0.1'
process.env.SMTP_PORT = '9'

const { app } = await import('../../src/app.js')
const { prisma } = await import('../../src/lib/prisma.js')
const { anoEmMocambique, numeroFactura } = await import('../../src/services/precos.js')

const PALAVRA_PASSE = process.env.SEED_PASSWORD || 'EasyShopTeste!2026'
let servidor
let base
let admin
let empresa
let empresaPendente
let cliente
let tarifa
let serieAntes
const ano = anoEmMocambique()
const criados = { encomendas: [], cotacoes: [], carrinhos: [] }

async function pedir(caminho, { metodo = 'GET', token, corpo, cabecalhos = {} } = {}) {
  const headers = { ...cabecalhos }
  if (token) headers.Authorization = `Bearer ${token}`
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  const resposta = await fetch(base + caminho, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) })
  const tipo = resposta.headers.get('content-type') || ''
  const corpoResposta = tipo.includes('application/pdf') ? Buffer.from(await resposta.arrayBuffer()) : await resposta.json().catch(() => null)
  return { status: resposta.status, tipo, corpo: corpoResposta }
}

async function entrar(email) {
  const { status, corpo } = await pedir('/auth/login', { metodo: 'POST', corpo: { email, palavraPasse: PALAVRA_PASSE } })
  assert.equal(status, 200, `login de ${email}`)
  return { token: corpo.token, ...corpo.utilizador }
}

before(async () => {
  servidor = app.listen(0)
  await new Promise(resolver => servidor.once('listening', resolver))
  base = `http://127.0.0.1:${servidor.address().port}/api`
  admin = await entrar('admin1@easyshop.test')
  empresa = await entrar('empresa1@easyshop.test')
  empresaPendente = await entrar('empresa3@easyshop.test')
  cliente = await entrar('cliente080@easyshop.test')
  tarifa = await prisma.tarifaFrete.findFirst({ where: { activo: true, zonaEntrega: { activo: true }, modalidadeEntrega: { activo: true } } })
  serieAntes = (await prisma.serieFactura.findUnique({ where: { ano } }))?.ultimoNumero ?? null
})

after(async () => {
  const cotacoes = await prisma.cotacao.findMany({ where: { id: { in: criados.cotacoes } }, select: { encomendaId: true } })
  const encomendaIds = [...new Set([...criados.encomendas, ...cotacoes.map(c => c.encomendaId).filter(id => id !== null)])]
  await prisma.registoAuditoria.deleteMany({ where: { tipoEntidade: 'cotacao', idEntidade: { in: criados.cotacoes.map(String) } } })
  await prisma.cotacao.deleteMany({ where: { id: { in: criados.cotacoes } } })
  if (encomendaIds.length) {
    const facturas = await prisma.factura.findMany({ where: { encomendaId: { in: encomendaIds } }, select: { id: true } })
    await prisma.registoAuditoria.deleteMany({ where: { tipoEntidade: 'factura', idEntidade: { in: facturas.map(f => String(f.id)) } } })
    await prisma.factura.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    const itens = await prisma.itemEncomenda.findMany({ where: { encomendaId: { in: encomendaIds } } })
    for (const item of itens) {
      await prisma.produto.update({ where: { id: item.produtoId }, data: { quantidadeStock: { increment: item.quantidade } } })
    }
    await prisma.movimentoStock.deleteMany({ where: { itemEncomendaId: { in: itens.map(item => item.id) } } })
    await prisma.historicoEstadoEncomenda.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.entrega.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.pagamento.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.registoAuditoria.deleteMany({ where: { tipoEntidade: 'encomenda', idEntidade: { in: encomendaIds.map(String) } } })
    await prisma.itemEncomenda.deleteMany({ where: { encomendaId: { in: encomendaIds } } })
    await prisma.encomenda.deleteMany({ where: { id: { in: encomendaIds } } })
  }
  await prisma.carrinho.deleteMany({ where: { tokenSessao: { in: criados.carrinhos } } })
  // Devolve o contador ao valor anterior aos testes (sem deixar números consumidos).
  if (serieAntes === null) await prisma.serieFactura.deleteMany({ where: { ano } })
  else await prisma.serieFactura.update({ where: { ano }, data: { ultimoNumero: serieAntes } })
  await new Promise(resolver => servidor.close(resolver))
  await prisma.$disconnect()
})

// Compra de particular: carrinho → checkout → pagamento simulado (que emite a factura).
async function comprarComoParticular(produto, quantidade) {
  const token = randomBytes(24).toString('base64url')
  criados.carrinhos.push(token)
  await pedir('/carrinho/itens', { metodo: 'POST', corpo: { tokenSessao: token, produtoId: produto.id, quantidade } })
  const confirmado = await pedir('/checkout/confirmar', {
    metodo: 'POST', cabecalhos: { 'x-idempotency-key': randomBytes(16).toString('hex') },
    corpo: {
      tokenSessao: token, zonaEntregaId: tarifa.zonaEntregaId, modalidadeEntregaId: tarifa.modalidadeEntregaId,
      nomeContacto: 'Cliente Teste Factura', emailContacto: 'factura.teste@easyshop.test', telefoneContacto: '840000003',
      entregaNomeDestinatario: 'Cliente Teste Factura', entregaTelefone: '840000003',
      entregaLinhaEndereco: 'Rua da Factura, 1', entregaCidade: 'Maputo', entregaProvincia: 'Maputo Cidade', aceiteTermos: true,
    },
  })
  assert.equal(confirmado.status, 201)
  criados.encomendas.push(confirmado.corpo.encomenda.id)
  return confirmado.corpo.encomenda
}

test('compra de particular: IVA guardado, factura numerada sem saltos ao confirmar o pagamento', async () => {
  const produto = await prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gte: 10 } }, orderBy: { id: 'asc' } })
  const encomenda = await comprarComoParticular(produto, 1)

  const gravada = await prisma.encomenda.findUnique({ where: { id: encomenda.id } })
  assert.equal(Number(gravada.taxaIva), 16)
  assert.equal(Math.round(Number(gravada.baseTributavel) * 100) + Math.round(Number(gravada.valorIva) * 100), Math.round(Number(gravada.valorTotal) * 100))
  assert.equal(gravada.facturacaoNuit, null)
  assert.match(gravada.facturacaoMorada, /Rua da Factura/)

  // Sem pagamento não há factura (nem emissão manual).
  assert.equal((await pedir(`/admin/encomendas/${encomenda.id}/factura`, { metodo: 'POST', token: admin.token })).status, 409)

  const pago = await pedir('/pagamentos/simular', {
    metodo: 'POST',
    corpo: { codigoEncomenda: encomenda.codigoEncomenda, formaPagamentoId: 0, valorPago: encomenda.valorTotal, emailContacto: 'factura.teste@easyshop.test' },
  })
  assert.equal(pago.status, 200)
  const esperado = numeroFactura(ano, (serieAntes ?? 0) + 1)
  assert.equal(pago.corpo.factura.numero, esperado)

  // Segunda compra paga: número seguinte, sem saltos.
  const segunda = await comprarComoParticular(produto, 1)
  const pagoSegunda = await pedir('/pagamentos/simular', {
    metodo: 'POST',
    corpo: { codigoEncomenda: segunda.codigoEncomenda, formaPagamentoId: 0, valorPago: segunda.valorTotal, emailContacto: 'factura.teste@easyshop.test' },
  })
  assert.equal(pagoSegunda.corpo.factura.numero, numeroFactura(ano, (serieAntes ?? 0) + 2))

  const factura = await prisma.factura.findUnique({ where: { encomendaId: encomenda.id } })
  assert.equal(factura.clienteNome, 'Cliente Teste Factura')
  assert.equal(Number(factura.total), Number(gravada.valorTotal))
  assert.equal(Number(factura.valorIva), Number(gravada.valorIva))

  // PDF: com o email certo; email errado ou em falta não dão acesso.
  const pdf = await pedir(`/encomendas/${encomenda.codigoEncomenda}/factura?email=factura.teste@easyshop.test`)
  assert.equal(pdf.status, 200)
  assert.match(pdf.tipo, /application\/pdf/)
  assert.equal(pdf.corpo.subarray(0, 5).toString(), '%PDF-')
  assert.equal((await pedir(`/encomendas/${encomenda.codigoEncomenda}/factura?email=outro@x.y`)).status, 404)
  assert.equal((await pedir(`/encomendas/${encomenda.codigoEncomenda}/factura`)).status, 400)

  const vista = await pedir(`/encomendas/${encomenda.codigoEncomenda}?email=factura.teste@easyshop.test`)
  assert.equal(vista.corpo.factura.numero, esperado)
})

test('encomenda de empresa (cotação): factura com o NUIT da empresa quando o admin confirma o pagamento', async () => {
  const produto = await prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gte: 20 } }, orderBy: { id: 'desc' } })
  const pedido = await pedir('/cotacoes', { metodo: 'POST', token: empresa.token, corpo: { itens: [{ produtoId: produto.id, quantidade: 3 }] } })
  const cotacao = pedido.corpo.cotacao
  criados.cotacoes.push(cotacao.id)
  const detalhe = await pedir(`/admin/cotacoes/${cotacao.id}`, { token: admin.token })
  await pedir(`/admin/cotacoes/${cotacao.id}/responder`, {
    metodo: 'PATCH', token: admin.token,
    corpo: { validaAte: new Date(Date.now() + 5 * 86400000).toISOString(), itens: detalhe.corpo.cotacao.itens.map(item => ({ itemId: item.id, precoProposto: 1000 })) },
  })
  const aceite = await pedir(`/cotacoes/${cotacao.id}/aceitar`, {
    metodo: 'POST', token: empresa.token,
    corpo: { zonaEntregaId: tarifa.zonaEntregaId, modalidadeEntregaId: tarifa.modalidadeEntregaId, entregaLinhaEndereco: 'Obra', entregaCidade: 'Maputo', entregaProvincia: 'Maputo', aceiteTermos: true },
  })
  assert.equal(aceite.status, 201)
  const encomendaId = aceite.corpo.encomenda.id
  const empresaDb = await prisma.empresa.findUnique({ where: { utilizadorId: empresa.id } })
  const gravada = await prisma.encomenda.findUnique({ where: { id: encomendaId } })
  assert.equal(gravada.facturacaoNuit, empresaDb.nuit)

  assert.equal((await pedir(`/admin/encomendas/${encomendaId}`, { metodo: 'PATCH', token: empresa.token, corpo: { pagamentoEstado: 'CONFIRMADO' } })).status, 403)
  const confirmado = await pedir(`/admin/encomendas/${encomendaId}`, { metodo: 'PATCH', token: admin.token, corpo: { pagamentoEstado: 'CONFIRMADO' } })
  assert.equal(confirmado.status, 200)
  assert.ok(confirmado.corpo.encomenda.factura)
  const factura = await prisma.factura.findUnique({ where: { encomendaId } })
  assert.equal(factura.clienteNuit, empresaDb.nuit)
  assert.match(factura.clienteMorada, new RegExp(empresaDb.cidade))

  // Emitir outra vez devolve a mesma factura; a lista e o PDF exigem administrador.
  const repetida = await pedir(`/admin/encomendas/${encomendaId}/factura`, { metodo: 'POST', token: admin.token })
  assert.equal(repetida.corpo.factura.numero, factura.numero)
  assert.equal((await pedir('/admin/facturas', { token: empresa.token })).status, 403)
  const lista = await pedir('/admin/facturas', { token: admin.token })
  assert.ok(lista.corpo.facturas.some(f => f.numero === factura.numero))
  const pdf = await pedir(`/admin/facturas/${factura.id}/pdf`, { token: admin.token })
  assert.equal(pdf.status, 200)
  assert.equal(pdf.corpo.subarray(0, 5).toString(), '%PDF-')

  // A empresa descarrega a factura pela sessão (sem email).
  const daEmpresa = await pedir(`/encomendas/${gravada.codigoEncomenda}/factura`, { token: empresa.token })
  assert.equal(daEmpresa.status, 200)
})

test('encomenda rápida por SKU: resultado por linha e só para empresas aprovadas', async () => {
  const [comStock, poucoStock] = await Promise.all([
    prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gte: 30 } }, orderBy: { id: 'asc' } }),
    prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gt: 0, lt: 10 } } }),
  ])
  const linhas = [
    { sku: comStock.codigo.toLowerCase(), quantidade: 5 },
    { sku: 'SKU-QUE-NAO-EXISTE', quantidade: 1 },
    { sku: poucoStock.codigo, quantidade: poucoStock.quantidadeStock + 1 },
    { sku: 'SEED-ES-0003', quantidade: 0 },
  ]
  const resposta = await pedir('/cotacoes/sku', { metodo: 'POST', token: empresa.token, corpo: { linhas } })
  assert.equal(resposta.status, 200)
  assert.equal(resposta.corpo.validas, 1)
  assert.equal(resposta.corpo.invalidas, 3)
  const [ok, inexistente, semStock, quantidade] = resposta.corpo.linhas
  assert.equal(ok.valida, true)
  assert.equal(ok.produto.id, comStock.id)
  assert.equal(ok.produto.quantidadeStock, undefined, 'não expõe o stock exacto')
  assert.match(inexistente.erro, /inexistente/)
  assert.match(semStock.erro, /stock/)
  assert.match(quantidade.erro, /Quantidade/)

  assert.equal((await pedir('/cotacoes/sku', { metodo: 'POST', token: empresaPendente.token, corpo: { linhas } })).status, 403)
  assert.equal((await pedir('/cotacoes/sku', { metodo: 'POST', token: cliente.token, corpo: { linhas } })).status, 403)
  assert.equal((await pedir('/cotacoes/sku', { metodo: 'POST', token: empresa.token, corpo: { linhas: [] } })).status, 400)
})
