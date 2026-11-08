import { randomBytes } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { consultarEncomenda } from './encomenda.service.js'
import { emitirFactura } from './factura.service.js'
import { c2bSingleStage, mpesaConfigurado, mensagemErroMpesa, normalizarTelefoneMpesa } from './pagamentos/mpesa.js'

// Confirma um pagamento real via M-Pesa C2B API.
export async function processarPagamentoMpesa(codigoEncomenda, formaPagamentoId, valorPago, emailContacto, telefone, utilizador = null) {
  const idForma = Number(formaPagamentoId)
  if (!codigoEncomenda || formaPagamentoId === null || formaPagamentoId === '' ||
      !Number.isSafeInteger(idForma) || idForma < 0 || !valorPago || !telefone) {
    throw { status: 400, message: 'Forneça codigoEncomenda, formaPagamentoId, valorPago e telefone.' }
  }

  const telefoneLimpo = normalizarTelefoneMpesa(telefone)
  if (!telefoneLimpo) {
    throw { status: 400, message: 'Número de telemóvel M-Pesa inválido. Use um número 84 ou 85.' }
  }

  if (!mpesaConfigurado()) {
    throw { status: 503, message: 'Pagamento M-Pesa não está configurado no servidor.' }
  }

  const encomenda = await consultarEncomenda(codigoEncomenda, emailContacto, utilizador)

  if (encomenda.estado !== 'REGISTADA') {
    throw { status: 400, message: `A encomenda não aceita pagamentos neste momento (estado: ${encomenda.estado}).` }
  }

  if (Math.abs(Number(valorPago) - Number(encomenda.valorTotal)) > 0.01) {
    throw { status: 400, message: `O valor submetido (${valorPago}) difere do total da encomenda (${encomenda.valorTotal}).` }
  }

  const forma = await prisma.formaPagamento.findUnique({ where: { id: idForma } })
  if (!forma || !forma.activo) {
    throw { status: 400, message: 'A forma de pagamento selecionada não está activa ou não existe.' }
  }

  const valorInteiro = String(Math.round(Number(encomenda.valorTotal)))
  // A M-Pesa só aceita referências alfanuméricas de 1 a 20 caracteres (senão devolve INS-17/INS-19).
  // Referência visível no M-Pesa: "CoelEASYSHOP" + 8 dígitos (20 caracteres no total).
  const PREFIXO = 'CoelEASYSHOP'
  const referenciaTransaccao = `${PREFIXO}${String(randomBytes(4).readUInt32BE(0) % 1e8).padStart(8, '0')}`
  const digitosEncomenda = String(codigoEncomenda).replace(/\D/g, '').slice(-8).padStart(8, '0')
  const referenciaTerceiro = `${PREFIXO}${digitosEncomenda}`

  let resultado
  try {
    resultado = await c2bSingleStage({
      telefone: telefoneLimpo,
      valor: valorInteiro,
      referenciaTransaccao,
      referenciaTerceiro,
    })
  } catch (_err) {
    throw { status: 503, message: 'Ligação à M-Pesa interrompida. Se confirmou o PIN, verifique o saldo.' }
  }

  if (resultado.codigo !== 'INS-0') {
    const codigo = resultado.codigo || 'INS-6'
    throw {
      status: 422,
      message: mensagemErroMpesa(codigo),
      codigoMpesa: codigo,
      descricaoMpesa: resultado.descricao,
    }
  }

  const referenciaOperacao = resultado.transaccaoId || referenciaTransaccao

  let factura
  try {
    factura = await prisma.$transaction(async (tx) => {
      await tx.pagamento.create({
        data: {
          encomendaId: encomenda.id,
          formaPagamentoId: forma.id,
          referenciaOperacao,
          valor: encomenda.valorTotal,
          estado: 'CONFIRMADO',
          simulado: false,
          confirmadoEm: new Date()
        }
      })

      const avancada = await tx.encomenda.updateMany({
        where: { id: encomenda.id, estado: 'REGISTADA' },
        data: { estado: 'EM_PROCESSAMENTO', actualizadoEm: new Date() }
      })
      if (avancada.count !== 1) {
        throw { status: 409, message: 'A encomenda já foi paga ou alterada entretanto.' }
      }

      await tx.historicoEstadoEncomenda.create({
        data: {
          encomendaId: encomenda.id,
          estadoAnterior: 'REGISTADA',
          estadoNovo: 'EM_PROCESSAMENTO',
          observacao: `Pagamento M-Pesa confirmado (${referenciaOperacao}).`
        }
      })

      await tx.registoAuditoria.create({
        data: {
          accao: 'PAGAMENTO_MPESA_CONFIRMADO',
          tipoEntidade: 'encomenda',
          idEntidade: String(encomenda.id),
          detalhes: { metodo: forma.nome, valor: valorPago, transaccaoMpesa: referenciaOperacao, telefone: telefoneLimpo }
        }
      })

      return emitirFactura(tx, encomenda.id)
    }, { timeout: 20000 })
  } catch (error) {
    if (error?.code === 'P2002') throw { status: 409, message: 'A encomenda já tem um pagamento confirmado.' }
    throw error
  }

  return {
    sucesso: true,
    message: 'Pagamento confirmado com sucesso.',
    referenciaOperacao,
    formaPagamento: forma.nome,
    factura: { numero: factura.numero },
  }
}

// Só para formas de pagamento simuladas: confirma o pagamento sem fornecedor externo.
// Quem paga tem de provar acesso à encomenda (email de contacto ou sessão do dono).
export async function simularPagamento(codigoEncomenda, formaPagamentoId, valorPago, emailContacto, utilizador = null) {
  // formaPagamentoId pode ser 0 (os identificadores do seed começam em 0).
  const idForma = Number(formaPagamentoId)
  if (!codigoEncomenda || formaPagamentoId === null || formaPagamentoId === '' ||
      !Number.isSafeInteger(idForma) || idForma < 0 || !valorPago) {
    throw { status: 400, message: 'Forneça codigoEncomenda, formaPagamentoId e valorPago.' }
  }

  // 1. Obter a encomenda (404 se o email/sessão não corresponder)
  const encomenda = await consultarEncomenda(codigoEncomenda, emailContacto, utilizador)

  // 2. AT15: Confirmação única e Estados (Evita dupla cobrança)
  if (encomenda.estado !== 'REGISTADA') {
    throw { status: 400, message: `A encomenda não aceita pagamentos neste momento (estado: ${encomenda.estado}).` }
  }

  // 3. AT15: Valor igual ao total
  if (Math.abs(Number(valorPago) - Number(encomenda.valorTotal)) > 0.01) {
    throw { status: 400, message: `O valor submetido (${valorPago}) difere do total da encomenda (${encomenda.valorTotal}).` }
  }

  // 4. AT15: Formas activas
  const forma = await prisma.formaPagamento.findUnique({ where: { id: idForma } })
  if (!forma || !forma.activo) {
    throw { status: 400, message: 'A forma de pagamento selecionada não está activa ou não existe.' }
  }
  // Com as chaves M-Pesa configuradas, o M-Pesa só é confirmado pela API real (POST /pagamentos/mpesa).
  if (!forma.simulado || (forma.codigo === 'MPESA' && mpesaConfigurado())) {
    throw { status: 400, message: 'Esta forma de pagamento não é simulada e precisa da confirmação do fornecedor.' }
  }

  const referenciaOperacao = `SIM-${codigoEncomenda}-${Date.now()}`

  // 5. Transação Atómica na Base de Dados
  let factura
  try {
    factura = await prisma.$transaction(async (tx) => {
      // 5.1 Cria o pagamento como CONFIRMADO e assinalado como simulado
      await tx.pagamento.create({
        data: {
          encomendaId: encomenda.id,
          formaPagamentoId: forma.id,
          referenciaOperacao,
          valor: encomenda.valorTotal,
          estado: 'CONFIRMADO',
          simulado: true,
          confirmadoEm: new Date()
        }
      })

      // 5.2 Avança a encomenda para EM_PROCESSAMENTO, só se ainda estiver REGISTADA
      // (dois pedidos em simultâneo não podem pagar a mesma encomenda).
      const avancada = await tx.encomenda.updateMany({
        where: { id: encomenda.id, estado: 'REGISTADA' },
        data: { estado: 'EM_PROCESSAMENTO', actualizadoEm: new Date() }
      })
      if (avancada.count !== 1) {
        throw { status: 409, message: 'A encomenda já foi paga ou alterada entretanto.' }
      }

      // 5.3 Regista o histórico de transição
      await tx.historicoEstadoEncomenda.create({
        data: {
          encomendaId: encomenda.id,
          estadoAnterior: 'REGISTADA',
          estadoNovo: 'EM_PROCESSAMENTO',
          observacao: `Pagamento confirmado via ${forma.nome}.`
        }
      })

      // 5.4 Auditoria global
      await tx.registoAuditoria.create({
        data: {
          accao: 'PAGAMENTO_CONFIRMADO',
          tipoEntidade: 'encomenda',
          idEntidade: String(encomenda.id),
          detalhes: { metodo: forma.nome, valor: valorPago }
        }
      })

      // 5.5 Factura numerada na mesma transacção (sem saltos se algo falhar).
      return emitirFactura(tx, encomenda.id)
    }, { timeout: 20000 })
  } catch (error) {
    // Índice pagamento_confirmado_unico: já existe um pagamento confirmado para a encomenda.
    if (error?.code === 'P2002') throw { status: 409, message: 'A encomenda já tem um pagamento confirmado.' }
    throw error
  }

  // 6. AT15: Sucesso identificado como simulação
  return {
    message: 'Pagamento confirmado com sucesso.',
    referenciaOperacao,
    formaPagamento: forma.nome,
    factura: { numero: factura.numero },
  }
}
// ───────────── Transferência bancária: comprovativo e análise pelo administrador ─────────────

const formaTransferencia = forma => forma && (forma.codigo === 'TRANSFERENCIA' || /transfer/i.test(forma.nome))

// Regista (ou substitui) o comprovativo; o pagamento fica PENDENTE até o administrador o confirmar.
export async function registarTransferencia({ codigoEncomenda, emailContacto, formaPagamentoId, comprovativoUrl }, utilizador = null) {
  const idForma = Number(formaPagamentoId)
  if (!codigoEncomenda || !Number.isSafeInteger(idForma) || idForma < 0) {
    throw { status: 400, message: 'Indique a encomenda e a forma de pagamento.' }
  }
  const encomenda = await consultarEncomenda(codigoEncomenda, emailContacto, utilizador)
  if (encomenda.estado !== 'REGISTADA') {
    throw { status: 400, message: 'Esta encomenda já não aguarda pagamento.' }
  }
  const forma = await prisma.formaPagamento.findUnique({ where: { id: idForma } })
  if (!forma?.activo || !formaTransferencia(forma)) {
    throw { status: 400, message: 'A forma de pagamento indicada não é transferência bancária.' }
  }
  const existente = await prisma.pagamento.findFirst({
    where: { encomendaId: encomenda.id, formaPagamentoId: forma.id, estado: 'PENDENTE' },
  })
  const pagamento = existente
    ? await prisma.pagamento.update({ where: { id: existente.id }, data: { comprovativoUrl, motivoFalha: null } })
    : await prisma.pagamento.create({
      data: {
        encomendaId: encomenda.id, formaPagamentoId: forma.id, valor: encomenda.valorTotal,
        referenciaOperacao: `TRF-${randomBytes(6).toString('hex').toUpperCase()}`,
        estado: 'PENDENTE', simulado: false, comprovativoUrl,
      },
    })
  await prisma.registoAuditoria.create({
    data: { accao: 'COMPROVATIVO_TRANSFERENCIA', tipoEntidade: 'encomenda', idEntidade: String(encomenda.id), detalhes: { pagamentoId: pagamento.id } },
  })
  return {
    message: 'Comprovativo recebido. O pagamento está em análise.',
    referenciaOperacao: pagamento.referenciaOperacao,
    estado: 'EM_ANALISE',
  }
}

export function listarTransferenciasEmAnalise() {
  return prisma.pagamento.findMany({
    where: { estado: 'PENDENTE', comprovativoUrl: { not: null } },
    orderBy: { id: 'desc' },
    select: {
      id: true, referenciaOperacao: true, valor: true, comprovativoUrl: true,
      formaPagamento: { select: { nome: true } },
      encomenda: { select: { codigoEncomenda: true, nomeContacto: true, emailContacto: true, criadoEm: true } },
    },
  })
}

export async function confirmarTransferencia(id, administrador) {
  const pagamento = await prisma.pagamento.findUnique({ where: { id }, include: { formaPagamento: true } })
  if (!pagamento || pagamento.estado !== 'PENDENTE') throw { status: 404, message: 'Transferência em análise não encontrada.' }
  try {
    const factura = await prisma.$transaction(async tx => {
      await tx.pagamento.update({ where: { id }, data: { estado: 'CONFIRMADO', confirmadoEm: new Date() } })
      const avancada = await tx.encomenda.updateMany({
        where: { id: pagamento.encomendaId, estado: 'REGISTADA' },
        data: { estado: 'EM_PROCESSAMENTO', actualizadoEm: new Date() },
      })
      if (avancada.count !== 1) throw { status: 409, message: 'A encomenda já foi paga ou alterada entretanto.' }
      await tx.historicoEstadoEncomenda.create({
        data: {
          encomendaId: pagamento.encomendaId, estadoAnterior: 'REGISTADA', estadoNovo: 'EM_PROCESSAMENTO',
          observacao: 'Transferência bancária confirmada após análise do comprovativo.',
        },
      })
      await tx.registoAuditoria.create({
        data: {
          utilizadorAutorId: administrador?.id ?? null, accao: 'PAGAMENTO_CONFIRMADO', tipoEntidade: 'encomenda',
          idEntidade: String(pagamento.encomendaId), detalhes: { metodo: pagamento.formaPagamento.nome, pagamentoId: id },
        },
      })
      return emitirFactura(tx, pagamento.encomendaId)
    }, { timeout: 20000 })
    return { message: 'Transferência confirmada e factura emitida.', factura: { numero: factura.numero } }
  } catch (error) {
    if (error?.code === 'P2002') throw { status: 409, message: 'A encomenda já tem um pagamento confirmado.' }
    throw error
  }
}

export async function rejeitarTransferencia(id, motivo, administrador) {
  const texto = String(motivo || '').trim().slice(0, 255)
  if (!texto) throw { status: 400, message: 'Indique o motivo da rejeição.' }
  const pagamento = await prisma.pagamento.findUnique({ where: { id } })
  if (!pagamento || pagamento.estado !== 'PENDENTE') throw { status: 404, message: 'Transferência em análise não encontrada.' }
  await prisma.pagamento.update({ where: { id }, data: { estado: 'FALHADO', motivoFalha: texto } })
  await prisma.registoAuditoria.create({
    data: {
      utilizadorAutorId: administrador?.id ?? null, accao: 'TRANSFERENCIA_REJEITADA', tipoEntidade: 'encomenda',
      idEntidade: String(pagamento.encomendaId), detalhes: { pagamentoId: id, motivo: texto },
    },
  })
  return { message: 'Transferência rejeitada. O cliente pode enviar outro comprovativo.' }
}
