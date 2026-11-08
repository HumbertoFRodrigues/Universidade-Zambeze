// Integração B2B (Fase 1): registo de empresa, aprovação pelo admin e bloqueio de compras.
// Servidor em processo + base de dados real. Tudo o que é criado é apagado no fim.
// O SMTP aponta para uma porta local fechada: nenhum email real é enviado.
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
let cliente
const sufixo = randomBytes(4).toString('hex')
const emailEmpresa = `empresa-teste-${sufixo}@easyshop.test`
// NUIT de teste com 9 dígitos, diferente a cada execução.
const nuit = String(900000000 + Math.floor(Math.random() * 99999999)).slice(0, 9)
const criados = { utilizadores: [] }

async function pedir(caminho, { metodo = 'GET', token, corpo } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  const resposta = await fetch(base + caminho, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) })
  return { status: resposta.status, corpo: await resposta.json().catch(() => null) }
}

async function entrar(email, palavraPasse = PALAVRA_PASSE) {
  const { status, corpo } = await pedir('/auth/login', { metodo: 'POST', corpo: { email, palavraPasse } })
  assert.equal(status, 200, `login de ${email}`)
  return { token: corpo.token, ...corpo.utilizador }
}

const registo = {
  nome: `Empresa Teste ${sufixo}, Lda`, nuit, email: emailEmpresa, telefone: '+258840009999',
  rua: 'Av. de teste, 1', bairro: 'Central', cidade: 'Maputo', provincia: 'Maputo Cidade',
  tipoCliente: 'REVENDEDOR', palavraPasse: 'empresa-teste-123', aceitePrivacidade: true,
}

before(async () => {
  servidor = app.listen(0)
  await new Promise(resolver => servidor.once('listening', resolver))
  base = `http://127.0.0.1:${servidor.address().port}/api`
  admin = await entrar('admin1@easyshop.test')
  cliente = await entrar('cliente080@easyshop.test')
})

after(async () => {
  const empresas = await prisma.empresa.findMany({ where: { utilizadorId: { in: criados.utilizadores } }, select: { id: true } })
  await prisma.registoAuditoria.deleteMany({ where: { tipoEntidade: 'empresa', idEntidade: { in: empresas.map(e => String(e.id)) } } })
  // A empresa e as sessões são apagadas em cascata com a conta.
  await prisma.utilizador.deleteMany({ where: { id: { in: criados.utilizadores } } })
  await new Promise(resolver => servidor.close(resolver))
  await prisma.$disconnect()
})

test('registo de empresa cria a conta EMPRESA e a empresa PENDENTE', async () => {
  const invalido = await pedir('/auth/registar-empresa', { metodo: 'POST', corpo: { ...registo, nuit: '12345' } })
  assert.equal(invalido.status, 400)

  const criado = await pedir('/auth/registar-empresa', { metodo: 'POST', corpo: registo })
  assert.equal(criado.status, 201)
  assert.equal(criado.corpo.empresa.estado, 'PENDENTE')
  const conta = await prisma.utilizador.findUnique({ where: { email: emailEmpresa }, include: { empresa: true } })
  criados.utilizadores.push(conta.id)
  assert.equal(conta.perfil, 'EMPRESA')
  assert.equal(conta.empresa.nuit, nuit)
  assert.equal(conta.empresa.tipoCliente, 'REVENDEDOR')

  const mesmoNuit = await pedir('/auth/registar-empresa', { metodo: 'POST', corpo: { ...registo, email: `outra-${sufixo}@easyshop.test` } })
  assert.equal(mesmoNuit.status, 409)
  const mesmoEmail = await pedir('/auth/registar-empresa', { metodo: 'POST', corpo: { ...registo, nuit: '123456789' } })
  assert.equal(mesmoEmail.status, 409)
})

test('a conta de empresa entra, vê o estado e nunca compra directamente', async () => {
  const empresa = await entrar(emailEmpresa, registo.palavraPasse)
  assert.equal(empresa.perfil, 'EMPRESA')

  const minha = await pedir('/empresa', { token: empresa.token })
  assert.equal(minha.status, 200)
  assert.equal(minha.corpo.empresa.estado, 'PENDENTE')
  assert.equal((await pedir('/empresa', { token: cliente.token })).status, 403, 'cliente particular')

  const produto = await prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gt: 0 } } })
  const token = randomBytes(24).toString('base64url')
  const compras = [
    pedir(`/carrinho?tokenSessao=${token}`, { token: empresa.token }),
    pedir('/carrinho/itens', { metodo: 'POST', token: empresa.token, corpo: { tokenSessao: token, produtoId: produto.id, quantidade: 1 } }),
    pedir('/checkout/calcular-frete', { metodo: 'POST', token: empresa.token, corpo: { tokenSessao: token, zonaEntregaId: 1, modalidadeEntregaId: 1 } }),
    pedir('/checkout/confirmar', { metodo: 'POST', token: empresa.token, corpo: {} }),
    pedir('/pagamentos/simular', { metodo: 'POST', token: empresa.token, corpo: {} }),
    pedir('/devolucoes', { metodo: 'POST', token: empresa.token, corpo: {} }),
  ]
  for (const resposta of await Promise.all(compras)) {
    assert.equal(resposta.status, 403)
    assert.match(resposta.corpo.message, /cotações/)
  }
  assert.equal(await prisma.carrinho.count({ where: { tokenSessao: token } }), 0)
})

test('só o administrador lista, aprova e suspende empresas', async () => {
  const conta = await prisma.utilizador.findUnique({ where: { email: emailEmpresa }, include: { empresa: true } })
  const id = conta.empresa.id

  assert.equal((await pedir('/admin/empresas', { token: cliente.token })).status, 403)
  assert.equal((await pedir(`/admin/empresas/${id}/estado`, { metodo: 'PATCH', token: cliente.token, corpo: { estado: 'APROVADA' } })).status, 403)

  const pendentes = await pedir(`/admin/empresas?estado=PENDENTE&pesquisa=${nuit}`, { token: admin.token })
  assert.equal(pendentes.status, 200)
  assert.ok(pendentes.corpo.empresas.some(empresa => empresa.id === id))
  assert.equal((await pedir('/admin/empresas?estado=OUTRO', { token: admin.token })).status, 400)

  const semMotivo = await pedir(`/admin/empresas/${id}/estado`, { metodo: 'PATCH', token: admin.token, corpo: { estado: 'SUSPENSA' } })
  assert.equal(semMotivo.status, 400)

  const aprovada = await pedir(`/admin/empresas/${id}/estado`, { metodo: 'PATCH', token: admin.token, corpo: { estado: 'APROVADA' } })
  assert.equal(aprovada.status, 200)
  assert.equal(aprovada.corpo.empresa.estado, 'APROVADA')
  // O SMTP de teste está fechado: a aprovação é gravada e o envio é indicado como falhado.
  assert.equal(aprovada.corpo.emailEnviado, false)
  const gravada = await prisma.empresa.findUnique({ where: { id } })
  assert.equal(gravada.estado, 'APROVADA')
  assert.equal(gravada.decididoPor, admin.id)
  assert.ok(gravada.decididoEm)
  assert.equal(await prisma.registoAuditoria.count({ where: { tipoEntidade: 'empresa', idEntidade: String(id), accao: 'APROVACAO_EMPRESA' } }), 1)

  assert.equal((await pedir(`/admin/empresas/${id}/estado`, { metodo: 'PATCH', token: admin.token, corpo: { estado: 'APROVADA' } })).status, 409)

  const suspensa = await pedir(`/admin/empresas/${id}/estado`, { metodo: 'PATCH', token: admin.token, corpo: { estado: 'SUSPENSA', motivo: 'Teste de suspensão' } })
  assert.equal(suspensa.status, 200)
  const empresa = await entrar(emailEmpresa, registo.palavraPasse)
  const vista = await pedir('/empresa', { token: empresa.token })
  assert.equal(vista.corpo.empresa.estado, 'SUSPENSA')
  assert.equal(vista.corpo.empresa.motivoEstado, 'Teste de suspensão')
})

test('o fluxo B2C continua igual para um cliente particular', async () => {
  const produto = await prisma.produto.findFirst({ where: { activo: true, quantidadeStock: { gt: 0 } } })
  const token = randomBytes(24).toString('base64url')
  const adicionado = await pedir('/carrinho/itens', { metodo: 'POST', token: cliente.token, corpo: { tokenSessao: token, produtoId: produto.id, quantidade: 1 } })
  assert.equal(adicionado.status, 200)
  await prisma.carrinho.deleteMany({ where: { tokenSessao: token } })
})
