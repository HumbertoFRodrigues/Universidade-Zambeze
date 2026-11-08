import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const limparSessao = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  useEffect(() => {
    let activo = true
    if (!localStorage.getItem('token')) {
      setIsLoadingAuth(false)
      return () => { activo = false }
    }

    authApi.me()
      .then(utilizador => {
        if (activo) {
          setUser(utilizador)
          localStorage.setItem('user', JSON.stringify(utilizador))
        }
      })
      .catch(() => {
        if (activo) limparSessao()
      })
      .finally(() => {
        if (activo) setIsLoadingAuth(false)
      })

    return () => { activo = false }
  }, [limparSessao])

  useEffect(() => {
    const handler = () => limparSessao()
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [limparSessao])

  const login = async (email, password) => {
    const { token, user: utilizador } = await authApi.login({ email, password })
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(utilizador))
    setUser(utilizador)
    return utilizador
  }

  // Depois de editar o perfil: actualiza os dados mostrados sem pedir novo login.
  const actualizarUtilizador = useCallback(dados => {
    setUser(actual => {
      const novo = { ...actual, ...dados }
      localStorage.setItem('user', JSON.stringify(novo))
      return novo
    })
  }, [])

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      limparSessao()
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      login,
      logout,
      actualizarUtilizador,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
