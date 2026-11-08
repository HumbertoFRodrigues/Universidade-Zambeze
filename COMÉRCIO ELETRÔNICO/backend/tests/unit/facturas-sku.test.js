import assert from 'node:assert/strict'
import { test } from 'node:test'
import { anoEmMocambique, ivaIncluido, numeroFactura } from '../../src/services/precos.js'
import { normalizarLinhasSku } from '../../src/validators/cotacao.validator.js'

test('IVA incluído: base + IVA = total exacto, com arredondamento ao centavo', () => {
  assert.deepEqual(ivaIncluido(11600, 16), { baseCentavos: 10000, ivaCentavos: 1600 })
  for (const total of [1, 99, 12345, 2427550, 100000001]) {
    const { baseCentavos, ivaCentavos } = ivaIncluido(total, 16)
    assert.equal(baseCentavos + ivaCentavos, total)
    assert.ok(Math.abs(ivaCentavos - total * 16 / 116) <= 0.5)
  }
  assert.deepEqual(ivaIncluido(5000, 0), { baseCentavos: 5000, ivaCentavos: 0 })
  assert.throws(() => ivaIncluido(100, 100))
  assert.throws(() => ivaIncluido(100, -1))
})

test('numeração das facturas: FT AAAA/NNNN com pelo menos 4 dígitos', () => {
  assert.equal(numeroFactura(2026, 1), 'FT 2026/0001')
  assert.equal(numeroFactura(2026, 123), 'FT 2026/0123')
  assert.equal(numeroFactura(2026, 12345), 'FT 2026/12345')
})

test('ano fiscal no fuso de Moçambique (UTC+2)', () => {
  assert.equal(anoEmMocambique(new Date('2026-12-31T21:59:00Z')), 2026)
  assert.equal(anoEmMocambique(new Date('2026-12-31T22:00:00Z')), 2027)
})

test('linhas SKU: erros de formato por linha, sem rejeitar o pedido inteiro', () => {
  const linhas = normalizarLinhasSku([
    { sku: ' SEED-ES-0001 ', quantidade: 5 },
    { sku: '', quantidade: 2 },
    { sku: 'SEED-ES-0002', quantidade: 0 },
    { sku: 'seed-es-0001', quantidade: 1 },
  ])
  assert.deepEqual(linhas.map(linha => linha.erro === null), [true, false, false, false])
  assert.equal(linhas[0].sku, 'SEED-ES-0001')
  assert.match(linhas[3].erro, /repetido/)
  assert.throws(() => normalizarLinhasSku([]), erro => erro.status === 400)
  assert.throws(() => normalizarLinhasSku(Array.from({ length: 201 }, (_, i) => ({ sku: `S${i}`, quantidade: 1 }))), erro => erro.status === 400)
})
