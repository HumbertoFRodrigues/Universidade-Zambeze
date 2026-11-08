import { prisma } from '../lib/prisma.js'

// As contas de empresa (perfil EMPRESA) nunca compram directamente: compram aceitando cotações.
// Usar depois de sessaoOpcional/verificarSessao nas rotas de compra (carrinho, checkout, pagamento, devolução).
export function bloquearContaEmpresa(request, response, next) {
  if (request.utilizador?.perfil === 'EMPRESA') {
    return response.status(403).json({ message: 'As contas de empresa não compram directamente; as compras são feitas através de cotações.' })
  }
  next()
}

// Pagamentos: a empresa só paga encomendas suas criadas a partir de uma cotação aceite.
// Os restantes perfis seguem as regras normais (consultarEncomenda valida o dono).
export async function permitirEmpresaSoEmCotacoes(request, response, next) {
  if (request.utilizador?.perfil !== 'EMPRESA') return next()
  const codigo = request.body?.codigoEncomenda || request.query?.codigo
  const encomenda = typeof codigo === 'string' && codigo
    ? await prisma.encomenda.findFirst({
      where: { codigoEncomenda: codigo, utilizadorId: request.utilizador.id, cotacao: { isNot: null } },
      select: { id: true },
    })
    : null
  if (!encomenda) {
    return response.status(403).json({ message: 'As contas de empresa só pagam encomendas criadas a partir das suas cotações.' })
  }
  next()
}

// Rotas exclusivas da conta de empresa.
export function exigirContaEmpresa(request, response, next) {
  if (request.utilizador?.perfil !== 'EMPRESA') {
    return response.status(403).json({ message: 'Esta área é exclusiva das contas de empresa.' })
  }
  next()
}
