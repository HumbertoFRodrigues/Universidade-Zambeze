export function errorHandler(error, _request, response, _next) {
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ message: 'JSON inválido.' })
  }
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'Pedido demasiado grande.' })
  }
  // Os serviços de encomendas e pagamentos lançam { status, message } para erros esperados (4xx).
  // Objectos simples { status, message } são erros previstos dos serviços (ex.: 503 da M-Pesa) e podem
  // ser mostrados; instâncias de Error com 5xx (Prisma, falhas internas) nunca expõem detalhes.
  const previsto = !(error instanceof Error) || (error.status >= 400 && error.status < 500)
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 600 && typeof error.message === 'string' && previsto) {
    return response.status(error.status).json({ message: error.message })
  }
  console.error(error)
  response.status(500).json({ message: 'Não foi possível processar o pedido.' })
}
