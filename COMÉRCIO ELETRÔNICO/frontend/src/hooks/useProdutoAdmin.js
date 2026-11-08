import { useCallback, useEffect, useState } from 'react'
import { produtosApi } from '../services/api.js'

export function useProdutoAdmin(id) {
  const [estado, setEstado] = useState({ id: null, produto: null, erro: '' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    produtosApi.obter(id, { signal: controller.signal })
      .then(produto => setEstado({ id, produto, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ id, produto: null, erro: error.message })
      })
    return () => controller.abort()
  }, [id, versao])

  const recarregar = useCallback(() => setVersao(valor => valor + 1), [])
  const definirProduto = useCallback(produto => setEstado({ id, produto, erro: '' }), [id])

  if (estado.id !== id) return { produto: null, erro: '', carregando: true, recarregar, definirProduto }
  return { produto: estado.produto, erro: estado.erro, carregando: false, recarregar, definirProduto }
}
