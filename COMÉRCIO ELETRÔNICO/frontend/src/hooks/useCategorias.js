import { useApi } from './useApi.js'

export function useCategorias() {
  const { data, error, loading } = useApi('/categorias')
  return {
    categorias: data?.categorias || [],
    error,
    loading,
  }
}
