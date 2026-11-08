import { prisma } from '../lib/prisma.js'
import { sessaoOpcional } from './auth.middleware.js'

const identificadores = request => ({ ...request.query, ...(request.body || {}) })

// O carrinho de um cliente só é acessível com a sessão desse cliente.
// Visitantes continuam a usar tokenSessao; com sessão iniciada e sem
// identificador, assume-se o carrinho do próprio utilizador.
export function exigirDonoCarrinho(request, response, next) {
  return sessaoOpcional(request, response, () => {
    const { utilizadorId, tokenSessao } = identificadores(request)
    const autenticado = request.utilizador

    if (utilizadorId !== undefined && utilizadorId !== null && utilizadorId !== '') {
      if (!autenticado) return response.status(401).json({ message: 'É necessário iniciar sessão para usar este carrinho.' })
      if (autenticado.id !== Number(utilizadorId) && autenticado.perfil !== 'ADMINISTRADOR') {
        return response.status(403).json({ message: 'Não tem permissão para aceder a este carrinho.' })
      }
      return next()
    }

    // request.query é só de leitura no Express 5; o controlador usa request.utilizador.
    if (!tokenSessao && autenticado && request.method !== 'GET') {
      request.body = { ...(request.body || {}), utilizadorId: autenticado.id }
    }
    return next()
  })
}

// Alterar ou remover um item exige provar a posse do carrinho que o contém.
export function exigirDonoItemCarrinho(request, response, next) {
  return sessaoOpcional(request, response, async () => {
    try {
      const itemId = Number(request.params.itemId)
      if (!Number.isSafeInteger(itemId)) return response.status(400).json({ message: 'Item inválido.' })

      const item = await prisma.itemCarrinho.findUnique({
        where: { id: itemId },
        select: { carrinho: { select: { utilizadorId: true, tokenSessao: true } } },
      })
      const { tokenSessao } = identificadores(request)
      const dono = item && (
        (request.utilizador && item.carrinho.utilizadorId === request.utilizador.id) ||
        (typeof tokenSessao === 'string' && tokenSessao.length > 0 && item.carrinho.tokenSessao === tokenSessao)
      )
      // 404 em vez de 403 para não revelar itens de outros carrinhos.
      if (!dono) return response.status(404).json({ message: 'Item não encontrado no carrinho.' })
      return next()
    } catch (error) {
      console.error('Erro ao verificar o item do carrinho:', error)
      return response.status(500).json({ message: 'Não foi possível verificar o item do carrinho.' })
    }
  })
}
