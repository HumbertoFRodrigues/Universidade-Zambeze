import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduto, useProdutos } from '../hooks/useProdutos.js'
import { usePublicInfo } from '../hooks/usePublicInfo.js'
import { useCarrinho } from '../contexto/CarrinhoContexto.jsx'
import { Foto } from '../components/Foto.jsx'
import { SeletorCor } from '../components/SeletorCor.jsx'
import { Estrelas } from '../components/Estrelas.jsx'
import { Avaliacoes } from '../components/Avaliacoes.jsx'
import { ProductCard } from '../components/ProductCard.jsx'
import { FormCotacao } from '../components/FormCotacao.jsx'
import { formatPrice, precoFinal, extraDaCor } from '../services/formatar.js'
import { rotuloTamanho } from '../services/tamanhos.js'
import { precoComDesconto, textoEscalao } from '../services/comercio.js'
import '../styles/produto.css'

// Carrega o produto e só depois mostra o detalhe, para a página começar sempre limpa
// Chaves antigas em minúsculas ganham rótulo legível e passam para o fim da ficha técnica.
const ROTULOS_FICHA = { material: 'Material', categoria: 'Categoria', cor: 'Cor', serie: 'Série', origem: 'Origem' }
function fichaTecnica(especificacoes) {
  if (!especificacoes || Array.isArray(especificacoes) || typeof especificacoes !== 'object') return []
  const entradas = Object.entries(especificacoes).filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
  const principais = entradas.filter(([chave]) => !ROTULOS_FICHA[chave])
  const gerais = entradas.filter(([chave]) => ROTULOS_FICHA[chave]).map(([chave, valor]) => [ROTULOS_FICHA[chave], valor])
  const vistos = new Set(principais.map(([chave]) => chave))
  // O PostgreSQL (JSONB) não guarda a ordem das chaves: ordena para uma leitura natural.
  const peso = chave => {
    const indice = ['Marca', 'Modelo', 'Linha', 'Série', 'Tipo'].indexOf(chave)
    if (indice !== -1) return indice
    if (/^(Normas|Certificação|Conteúdo da embalagem)$/.test(chave)) return 900
    return 100
  }
  principais.sort((a, b) => peso(a[0]) - peso(b[0]))
  return [...principais, ...gerais.filter(([chave]) => !vistos.has(chave))]
    .map(([chave, valor]) => [chave.replace(/_/g, ' ').replace(/^./, letra => letra.toUpperCase()), valor])
}

export function ProductPage() {
  const { slug } = useParams()
  const { produto, loading } = useProduto(slug)
  if (loading) return <p role="status">A carregar produto…</p>
  if (!produto) return <p role="alert">Produto não encontrado. <Link to="/produtos">Voltar ao catálogo</Link></p>
  return <Detalhe key={slug} produto={produto} />
}

function Detalhe({ produto }) {
  const { produtos } = useProdutos()
  const { regras } = usePublicInfo()
  const { adicionar } = useCarrinho()
  const cores = produto.cores || []
  const modelos = produto.modelos || []
  const tamanhos = produto.tamanhos || []
  const rotulo = rotuloTamanho(tamanhos)
  const guia = regras?.guiasTamanho?.[produto.slug]
  const escaloes = regras?.atacado || []
  const prazoDevolucaoDias = regras?.prazoDevolucaoDias
  const prazos = regras?.prazosEntrega
  const qtdMinimaAtacado = escaloes.find(escalao => escalao.desconto > 0)?.de

  const [foto, setFoto] = useState(0)
  const [corId, setCorId] = useState(cores[0]?.id)
  const [modelo, setModelo] = useState(0)
  const [tamanho, setTamanho] = useState('')
  const [qtd, setQtd] = useState(1)
  // "#avaliacoes" (por exemplo, ao voltar do registo para enviar uma avaliação) abre o separador Avaliações.
  const [aba, setAba] = useState(() => (window.location.hash === '#avaliacoes' ? 2 : 0))
  useEffect(() => {
    if (window.location.hash === '#avaliacoes') document.getElementById('abas')?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  const [erro, setErro] = useState('')
  const [verGuia, setVerGuia] = useState(false)
  const [cotando, setCotando] = useState(false)

  const cor = cores.find(c => c.id === corId)
  const extra = extraDaCor(produto, corId)
  const preco = precoFinal(produto, modelo, corId)
  // Produto em promoção (sem modelo com preço próprio): preço antigo, desconto e selo.
  const promo = produto.precoPromocional != null && !(produto.modelos || [])[modelo] && Number(produto.preco) > Number(produto.precoPromocional)
    ? (() => {
      const antigo = Number(produto.preco) + extraDaCor(produto, corId)
      return { antigo, percentagem: Math.round((1 - preco / antigo) * 100) }
    })()
    : null
  const semelhantes = produtos.filter(p => p.slug !== produto.slug && p.categoria?.nome === produto.categoria?.nome).slice(0, 4)
  const especificacoes = fichaTecnica(produto.especificacoes)

  const comprar = () => {
    if (tamanhos.length && !tamanho) return setErro(`Escolha o ${rotulo.toLowerCase()} antes de adicionar.`)
    setErro('')
    adicionar({
      chave: `${produto.slug}|${modelo}|${corId}|${tamanho}`,
      produto, cor: corId, corNome: cor?.nome, modelo: modelos[modelo]?.nome, tamanho, preco, qtd,
    })
  }

  const irParaAvaliacoes = () => {
    setAba(2)
    document.getElementById('abas')?.scrollIntoView({ behavior: 'smooth' })
  }

  return <article className="produto">
    <nav className="migalhas"><Link to="/">Início</Link> / <Link to="/produtos">Produtos</Link> / <span>{produto.nome}</span></nav>

    <div className="produto-topo">
      <div className="galeria">
        <div className="foto-grande">
          {promo && <span className="selo-promo-foto" aria-hidden="true">−{promo.percentagem}%</span>}
          <Foto produto={produto} cor={corId} indice={foto} />
        </div>
        {produto.imagens?.length > 1 && <div className="miniaturas">
          {produto.imagens.slice(0, 4).map((_imagem, i) => (
            <button key={i} type="button" className={foto === i ? 'ativa' : ''} onClick={() => setFoto(i)} aria-label={`Foto ${i + 1}`}>
              <Foto produto={produto} cor={corId} indice={i} />
            </button>
          ))}
        </div>}
      </div>

      <div className="info">
        <small className="categoria-nome">{produto.categoria?.nome}{produto.marca ? ' · ' + produto.marca : ''}</small>
        <h1>{produto.nome}</h1>
        {produto.nota > 0 && <button type="button" className="ver-avaliacoes" onClick={irParaAvaliacoes}><Estrelas nota={produto.nota} /> {produto.avaliacoes} avaliações</button>}
        {promo && <p className="selo-promo"><b>Promoção</b>{produto.nomePromocao && <span>{produto.nomePromocao}</span>}</p>}
        <p className="preco">
          {promo && <s className="preco-antigo">{formatPrice(promo.antigo, produto.codigoMoeda)}</s>}
          {formatPrice(preco, produto.codigoMoeda)}
          {promo && <small className="poupanca">Poupa {formatPrice(promo.antigo - preco, produto.codigoMoeda)} (−{promo.percentagem}%)</small>}
        </p>
        <p className={produto.disponibilidade === 'ESGOTADO' ? 'stock sem' : 'stock'}>{produto.disponibilidade === 'ESGOTADO' ? 'Sem stock' : produto.disponibilidade === 'STOCK_LIMITADO' ? 'Stock limitado' : 'Disponível'}</p>

        {cores.length > 0 && <>
          <h4>Cor: <b>{cor?.nome}</b> <span className="extra">{extra ? `+${formatPrice(extra)} por esta cor` : 'sem custo extra'}</span></h4>
          <SeletorCor cores={cores} atual={corId} aoEscolher={setCorId} grande />
        </>}

        {tamanhos.length > 0 && <>
          <h4>{rotulo}{tamanho && <>: <b>{tamanho}</b></>}
            {guia && <button type="button" className="link guia-link" onClick={() => setVerGuia(!verGuia)}>{verGuia ? 'Fechar o guia' : `Guia de ${rotulo === 'Número' ? 'números' : 'tamanhos'}`}</button>}
          </h4>
          <div className="tamanhos" role="group" aria-label={rotulo}>
            {tamanhos.map(t => <button key={t} type="button" className={tamanho === t ? 'ativa' : ''} onClick={() => { setTamanho(t); setErro('') }}>{t}</button>)}
          </div>
          {guia && verGuia && <div className="guia">
            <table>
              <thead><tr>{guia.colunas.map(c => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>{guia.linhas.map(l => <tr key={l[0]} className={l[0] === tamanho ? 'escolhido' : ''}>{l.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody>
            </table>
            <p>{guia.dica} <small>Medidas de exemplo.</small></p>
          </div>}
        </>}

        {modelos.length > 1 && <>
          <h4>Escolha o modelo</h4>
          <div className="modelos">
            {modelos.map((m, i) => (
              <button key={m.nome} type="button" className={modelo === i ? 'ativa' : ''} onClick={() => setModelo(i)}>
                <span><b>{m.nome}</b><small>{m.nota}</small></span>
                <strong>{formatPrice(m.preco + extra)}</strong>
              </button>
            ))}
          </div>
        </>}

        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="comprar">
          <div className="qtd">
            <button type="button" onClick={() => setQtd(Math.max(1, qtd - 1))} aria-label="Menos">−</button>
            <b>{qtd}</b>
            <button type="button" onClick={() => setQtd(qtd + 1)} aria-label="Mais">+</button>
          </div>
          <button type="button" className="botao grande" onClick={comprar}>Adicionar · {formatPrice(preco * qtd)}</button>
        </div>
        <ul className="vantagens-produto">
          {prazos?.cidade && <li>Entrega em Maputo e Matola em {prazos.cidade}</li>}
          <li>Pague com M-Pesa, e-Mola ou fatura de empresa</li>
          {prazoDevolucaoDias && <li>Devolução em {prazoDevolucaoDias} dias</li>}
        </ul>

        {escaloes.length > 1 && <div className="atacado">
          <h3>Compra por atacado</h3>
          <p>A partir de {qtdMinimaAtacado} unidades, cada uma fica mais barata.</p>
          <table>
            <tbody>{escaloes.slice(1).map(e => (
              <tr key={e.de}><td>{textoEscalao(e)} unidades</td><td><b>{formatPrice(precoComDesconto(preco, e.de, escaloes))}</b> cada</td></tr>
            ))}</tbody>
          </table>
          <button type="button" className="botao botao-claro botao-pequeno" onClick={() => setCotando(!cotando)}>{cotando ? 'Fechar' : 'Pedir cotação'}</button>
          {cotando && <FormCotacao produtoInicial={produto.slug} />}
        </div>}
      </div>
    </div>

    <div className="abas" id="abas">
      {['Descrição', 'Ficha técnica', 'Avaliações'].map((nome, i) => <button key={nome} type="button" className={aba === i ? 'ativa' : ''} onClick={() => setAba(i)}>{nome}</button>)}
    </div>
    <div className="aba-conteudo">
      {aba === 0 && <div className="descricao-produto">
        {String(produto.descricao || '').split(/\n\s*\n/).filter(Boolean).map((paragrafo, i) => <p key={i}>{paragrafo}</p>)}
        {produto.garantia && <p><b>Garantia:</b> {produto.garantia}</p>}
      </div>}
      {aba === 1 && (especificacoes.length
        ? <dl className="ficha">{especificacoes.map(([nome, valor]) => <div key={nome}><dt>{nome}</dt><dd>{String(valor)}</dd></div>)}</dl>
        : <p>Sem ficha técnica disponível.</p>)}
      {aba === 2 && <Avaliacoes slug={produto.slug} notaMedia={produto.nota} totalAvaliacoes={produto.avaliacoes} />}
    </div>

    {semelhantes.length > 0 && <>
      <h2>Outros modelos e produtos semelhantes</h2>
      <div className="grid">{semelhantes.map(p => <ProductCard key={p.slug} produto={p} />)}</div>
    </>}
  </article>
}