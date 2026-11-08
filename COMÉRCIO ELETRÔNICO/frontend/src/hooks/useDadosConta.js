import { useCallback, useEffect, useState } from 'react'
import { mensagemDeErro } from '../services/cliente.js'

// Carrega dados da área do cliente. carregar(opcoes) recebe { signal };
// chave identifica o pedido (muda quando os parâmetros mudam).
export function useDadosConta(carregar, chave) {
  const [versao, setVersao] = useState(0)
  const id = `${chave}|${versao}`
  const [estado, setEstado] = useState({ id: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    carregar({ signal: controller.signal })
      .then(data => setEstado({ id, data, error: null }))
      .catch(error => {
        if (error.name !== 'AbortError') setEstado({ id, data: null, error: mensagemDeErro(error) })
      })
    return () => controller.abort()
    // carregar muda a cada render; a chave identifica o pedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const recarregar = useCallback(() => setVersao(v => v + 1), [])
  const actual = estado.id === id
  return {
    data: actual ? estado.data : null,
    error: actual ? estado.error : null,
    loading: !actual,
    recarregar,
  }
}
