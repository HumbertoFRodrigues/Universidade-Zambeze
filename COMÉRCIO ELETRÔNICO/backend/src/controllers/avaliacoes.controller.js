import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../lib/prisma.js'
import { encomendasDoCliente } from '../services/conta.service.js'
import { pastaUploads } from './uploads.controller.js'

// Avaliações de produtos: só quem comprou e recebeu o produto (encomenda CONCLUIDA) pode avaliar,
// uma vez por produto, com estrelas, comentário e até 4 fotografias. A avaliação fica ligada ao
// item da encomenda (compra verificada) e PENDENTE até o administrador decidir.

const MAX_COMENTARIO = 1000
const MAX_IMAGENS = 4
const ESTADOS = ['PENDENTE', 'APROVADA', 'REJEITADA']
const CAMPOS_AVALIACAO = { classificacao: true, comentario: true, estado: true, motivoRejeicao: true, imagens: true }
const pastaAvaliacoes = path.join(pastaUploads, 'avaliacoes')
mkdirSync(pastaAvaliacoes, { recursive: true })
const URL_IMAGEM = /^\/api\/uploads\/avaliacoes\/([a-z0-9-]+\.(?:jpg|png|webp))$/

const TIPOS = [
  { extensao: 'jpg', testar: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { extensao: 'png', testar: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { extensao: 'webp', testar: b => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
]

async function produtoPorSlug(slug) {
  const produto = await prisma.produto.findUnique({ where: { slug: String(slug || '') }, select: { id: true, nome: true, activo: true } })
  if (!produto?.activo) throw { status: 404, message: 'Produto não encontrado.' }
  return produto
}

// Item de uma encomenda concluída do cliente com este produto e ainda sem avaliação.
function itemComprado(utilizador, produtoId) {
  return prisma.itemEncomenda.findFirst({
    where: { produtoId, avaliacao: null, encomenda: { AND: [encomendasDoCliente(utilizador), { estado: 'CONCLUIDA' }] } },
    orderBy: { id: 'desc' },
    select: { id: true },
  })
}

// Avaliação já feita pelo cliente a este produto (pela conta ou por uma encomenda sua).
function avaliacaoDoCliente(utilizador, produtoId) {
  return prisma.avaliacaoProduto.findFirst({
    where: { produtoId, OR: [{ utilizadorId: utilizador.id }, { itemEncomenda: { encomenda: encomendasDoCliente(utilizador) } }] },
    select: CAMPOS_AVALIACAO,
  })
}

const SEM_COMPRA = { status: 403, message: 'Só pode avaliar produtos que comprou e recebeu.' }

export async function minhaAvaliacao(req, res, next) {
  try {
    const produto = await produtoPorSlug(req.params.slug)
    const [avaliacao, item, recebido] = await Promise.all([
      avaliacaoDoCliente(req.utilizador, produto.id),
      itemComprado(req.utilizador, produto.id),
      prisma.itemEncomenda.count({ where: { produtoId: produto.id, encomenda: { AND: [encomendasDoCliente(req.utilizador), { estado: 'CONCLUIDA' }] } } }),
    ])
    res.json({ podeAvaliar: !avaliacao && Boolean(item), comprou: recebido > 0, avaliacao: avaliacao || null })
  } catch (error) {
    next(error)
  }
}

// Fotografia de uma avaliação: corpo binário (image/*), até 3 MB, validada pelos magic bytes.
export async function enviarImagemAvaliacao(req, res, next) {
  try {
    const produto = await produtoPorSlug(req.params.slug)
    if (!(await itemComprado(req.utilizador, produto.id))) throw SEM_COMPRA
    const corpo = req.body
    if (!Buffer.isBuffer(corpo) || corpo.length < 12) {
      return res.status(400).json({ message: 'Envie uma fotografia JPG, PNG ou WebP (até 3 MB).' })
    }
    const tipo = TIPOS.find(item => item.testar(corpo))
    if (!tipo) return res.status(415).json({ message: 'O ficheiro não é uma fotografia JPG, PNG ou WebP válida.' })
    const nome = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${tipo.extensao}`
    await writeFile(path.join(pastaAvaliacoes, nome), corpo, { flag: 'wx' })
    res.status(201).json({ url: `/api/uploads/avaliacoes/${nome}` })
  } catch (error) {
    next(error)
  }
}

function validarImagens(valor) {
  if (valor === undefined || valor === null) return []
  if (!Array.isArray(valor)) throw { status: 400, message: 'As fotografias são inválidas.' }
  if (valor.length > MAX_IMAGENS) throw { status: 400, message: `Pode juntar no máximo ${MAX_IMAGENS} fotografias.` }
  const unicas = [...new Set(valor)]
  for (const url of unicas) {
    const nome = typeof url === 'string' ? URL_IMAGEM.exec(url)?.[1] : null
    if (!nome || !existsSync(path.join(pastaAvaliacoes, nome))) throw { status: 400, message: 'Uma das fotografias é inválida. Envie-a novamente.' }
  }
  return unicas
}

export async function avaliarProduto(req, res, next) {
  try {
    const classificacao = Number(req.body?.classificacao)
    if (!Number.isInteger(classificacao) || classificacao < 1 || classificacao > 5) {
      return res.status(400).json({ message: 'Escolha de 1 a 5 estrelas.' })
    }
    const comentario = typeof req.body?.comentario === 'string' ? req.body.comentario.trim() : ''
    if (comentario.length > MAX_COMENTARIO) {
      return res.status(400).json({ message: `O comentário não pode exceder ${MAX_COMENTARIO} caracteres.` })
    }
    const imagens = validarImagens(req.body?.imagens)
    const produto = await produtoPorSlug(req.params.slug)
    if (await avaliacaoDoCliente(req.utilizador, produto.id)) return res.status(409).json({ message: 'Já avaliou este produto.' })
    const item = await itemComprado(req.utilizador, produto.id)
    if (!item) throw SEM_COMPRA
    try {
      await prisma.avaliacaoProduto.create({
        data: {
          produtoId: produto.id, utilizadorId: req.utilizador.id, itemEncomendaId: item.id,
          classificacao, comentario: comentario || null, imagens, estado: 'PENDENTE',
        },
      })
    } catch (error) {
      if (error?.code === 'P2002') return res.status(409).json({ message: 'Já avaliou este produto.' })
      throw error
    }
    res.status(201).json({ message: 'Obrigado! A sua avaliação foi enviada e fica visível depois de aprovada pela loja.' })
  } catch (error) {
    next(error)
  }
}

export async function listarAvaliacoesAdmin(req, res, next) {
  try {
    const estado = ESTADOS.includes(req.query.estado) ? req.query.estado : 'PENDENTE'
    const [avaliacoes, contagens] = await Promise.all([
      prisma.avaliacaoProduto.findMany({
        where: { estado },
        orderBy: { criadoEm: estado === 'PENDENTE' ? 'asc' : 'desc' },
        take: 100,
        select: {
          id: true, classificacao: true, comentario: true, estado: true, motivoRejeicao: true, imagens: true, criadoEm: true, moderadoEm: true,
          produto: { select: { nome: true, slug: true } },
          autor: { select: { nome: true, email: true } },
          itemEncomenda: { select: { encomenda: { select: { codigoEncomenda: true, nomeContacto: true, emailContacto: true } } } },
        },
      }),
      prisma.avaliacaoProduto.groupBy({ by: ['estado'], _count: { _all: true } }),
    ])
    res.json({
      estado,
      contagens: Object.fromEntries(ESTADOS.map(e => [e, contagens.find(c => c.estado === e)?._count._all || 0])),
      avaliacoes: avaliacoes.map(a => ({
        id: a.id, classificacao: a.classificacao, comentario: a.comentario, estado: a.estado,
        motivoRejeicao: a.motivoRejeicao, imagens: a.imagens, criadoEm: a.criadoEm, moderadoEm: a.moderadoEm,
        produto: a.produto.nome, slug: a.produto.slug,
        cliente: a.autor?.nome || a.itemEncomenda?.encomenda.nomeContacto || 'Cliente',
        email: a.autor?.email || a.itemEncomenda?.encomenda.emailContacto || '',
        encomenda: a.itemEncomenda?.encomenda.codigoEncomenda || null,
        compraVerificada: Boolean(a.itemEncomenda),
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function moderarAvaliacao(req, res, next) {
  try {
    const id = Number(req.params.id)
    const { estado } = req.body ?? {}
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Avaliação inválida.' })
    if (!['APROVADA', 'REJEITADA'].includes(estado)) return res.status(400).json({ message: 'O estado deve ser APROVADA ou REJEITADA.' })
    const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim().slice(0, 255) : ''
    if (estado === 'REJEITADA' && !motivo) return res.status(400).json({ message: 'Indique o motivo da rejeição.' })
    const existente = await prisma.avaliacaoProduto.findUnique({ where: { id }, select: { id: true, itemEncomendaId: true } })
    if (!existente) return res.status(404).json({ message: 'Avaliação não encontrada.' })
    await prisma.$transaction([
      prisma.avaliacaoProduto.update({
        where: { id },
        data: { estado, motivoRejeicao: estado === 'REJEITADA' ? motivo : null, moderadoEm: new Date() },
      }),
      prisma.registoAuditoria.create({
        data: {
          utilizadorAutorId: req.utilizador?.id ?? null,
          accao: estado === 'APROVADA' ? 'AVALIACAO_APROVADA' : 'AVALIACAO_REJEITADA',
          tipoEntidade: 'avaliacao_produto', idEntidade: String(id), detalhes: motivo ? { motivo } : {},
        },
      }),
    ])
    res.json({ message: estado === 'APROVADA' ? 'Avaliação aprovada e publicada.' : 'Avaliação rejeitada.' })
  } catch (error) {
    next(error)
  }
}
