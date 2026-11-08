// Bloqueio temporário por IP: 3 inícios de sessão falhados seguidos (em 15 min) bloqueiam
// esse IP em TODO o site durante 50 segundos. Em memória: basta para uma instância.

export const MAX_FALHAS_LOGIN = 3
export const BLOQUEIO_SEGUNDOS = 50
const JANELA_FALHAS_MS = 15 * 60 * 1000

const falhas = new Map()
const bloqueados = new Map()

const limpar = setInterval(() => {
  const agora = Date.now()
  for (const [ip, ate] of bloqueados) if (ate <= agora) bloqueados.delete(ip)
  for (const [ip, registo] of falhas) if (registo.expiraEm <= agora) falhas.delete(ip)
}, 60 * 1000)
limpar.unref()

function segundosRestantes(ip) {
  const ate = bloqueados.get(ip)
  if (!ate) return 0
  const restante = Math.ceil((ate - Date.now()) / 1000)
  if (restante <= 0) bloqueados.delete(ip)
  return Math.max(0, restante)
}

function respostaBloqueio(response, segundos) {
  response.set('Retry-After', String(segundos))
  return response.status(429).json({
    message: `Acesso restrito: demasiadas tentativas de início de sessão falhadas. Tente novamente dentro de ${segundos} segundos.`,
    bloqueado: true,
    segundos,
  })
}

// Antes de todas as rotas da API: um IP bloqueado não acede a nada (excepto ao estado do serviço).
export function bloqueioGlobal(request, response, next) {
  if (request.path === '/api/health') return next()
  const segundos = segundosRestantes(request.ip)
  return segundos ? respostaBloqueio(response, segundos) : next()
}

// Nas rotas de login: conta as respostas 401 (credenciais inválidas). À terceira falha,
// a própria resposta já indica o bloqueio; um login bem-sucedido limpa o contador.
export function contarFalhasLogin(request, response, next) {
  const ip = request.ip
  const jsonOriginal = response.json.bind(response)
  response.json = corpo => {
    if (response.statusCode === 401) {
      const agora = Date.now()
      const actual = falhas.get(ip)
      const registo = !actual || actual.expiraEm <= agora ? { n: 0, expiraEm: agora + JANELA_FALHAS_MS } : actual
      registo.n += 1
      falhas.set(ip, registo)
      if (registo.n >= MAX_FALHAS_LOGIN) {
        falhas.delete(ip)
        bloqueados.set(ip, agora + BLOQUEIO_SEGUNDOS * 1000)
        return respostaBloqueio(response, BLOQUEIO_SEGUNDOS)
      }
      const restantes = MAX_FALHAS_LOGIN - registo.n
      return jsonOriginal({
        ...corpo,
        message: `${corpo?.message || 'Credenciais inválidas.'} ${restantes === 1 ? 'Resta 1 tentativa' : `Restam ${restantes} tentativas`} antes de o acesso ser bloqueado.`,
        tentativasRestantes: restantes,
      })
    }
    if (response.statusCode < 400) falhas.delete(ip)
    return jsonOriginal(corpo)
  }
  next()
}
