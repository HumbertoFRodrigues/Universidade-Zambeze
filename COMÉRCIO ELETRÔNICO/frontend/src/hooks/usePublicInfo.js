import { useApi } from './useApi.js'

export function usePublicInfo() {
  const { data, error, loading } = useApi('/configuracao-publica')
  const configuracao = data?.configuracao || null
  return {
    configuracao,
    regras: configuracao?.regrasComerciais || null,
    error,
    loading,
  }
}
