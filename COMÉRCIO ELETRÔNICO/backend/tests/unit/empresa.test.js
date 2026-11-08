import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizarNuit, validarDecisaoEmpresa, validarRegistoEmpresa } from '../../src/validators/empresa.validator.js'

const rejeita = (funcao, status, mensagem) => assert.throws(funcao, erro => {
  assert.equal(erro.status, status)
  if (mensagem) assert.match(erro.message, mensagem)
  return true
})

const registo = {
  nome: ' Construtora Teste, Lda ', nuit: '400 123 456', email: 'Compras@Construtora.co.mz', telefone: '+258840000000',
  rua: 'Av. 24 de Julho, 100', bairro: 'Polana', cidade: 'Maputo', provincia: 'Maputo Cidade',
  tipoCliente: 'EMPRESA', palavraPasse: 'segredo123', aceitePrivacidade: true,
}

test('NUIT: exactamente 9 dígitos, espaços ignorados', () => {
  assert.equal(normalizarNuit('400 123 456'), '400123456')
  assert.equal(normalizarNuit('400123456'), '400123456')
  for (const invalido of ['40012345', '4001234567', '40012345a', '', null, undefined, 400123456.5]) {
    rejeita(() => normalizarNuit(invalido), 400, /9 dígitos/)
  }
})

test('registo de empresa normaliza e valida os campos', () => {
  const dados = validarRegistoEmpresa(registo)
  assert.equal(dados.nome, 'Construtora Teste, Lda')
  assert.equal(dados.nuit, '400123456')
  assert.equal(dados.email, 'compras@construtora.co.mz')
  assert.equal(dados.tipoCliente, 'EMPRESA')
  assert.equal(validarRegistoEmpresa({ ...registo, tipoCliente: 'REVENDEDOR' }).tipoCliente, 'REVENDEDOR')

  rejeita(() => validarRegistoEmpresa({ ...registo, aceitePrivacidade: false }), 400, /Privacidade/)
  rejeita(() => validarRegistoEmpresa({ ...registo, tipoCliente: 'PARTICULAR' }), 400, /tipo de cliente/)
  rejeita(() => validarRegistoEmpresa({ ...registo, palavraPasse: '123' }), 400, /palavra-passe/)
  rejeita(() => validarRegistoEmpresa({ ...registo, email: 'sem-arroba' }), 400, /email/)
  rejeita(() => validarRegistoEmpresa({ ...registo, bairro: ' ' }), 400, /bairro/)
  rejeita(() => validarRegistoEmpresa({ ...registo, nuit: '123' }), 400, /NUIT/)
  rejeita(() => validarRegistoEmpresa({ ...registo, nome: 'x'.repeat(151) }), 400)
})

test('decisão do administrador: aprovar, suspender com motivo, sem repetir o estado', () => {
  assert.deepEqual(validarDecisaoEmpresa({ estado: 'APROVADA' }, 'PENDENTE'), { estado: 'APROVADA', motivo: null })
  assert.deepEqual(validarDecisaoEmpresa({ estado: 'SUSPENSA', motivo: ' NUIT inválido ' }, 'APROVADA'), { estado: 'SUSPENSA', motivo: 'NUIT inválido' })
  assert.deepEqual(validarDecisaoEmpresa({ estado: 'APROVADA' }, 'SUSPENSA'), { estado: 'APROVADA', motivo: null })
  rejeita(() => validarDecisaoEmpresa({ estado: 'SUSPENSA' }, 'PENDENTE'), 400, /motivo/)
  rejeita(() => validarDecisaoEmpresa({ estado: 'APROVADA' }, 'APROVADA'), 409)
  rejeita(() => validarDecisaoEmpresa({ estado: 'PENDENTE' }, 'APROVADA'), 400)
  rejeita(() => validarDecisaoEmpresa({ estado: 'SUSPENSA', motivo: 'x'.repeat(501) }, 'APROVADA'), 400)
})
