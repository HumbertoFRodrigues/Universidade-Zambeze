import { verificarSessao } from './auth.middleware.js'

export async function verificarAdmin(request, response, next) {
  await verificarSessao(request, response, () => {
    if (request.utilizador.perfil !== 'ADMINISTRADOR') {
      return response.status(403).json({ message: 'Privilégios de administrador necessários.' })
    }
    request.admin = request.utilizador
    next()
  })
}