import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import { useCategorias } from '../../hooks/useCategorias.js'
import { usePublicInfo } from '../../hooks/usePublicInfo.js'
import { ProductCard } from '../ProductCard.jsx'
import { CREDITOS_IMAGENS, imagemCategoria, logoMarca } from './homeMedia.js'
import { LogoPagamento } from '../LogoPagamento.jsx'
import { categoriasPrincipais } from '../../services/categorias.js'

const desenhos = {
  rede: <><rect x="4" y="5" width="16" height="12" rx="2" /><path d="M8 21h8m-4-4v4M8 10h.01M12 10h.01M16 10h.01" /></>,
  video: <><rect x="3" y="6" width="14" height="12" rx="2" /><path d="m17 10 4-3v10l-4-3" /></>,
  acesso: <><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="11" r="3" /><path d="M12 14v3" /></>,
  energia: <><path d="M13 2 4 14h7l-1 8 10-13h-7z" /></>,
  alarme: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></>,
  fogo: <><path d="M12 22c5 0 8-3 8-8 0-4-3-7-5-9 0 4-2 5-2 5 0-4-3-7-5-8 1 5-4 8-4 13 0 4 3 7 8 7Z" /></>,
  epi: <><path d="M4 10a8 8 0 0 1 16 0v3H4zM3 13h18v3H3zM8 16v4m8-4v4" /></>,
}

const vantagens = [
  ['Entrega rápida', regras => `Entrega em Maputo e Matola em ${regras?.prazosEntrega?.cidade || '1 a 2 dias úteis'}, ou levantamento gratuito na loja.`],
  ['Todo o país', regras => `Envio para todas as províncias em ${regras?.prazosEntrega?.nacional || '3 a 7 dias úteis'}, com acompanhamento da encomenda.`],
  ['Pagamento local e seguro', 'M-Pesa e e-Mola no telemóvel, cartão Visa/Mastercard, transferência bancária ou numerário na entrega.'],
  ['Preços para empresas', 'Descontos automáticos a partir de 10 unidades, cotações e factura com IVA e NUIT.'],
  ['Apoio técnico', 'Ajudamos a escolher câmeras, firewalls, alarmes e EPI adequados ao seu espaço e actividade.'],
  ['Garantia', 'Produtos novos com garantia: 12 meses em equipamento electrónico e 24 meses em cofres.'],
]

function HomeIcon({ nome, className = '' }) {
  return <svg className={`hm-ico ${className}`} viewBox="0 0 24 24" aria-hidden="true">{desenhos[nome] || <circle cx="12" cy="12" r="8" />}</svg>
}

const ligacaoCategoria = categoria => `/produtos?categoria=${encodeURIComponent(categoria.nome)}`

// Imagem da categoria; sem imagem associada, mostra um espaço neutro com o ícone da loja.
function ImagemCategoria({ categoria, className }) {
  const imagem = imagemCategoria(categoria.nome)
  if (!imagem) return <span className={`${className} hm-media-vazia`} aria-hidden="true"><HomeIcon nome="epi" className="hm-ico--cat" /></span>
  return <img className={className} src={imagem.src} alt="" loading="lazy" decoding="async" />
}

const confiancaHero = [
  'Entrega em Maputo e Matola em 1–2 dias úteis',
  'Pagamento M-Pesa, e-Mola, cartão ou transferência',
  'Factura com IVA e NUIT',
  'Garantia em todos os produtos',
]

export function HomeHero() {
  return <section className="hm-hero" aria-labelledby="hero-title">
    <img className="hm-hero__img" src="/imagens/home/hero.jpg" alt="Profissional com equipamento de segurança numa obra" fetchPriority="high" />
    <div className="hm-container hm-hero__inner">
      <span className="hm-eyebrow">Segurança física e digital em Moçambique</span>
      <h1 id="hero-title">Proteja pessoas, instalações e dados num só lugar</h1>
      <p>Videovigilância, redes e firewalls, controlo de acessos, alarmes, cofres, combate a incêndios e EPI das melhores marcas, para empresas, obras e casas.</p>
      <div className="hm-hero__cta">
        <Link className="hm-btn hm-btn--gold" to="/produtos">Ver produtos</Link>
        <Link className="hm-btn hm-btn--ghost" to="/empresas">Pedir cotação para empresas</Link>
      </div>
      <ul className="hm-hero__confianca" aria-label="Vantagens">
        {confiancaHero.map(texto => <li key={texto}><span aria-hidden="true">✓</span>{texto}</li>)}
      </ul>
    </div>
  </section>
}

export function HomeCategories() {
  const { categorias, loading } = useCategorias()
  const principais = categoriasPrincipais(categorias).filter(categoria => imagemCategoria(categoria.nome)).slice(0, 8)
  const totalSub = id => categorias.filter(categoria => categoria.categoriaPaiId === id).length

  return <section className="hm-section" id="categorias" aria-labelledby="cat-title">
    <div className="hm-container">
      <header className="hm-head hm-head--accoes">
        <div><h2 id="cat-title">Compre por categoria</h2><p>Soluções completas de segurança, da obra ao centro de dados.</p></div>
        <Link className="hm-btn hm-btn--sm hm-btn--contorno" to="/produtos">Todas as categorias</Link>
      </header>
      {loading
        ? <p role="status">A carregar categorias…</p>
        : <ul className="hm-cats hm-cats--grelha" aria-label="Categorias principais">
          {principais.map(categoria => (
            <li key={categoria.id}>
              <Link className="hm-cat hm-cat--cartao" to={ligacaoCategoria(categoria)}>
                <ImagemCategoria categoria={categoria} className="hm-cat__img" />
                <span className="hm-cat__nome">{categoria.nome}</span>
                {totalSub(categoria.id) > 0 && <small>{totalSub(categoria.id)} {totalSub(categoria.id) === 1 ? 'subcategoria' : 'subcategorias'}</small>}
              </Link>
            </li>
          ))}
        </ul>}
    </div>
  </section>
}

export function HomePagamentos() {
  return <section className="hm-pagamentos" aria-labelledby="pay-title">
    <div className="hm-container hm-pagamentos__inner">
      <div>
        <h2 id="pay-title">Pague como preferir</h2>
        <p>M-Pesa e e-Mola no telemóvel, cartão Visa ou Mastercard e transferência bancária com comprovativo.</p>
      </div>
      <ul className="hm-pagamentos__logos" aria-label="Formas de pagamento">
        {['mpesa', 'emola', 'cartao', 'banco'].map(id => <li key={id}><LogoPagamento id={id} /></li>)}
      </ul>
    </div>
  </section>
}

// Carrega até 150 produtos (3 páginas de 50) para escolher uma montra variada.
function useCatalogoAlargado(filtro = '') {
  const [estado, setEstado] = useState({ produtos: [], loading: true })
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([1, 2, 3].map(pagina => api(`/produtos?limite=50&pagina=${pagina}${filtro}`, { signal: controller.signal }).catch(() => null)))
      .then(respostas => {
        if (controller.signal.aborted) return
        setEstado({ produtos: respostas.flatMap(resposta => resposta?.produtos || []), loading: false })
      })
    return () => controller.abort()
  }, [filtro])
  return estado
}

// Um produto por categoria principal, à vez (em stock e com fotografia primeiro), até ao limite.
function montraVariada(produtos, categorias, limite = 8) {
  const pai = new Map(categorias.map(categoria => [categoria.id, categoria.categoriaPaiId ?? categoria.id]))
  const ordem = categoriasPrincipais(categorias).map(categoria => categoria.id)
  const pontuacao = produto => (produto.disponibilidade === 'ESGOTADO' ? 2 : 0) + (produto.imagens?.length ? 0 : 1) - (produto.maisVendido ? 0.5 : 0)
  const grupos = new Map()
  for (const produto of [...produtos].sort((x, y) => pontuacao(x) - pontuacao(y))) {
    if (produto.disponibilidade === 'ESGOTADO' || !produto.imagens?.length) continue
    const raiz = pai.get(produto.categoria?.id) ?? produto.categoria?.id
    if (!grupos.has(raiz)) grupos.set(raiz, [])
    grupos.get(raiz).push(produto)
  }
  const chaves = [...grupos.keys()].sort((x, y) => (ordem.indexOf(x) + 1 || 99) - (ordem.indexOf(y) + 1 || 99))
  const escolhidos = []
  for (let ronda = 0; escolhidos.length < limite && chaves.some(chave => grupos.get(chave).length > ronda); ronda++) {
    for (const chave of chaves) {
      const produto = grupos.get(chave)[ronda]
      if (produto && escolhidos.length < limite) escolhidos.push(produto)
    }
  }
  return escolhidos
}

export function HomeFeaturedProducts() {
  const { categorias } = useCategorias()
  const { produtos, loading } = useCatalogoAlargado()
  const lista = montraVariada(produtos, categorias, 8)

  return <section className="hm-section hm-section--grey" id="destaques" aria-labelledby="feat-title">
    <div className="hm-container">
      <header className="hm-head"><h2 id="feat-title">Produtos em destaque</h2><p>Uma selecção de cada área: videovigilância, redes, acessos, alarmes, incêndios, cofres e EPI.</p></header>
      {loading
        ? <p role="status">A carregar produtos…</p>
        : lista.length
          ? <ul className="hm-grid hm-grid--4">{lista.map(produto => <li key={produto.slug}><ProductCard produto={produto} /></li>)}</ul>
          : <p>Não há produtos disponíveis neste momento.</p>}
      <p className="hm-section__more"><Link className="hm-btn hm-btn--gold hm-btn--sm" to="/produtos">Ver todos os produtos</Link></p>
    </div>
  </section>
}

export function HomeOffers() {
  const { categorias } = useCategorias()
  const { produtos, loading } = useCatalogoAlargado('&promocao=true')
  const ofertas = montraVariada(produtos, categorias, 8)
  if (!loading && !ofertas.length) return null

  return <section className="hm-section" id="ofertas" aria-labelledby="offer-title">
    <div className="hm-container">
      <Link className="hm-faixa-promo" to="/produtos?promocao=true">
        <span className="hm-faixa-promo__selo">Promoções</span>
        <span><b>Semana da Segurança de Redes</b> e campanhas de videovigilância, acessos e EPI com descontos aplicados no carrinho.</span>
        <span className="hm-faixa-promo__ir" aria-hidden="true">Ver ofertas →</span>
      </Link>
      <header className="hm-head hm-head--accoes">
        <div><h2 id="offer-title">Ofertas em destaque</h2><p>Preços promocionais em vigor e descontos automáticos a partir de 10 unidades.</p></div>
        <Link className="hm-btn hm-btn--sm hm-btn--contorno" to="/produtos?promocao=true">Ver todas as promoções</Link>
      </header>
      {loading
        ? <p role="status">A carregar ofertas…</p>
        : <ul className="hm-grid hm-grid--4">{ofertas.map(produto => <li key={produto.slug}><ProductCard produto={produto} /></li>)}</ul>}
    </div>
  </section>
}

export function HomeBrands({ produtos }) {
  // As facetas de GET /produtos trazem todas as marcas do catálogo; os produtos carregados servem de alternativa.
  const { data } = useApi('/produtos?limite=1')
  const nomes = data?.facetas?.marcas?.length
    ? data.facetas.marcas.map(marca => marca.nome)
    : produtos.map(produto => produto.marca)
  const todas = [...new Set(nomes.filter(Boolean))]
  const comLogo = todas.filter(nome => logoMarca(nome))
  // Mostra só as marcas com logótipo verificado; se nenhuma tiver, mantém os nomes em texto.
  const marcas = (comLogo.length ? comLogo : todas).slice(0, 12)

  return <section className="hm-section hm-section--grey" id="marcas" aria-labelledby="brand-title">
    <div className="hm-container">
      <header className="hm-head"><h2 id="brand-title">Marcas em destaque</h2><p>Trabalhamos com fabricantes reconhecidos em segurança electrónica, redes e protecção individual.</p></header>
      {marcas.length
        ? <ul className="hm-brands">{marcas.map(marca => (
            <li className="hm-brand" key={marca}>
              <Link to={`/produtos?marca=${encodeURIComponent(marca)}`} title={marca}>
                {logoMarca(marca)
                  ? <img src={logoMarca(marca).src} style={logoMarca(marca).estilo} alt={marca} loading="lazy" decoding="async" />
                  : marca}
              </Link>
            </li>
          ))}</ul>
        : <p>As marcas serão apresentadas quando houver produtos no catálogo.</p>}
    </div>
  </section>
}

export function HomeSectors() {
  const { categorias } = useCategorias()
  const raizes = categoriasPrincipais(categorias).filter(categoria => imagemCategoria(categoria.nome))
  const pistaRef = useRef(null)
  const [limites, setLimites] = useState({ inicio: true, fim: true })

  const actualizarLimites = useCallback(() => {
    const pista = pistaRef.current
    if (!pista) return
    setLimites({
      inicio: pista.scrollLeft <= 2,
      fim: pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 2,
    })
  }, [])

  useEffect(() => {
    const pista = pistaRef.current
    if (!pista) return undefined
    actualizarLimites()
    const observador = new ResizeObserver(actualizarLimites)
    observador.observe(pista)
    return () => observador.disconnect()
  }, [actualizarLimites, raizes.length])

  // Avança o equivalente aos cards visíveis.
  const deslocar = direccao => {
    const pista = pistaRef.current
    if (!pista) return
    pista.scrollBy({ left: direccao * pista.clientWidth, behavior: 'smooth' })
  }

  return <section className="hm-section" id="setores" aria-labelledby="sector-title">
    <div className="hm-container">
      <header className="hm-head hm-head--accoes">
        <div><h2 id="sector-title">Soluções para cada necessidade</h2><p>Todas as áreas de segurança e as respectivas subcategorias.</p></div>
        {raizes.length > 0 && <div className="hm-carrossel__botoes">
          <button type="button" onClick={() => deslocar(-1)} disabled={limites.inicio} aria-controls="hm-setores-pista" aria-label="Ver soluções anteriores">‹</button>
          <button type="button" onClick={() => deslocar(1)} disabled={limites.fim} aria-controls="hm-setores-pista" aria-label="Ver mais soluções">›</button>
        </div>}
      </header>
      <ul className="hm-sectors" id="hm-setores-pista" ref={pistaRef} onScroll={actualizarLimites} tabIndex={0} aria-label="Soluções por categoria">
        {raizes.map(raiz => (
          <li className="hm-sector" key={raiz.id}>
            <Link className="hm-sector__media" to={ligacaoCategoria(raiz)} tabIndex={-1} aria-hidden="true">
              <ImagemCategoria categoria={raiz} className="hm-sector__img" />
            </Link>
            <div className="hm-sector__body">
              <h3><Link to={ligacaoCategoria(raiz)}>{raiz.nome}</Link></h3>
              <ul className="hm-sector__links">
                {categorias.filter(categoria => categoria.categoriaPaiId === raiz.id).map(categoria => (
                  <li key={categoria.id}><Link to={ligacaoCategoria(categoria)}>{categoria.nome}<span aria-hidden="true">→</span></Link></li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      <details className="hm-creditos">
        <summary>Créditos das imagens</summary>
        Wikimedia Commons —{' '}
        {CREDITOS_IMAGENS.map(([titulo, autor, licenca, url], indice) => (
          <span key={url}>{indice > 0 && ' · '}<a href={url} target="_blank" rel="noopener noreferrer">{titulo}</a> ({autor}, {licenca})</span>
        ))}
      </details>
    </div>
  </section>
}

export function HomeBusinesses() {
  return <section className="hm-section hm-section--dark" id="empresas" aria-labelledby="biz-title">
    <div className="hm-container hm-biz">
      <div className="hm-biz__media">
        <img src="/imagens/home/equipa.jpg" alt="Equipa a trabalhar num estaleiro" loading="lazy" />
      </div>
      <div className="hm-biz__text">
        <span className="hm-eyebrow">Soluções para empresas</span>
        <h2 id="biz-title">Projectos de segurança à medida da sua empresa</h2>
        <p>Do escritório ao estaleiro: dimensionamos o equipamento, apresentamos uma cotação com preços por quantidade e acompanhamos a entrega.</p>
        <ul className="hm-biz__list">
          <li><HomeIcon nome="video" className="hm-ico--sm" />Videovigilância: câmeras IP, NVR, discos e monitorização</li>
          <li><HomeIcon nome="rede" className="hm-ico--sm" />Redes seguras: firewalls, switches, Wi-Fi e racks</li>
          <li><HomeIcon nome="acesso" className="hm-ico--sm" />Controlo de acessos e alarmes para escritórios e armazéns</li>
          <li><HomeIcon nome="epi" className="hm-ico--sm" />EPI e combate a incêndios para equipas e obras</li>
        </ul>
        <div className="hm-hero__cta">
          <Link className="hm-btn hm-btn--gold" to="/empresas">Pedir cotação</Link>
          <Link className="hm-btn hm-btn--ghost" to="/info/contactos">Falar com a equipa</Link>
        </div>
      </div>
    </div>
  </section>
}

export function HomeAdvantages() {
  const { regras } = usePublicInfo()
  return <section className="hm-section" id="vantagens" aria-labelledby="adv-title">
    <div className="hm-container">
      <header className="hm-head"><h2 id="adv-title">Porquê a EasyShop</h2><p>Uma loja moçambicana especializada em segurança, com apoio do início ao fim da compra.</p></header>
      <ul className="hm-advs">
        {vantagens.map(([titulo, texto], indice) => (
          <li className="hm-adv" key={titulo}>
            <HomeIcon nome={['video', 'energia', 'acesso', 'epi', 'rede', 'fogo'][indice]} className="hm-ico--adv" />
            <div><h3>{indice === 5 ? <Link to="/info/garantia">{titulo}</Link> : titulo}</h3><p>{typeof texto === 'function' ? texto(regras) : texto}</p></div>
          </li>
        ))}
      </ul>
    </div>
  </section>
}

export function HomeContacto() {
  const { configuracao } = usePublicInfo()
  const telefone = configuracao?.telefone
  return <section className="hm-news" id="contacto" aria-labelledby="news-title">
    <div className="hm-container hm-news__inner">
      <div>
        <h2 id="news-title">Precisa de ajuda a escolher?</h2>
        <p>Fale com a nossa equipa: indicamos o equipamento certo para a sua casa, empresa ou obra{configuracao?.horarioAtendimento ? ` (${configuracao.horarioAtendimento})` : ''}.</p>
      </div>
      <div className="hm-contacto__accoes">
        {telefone && <a className="hm-btn hm-btn--dark" href={`tel:${telefone}`}>Ligar {telefone}</a>}
        <Link className="hm-btn hm-btn--claro" to="/empresas">Pedir cotação</Link>
        <Link className="hm-btn hm-btn--claro" to="/info/perguntas-frequentes">Perguntas frequentes</Link>
      </div>
    </div>
  </section>
}
