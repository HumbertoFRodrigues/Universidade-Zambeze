import { useCallback, useEffect, useState } from 'react'
import { categoriasApi } from '../services/api.js'

// GET /admin/categorias devolve todas as categorias (activas e inactivas) de uma vez.
export function useCategoriasAdmin() {
  const [estado, setEstado] = useState({ categorias: null, erro: '' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    categoriasApi.listarAdmin({ signal: controller.signal })
      .then(resposta => setEstado({ categorias: resposta.categorias || [], erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ categorias: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])

  const recarregar = useCallback(() => setVersao(valor => valor + 1), [])
  // Substitui uma categoria após confirmação do backend, mantendo totalProdutos.
  const actualizarCategoria = useCallback(categoria => setEstado(anterior => ({
    ...anterior,
    categorias: (anterior.categorias || []).map(item => (item.id === categoria.id ? { ...item, ...categoria } : item)),
  })), [])

  return {
    categorias: estado.categorias,
    erro: estado.erro,
    carregando: !estado.categorias && !estado.erro,
    recarregar,
    actualizarCategoria,
  }
}

// Ordena por nome, cada categoria seguida das suas subcategorias, com o nível de profundidade.
export function ordenarHierarquia(categorias) {
  const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt')
  const ids = new Set(categorias.map(item => item.id))
  const vistos = new Set()
  const resultado = []
  const visitar = (categoria, nivel) => {
    if (vistos.has(categoria.id)) return
    vistos.add(categoria.id)
    resultado.push({ ...categoria, nivel })
    categorias.filter(item => item.categoriaPaiId === categoria.id).sort(porNome).forEach(filha => visitar(filha, nivel + 1))
  }
  categorias.filter(item => item.categoriaPaiId == null || !ids.has(item.categoriaPaiId)).sort(porNome).forEach(raiz => visitar(raiz, 0))
  // Salvaguarda para referências circulares: nenhuma categoria fica de fora.
  categorias.filter(item => !vistos.has(item.id)).sort(porNome).forEach(item => visitar(item, 0))
  return resultado
}
