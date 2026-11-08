import { useApi } from './useApi.js'

export function useProdutos() {
    const { data, error, loading } = useApi('/produtos')
    return { produtos: data?.produtos || [], loading, error, demo: false }
}

export function useProduto(slug) {
    const { data, error, loading } = useApi('/produtos/' + encodeURIComponent(slug))
    return { produto: data?.produto || null, loading, error, demo: false }
}