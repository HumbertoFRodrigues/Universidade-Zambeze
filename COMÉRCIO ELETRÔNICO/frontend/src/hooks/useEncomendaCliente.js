import { useEffect, useState } from 'react'
import { clienteApi, mensagemDeErro } from '../services/cliente.js'

// versao: incrementar para voltar a pedir a encomenda (por exemplo, depois de a cancelar).
export function useEncomendaCliente(codigo, email, versao = 0) {
  const chave = `${codigo}|${email}|${versao}`
  const [state, setState] = useState({ chave: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    clienteApi.encomenda(codigo, email, { signal: controller.signal })
      .then(data => setState({ chave, data, error: null }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ chave, data: null, error: mensagemDeErro(error) })
      })
    return () => controller.abort()
  }, [chave, codigo, email])

  return state.chave === chave
    ? { ...state, loading: false }
    : { data: null, error: null, loading: true }
}
