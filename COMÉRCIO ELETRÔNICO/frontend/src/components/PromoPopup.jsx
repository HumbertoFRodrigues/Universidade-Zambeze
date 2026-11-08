import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../services/api.js'
import { formatPrice } from '../services/formatar.js'
import { useAuth } from '../lib/AuthContext.jsx'
import '../styles/promo-popup.css'

const PAGINAS = ['/', '/produtos']
const ATRASO_MS = 5000
const chaveVista = utilizadorId => `easyshop-promo-vista-${utilizadorId || 'anonimo'}`

function jaVista(chave) {
  try { return sessionStorage.getItem(chave) === '1' } catch { return false }
}

function marcarVista(chave) {
  try { sessionStorage.setItem(chave, '1') } catch { /* armazenamento bloqueado */ }
}

const diasRestantes = data => Math.max(1, Math.ceil((new Date(data) - Date.now()) / 86400000))

export function PromoPopup() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [dados, setDados] = useState(null)
  const [aberto, setAberto] = useState(false)
  const chave = chaveVista(user?.id)
  const paginaPermitida = PAGINAS.includes(pathname)

  useEffect(() => {
    if (!paginaPermitida || jaVista(chave)) return undefined
    const controller = new AbortController()
    const temporizador = setTimeout(() => {
      api('/promocoes/destaque', { signal: controller.signal })
        .then(resposta => {
          if (!resposta?.promocoes?.length) return
          setDados(resposta)
          setAberto(true)
          marcarVista(chave)
        })
        .catch(() => {})
    }, ATRASO_MS)
    return () => {
      clearTimeout(temporizador)
      controller.abort()
    }
  }, [chave, paginaPermitida])

  useEffect(() => {
    if (!aberto) return undefined
    const fechar = evento => { if (evento.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', fechar)
    return () => document.removeEventListener('keydown', fechar)
  }, [aberto])

  if (!aberto || !dados) return null
  const [principal, ...outras] = dados.promocoes
  const habitual = dados.clienteHabitual

  return <div className="promo-popup" role="dialog" aria-modal="true" aria-labelledby="promo-popup-titulo" onClick={() => setAberto(false)}>
    <div className="promo-popup__caixa" onClick={evento => evento.stopPropagation()}>
      <button type="button" className="promo-popup__fechar" aria-label="Fechar" onClick={() => setAberto(false)}>×</button>
      <div className="promo-popup__topo">
        <span className="promo-popup__selo">{principal.desconto}</span>
        {habitual
          ? <>
            <p className="promo-popup__ola">Olá{habitual.nome ? `, ${habitual.nome}` : ''}! Obrigado por voltar.</p>
            <h2 id="promo-popup-titulo">{principal.paraSi ? 'Ofertas escolhidas para si' : 'Ofertas para clientes habituais'}</h2>
            <p>Já fez {habitual.encomendas} encomendas connosco. {principal.paraSi ? 'Estas ofertas são das categorias que mais compra.' : 'Veja as campanhas em curso.'}</p>
          </>
          : <>
            <h2 id="promo-popup-titulo">{principal.nome}</h2>
            {principal.descricao && <p>{principal.descricao}</p>}
          </>}
        <small>Termina em {diasRestantes(principal.terminaEm)} dia(s) · Desconto aplicado automaticamente no carrinho</small>
      </div>

      <ul className="promo-popup__produtos">
        {principal.produtos.map(produto => <li key={produto.slug}>
          <Link to={`/produtos/${encodeURIComponent(produto.slug)}`} onClick={() => setAberto(false)}>
            <div className="promo-popup__foto">{produto.imagem ? <img src={produto.imagem} alt="" loading="lazy" /> : null}</div>
            <small>{produto.marca}</small>
            <b>{produto.nome}</b>
            <span><s>{formatPrice(produto.preco)}</s> <strong>{formatPrice(produto.precoPromocional)}</strong></span>
          </Link>
        </li>)}
      </ul>

      {outras.length > 0 && <p className="promo-popup__mais">
        Também em promoção: {outras.slice(0, 3).map(promocao => promocao.nome).join(' · ')}
      </p>}

      <div className="promo-popup__accoes">
        <Link className="botao botao-laranja" to="/produtos?promocao=true" onClick={() => setAberto(false)}>Ver todas as promoções</Link>
        <button type="button" className="promo-popup__depois" onClick={() => setAberto(false)}>Agora não</button>
      </div>
    </div>
  </div>
}
