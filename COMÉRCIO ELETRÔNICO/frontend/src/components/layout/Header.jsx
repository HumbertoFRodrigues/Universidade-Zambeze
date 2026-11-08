import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCategorias } from '../../hooks/useCategorias.js'
import { categoriasPrincipais } from '../../services/categorias.js'
import { usePublicInfo } from '../../hooks/usePublicInfo.js'
import { useCarrinho } from '../../contexto/CarrinhoContexto.jsx'
import { api } from '../../services/api.js'
import { formatPrice } from '../../services/formatar.js'
import '../../styles/header.css'


function Icone({ nome, className = '' }) {
  const caminhos = {
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    fechar: <path d="m18 6-12 12M6 6l12 12" />,
    utilizador: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    carrinho: <><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L22 8H6" /><circle cx="10" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></>,
    sacola: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    telefone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L8 10.2a16 16 0 0 0 5.8 5.8l.9-1.9a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 1.9Z" />,
    seta: <path d="m7 10 5 5 5-5" />,
    pesquisa: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  }

  return <svg className={`epi-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{caminhos[nome]}</svg>
}

export function Header() {
  const location = useLocation()
  const { pathname, search, hash } = location
  return <HeaderContent key={pathname + search} search={search} origem={`${pathname}${search}${hash}`} />
}

function HeaderContent({ search, origem }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [popupAberto, setPopupAberto] = useState(null)
  const [categoriasVisiveis, setCategoriasVisiveis] = useState(8)
  const listaCategoriasRef = useRef(null)
  const pesquisaRef = useRef(null)
  const [termoPesquisa, setTermoPesquisa] = useState(() => {
    const parametros = new URLSearchParams(search)
    return parametros.get('busca') || parametros.get('pesquisa') || ''
  })
  const [sugestoesProdutos, setSugestoesProdutos] = useState([])
  const [sugestoesVisiveis, setSugestoesVisiveis] = useState(false)
  const [sugestoesCarregando, setSugestoesCarregando] = useState(false)
  const [erroSugestoes, setErroSugestoes] = useState('')
  const [sugestaoActiva, setSugestaoActiva] = useState(-1)
  const { quantidade, total } = useCarrinho()
  const { categorias } = useCategorias()
  const { configuracao, regras } = usePublicInfo()
  const ir = useNavigate()
  const parametros = new URLSearchParams(search)
  const categoriaAtual = parametros.get('categoria')
  const termoNormalizado = termoPesquisa.trim().toLocaleLowerCase('pt').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const sugestoesCategorias = termoNormalizado.length < 2 ? [] : categorias
    .filter(categoria => categoria.nome.toLocaleLowerCase('pt').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(termoNormalizado))
    .slice(0, 3)
  const sugestoes = [
    ...sugestoesProdutos.map(produto => ({ tipo: 'produto', item: produto })),
    ...sugestoesCategorias.map(categoria => ({ tipo: 'categoria', item: categoria })),
  ]

  useEffect(() => {
    document.documentElement.classList.toggle('epi-drawer-open', menuAberto)
    return () => document.documentElement.classList.remove('epi-drawer-open')
  }, [menuAberto])

  useEffect(() => {
    const aoClicarFora = evento => {
      if (!pesquisaRef.current?.contains(evento.target)) {
        setSugestoesVisiveis(false)
        setSugestaoActiva(-1)
      }
    }
    document.addEventListener('pointerdown', aoClicarFora)
    return () => document.removeEventListener('pointerdown', aoClicarFora)
  }, [])

  useEffect(() => {
    const termo = termoPesquisa.trim()
    if (termo.length < 2) return undefined

    const controller = new AbortController()
    const temporizador = setTimeout(() => {
      setSugestoesCarregando(true)
      setErroSugestoes('')
      const parametros = new URLSearchParams({ pesquisa: termo, pagina: '1', limite: '5' })
      api(`/produtos?${parametros.toString()}`, { signal: controller.signal })
        .then(resposta => {
          if (!controller.signal.aborted) {
            setSugestoesProdutos(Array.isArray(resposta) ? resposta : resposta?.produtos || resposta?.items || [])
          }
        })
        .catch(error => {
          if (error.name !== 'AbortError' && !controller.signal.aborted) {
            setSugestoesProdutos([])
            setErroSugestoes('Não foi possível carregar sugestões.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSugestoesCarregando(false)
        })
    }, 250)

    return () => {
      clearTimeout(temporizador)
      controller.abort()
    }
  }, [termoPesquisa])

  useEffect(() => {
    if (!menuAberto && !popupAberto) return undefined
    const fecharComEscape = evento => {
      if (evento.key === 'Escape') {
        setMenuAberto(false)
        setPopupAberto(null)
      }
    }
    document.addEventListener('keydown', fecharComEscape)
    return () => document.removeEventListener('keydown', fecharComEscape)
  }, [menuAberto, popupAberto])

  const pesquisar = evento => {
    evento.preventDefault()
    const termo = termoPesquisa.trim()
    fecharSugestoes()
    ir(termo ? '/produtos?busca=' + encodeURIComponent(termo) : '/produtos')
  }

  const fecharSugestoes = () => {
    setSugestoesVisiveis(false)
    setSugestaoActiva(-1)
  }

  const seleccionarSugestao = sugestao => {
    fecharSugestoes()
    if (sugestao.tipo === 'produto') {
      ir(`/produtos/${encodeURIComponent(sugestao.item.slug)}`)
    } else {
      ir(`/produtos?categoria=${encodeURIComponent(sugestao.item.id)}`)
    }
  }

  const aoTeclarPesquisa = evento => {
    if (evento.key === 'Escape') {
      fecharSugestoes()
      return
    }
    if (evento.key === 'ArrowDown' && sugestoesVisiveis && sugestoes.length) {
      evento.preventDefault()
      setSugestaoActiva(actual => (actual + 1) % sugestoes.length)
    }
    if (evento.key === 'ArrowUp' && sugestoesVisiveis && sugestoes.length) {
      evento.preventDefault()
      setSugestaoActiva(actual => (actual - 1 + sugestoes.length) % sugestoes.length)
    }
    if (evento.key === 'Enter' && sugestoesVisiveis && sugestaoActiva >= 0) {
      evento.preventDefault()
      seleccionarSugestao(sugestoes[sugestaoActiva])
    }
  }

  const linksCategorias = useMemo(() => categoriasPrincipais(categorias).map(categoria => ({
    id: categoria.id,
    nome: categoria.nome,
    destino: '/produtos?categoria=' + encodeURIComponent(categoria.nome),
  })), [categorias])

  useEffect(() => {
    const lista = listaCategoriasRef.current
    if (!lista) return undefined
    const medir = () => {
      const limite = window.matchMedia('(min-width: 1200px)').matches ? 8 : linksCategorias.length
      const estilo = getComputedStyle(lista.querySelector('a') || lista)
      const padding = Number.parseFloat(estilo.paddingLeft) + Number.parseFloat(estilo.paddingRight)
      const contexto = document.createElement('canvas').getContext('2d')
      contexto.font = estilo.font
      let largura = 0
      let quantidade = 0
      for (const categoria of linksCategorias.slice(0, limite)) {
        const proxima = contexto.measureText(categoria.nome).width + padding + 2
        if (largura + proxima > lista.clientWidth) break
        largura += proxima
        quantidade += 1
      }
      setCategoriasVisiveis(quantidade)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(lista)
    return () => observador.disconnect()
  }, [linksCategorias])

  const fecharMenus = () => {
    setMenuAberto(false)
    setPopupAberto(null)
  }

  return <>
    <header className="epi-header">
      <div className="epi-topbar">
        <div className="epi-container epi-topbar__inner">
          {regras?.prazosEntrega?.cidade && <Link to="/info/entrega"><Icone nome="sacola" /> Entrega em Maputo e Matola: {regras.prazosEntrega.cidade}</Link>}
          <Link to="/empresas"><Icone nome="pesquisa" /> Envie um pedido de cotação</Link>
          {configuracao?.telefone && <a href={`tel:${configuracao.telefone}`}><Icone nome="telefone" /> {regras?.vendedor?.telefoneWhatsapp || configuracao.telefone}</a>}
        </div>
      </div>

      <div className="epi-mainbar">
        <div className="epi-container epi-mainbar__inner">
          <button className="epi-menu-toggle" type="button" aria-label="Abrir menu" aria-controls="epi-drawer" aria-expanded={menuAberto} onClick={() => setMenuAberto(true)}>
            <Icone nome="menu" />
          </button>

          <Link className="epi-logo" to="/" aria-label="EasyShop - página inicial">
            <span className="epi-brand"><strong>Easy</strong><em>Shop</em></span>
          </Link>

          <form className="epi-search" ref={pesquisaRef} onSubmit={pesquisar} role="search">
            <input
              className="epi-search__input"
              type="search"
              name="busca"
              value={termoPesquisa}
              onChange={evento => {
                const valor = evento.target.value
                setTermoPesquisa(valor)
                setSugestoesProdutos([])
                setErroSugestoes('')
                setSugestoesCarregando(valor.trim().length >= 2)
                setSugestoesVisiveis(true)
                setSugestaoActiva(-1)
              }}
              onFocus={() => setSugestoesVisiveis(true)}
              onKeyDown={aoTeclarPesquisa}
              aria-label="Pesquisar produtos"
              aria-autocomplete="list"
              aria-expanded={sugestoesVisiveis && termoNormalizado.length >= 2}
              aria-controls="epi-search-suggestions"
              placeholder="O que procura?"
            />
            <button className="epi-search__button" type="submit"><Icone nome="pesquisa" /><span>Pesquisar</span></button>
            {sugestoesVisiveis && termoNormalizado.length >= 2 && <div className="epi-search__suggestions" id="epi-search-suggestions" role="listbox" aria-label="Sugestões de pesquisa">
              {sugestoes.map((sugestao, indice) => (
                <button
                  key={sugestao.tipo === 'produto' ? `produto-${sugestao.item.id}` : `categoria-${sugestao.item.id}`}
                  className={`epi-search__suggestion${sugestaoActiva === indice ? ' is-active' : ''}`}
                  type="button"
                  role="option"
                  aria-selected={sugestaoActiva === indice}
                  onMouseDown={evento => evento.preventDefault()}
                  onClick={() => seleccionarSugestao(sugestao)}
                >
                  <span className="epi-search__suggestion-type">{sugestao.tipo === 'produto' ? 'Produto' : 'Categoria'}</span>
                  <span>{sugestao.item.nome}</span>
                </button>
              ))}
              {sugestoesCarregando && <p className="epi-search__suggestion-status" role="status">A procurar…</p>}
              {!sugestoesCarregando && erroSugestoes && sugestoes.length === 0 && <p className="epi-search__suggestion-status" role="status">{erroSugestoes}</p>}
              {!sugestoesCarregando && !erroSugestoes && sugestoes.length === 0 && <p className="epi-search__suggestion-status" role="status">Sem sugestões para “{termoPesquisa.trim()}”.</p>}
              <button className="epi-search__suggestion-all" type="submit">
                Ver resultados para “{termoPesquisa.trim()}”
              </button>
            </div>}
          </form>

          <div className={`epi-action epi-action--account${popupAberto === 'conta' ? ' is-open' : ''}`} onMouseEnter={() => setPopupAberto('conta')} onMouseLeave={() => setPopupAberto(null)} onFocus={() => setPopupAberto('conta')} onBlur={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) setPopupAberto(null) }}>
            <Link className="epi-action__link" to="/conta" state={{ from: origem }} onClick={() => setPopupAberto(null)}>
              <Icone nome="utilizador" className="epi-user-icon" />
              <span className="epi-action__text"><span>Minha</span><span>conta</span></span>
            </Link>
            <div className="epi-popup epi-popup--account" role="dialog" aria-label="Acesso à conta">
              <strong>Bem-vindo à EasyShop</strong>
              <p>Aceda à sua conta ou crie um novo registo.</p>
              <Link className="epi-popup__button" to="/conta" state={{ from: origem }} onClick={() => setPopupAberto(null)}>Aceder à minha conta</Link>
            </div>
          </div>

          <div className={`epi-action epi-action--cart${popupAberto === 'carrinho' ? ' is-open' : ''}`} onMouseEnter={() => setPopupAberto('carrinho')} onMouseLeave={() => setPopupAberto(null)} onFocus={() => setPopupAberto('carrinho')} onBlur={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) setPopupAberto(null) }}>
            <Link className="epi-action__link" to="/carrinho" onClick={() => setPopupAberto(null)} aria-label={`Carrinho, ${quantidade} artigos`}>
              <Icone nome="carrinho" className="epi-cart-icon" />
              <span className="epi-cart-badge">{quantidade}</span>
              <span className="epi-action__text"><span>Carrinho</span><span>{formatPrice(total)}</span></span>
            </Link>
            <div className="epi-popup epi-popup--cart" role="dialog" aria-label="Resumo do carrinho">
              {quantidade === 0 ? <p>O seu carrinho está vazio.</p> : <p>{quantidade} artigo(s) · {formatPrice(total)}</p>}
              <Link to="/carrinho" onClick={() => setPopupAberto(null)}>Ver carrinho</Link>
            </div>
          </div>
        </div>
      </div>

      <nav className="epi-catbar" aria-label="Categorias e destaques">
        <div className="epi-container epi-catbar__inner">
          <Link className="epi-catbar__all" to="/produtos"><Icone nome="menu" /><span>Todas categorias</span></Link>
          <ul className="epi-category-list" ref={listaCategoriasRef}>
            {linksCategorias.slice(0, categoriasVisiveis).map(categoria => (
              <li className="epi-category" key={categoria.id}>
                <Link className={categoriaAtual === categoria.nome ? 'is-active' : ''} to={categoria.destino}>{categoria.nome}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>

    <div className={`epi-drawer-backdrop${menuAberto ? ' is-on' : ''}`} onClick={fecharMenus} aria-hidden="true" />
    <aside className={`epi-drawer${menuAberto ? ' is-open' : ''}`} id="epi-drawer" aria-label="Menu de navegação" aria-hidden={!menuAberto} inert={!menuAberto}>
      <div className="epi-drawer__head"><Link to="/conta" state={{ from: origem }} onClick={fecharMenus}>Minha conta</Link><Link to="/empresas" onClick={fecharMenus}>Empresas</Link></div>
      <ul className="epi-drawer__list">
        <li><Link className="epi-drawer__all-products" to="/produtos" onClick={fecharMenus}>Todas as categorias</Link></li>
      </ul>
      <p className="epi-drawer__heading">Categorias</p>
      <ul className="epi-drawer__list">
        {linksCategorias.map(categoria => (
          <li key={categoria.id}>
            <Link to={categoria.destino} onClick={fecharMenus}>{categoria.nome}</Link>
          </li>
        ))}
      </ul>
      <p className="epi-drawer__heading">Destaques</p>
    </aside>
    <button className={`epi-drawer-close${menuAberto ? ' is-on' : ''}`} type="button" aria-label="Fechar menu" onClick={fecharMenus}><Icone nome="fechar" /></button>
  </>
}
