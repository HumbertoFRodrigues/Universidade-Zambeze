import { prisma } from '../lib/prisma.js'
import { criarHashPalavraPasse } from '../controllers/auth.controller.js'
import { enviarEmail } from '../utils/email.js'
import { identificador, paginacao } from '../validators/conta.validator.js'
import { ESTADOS_EMPRESA, validarDecisaoEmpresa, validarRegistoEmpresa } from '../validators/empresa.validator.js'

const camposEmpresa = {
  id: true,
  nome: true,
  nuit: true,
  rua: true,
  bairro: true,
  cidade: true,
  provincia: true,
  telefone: true,
  email: true,
  tipoCliente: true,
  estado: true,
  motivoEstado: true,
  decididoEm: true,
  criadoEm: true,
}

// Registo público: cria a conta (perfil EMPRESA) e a empresa PENDENTE numa transacção.
// A conta pode iniciar sessão para ver o estado, mas nunca compra directamente.
export async function registarEmpresa(dados) {
  const empresa = validarRegistoEmpresa(dados)
  const [emailUsado, nuitUsado] = await Promise.all([
    prisma.utilizador.findFirst({ where: { email: { equals: empresa.email, mode: 'insensitive' } }, select: { id: true } }),
    prisma.empresa.findUnique({ where: { nuit: empresa.nuit }, select: { id: true } }),
  ])
  if (emailUsado) throw { status: 409, message: 'Este e-mail já está registado.' }
  if (nuitUsado) throw { status: 409, message: 'Já existe uma empresa registada com este NUIT.' }

  // O scrypt é lento de propósito: calcula-se fora da transacção.
  const hashPalavraPasse = criarHashPalavraPasse(empresa.palavraPasse)
  try {
    const criada = await prisma.$transaction(async tx => {
      const conta = await tx.utilizador.create({
        data: {
          nome: empresa.nome,
          email: empresa.email,
          telefone: empresa.telefone,
          hashPalavraPasse,
          perfil: 'EMPRESA',
          activo: true,
          privacidadeAceiteEm: new Date(),
        },
      })
      const { palavraPasse: _ignorada, ...dadosEmpresa } = empresa
      return tx.empresa.create({ data: { ...dadosEmpresa, utilizadorId: conta.id }, select: camposEmpresa })
    })
    return {
      message: 'Pedido de registo recebido. Vai receber um email quando a empresa for aprovada.',
      empresa: criada,
    }
  } catch (error) {
    // Dois registos em simultâneo: os índices únicos (email, NUIT) decidem.
    if (error?.code === 'P2002') throw { status: 409, message: 'O e-mail ou o NUIT já estão registados.' }
    throw error
  }
}

export async function obterEmpresaDaConta(utilizador) {
  const empresa = await prisma.empresa.findUnique({ where: { utilizadorId: utilizador.id }, select: camposEmpresa })
  if (!empresa) throw { status: 404, message: 'Esta conta não tem empresa associada.' }
  return { empresa }
}

// ==================== Administração da loja ====================

export async function listarEmpresas(query = {}) {
  const { estado, pesquisa } = query
  if (estado !== undefined && !ESTADOS_EMPRESA.includes(estado)) throw { status: 400, message: 'O estado é inválido.' }
  if (pesquisa !== undefined && (typeof pesquisa !== 'string' || pesquisa.length > 100)) {
    throw { status: 400, message: 'A pesquisa não pode exceder 100 caracteres.' }
  }
  const pagina = paginacao(query, { limitePadrao: 20 })
  const termo = pesquisa?.trim()
  const where = {
    ...(estado ? { estado } : {}),
    ...(termo ? {
      OR: [
        { nome: { contains: termo, mode: 'insensitive' } },
        { nuit: { contains: termo.replace(/\s+/g, '') } },
        { email: { contains: termo, mode: 'insensitive' } },
      ],
    } : {}),
  }
  const [empresas, total] = await Promise.all([
    prisma.empresa.findMany({ where, select: camposEmpresa, orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }], skip: pagina.skip, take: pagina.take }),
    prisma.empresa.count({ where }),
  ])
  return { empresas, total, pagina: pagina.pagina, totalPaginas: Math.max(Math.ceil(total / pagina.take), 1) }
}

export async function obterEmpresa(id) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: identificador(id, 'identificador da empresa') },
    select: { ...camposEmpresa, responsavel: { select: { nome: true } }, utilizador: { select: { activo: true, criadoEm: true } } },
  })
  if (!empresa) throw { status: 404, message: 'Empresa não encontrada.' }
  return { empresa }
}

function notificarDecisao(empresa, estado, motivo) {
  const aprovada = estado === 'APROVADA'
  return enviarEmail({
    para: empresa.email,
    assunto: aprovada ? 'A sua empresa foi aprovada - EasyShop' : 'Conta de empresa suspensa - EasyShop',
    texto: aprovada
      ? `Olá,

A empresa ${empresa.nome} (NUIT ${empresa.nuit}) foi aprovada na EasyShop.

Já pode iniciar sessão e pedir cotações.

Obrigado.`
      : `Olá,

A conta da empresa ${empresa.nome} (NUIT ${empresa.nuit}) foi suspensa na EasyShop.

Motivo: ${motivo}

Para mais informações, contacte a loja.`,
  })
}

// Aprova ou suspende; regista auditoria na mesma transacção e envia o email depois de gravar.
export async function decidirEmpresa(id, dados, admin) {
  const empresaId = identificador(id, 'identificador da empresa')
  const actual = await prisma.empresa.findUnique({ where: { id: empresaId }, select: { estado: true } })
  if (!actual) throw { status: 404, message: 'Empresa não encontrada.' }
  const { estado, motivo } = validarDecisaoEmpresa(dados, actual.estado)

  const empresa = await prisma.$transaction(async tx => {
    const actualizada = await tx.empresa.update({
      where: { id: empresaId },
      data: { estado, motivoEstado: motivo, decididoPor: admin.id, decididoEm: new Date() },
      select: camposEmpresa,
    })
    await tx.registoAuditoria.create({
      data: {
        utilizadorAutorId: admin.id,
        accao: estado === 'APROVADA' ? 'APROVACAO_EMPRESA' : 'SUSPENSAO_EMPRESA',
        tipoEntidade: 'empresa',
        idEntidade: String(empresaId),
        detalhes: { de: actual.estado, para: estado, motivo },
      },
    })
    return actualizada
  })

  const emailEnviado = await notificarDecisao(empresa, estado, motivo)
  return {
    message: estado === 'APROVADA' ? 'Empresa aprovada.' : 'Empresa suspensa.',
    emailEnviado,
    empresa,
  }
}
