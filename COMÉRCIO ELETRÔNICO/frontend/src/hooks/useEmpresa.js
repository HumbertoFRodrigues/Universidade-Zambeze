import { useAuth } from '../lib/AuthContext.jsx'
import { empresaApi } from '../services/api.js'
import { useDadosConta } from './useDadosConta.js'

// Empresa da conta da sessão (só para contas com perfil EMPRESA).
export function useEmpresa() {
  const { user } = useAuth()
  const contaEmpresa = user?.perfil === 'EMPRESA'
  const { data, error, loading, recarregar } = useDadosConta(
    opcoes => (contaEmpresa ? empresaApi.minha(opcoes) : Promise.resolve(null)), `empresa-${user?.id ?? 'anonimo'}`,
  )
  return {
    contaEmpresa,
    empresa: data?.empresa || null,
    aprovada: data?.empresa?.estado === 'APROVADA',
    error,
    loading: contaEmpresa && loading,
    recarregar,
  }
}
