import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, encomendasApi, produtosApi } from '../../services/api.js'
import { caminhoEncomenda } from '../../lib/encomendasAdmin.js'
import { ESTADOS_ENCOMENDA } from '../../services/cliente.js'
import { formatarMZN, dataLegivel } from '../../lib/format.js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Truck,
  ArrowRight,
  AlertTriangle,
  Package,
  PackageCheck,
  PackageX,
} from 'lucide-react'

function Indicador({ titulo, valor, icone, cor = 'text-muted-foreground', classeValor = '', to }) {
  const Icone = icone
  const conteudo = (
    <Card className={to ? 'h-full transition-colors hover:border-primary/40' : 'h-full'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {titulo}
        </CardTitle>
        <Icone className={`h-4 w-4 ${cor}`} />
      </CardHeader>
      <CardContent>
        <div className={`font-mono text-2xl font-bold ${classeValor}`}>{valor}</div>
      </CardContent>
    </Card>
  )
  return to ? <Link to={to} className="block">{conteudo}</Link> : conteudo
}

function CabecalhoSeccao({ titulo, to, ligacao, icone }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {icone}
        <h2 className="truncate font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{titulo}</h2>
      </div>
      <Link to={to} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-primary hover:underline">
        {ligacao} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// Contagens obtidas do total devolvido pela listagem administrativa de produtos.
async function carregarProdutos(signal) {
  const contar = activo => produtosApi.listar({ limite: 1, activo }, { signal }).then(resposta => resposta.total)
  const [total, activos, inactivos, stockBaixo] = await Promise.all([
    contar(),
    contar('true'),
    contar('false'),
    produtosApi.stockBaixo({ signal }),
  ])
  const lista = [...(stockBaixo.produtosStockBaixo || [])].sort((a, b) => a.quantidadeStock - b.quantidadeStock)
  return { total, activos, inactivos, stockBaixo: lista }
}

export default function AdminPainel() {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [produtos, setProdutos] = useState(null)
  const [erroProdutos, setErroProdutos] = useState('')
  const [recentes, setRecentes] = useState(null)
  const [erroRecentes, setErroRecentes] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api('/admin/painel', { signal: controller.signal })
      .then(setDados)
      .catch(error => {
        if (!controller.signal.aborted) setErro(error.message)
      })
    // GET /admin/painel devolve só 5 encomendas recentes; a listagem, com a mesma
    // ordenação (mais recentes primeiro), permite mostrar 6.
    encomendasApi.listar({ limite: 6 }, { signal: controller.signal })
      .then(resposta => setRecentes(resposta.encomendas || []))
      .catch(error => {
        if (!controller.signal.aborted) setErroRecentes(error.message)
      })
    carregarProdutos(controller.signal)
      .then(setProdutos)
      .catch(error => {
        if (!controller.signal.aborted) setErroProdutos(error.message)
      })
    return () => controller.abort()
  }, [])

  // Função auxiliar para definir a cor do badge com base no estado
  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'CONCLUIDA': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
      case 'CANCELADA': return 'bg-red-100 text-red-700 hover:bg-red-100'
      case 'EM_PROCESSAMENTO': return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
      default: return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    }
  }

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Painel</h1>
        <p className="text-sm text-muted-foreground">
          Resumo dos produtos, encomendas, pagamentos e entregas.
        </p>
      </div>

      {/* Produtos */}
      <div className="space-y-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Produtos</h2>
        {erroProdutos && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive" role="alert">
            Não foi possível carregar os indicadores de produtos: {erroProdutos}
          </div>
        )}
        {!produtos && !erroProdutos && (
          <p className="text-sm text-muted-foreground" role="status">A carregar indicadores de produtos…</p>
        )}
        {produtos && (
          <div className="[display:grid] w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador titulo="Total de produtos" valor={produtos.total} icone={Package} to="/admin/produtos" />
            <Indicador titulo="Activos" valor={produtos.activos} icone={PackageCheck} cor="text-emerald-500" classeValor="text-emerald-600" to="/admin/produtos?estado=activos" />
            <Indicador titulo="Inactivos" valor={produtos.inactivos} icone={PackageX} cor="text-slate-400" to="/admin/produtos?estado=inactivos" />
            <Indicador titulo="Stock baixo" valor={produtos.stockBaixo.length} icone={AlertTriangle} cor="text-amber-500" classeValor="text-amber-600" to="/admin/stock/baixo" />
          </div>
        )}
      </div>

      {erro && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive" role="alert">
          {erro}
        </div>
      )}

      {!dados && !erro && (
        <p className="py-8 text-center text-muted-foreground" role="status">A carregar painel…</p>
      )}

      {dados && (
        <div className="space-y-4">
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Vendas</h2>
          <div className="[display:grid] w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador titulo="Encomendas" valor={dados.indicadores.totalEncomendas} icone={ShoppingCart} to="/admin/encomendas" />
            <Indicador titulo="Receita (pago)" valor={formatarMZN(dados.indicadores.receita)} icone={DollarSign} cor="text-emerald-500" classeValor="text-xl text-emerald-600" />
            <Indicador titulo="Aguarda pagamento" valor={dados.indicadores.porPagar} icone={Clock} cor="text-amber-500" classeValor="text-amber-500" />
            <Indicador titulo="Por entregar" valor={dados.indicadores.porEntregar} icone={Truck} cor="text-blue-500" classeValor="text-blue-600" />
          </div>
        </div>
      )}

      {/* [display:grid] em vez de "grid": a classe global .grid (global.css) fixa colunas de
          260px e sobrepunha-se às do Tailwind. Grelha própria com duas colunas iguais a partir
          de 992px (mesmo espaçamento dos cartões); uma por cima da outra abaixo disso. */}
      <div className="[display:grid] w-full grid-cols-[minmax(0,1fr)] gap-4 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Encomendas Recentes */}
        <div className="min-w-0 space-y-4">
          <CabecalhoSeccao titulo="Encomendas recentes" to="/admin/encomendas" ligacao="Ver todas" />
          {erroRecentes && (
            <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive" role="alert">{erroRecentes}</div>
          )}
          {!recentes && !erroRecentes && (
            <p className="text-sm text-muted-foreground" role="status">A carregar encomendas…</p>
          )}
          {recentes && (recentes.length ? (
            <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
              {recentes.map(encomenda => (
                <li key={encomenda.id}>
                  {/* Uma linha: código | cliente | data | estado | valor. Se o bloco for estreito,
                      data, estado e valor passam inteiros para uma segunda linha, à direita. */}
                  <Link
                    to={caminhoEncomenda(encomenda.codigo)}
                    className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className="flex min-w-0 flex-1 basis-40 items-center gap-3">
                      <strong className="shrink-0 font-mono text-xs font-semibold">{encomenda.codigo}</strong>
                      <span className="min-w-0 truncate" title={encomenda.nomeCliente}>{encomenda.nomeCliente}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="whitespace-nowrap text-xs text-muted-foreground" title={dataLegivel(encomenda.data)}>
                        {new Date(encomenda.data).toLocaleDateString('pt-PT')}
                      </span>
                      <Badge className={`${getBadgeClass(encomenda.estado)} whitespace-nowrap`}>
                        {ESTADOS_ENCOMENDA[encomenda.estado] || encomenda.estado}
                      </Badge>
                      <strong className="min-w-[6.5rem] whitespace-nowrap text-right font-mono font-semibold">
                        {formatarMZN(encomenda.total)}
                      </strong>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Não há encomendas registadas.</p>
          ))}
        </div>

        {/* Stock Baixo */}
        <div className="min-w-0 space-y-4">
          <CabecalhoSeccao
            titulo="Produtos com stock baixo"
            to="/admin/stock/baixo"
            ligacao="Ver todos"
            icone={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          />
          {!produtos && !erroProdutos && (
            <p className="text-sm text-muted-foreground" role="status">A carregar produtos…</p>
          )}
          {produtos && (produtos.stockBaixo.length ? (
            <>
              <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
                {produtos.stockBaixo.slice(0, 6).map(produto => (
                  <li key={produto.id}>
                    <Link
                      to={`/admin/produtos/${encodeURIComponent(produto.id)}`}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium" title={produto.nome}>{produto.nome}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        <Badge className={produto.quantidadeStock === 0
                          ? 'bg-red-100 text-red-700 hover:bg-red-100'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}
                        >
                          {produto.quantidadeStock === 0 ? 'Esgotado' : 'Stock baixo'}
                        </Badge>
                        <strong className={`min-w-[3.5rem] whitespace-nowrap text-right font-mono font-bold ${
                          produto.quantidadeStock === 0 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {produto.quantidadeStock} un.
                        </strong>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {produtos.stockBaixo.length > 6 && (
                <p className="text-xs text-muted-foreground">E mais {produtos.stockBaixo.length - 6} produto(s) com stock baixo.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Não há produtos activos com stock baixo.</p>
          ))}
        </div>
      </div>
    </section>
  )
}
