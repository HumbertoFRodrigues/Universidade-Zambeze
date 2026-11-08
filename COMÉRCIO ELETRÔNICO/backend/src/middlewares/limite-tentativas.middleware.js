// Limite de tentativas em memória (AT40). Por omissão conta só as respostas
// falhadas: um login bem-sucedido limpa o contador. Basta para uma única instância;
// com várias réplicas, mover os contadores para Redis.
export function limitarTentativas({ maximo, janelaMs, mensagem, chave = request => request.ip, apenasFalhas = true }) {
  const tentativas = new Map()

  const limpar = setInterval(() => {
    const agora = Date.now()
    for (const [id, registo] of tentativas) if (registo.expiraEm <= agora) tentativas.delete(id)
  }, janelaMs)
  limpar.unref()

  return (request, response, next) => {
    const id = chave(request)
    const agora = Date.now()
    const registo = tentativas.get(id)

    if (registo && registo.expiraEm > agora && registo.falhas >= maximo) {
      response.set('Retry-After', String(Math.ceil((registo.expiraEm - agora) / 1000)))
      return response.status(429).json({ message: mensagem })
    }

    response.on('finish', () => {
      if (apenasFalhas && response.statusCode < 400) {
        tentativas.delete(id)
        return
      }
      if (response.statusCode === 429 || response.statusCode >= 500) return
      const actual = tentativas.get(id)
      if (!actual || actual.expiraEm <= Date.now()) tentativas.set(id, { falhas: 1, expiraEm: Date.now() + janelaMs })
      else actual.falhas += 1
    })
    next()
  }
}

const emailOuIp = request => `${request.ip}|${String(request.body?.email || '').trim().toLowerCase()}`

export const limiteLogin = limitarTentativas({
  maximo: 5,
  janelaMs: 15 * 60 * 1000,
  chave: emailOuIp,
  mensagem: 'Demasiadas tentativas de início de sessão. Tente novamente dentro de 15 minutos.',
})

// Cada pedido M-Pesa envia uma notificação ao telemóvel do cliente: limitar evita abusos.
export const limitePagamentos = limitarTentativas({
  maximo: 20,
  janelaMs: 10 * 60 * 1000,
  apenasFalhas: false,
  mensagem: 'Demasiados pedidos de pagamento. Aguarde alguns minutos e tente novamente.',
})

export const limiteRecuperacao = limitarTentativas({
  maximo: 5,
  janelaMs: 60 * 60 * 1000,
  // A resposta é sempre genérica (200), por isso contam todos os pedidos.
  apenasFalhas: false,
  mensagem: 'Demasiados pedidos de recuperação. Tente novamente mais tarde.',
})
