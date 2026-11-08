import { prisma } from '../lib/prisma.js'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcrypt'
import { solicitarRecuperacao, reporPalavraPasse } from '../services/auth.service.js'


// Função auxiliar para gerar o hash da palavra-passe compatível com o seed
export function criarHashPalavraPasse(palavraPasse) {
  const sal = randomBytes(16).toString('hex')
  const chave = scryptSync(palavraPasse, Buffer.from(sal, 'hex'), 64, { N: 16384, r: 8, p: 1 }).toString('hex')
  return `scrypt$16384$8$1$${sal}$${chave}`
}

// Função auxiliar atualizada para suportar tanto bcrypt (reset) como scrypt (registo/seed)
async function verificarPalavraPasse(palavraPasse, hashArmazenado) {
  try {
    // Se o hash começar por $2 (formato bcrypt), usamos o bcrypt.compare
    if (hashArmazenado && hashArmazenado.startsWith('$2')) {
      return await bcrypt.compare(palavraPasse, hashArmazenado)
    }

    // Caso contrário, mantemos a compatibilidade com o scrypt
    const partes = hashArmazenado.split('$')
    if (partes.length !== 6) return false
    const [, N_str, r_str, p_str, sal, chaveArmazenada] = partes
    const N = Number(N_str)
    const r = Number(r_str)
    const p = Number(p_str)
    const chaveCalculada = scryptSync(palavraPasse, Buffer.from(sal, 'hex'), 64, { N, r, p }).toString('hex')
    return timingSafeEqual(Buffer.from(chaveCalculada, 'hex'), Buffer.from(chaveArmazenada, 'hex'))
  } catch {
    return false
  }
}

// 1. Registo de Cliente
export async function registar(request, response) {
  try {
    const { nome, email, telefone, palavraPasse, aceitePrivacidade } = request.body

    if (!nome || !email || !telefone || !palavraPasse) {
      return response.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' })
    }

    if (!aceitePrivacidade) {
      return response.status(400).json({ message: 'É obrigatório aceitar a Política de Privacidade.' })
    }

    // Verificar se o email já existe
    const emailNormalizado = email.trim().toLowerCase()
    const existente = await prisma.utilizador.findUnique({ where: { email: emailNormalizado } })
    if (existente) {
      return response.status(409).json({ message: 'Este e-mail já está registado.' })
    }

    const hashPalavraPasse = criarHashPalavraPasse(palavraPasse)

    const utilizador = await prisma.utilizador.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        telefone: telefone.trim(),
        hashPalavraPasse,
        perfil: 'CLIENTE',
        activo: true,
        privacidadeAceiteEm: new Date(),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        perfil: true,
        criadoEm: true,
      },
    })

    return response.status(201).json({
      message: 'Conta criada com sucesso.',
      utilizador,
    })
  } catch (error) {
    console.error('Erro no registo:', error)
    return response.status(500).json({ message: 'Não foi possível concluir o registo.' })
  }
}

// 2. Início de Sessão (Login normal de Cliente)
export async function login(request, response) {
  try {
    const { email, palavraPasse } = request.body

    if (typeof email !== 'string' || typeof palavraPasse !== 'string' || !email.trim() || !palavraPasse) {
      return response.status(400).json({ message: 'E-mail e palavra-passe são obrigatórios.' })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const utilizador = await prisma.utilizador.findUnique({ where: { email: emailNormalizado } })

    if (!utilizador || !utilizador.activo) {
      return response.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const palavraPasseValida = await verificarPalavraPasse(palavraPasse, utilizador.hashPalavraPasse)
    if (!palavraPasseValida) {
      return response.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const token = randomBytes(32).toString('base64url')
    await prisma.sessaoAutenticacao.create({
      data: {
        utilizadorId: utilizador.id,
        hashToken: createHash('sha256').update(token).digest('hex'),
        expiraEm: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    })

    return response.json({
      message: 'Sessão iniciada com sucesso.',
      token,
      utilizador: {
        id: utilizador.id,
        nome: utilizador.nome,
        email: utilizador.email,
        telefone: utilizador.telefone,
        perfil: utilizador.perfil,
      },
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return response.status(500).json({ message: 'Não foi possível iniciar sessão.' })
  }
}

// 3. Início de Sessão Exclusivo para Administradores
export async function loginAdmin(request, response) {
  try {
    const { email, palavraPasse } = request.body

    if (typeof email !== 'string' || typeof palavraPasse !== 'string' || !email.trim() || !palavraPasse) {
      return response.status(400).json({ message: 'E-mail e palavra-passe são obrigatórios.' })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const utilizador = await prisma.utilizador.findUnique({ where: { email: emailNormalizado } })

    // Bloqueia imediatamente o acesso se a conta não tiver perfil de ADMINISTRADOR
    if (!utilizador || !utilizador.activo || utilizador.perfil !== 'ADMINISTRADOR') {
      return response.status(403).json({ message: 'Acesso negado. Área restrita a administradores.' })
    }

    const palavraPasseValida = await verificarPalavraPasse(palavraPasse, utilizador.hashPalavraPasse)
    if (!palavraPasseValida) {
      return response.status(401).json({ message: 'Credenciais inválidas.' })
    }

    const token = randomBytes(32).toString('base64url')
    await prisma.sessaoAutenticacao.create({
      data: {
        utilizadorId: utilizador.id,
        hashToken: createHash('sha256').update(token).digest('hex'),
        expiraEm: new Date(Date.now() + 12 * 60 * 60 * 1000), // Expira em 12 horas
      },
    })

    return response.json({
      message: 'Sessão administrativa iniciada com sucesso.',
      token,
      utilizador: {
        id: utilizador.id,
        nome: utilizador.nome,
        email: utilizador.email,
        telefone: utilizador.telefone,
        perfil: utilizador.perfil,
      },
    })
  } catch (error) {
    console.error('Erro no login de admin:', error)
    return response.status(500).json({ message: 'Não foi possível iniciar sessão administrativa.' })
  }
}

export async function obterSessao(request, response) {
  const { id, nome, email, telefone, perfil } = request.utilizador
  return response.json({ utilizador: { id, nome, email, telefone, perfil } })
}

export async function terminarSessao(request, response) {
  try {
    await prisma.sessaoAutenticacao.update({
      where: { id: request.sessaoId },
      data: { revogadoEm: new Date() },
    })
    return response.status(204).end()
  } catch (error) {
    console.error('Erro ao terminar sessão:', error)
    return response.status(500).json({ message: 'Não foi possível terminar a sessão.' })
  }
}

export async function postEsquecerPalavraPasse(req, res) {
  try {
    const { email } = req.body
    const resultado = await solicitarRecuperacao(email)
    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao solicitar recuperação de palavra-passe:', error)
    return res.status(error.status || 500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}

export async function postReporPalavraPasse(req, res) {
  try {
    const { token, novaPalavraPasse } = req.body
    const resultado = await reporPalavraPasse(token, novaPalavraPasse)
    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao repor palavra-passe:', error)
    return res.status(error.status || 500).json({ message: error.message || 'Erro interno no servidor.' })
  }
}