import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { carrinhoApi } from '../services/api.js'
import { useAuth } from '../lib/AuthContext.jsx'

const Contexto = createContext(null)

// Atalho para usar o carrinho em qualquer componente
export const useCarrinho = () => useContext(Contexto)

const CHAVE_TOKEN = 'easyshop-carrinho'

// As contas de empresa não compram directamente (o servidor responde 403): compram por cotação.
export const AVISO_CONTA_EMPRESA = 'As contas de empresa não compram directamente; as compras são feitas através de cotações.'

// Identificador secreto do carrinho deste navegador (43 caracteres; o backend aceita até 64).
// Só o identificador fica no navegador: os itens ficam guardados no backend.
function tokenDoCarrinho() {
  try {
    const guardado = localStorage.getItem(CHAVE_TOKEN)
    if (guardado && /^[A-Za-z0-9_-]{40,64}$/.test(guardado)) return guardado
  } catch { /* sem armazenamento disponível */ }
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  try { localStorage.setItem(CHAVE_TOKEN, token) } catch { /* sem armazenamento disponível */ }
  return token
}

// Converte um item do backend para o formato usado pelas páginas (chave, produto, preco, qtd).
// Os produtos do backend não têm modelos, cores nem tamanhos: há um item por produto.
function paraItem(item) {
  return {
    chave: String(item.id),
    itemId: item.id,
    produto: {
      id: item.produtoId,
      nome: item.produto.nome,
      slug: item.produto.slug,
      preco: item.produto.preco,
      activo: item.produto.ativo,
      stockDisponivel: item.produto.stockDisponivel,
      imagens: item.produto.imagemPrincipal ? [{ url: item.produto.imagemPrincipal }] : [],
    },
    preco: Number(item.produto.preco),
    qtd: item.quantidade,
  }
}

export function CarrinhoProvider({ children }) {
  const { user } = useAuth()
  const contaEmpresa = user?.perfil === 'EMPRESA'
  const [token] = useState(tokenDoCarrinho)
  const [itens, setItens] = useState([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const temporizador = useRef(null)

  // Mostra uma mensagem curta e esconde-a passados 2,5 segundos
  const avisar = useCallback(texto => {
    setAviso(texto)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setAviso(''), 2500)
  }, [])

  const aplicar = useCallback(resposta => {
    setItens((resposta.itens || []).map(paraItem))
    setTotal(Number(resposta.totalParcial) || 0)
    setErro('')
  }, [])

  const recarregar = useCallback(async opcoes => {
    if (contaEmpresa) {
      setItens([])
      setTotal(0)
      setCarregando(false)
      return
    }
    try {
      aplicar(await carrinhoApi.consultar(token, opcoes))
    } catch (error) {
      if (error.name !== 'AbortError') setErro(error.message)
    } finally {
      setCarregando(false)
    }
  }, [aplicar, token, contaEmpresa])

  useEffect(() => {
    const controller = new AbortController()
    recarregar({ signal: controller.signal })
    return () => controller.abort()
  }, [recarregar])

  // Executa uma alteração no backend e volta a ler o carrinho; devolve true se correu bem.
  const alterar = async (operacao, sucesso) => {
    if (contaEmpresa) {
      avisar(AVISO_CONTA_EMPRESA)
      return false
    }
    try {
      await operacao()
      if (sucesso) avisar(sucesso)
      return true
    } catch (error) {
      avisar(error.message)
      return false
    } finally {
      await recarregar()
    }
  }

  // O backend soma a quantidade se o produto já estiver no carrinho e valida o stock.
  const adicionar = novo => alterar(
    () => carrinhoApi.adicionar(token, novo.produto.id, novo.qtd),
    novo.produto.nome + ' no carrinho',
  )

  const remover = chave => {
    const item = itens.find(i => i.chave === chave)
    return item ? alterar(() => carrinhoApi.remover(token, item.itemId)) : Promise.resolve(false)
  }

  // Com quantidade menor que 1, o item sai do carrinho
  const mudarQtd = (chave, qtd) => {
    if (qtd < 1) return remover(chave)
    const item = itens.find(i => i.chave === chave)
    return item ? alterar(() => carrinhoApi.actualizar(token, item.itemId, qtd)) : Promise.resolve(false)
  }

  // Sem variantes no backend, alterar um item só pode mudar a quantidade.
  const trocar = (chaveAntiga, novo) => mudarQtd(chaveAntiga, novo.qtd)

  // Não existe endpoint para esvaziar: remove-se item a item.
  const limpar = () => alterar(async () => {
    for (const item of itens) await carrinhoApi.remover(token, item.itemId)
  })

  const quantidade = itens.reduce((soma, i) => soma + i.qtd, 0)

  return (
    <Contexto.Provider value={{
      tokenSessao: token, contaEmpresa, itens, carregando, erro, recarregar, aviso, adicionar, remover, mudarQtd, trocar, limpar,
      total, quantidade,
    }}>
      {children}
    </Contexto.Provider>
  )
}
