import { createHash } from 'node:crypto'
import { prisma } from '../lib/prisma.js'

// Devolve a sessão activa do cabeçalho Authorization, null se não houver cabeçalho,
// ou lança { status: 401 } se o token for inválido ou estiver expirado.
async function obterSessao(request) {
  const cabecalho = request.get('authorization') || ''
  if (!cabecalho) return null
  const correspondencia = /^Bearer ([A-Za-z0-9_-]{40,})$/.exec(cabecalho)
  if (!correspondencia) throw { status: 401, message: 'É necessário iniciar sessão.' }

  const hashToken = createHash('sha256').update(correspondencia[1]).digest('hex')
  const sessao = await prisma.sessaoAutenticacao.findUnique({
    where: { hashToken },
    include: { utilizador: true },
  })
  if (!sessao || sessao.revogadoEm || sessao.expiraEm <= new Date() || !sessao.utilizador.activo) {
    throw { status: 401, message: 'A sessão expirou. Inicie sessão novamente.' }
  }
  return sessao
}

async function aplicarSessao(request, response, next, obrigatoria) {
  let sessao
  try {
    sessao = await obterSessao(request)
  } catch (error) {
    if (error.status === 401) return response.status(401).json({ message: error.message })
    console.error('Erro ao verificar sessão:', error)
    return response.status(500).json({ message: 'Não foi possível verificar a sessão.' })
  }
  if (!sessao) {
    if (obrigatoria) return response.status(401).json({ message: 'É necessário iniciar sessão.' })
    return next()
  }
  request.utilizador = sessao.utilizador
  request.sessaoId = sessao.id
  next()
}

export function verificarSessao(request, response, next) {
  return aplicarSessao(request, response, next, true)
}

// Rotas públicas (carrinho, checkout) que reconhecem o cliente quando há sessão.
// Um token inválido continua a dar 401, para o cliente saber que a sessão expirou.
export function sessaoOpcional(request, response, next) {
  return aplicarSessao(request, response, next, false)
}
