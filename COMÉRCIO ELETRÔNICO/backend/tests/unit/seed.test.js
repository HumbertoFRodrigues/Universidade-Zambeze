import assert from 'node:assert/strict'
import { test } from 'node:test'
import { scryptSync } from 'node:crypto'
import { existsSync } from 'node:fs'
import { Prisma } from '@prisma/client'
import { criarDadosSeed } from '../../../db/seed/dados.js'
import { gravarDadosSeed, ordemModelos } from '../../../db/seed/gravar.js'

const referencia = new Date('2026-10-11T00:00:00Z')
const dados = criarDadosSeed({ referencia })
const modelos = Prisma.dmmf.datamodel.models
const delegado = nome => nome.charAt(0).toLowerCase() + nome.slice(1)
const chave = valores => valores.map(valor => String(valor)).join('|')
const cents = valor => Math.round(Number(valor) * 100)

test('preenche todos os modelos, respeitando campos, enums, unicidade e FKs', () => {
  assert.equal(modelos.length, 36)
  for (const modelo of modelos) {
    const linhas = dados[delegado(modelo.name)]
    assert.ok(linhas?.length > 0, modelo.name)
    assert.ok(ordemModelos.includes(delegado(modelo.name)))
    const escalares = modelo.fields.filter(campo => campo.kind !== 'object')
    for (const linha of linhas) {
      for (const nome of Object.keys(linha)) assert.ok(escalares.some(campo => campo.name === nome), `${modelo.name}.${nome}`)
      for (const campo of escalares) {
        const valor = linha[campo.name]
        if (campo.isRequired && !campo.hasDefaultValue) assert.notEqual(valor == null, true, `${modelo.name}.${campo.name}`)
        if (valor != null && campo.kind === 'enum') {
          const valores = Prisma.dmmf.datamodel.enums.find(item => item.name === campo.type).values.map(item => item.name)
          assert.ok(valores.includes(valor), `${modelo.name}.${campo.name}: ${valor}`)
        }
        if (valor != null && campo.type === 'DateTime') assert.ok(valor instanceof Date && Number.isFinite(valor.getTime()))
      }
      for (const relacao of modelo.fields.filter(campo => campo.relationFromFields?.length)) {
        const valores = relacao.relationFromFields.map(campo => linha[campo])
        if (valores.some(valor => valor == null)) continue
        const destino = dados[delegado(relacao.type)]
        assert.ok(destino.some(alvo => relacao.relationToFields.every((campo, indice) => alvo[campo] === valores[indice])), `${modelo.name}.${relacao.name}`)
      }
    }
    const unicos = [
      ...escalares.filter(campo => campo.isUnique || campo.isId).map(campo => [campo.name]),
      ...modelo.uniqueFields, ...(modelo.primaryKey ? [modelo.primaryKey.fields] : []),
    ]
    for (const campos of unicos) {
      const valores = linhas.map(linha => campos.map(campo => linha[campo])).filter(valor => valor.every(item => item != null)).map(chave)
      assert.equal(new Set(valores).size, valores.length, `${modelo.name}: ${campos}`)
    }
  }
  assert.equal(dados.produto.length, 130)
  assert.equal(dados.imagemProduto.length, dados.produto.length)
  const urls = dados.imagemProduto.filter(imagem => imagem.url.startsWith('/imagens/produtos/')).map(imagem => imagem.url)
  assert.equal(new Set(urls).size, urls.length)
  assert.equal(dados.utilizador.length, 127)
  assert.equal(dados.empresa.length, 3)
  assert.ok(dados.empresa.every(empresa => /^\d{9}$/.test(empresa.nuit)))
  assert.equal(dados.encomenda.length, 240)
})

test('totais históricos, promoções e pagamentos são coerentes', () => {
  for (const encomenda of dados.encomenda) {
    const itens = dados.itemEncomenda.filter(item => item.encomendaId === encomenda.id)
    assert.ok(itens.length >= 2)
    const subtotal = itens.reduce((total, item) => total + cents(item.precoUnitario) * item.quantidade, 0)
    const desconto = itens.reduce((total, item) => total + cents(item.descontoUnitario) * item.quantidade, 0)
    assert.equal(cents(encomenda.valorSubtotal), subtotal)
    assert.equal(cents(encomenda.totalDesconto), desconto)
    assert.equal(cents(encomenda.valorTotal), subtotal - desconto + cents(encomenda.valorFrete))
    const tarifa = dados.tarifaFrete.find(item => item.zonaEntregaId === encomenda.zonaEntregaId && item.modalidadeEntregaId === encomenda.modalidadeEntregaId)
    assert.equal(tarifa.activo, true)
    const pagamentos = dados.pagamento.filter(pagamento => pagamento.encomendaId === encomenda.id)
    assert.ok(pagamentos.filter(pagamento => ['CONFIRMADO', 'REEMBOLSADO'].includes(pagamento.estado)).length <= 1)
    for (const pagamento of pagamentos) {
      assert.equal(pagamento.valor, encomenda.valorTotal)
      assert.ok(cents(pagamento.valorReembolsado) <= cents(pagamento.valor))
      assert.equal(pagamento.simulado, true)
      if (['CONFIRMADO', 'REEMBOLSADO'].includes(pagamento.estado)) assert.ok(pagamento.confirmadoEm)
    }
    const historico = dados.historicoEstadoEncomenda.filter(linha => linha.encomendaId === encomenda.id)
    assert.equal(historico.at(-1).estadoNovo, encomenda.estado)
    for (const item of itens) {
      assert.ok(item.quantidade > 0)
      assert.ok(cents(item.descontoUnitario) >= 0 && cents(item.descontoUnitario) <= cents(item.precoUnitario))
      if (item.promocaoId != null) {
        const promocao = dados.promocao.find(linha => linha.id === item.promocaoId)
        const produto = dados.produto.find(linha => linha.id === item.produtoId)
        assert.equal(promocao.activo, true)
        assert.ok(promocao.inicioEm <= encomenda.criadoEm && promocao.fimEm > encomenda.criadoEm)
        assert.ok(promocao.categoriaId === produto.categoriaId || dados.promocaoProduto.some(linha => linha.promocaoId === promocao.id && linha.produtoId === produto.id))
      }
    }
  }
})

test('livro de stock reconcilia vendas, cancelamentos e devoluções', () => {
  for (const produto of dados.produto) {
    const movimentos = dados.movimentoStock.filter(movimento => movimento.produtoId === produto.id)
    let saldo = 0
    for (const movimento of movimentos) {
      saldo += movimento.variacaoQuantidade
      assert.ok(saldo >= 0)
      assert.equal(movimento.stockApos, saldo)
      assert.notEqual(movimento.variacaoQuantidade, 0)
      if (movimento.tipoMovimento === 'VENDA') {
        assert.ok(movimento.variacaoQuantidade < 0 && Number.isInteger(movimento.itemEncomendaId))
      }
      if (movimento.tipoMovimento === 'REPOSICAO_DEVOLUCAO') {
        const item = dados.itemDevolucao.find(linha => linha.id === movimento.itemDevolucaoId)
        assert.equal(item.resultadoVerificacao, 'REVENDAVEL')
      }
    }
    assert.equal(produto.quantidadeStock, saldo)
    const imagens = dados.imagemProduto.filter(imagem => imagem.produtoId === produto.id)
    assert.equal(imagens.filter(imagem => imagem.principal).length, 1)
    // Imagens locais servidas pelo frontend (public/imagens/produtos/ ou, sem foto própria, categorias/).
    assert.ok(imagens.every(imagem => /^\/imagens\/(produtos|categorias)\/[a-z0-9-]+\.jpg$/.test(imagem.url)))
    assert.ok(imagens.every(imagem => existsSync(new URL(`../../../frontend/public${imagem.url}`, import.meta.url))))
  }
  for (const item of dados.itemEncomenda) {
    const encomenda = dados.encomenda.find(linha => linha.id === item.encomendaId)
    const venda = dados.movimentoStock.filter(linha => linha.itemEncomendaId === item.id && linha.tipoMovimento === 'VENDA')
    const reposicoes = dados.movimentoStock.filter(linha => linha.itemEncomendaId === item.id && linha.tipoMovimento === 'REPOSICAO_CANCELAMENTO')
    assert.equal(venda.length, 1)
    assert.equal(venda[0].variacaoQuantidade, -item.quantidade)
    assert.equal(reposicoes.length, encomenda.estado === 'CANCELADA' ? 1 : 0)
  }
})

test('devoluções, reembolsos e avaliações respeitam a compra original', () => {
  for (const item of dados.itemEncomenda) {
    const devolvidos = dados.itemDevolucao.filter(linha => linha.itemEncomendaId === item.id)
    const reservado = devolvidos.reduce((total, linha) => total + (dados.devolucao.find(dev => dev.id === linha.devolucaoId).estado === 'REJEITADA' ? 0 : linha.quantidade), 0)
    assert.equal(item.quantidadeDevolvida, reservado)
    assert.ok(reservado <= item.quantidade)
  }
  for (const devolucao of dados.devolucao) {
    const encomenda = dados.encomenda.find(linha => linha.id === devolucao.encomendaId)
    assert.equal(encomenda.estado, 'CONCLUIDA')
    if (devolucao.estado === 'REJEITADA') assert.ok(devolucao.justificacaoDecisao)
    for (const item of dados.itemDevolucao.filter(linha => linha.devolucaoId === devolucao.id)) {
      const original = dados.itemEncomenda.find(linha => linha.id === item.itemEncomendaId)
      assert.equal(original.encomendaId, encomenda.id)
    }
  }
  for (const reembolso of dados.reembolso) {
    const devolucao = dados.devolucao.find(linha => linha.id === reembolso.devolucaoId)
    const pagamento = dados.pagamento.find(linha => linha.id === reembolso.pagamentoId)
    const elegivel = dados.itemDevolucao.filter(linha => linha.devolucaoId === devolucao.id).reduce((total, linha) => {
      const original = dados.itemEncomenda.find(item => item.id === linha.itemEncomendaId)
      return total + (cents(original.precoUnitario) - cents(original.descontoUnitario)) * linha.quantidade
    }, 0)
    assert.equal(cents(reembolso.valor), elegivel)
    assert.equal(pagamento.encomendaId, devolucao.encomendaId)
    if (reembolso.estado === 'CONCLUIDO') {
      assert.equal(pagamento.estado, 'REEMBOLSADO')
      assert.equal(pagamento.valorReembolsado, reembolso.valor)
    }
  }
  for (const avaliacao of dados.avaliacaoProduto) {
    const item = dados.itemEncomenda.find(linha => linha.id === avaliacao.itemEncomendaId)
    const entrega = dados.entrega.find(linha => linha.encomendaId === item.encomendaId)
    assert.equal(entrega.estado, 'ENTREGUE')
    assert.ok(avaliacao.criadoEm >= entrega.entregueEm)
    assert.ok(avaliacao.classificacao >= 1 && avaliacao.classificacao <= 5)
  }
})

test('cobre todos os estados e guarda hashes scrypt em vez de palavras-passe', () => {
  for (const [modelo, campo, tipo] of [
    ['encomenda', 'estado', 'EstadoEncomenda'], ['pagamento', 'estado', 'EstadoPagamento'],
    ['entrega', 'estado', 'EstadoEntrega'], ['devolucao', 'estado', 'EstadoDevolucao'],
    ['reembolso', 'estado', 'EstadoReembolso'], ['pedidoAssistencia', 'estado', 'EstadoPedido'],
    ['movimentoStock', 'tipoMovimento', 'TipoMovimento'], ['itemDevolucao', 'resultadoVerificacao', 'CondicaoItem'],
  ]) {
    const esperado = Prisma.dmmf.datamodel.enums.find(item => item.name === tipo).values.map(item => item.name).sort()
    assert.deepEqual([...new Set(dados[modelo].map(linha => linha[campo]))].sort(), esperado)
  }
  const utilizador = dados.utilizador[0]
  const [algoritmo, n, r, p, sal, hash] = utilizador.hashPalavraPasse.split('$')
  assert.equal(algoritmo, 'scrypt')
  assert.equal(scryptSync('EasyShopTeste!2026', Buffer.from(sal, 'hex'), 64, { N: Number(n), r: Number(r), p: Number(p) }).toString('hex'), hash)
  assert.equal(new Set(dados.utilizador.map(linha => linha.email.toLowerCase())).size, dados.utilizador.length)
  assert.equal(new Set(dados.utilizador.map(linha => linha.hashPalavraPasse)).size, dados.utilizador.length)
  // Todas as contas (clientes, administradores e empresas) com o formato scrypt completo.
  assert.ok(dados.utilizador.every(linha => /^scrypt\$16384\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(linha.hashPalavraPasse)))
  assert.ok(dados.encomenda.some(linha => linha.utilizadorId === null))
  assert.ok(dados.produto.some(linha => linha.quantidadeStock === 0))
  assert.ok(dados.produto.some(linha => !linha.activo))
})

test('gravação usa uma transacção e repetir não duplica nem altera registos', async () => {
  const armazenado = Object.fromEntries(ordemModelos.map(modelo => [modelo, new Map()]))
  let transaccoes = 0
  let bloqueios = 0
  let sincronizacoes = 0
  const tx = {
    $executeRaw: async strings => {
      const query = strings.join('')
      if (query.includes('pg_advisory_xact_lock')) bloqueios++
      if (query.includes('pg_get_serial_sequence')) sincronizacoes++
      return 1
    },
  }
  for (const modelo of ordemModelos) tx[modelo] = {
    createMany: async ({ data, skipDuplicates }) => {
      assert.equal(skipDuplicates, true)
      let count = 0
      for (const linha of data) {
        const campos = 'id' in linha ? [linha.id] : modelo === 'tarifaFrete' ? [linha.zonaEntregaId, linha.modalidadeEntregaId] : [linha.promocaoId, linha.produtoId]
        const identidade = chave(campos)
        if (!armazenado[modelo].has(identidade)) { armazenado[modelo].set(identidade, { ...linha }); count++ }
      }
      return { count }
    },
    count: async ({ where }) => where.id.in.filter(valor => armazenado[modelo].has(String(valor))).length,
  }
  const prisma = { $transaction: async callback => { transaccoes++; return callback(tx) } }
  const primeira = await gravarDadosSeed(prisma, dados)
  const produto = armazenado.produto.values().next().value
  produto.quantidadeStock = 999
  const segunda = await gravarDadosSeed(prisma, dados)
  assert.equal(transaccoes, 2)
  assert.equal(bloqueios, 2)
  assert.equal(sincronizacoes, 2)
  for (const modelo of ordemModelos) {
    assert.equal(primeira[modelo].inseridos, dados[modelo].length)
    assert.equal(segunda[modelo].inseridos, 0)
  }
  assert.equal(produto.quantidadeStock, 999)
})

test('conflitos de identidade impedem continuar a gravação', async () => {
  const tx = {
    $executeRaw: async () => 1,
    categoria: { createMany: async () => ({ count: 0 }), count: async () => 0 },
  }
  const prisma = { $transaction: callback => callback(tx) }
  await assert.rejects(gravarDadosSeed(prisma, dados), /Conflito de identidade em categoria/)
})
