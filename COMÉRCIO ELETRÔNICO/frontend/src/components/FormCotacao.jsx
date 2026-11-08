import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmpresa } from '../hooks/useEmpresa.js'
import { api, cotacoesApi } from '../services/api.js'
import { formatPrice } from '../services/formatar.js'
import { EncomendaRapidaSku } from './EncomendaRapidaSku.jsx'
import '../styles/empresas.css'

// Pedido de cotação (POST /cotacoes): só para contas de empresa aprovadas.
// O preço final é sempre o proposto pela loja; o preço pedido é só uma indicação.
export function FormCotacao({ produtoInicial = '', aoCriar }) {
  const { contaEmpresa, empresa, aprovada, loading } = useEmpresa()

  if (!contaEmpresa) {
    return <p className="nota">
      As cotações estão disponíveis para empresas e revendedores. <Link to="/register">Crie uma conta de empresa</Link> ou <Link to="/login">entre</Link> com a conta da empresa.
    </p>
  }
  if (loading) return <p role="status">A verificar a conta da empresa…</p>
  if (!aprovada) {
    return <p className="nota">
      {empresa?.estado === 'SUSPENSA'
        ? 'A conta da empresa está suspensa. Contacte a loja.'
        : 'A empresa aguarda aprovação da loja. Vai receber um email quando puder pedir cotações.'}
    </p>
  }
  return <FormularioLinhas produtoInicial={produtoInicial} aoCriar={aoCriar} />
}

function FormularioLinhas({ produtoInicial, aoCriar }) {
  const [linhas, setLinhas] = useState([])
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState([])
  const [notas, setNotas] = useState('')
  const [estado, setEstado] = useState({ aEnviar: false, erro: '', enviada: null })

  // Produto da página actual (ProductPage), se indicado.
  useEffect(() => {
    if (!produtoInicial) return undefined
    const controller = new AbortController()
    api(`/produtos/${encodeURIComponent(produtoInicial)}`, { signal: controller.signal })
      .then(resposta => {
        const produto = resposta.produto
        if (produto) setLinhas(actuais => (actuais.length ? actuais : [{ produto, quantidade: 10, precoPedido: '' }]))
      })
      .catch(() => {})
    return () => controller.abort()
  }, [produtoInicial])

  // Pesquisa no catálogo (só produtos activos, até 8 resultados).
  useEffect(() => {
    const pesquisa = termo.trim()
    if (pesquisa.length < 2) return undefined
    const controller = new AbortController()
    const espera = setTimeout(() => {
      api(`/produtos?${new URLSearchParams({ pesquisa, limite: '8' })}`, { signal: controller.signal })
        .then(resposta => setResultados(resposta.produtos || []))
        .catch(() => {})
    }, 250)
    return () => { clearTimeout(espera); controller.abort() }
  }, [termo])

  const adicionar = produto => {
    setLinhas(actuais => (actuais.some(linha => linha.produto.id === produto.id) ? actuais : [...actuais, { produto, quantidade: 10, precoPedido: '' }]))
    setTermo('')
    setResultados([])
  }
  // Linhas validadas por SKU: soma a quantidade se o produto já estiver no pedido.
  const adicionarVarios = novas => setLinhas(actuais => {
    const resultado = actuais.map(linha => ({ ...linha }))
    for (const nova of novas) {
      const existente = resultado.find(linha => linha.produto.id === nova.produto.id)
      if (existente) existente.quantidade = Number(existente.quantidade) + nova.quantidade
      else resultado.push({ produto: nova.produto, quantidade: nova.quantidade, precoPedido: '' })
    }
    return resultado
  })
  const mudar = (id, campo, valor) => setLinhas(actuais => actuais.map(linha => (linha.produto.id === id ? { ...linha, [campo]: valor } : linha)))
  const remover = id => setLinhas(actuais => actuais.filter(linha => linha.produto.id !== id))

  const enviar = async e => {
    e.preventDefault()
    if (!linhas.length) return setEstado({ aEnviar: false, erro: 'Adicione pelo menos um produto.', enviada: null })
    setEstado({ aEnviar: true, erro: '', enviada: null })
    try {
      const resposta = await cotacoesApi.criar({
        itens: linhas.map(linha => ({
          produtoId: linha.produto.id,
          quantidade: Number(linha.quantidade),
          precoPedido: linha.precoPedido === '' ? undefined : Number(linha.precoPedido),
        })),
        notas: notas.trim() || undefined,
      })
      setLinhas([])
      setNotas('')
      setEstado({ aEnviar: false, erro: '', enviada: resposta.cotacao })
      aoCriar?.(resposta.cotacao)
    } catch (error) {
      setEstado({ aEnviar: false, erro: error.message, enviada: null })
    }
  }

  if (estado.enviada) {
    return <div className="cotacao-enviada" role="status">
      <b>Pedido {estado.enviada.codigo} enviado.</b>
      <p>A loja vai responder com os preços. Acompanhe o pedido na página <Link to="/empresas">Empresas</Link>.</p>
      <button type="button" className="link" onClick={() => setEstado({ aEnviar: false, erro: '', enviada: null })}>Fazer outro pedido</button>
    </div>
  }

  return <form className="form-cotacao" onSubmit={enviar}>
    <label className="larga">Adicionar produto
      <input value={termo} onChange={e => setTermo(e.target.value)} placeholder="Pesquise pelo nome ou código" maxLength={100} />
    </label>
    {termo.trim().length >= 2 && resultados.length > 0 && <ul className="larga resultados-cotacao">
      {resultados.map(produto => (
        <li key={produto.id}><button type="button" className="link" onClick={() => adicionar(produto)}>{produto.nome} · {formatPrice(produto.preco)}</button></li>
      ))}
    </ul>}
    <EncomendaRapidaSku aoAdicionar={adicionarVarios} />
    {linhas.map(linha => (
      <fieldset key={linha.produto.id} className="larga linha-cotacao">
        <legend>{linha.produto.nome} <small>(preço de catálogo {formatPrice(linha.produto.preco)})</small></legend>
        <label>Quantidade
          <input type="number" min="1" max="100000" step="1" required value={linha.quantidade} onChange={e => mudar(linha.produto.id, 'quantidade', e.target.value)} />
        </label>
        <label>Preço pedido por unidade (opcional)
          <input type="number" min="0.01" step="0.01" value={linha.precoPedido} onChange={e => mudar(linha.produto.id, 'precoPedido', e.target.value)} />
        </label>
        <button type="button" className="link" onClick={() => remover(linha.produto.id)}>Remover</button>
      </fieldset>
    ))}
    <label className="larga">Notas para a loja (opcional)
      <textarea maxLength={2000} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Prazo de entrega, local, cores ou tamanhos" />
    </label>
    <p className="preco-referencia">O preço final é proposto pela loja na resposta à cotação.</p>
    {estado.erro && <p className="erro larga" role="alert">{estado.erro}</p>}
    <button className="botao botao-laranja larga" type="submit" disabled={estado.aEnviar || !linhas.length}>{estado.aEnviar ? 'A enviar…' : 'Pedir cotação'}</button>
  </form>
}
