import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard.jsx'
import { CatalogFilters } from '../components/catalog/CatalogFilters.jsx'
import { api } from '../services/api.js'
import { precoBase } from '../services/formatar.js'
import '../styles/catalogo.css'

const ITENS_POR_PAGINA = 12
const ORDENS = [
  { valor: 'recentes', etiqueta: 'Mais recentes' },
  { valor: 'preco-asc', etiqueta: 'Preço: menor para maior' },
  { valor: 'preco-desc', etiqueta: 'Preço: maior para menor' },
  { valor: 'nome-asc', etiqueta: 'Nome: A–Z' },
]

function nomesDeMarca(params) {
  return [...new Set(params.getAll('marca').flatMap(valor => valor.split(',').map(nome => nome.trim()).filter(Boolean)))]
}

function resultadoLocal(fonte, params) {
  const categoria = params.get('categoria')
  const marcas = nomesDeMarca(params)
  const termo = (params.get('busca') || params.get('pesquisa') || '').trim().toLocaleLowerCase('pt')
  const soPromocao = params.get('promocao') === 'true' || params.get('filtro') === 'ofertas'
  const disponibilidade = params.get('disponibilidade') || ''
  const ordem = params.get('ordenar') || 'recentes'
  let items = fonte.filter(produto =>
    (!categoria || String(produto.categoria?.id) === categoria || produto.categoria?.nome === categoria) &&
    (!marcas.length || marcas.includes(produto.marca)) &&
    (!termo || `${produto.nome} ${produto.marca || ''} ${produto.descricao || ''}`.toLocaleLowerCase('pt').includes(termo)) &&
    (!soPromocao || produto.oferta || produto.emPromocao) &&
    (disponibilidade !== 'em-stock' || (produto.quantidadeStock ?? 0) > 0 || produto.disponibilidade === 'EM_STOCK' || produto.disponibilidade === 'STOCK_LIMITADO') &&
    (disponibilidade !== 'esgotado' || produto.quantidadeStock === 0 || produto.disponibilidade === 'ESGOTADO')
  )

  if (ordem === 'preco-asc') items = [...items].sort((a, b) => precoBase(a) - precoBase(b))
  if (ordem === 'preco-desc') items = [...items].sort((a, b) => precoBase(b) - precoBase(a))
  if (ordem === 'nome-asc') items = [...items].sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))

  const pagina = Math.max(Number(params.get('pagina')) || 1, 1)
  const total = items.length
  const totalPaginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA))
  const paginaFinal = Math.min(pagina, totalPaginas)
  const inicio = (paginaFinal - 1) * ITENS_POR_PAGINA
  const facetasCategorias = [...new Map(fonte
    .filter(produto => produto.categoria?.nome)
    .map(produto => [produto.categoria.id, produto.categoria])).values()]
    .map(item => ({
      ...item,
      total: fonte.filter(produto => produto.categoria?.id === item.id).length,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
  const facetasMarcas = [...new Set(fonte.map(produto => produto.marca).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt'))
    .map(nome => ({ nome, total: fonte.filter(produto => produto.marca === nome).length }))

  return {
    produtos: items.slice(inicio, inicio + ITENS_POR_PAGINA),
    total,
    pagina: paginaFinal,
    totalPaginas,
    facetas: { categorias: facetasCategorias, marcas: facetasMarcas },
  }
}

function intervaloPaginas(pagina, totalPaginas) {
  if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1)

  const paginas = new Set([1, totalPaginas, pagina, pagina - 1, pagina + 1].filter(n => n >= 1 && n <= totalPaginas))
  const ordenadas = [...paginas].sort((a, b) => a - b)
  return ordenadas.flatMap((n, i) => i && n - ordenadas[i - 1] > 1 ? ['…', n] : [n])
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const parametrosActuales = searchParams.toString()
  const [estadoCatalogo, setEstadoCatalogo] = useState({
    parametros: null,
    resultado: {
      produtos: [],
      total: 0,
      pagina: 1,
      totalPaginas: 1,
      facetas: { categorias: [], marcas: [] },
    },
    demo: false,
    aviso: '',
  })
  const loading = estadoCatalogo.parametros !== parametrosActuales
  const resultado = estadoCatalogo.resultado
  const demo = !loading && estadoCatalogo.demo
  const aviso = !loading ? estadoCatalogo.aviso : ''

  const marcasSelecionadas = useMemo(() => nomesDeMarca(searchParams), [searchParams])
  const termo = searchParams.get('busca') || searchParams.get('pesquisa') || ''
  const categoriaId = searchParams.get('categoria') || ''
  const filtroEspecial = searchParams.get('filtro')
  const promocao = searchParams.get('promocao') === 'true' || filtroEspecial === 'ofertas'
  const disponibilidade = searchParams.get('disponibilidade') || ''
  const ordenarParam = searchParams.get('ordenar') || 'recentes'
  const ordenar = ORDENS.some(opcao => opcao.valor === ordenarParam) ? ordenarParam : 'recentes'

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams(parametrosActuales)
    const filtroPedido = params.get('filtro')
    const termoPedido = params.get('pesquisa') || params.get('busca') || ''
    params.delete('busca')
    params.delete('filtro')
    const paginaPedido = Math.max(Math.floor(Number(params.get('pagina')) || 1), 1)
    params.set('pagina', String(paginaPedido))
    params.set('limite', String(ITENS_POR_PAGINA))
    if (termoPedido) params.set('pesquisa', termoPedido)
    if (filtroPedido === 'ofertas') params.set('promocao', 'true')

    api(`/produtos?${params.toString()}`, { signal: controller.signal })
      .then(resposta => {
        if (controller.signal.aborted) return
        const data = resposta || {}
        const items = Array.isArray(data) ? data : data.produtos || data.items || []
        const paginaLocal = resultadoLocal(items, new URLSearchParams(parametrosActuales))
        const temPaginacaoServidor =
          Number.isSafeInteger(data.total) &&
          Number.isSafeInteger(data.pagina) &&
          Number.isSafeInteger(data.totalPaginas)
        const resultadoServidor = temPaginacaoServidor
          ? {
              produtos: items,
              total: data.total,
              pagina: data.pagina,
              totalPaginas: Math.max(data.totalPaginas, 1),
              facetas: data.facetas || paginaLocal.facetas,
            }
          : paginaLocal
        setEstadoCatalogo({
          parametros: parametrosActuales,
          resultado: resultadoServidor,
          demo: false,
          aviso: temPaginacaoServidor ? '' : 'O serviço ainda não devolve metadados de paginação; resultados paginados localmente.',
        })
      })
      .catch(error => {
        if (error.name === 'AbortError') return
        setEstadoCatalogo({
          parametros: parametrosActuales,
          resultado: {
            produtos: [],
            total: 0,
            pagina: 1,
            totalPaginas: 1,
            facetas: { categorias: [], marcas: [] },
          },
          demo: false,
          aviso: 'Não foi possível carregar o catálogo. Tente novamente mais tarde.',
        })
      })

    return () => controller.abort()
  }, [parametrosActuales])

  const alterarFiltros = actualizador => {
    const parametros = new URLSearchParams(searchParams)
    actualizador(parametros)
    parametros.set('pagina', '1')
    setSearchParams(parametros)
  }

  const definirCategoria = valor => alterarFiltros(params => {
    if (valor) params.set('categoria', valor)
    else params.delete('categoria')
  })

  const alternarMarca = nome => alterarFiltros(params => {
    const selecionadas = nomesDeMarca(params)
    params.delete('marca')
    for (const marca of selecionadas.includes(nome)
      ? selecionadas.filter(item => item !== nome)
      : [...selecionadas, nome]) {
      params.append('marca', marca)
    }
  })

  const definirFiltro = (chave, valor) => alterarFiltros(params => {
    if (valor) params.set(chave, valor)
    else params.delete(chave)
  })

  // Mudar de página mantém os filtros (alterarFiltros volta sempre à página 1).
  const irParaPagina = numero => {
    const parametros = new URLSearchParams(searchParams)
    parametros.set('pagina', String(numero))
    setSearchParams(parametros)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const tituloCategoria = resultado.facetas.categorias
    .find(item => String(item.id) === categoriaId || item.nome === categoriaId)?.nome
  const titulo = filtroEspecial === 'ofertas'
    ? 'Ofertas'
    : termo
      ? `Resultados para “${termo}”`
      : tituloCategoria || categoriaId || 'Todos os produtos'
  const paginas = intervaloPaginas(resultado.pagina, resultado.totalPaginas)

  return (
    <section className="catalogo-pagina">
      <h1>{titulo}</h1>

      {aviso && <p className="catalogo-aviso" role="status">{aviso}</p>}

      <div className="catalogo-layout">
        <aside className="catalogo-sidebar" aria-label="Filtros do catálogo">
          <CatalogFilters
            categorias={resultado.facetas.categorias}
            marcas={resultado.facetas.marcas}
            categoria={categoriaId}
            marcasSelecionadas={marcasSelecionadas}
            disponibilidade={disponibilidade}
            promocao={promocao}
            onCategoria={definirCategoria}
            onMarca={alternarMarca}
            onDisponibilidade={valor => definirFiltro('disponibilidade', valor)}
            onPromocao={valor => alterarFiltros(params => {
              params.delete('filtro')
              if (valor) params.set('promocao', 'true')
              else params.delete('promocao')
            })}
            onLimpar={() => setSearchParams(new URLSearchParams(termo ? { busca: termo } : {}))}
            temFiltros={Boolean(categoriaId || marcasSelecionadas.length || disponibilidade || promocao || termo)}
          />
        </aside>

        <div className="catalogo-resultados">
          <div className="catalogo-toolbar">
            <p aria-live="polite">
              {loading ? 'A carregar produtos…' : `${resultado.total} produtos encontrados`}
            </p>
            <label>
              <span>Ordenar por</span>
              <select
                value={ordenar}
                onChange={evento => definirFiltro('ordenar', evento.target.value === 'recentes' ? '' : evento.target.value)}
              >
                {ORDENS.map(opcao => <option key={opcao.valor} value={opcao.valor}>{opcao.etiqueta}</option>)}
              </select>
            </label>
          </div>

          {loading
            ? <p className="catalogo-estado" role="status">A carregar produtos…</p>
            : resultado.produtos.length
              ? <div className="catalogo-grelha">{resultado.produtos.map(produto =>
                  <ProductCard key={produto.id || produto.slug} produto={produto} />
                )}</div>
              : <p className="catalogo-estado">Nenhum produto encontrado. Altere ou limpe os filtros.</p>}

          {!loading && resultado.totalPaginas > 1 && (
            <nav className="catalogo-paginacao" aria-label="Paginação do catálogo">
              <button
                type="button"
                disabled={resultado.pagina <= 1}
                onClick={() => irParaPagina(resultado.pagina - 1)}
                aria-label="Página anterior"
              >‹</button>
              {paginas.map((numero, indice) => numero === '…'
                ? <span key={`ellipsis-${indice}`} aria-hidden="true">…</span>
                : <button
                    key={numero}
                    type="button"
                    className={numero === resultado.pagina ? 'activa' : ''}
                    aria-current={numero === resultado.pagina ? 'page' : undefined}
                    onClick={() => irParaPagina(numero)}
                  >{numero}</button>)}
              <button
                type="button"
                disabled={resultado.pagina >= resultado.totalPaginas}
                onClick={() => irParaPagina(resultado.pagina + 1)}
                aria-label="Página seguinte"
              >›</button>
            </nav>
          )}

          {demo && <span className="catalogo-demo">Demonstração</span>}
        </div>
      </div>
    </section>
  )
}
