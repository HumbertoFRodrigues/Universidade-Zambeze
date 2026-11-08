import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../lib/prisma.js'
import * as pagamentoService from '../services/pagamento.service.js'
import { mpesaConfigurado } from '../services/pagamentos/mpesa.js'

export async function simular(req, res, next) {
  try {
    const { codigoEncomenda, formaPagamentoId, valorPago, emailContacto } = req.body ?? {}
    const resultado = await pagamentoService.simularPagamento(
      codigoEncomenda, formaPagamentoId, valorPago, emailContacto, req.utilizador ?? null,
    )
    res.status(200).json(resultado)
  } catch (error) {
    next(error)
  }
}

export async function pagarMpesa(req, res, next) {
  try {
    const { codigoEncomenda, formaPagamentoId, valorPago, emailContacto, telefone } = req.body ?? {}
    // Em demonstração (PAGAMENTOS_SIMULACAO=true ou sem credenciais M-Pesa) confirma por simulação.
    const resultado = process.env.PAGAMENTOS_SIMULACAO === 'true' || !mpesaConfigurado()
      ? await pagamentoService.simularPagamento(codigoEncomenda, formaPagamentoId, valorPago, emailContacto, req.utilizador ?? null)
      : await pagamentoService.processarPagamentoMpesa(
        codigoEncomenda, formaPagamentoId, valorPago, emailContacto, telefone, req.utilizador ?? null,
      )
    res.status(200).json(resultado)
  } catch (error) {
    next(error)
  }
}

// Comprovativos são dados pessoais: pasta privada, nunca servida como ficheiro estático.
export const pastaComprovativos = process.env.COMPROVATIVOS_DIR
  ? path.resolve(process.env.COMPROVATIVOS_DIR)
  : fileURLToPath(new URL('../../comprovativos', import.meta.url))
mkdirSync(pastaComprovativos, { recursive: true })

const TIPOS_COMPROVATIVO = [
  { extensao: 'jpg', testar: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { extensao: 'png', testar: b => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  { extensao: 'webp', testar: b => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  { extensao: 'pdf', testar: b => b.subarray(0, 5).toString('ascii') === '%PDF-' },
]

export async function enviarComprovativo(req, res, next) {
  try {
    const corpo = req.body
    if (!Buffer.isBuffer(corpo) || corpo.length < 12) {
      return res.status(400).json({ message: 'Envie o comprovativo em JPG, PNG, WebP ou PDF (até 3 MB).' })
    }
    const tipo = TIPOS_COMPROVATIVO.find(item => item.testar(corpo))
    if (!tipo) return res.status(415).json({ message: 'O ficheiro não é uma imagem ou PDF válido.' })
    const nome = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${tipo.extensao}`
    await writeFile(path.join(pastaComprovativos, nome), corpo, { flag: 'wx' })
    const { codigo, email, forma } = req.query
    const resultado = await pagamentoService.registarTransferencia(
      { codigoEncomenda: codigo, emailContacto: email, formaPagamentoId: forma, comprovativoUrl: nome },
      req.utilizador ?? null,
    )
    res.status(201).json(resultado)
  } catch (error) {
    next(error)
  }
}

export async function listarTransferencias(_req, res, next) {
  try {
    res.json({ transferencias: await pagamentoService.listarTransferenciasEmAnalise() })
  } catch (error) {
    next(error)
  }
}

export async function verComprovativo(req, res, next) {
  try {
    const pagamento = await prisma.pagamento.findUnique({ where: { id: Number(req.params.id) || 0 }, select: { comprovativoUrl: true } })
    const nome = pagamento?.comprovativoUrl
    if (!nome || !/^[a-z0-9]+-[a-f0-9]{16}\.(jpg|png|webp|pdf)$/.test(nome)) {
      return res.status(404).json({ message: 'Comprovativo não encontrado.' })
    }
    res.set('Cache-Control', 'private, no-store')
    res.sendFile(path.join(pastaComprovativos, nome))
  } catch (error) {
    next(error)
  }
}

export async function confirmarTransferencia(req, res, next) {
  try {
    res.json(await pagamentoService.confirmarTransferencia(Number(req.params.id) || 0, req.utilizador))
  } catch (error) {
    next(error)
  }
}

export async function rejeitarTransferencia(req, res, next) {
  try {
    res.json(await pagamentoService.rejeitarTransferencia(Number(req.params.id) || 0, req.body?.motivo, req.utilizador))
  } catch (error) {
    next(error)
  }
}
