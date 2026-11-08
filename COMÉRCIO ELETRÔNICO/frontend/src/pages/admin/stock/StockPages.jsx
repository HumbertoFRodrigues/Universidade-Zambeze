import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useSearchParams } from 'react-router-dom'
import { AlertTriangle, History, PackagePlus, PackageSearch, Search, SlidersHorizontal } from 'lucide-react'
import { consultasAdminApi, produtosApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { estadoStockAdmin, limiarEfectivo } from '../../../lib/produtosAdmin.js'
import ProdutoSelector from '../../../components/admin/ProdutoSelector.jsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const SECCOES = [
  { to: '/admin/stock', label: 'Visão geral' },
  { to: '/admin/stock/baixo', label: 'Stock baixo' },
  { to: '/admin/stock/entradas', label: 'Entradas' },
  { to: '/admin/stock/ajustes', label: 'Ajustes' },
  { to: '/admin/stock/movimentos', label: 'Movimentos' },
]

const caminhoProduto = id => `/admin/produtos/${encodeURIComponent(id)}`
const comProduto = (caminho, id) => `${caminho}?produto=${encodeURIComponent(id)}`

function CabecalhoStock({ titulo, descricao }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{titulo}</h1>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      <nav aria-label="Secções de stock" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
        {SECCOES.map(seccao => (
          <NavLink
            key={seccao.to}
            to={seccao.to}
            end
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {seccao.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function Titulo({ children }) {
  return <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{children}</CardTitle>
}

function useStockBaixo() {
  const [estado, setEstado] = useState({ produtos: null, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    produtosApi.stockBaixo({ signal: controller.signal })
      .then(resposta => setEstado({
        produtos: [...(resposta.produtosStockBaixo || [])].sort((a, b) => a.quantidadeStock - b.quantidadeStock || a.nome.localeCompare(b.nome, 'pt')),
        erro: '',
      }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ produtos: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])
  return { ...estado, carregando: !estado.produtos && !estado.erro, recarregar: () => setVersao(valor => valor + 1) }
}

function AccoesStock({ id }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild size="sm" variant="outline"><Link to={comProduto('/admin/stock/entradas', id)}><PackagePlus className="h-4 w-4" />Entrada</Link></Button>
      <Button asChild size="sm" variant="outline"><Link to={comProduto('/admin/stock/ajustes', id)}><SlidersHorizontal className="h-4 w-4" />Ajuste</Link></Button>
    </div>
  )
}

// ==================== Visão geral ====================

const LIMITE = 20
const FILTRO_ACTIVO = { activos: 'true', inactivos: 'false' }

export function StockPage() {
  const baixo = useStockBaixo()
  const [texto, setTexto] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [estado, setEstado] = useState('activos')
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ chave: null, produtos: [], total: 0, totalPaginas: 0, erro: '' })
  const temporizador = useRef(null)
  const chave = JSON.stringify({ pesquisa, estado, pagina, versao })

  useEffect(() => () => clearTimeout(temporizador.current), [])

  useEffect(() => {
    const controller = new AbortController()
    produtosApi.listar({ pesquisa, activo: FILTRO_ACTIVO[estado], pagina, limite: LIMITE }, { signal: controller.signal })
      .then(resposta => setResultado({ chave, produtos: resposta.produtos || [], total: resposta.total || 0, totalPaginas: resposta.totalPaginas || 0, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setResultado({ chave, produtos: [], total: 0, totalPaginas: 0, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, pesquisa, estado, pagina])

  const alterarPesquisa = valor => {
    setTexto(valor)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => { setPesquisa(valor.trim()); setPagina(1) }, 350)
  }

  const carregando = resultado.chave !== chave
  const primeiraCarga = carregando && resultado.chave === null
  const { produtos, total, totalPaginas, erro } = resultado
  const esgotados = baixo.produtos ? baixo.produtos.filter(produto => produto.quantidadeStock <= 0).length : null

  return (
    <section className="space-y-6">
      <CabecalhoStock titulo="Stock" descricao="Quantidades disponíveis registadas para cada produto." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">Produtos listados</p></CardHeader>
          <CardContent><p className="font-mono text-2xl font-bold">{primeiraCarga || erro ? '—' : total}</p></CardContent>
        </Card>
        <Link to="/admin/stock/baixo" className="block">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardHeader className="pb-2"><p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">Stock baixo (activos)</p></CardHeader>
            <CardContent><p className="font-mono text-2xl font-bold text-amber-600">{baixo.produtos ? baixo.produtos.length : baixo.erro ? '—' : '…'}</p></CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="pb-2"><p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">Esgotados (activos)</p></CardHeader>
          <CardContent><p className="font-mono text-2xl font-bold text-red-600">{esgotados ?? (baixo.erro ? '—' : '…')}</p></CardContent>
        </Card>
      </div>
      {baixo.erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar o relatório de stock baixo.">{baixo.erro}</FeedbackMessage>}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="space-y-1.5">
          <Label htmlFor="stock-pesquisa">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="stock-pesquisa" type="search" className="pl-9" placeholder="Nome, código ou marca" value={texto} onChange={e => alterarPesquisa(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock-estado">Produtos</Label>
          <Select value={estado} onValueChange={valor => { setEstado(valor); setPagina(1) }}>
            <SelectTrigger id="stock-estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {primeiraCarga && <LoadingState mensagem="A carregar stock…" />}
      {!carregando && erro && (
        <FeedbackMessage variante="erro" titulo="Não foi possível carregar os produtos." accao={<Button variant="outline" size="sm" onClick={() => setVersao(valor => valor + 1)}>Tentar novamente</Button>}>
          {erro}
        </FeedbackMessage>
      )}
      {!carregando && !erro && !produtos.length && (
        <EmptyState Icone={PackageSearch} titulo="Nenhum produto encontrado." descricao="Altere a pesquisa ou o filtro seleccionado." />
      )}

      {!primeiraCarga && produtos.length > 0 && (
        <div className={carregando ? 'opacity-60' : ''} aria-busy={carregando}>
          {/* Telemóvel */}
          <div className="space-y-3 md:hidden">
            {produtos.map(produto => {
              const situacao = estadoStockAdmin(produto)
              return (
                <Card key={produto.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={caminhoProduto(produto.id)} className="font-medium hover:underline">{produto.nome}</Link>
                        <p className="text-xs text-muted-foreground">{produto.codigo || 'Sem código'} · limiar {limiarEfectivo(produto)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold">{produto.quantidadeStock}</p>
                        <Badge className={situacao.classe}>{situacao.etiqueta}</Badge>
                      </div>
                    </div>
                    <AccoesStock id={produto.id} />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Computador e tablet */}
          <div className="hidden rounded-md border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Limiar</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead><span className="sr-only">Acções</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map(produto => {
                  const situacao = estadoStockAdmin(produto)
                  return (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <Link to={caminhoProduto(produto.id)} className="font-medium hover:underline">{produto.nome}</Link>
                        <p className="font-mono text-xs text-muted-foreground">{produto.codigo || 'Sem código'}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{produto.categoria?.nome || '—'}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{produto.quantidadeStock}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{limiarEfectivo(produto)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={situacao.classe}>{situacao.etiqueta}</Badge>
                          {!produto.activo && <Badge variant="destructive">Inactivo</Badge>}
                        </div>
                      </TableCell>
                      <TableCell><AccoesStock id={produto.id} /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!erro && totalPaginas > 1 && (
        <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagina <= 1 || carregando} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={pagina >= totalPaginas || carregando} onClick={() => setPagina(pagina + 1)}>Seguinte</Button>
          </div>
        </nav>
      )}
    </section>
  )
}

// ==================== Stock baixo ====================

export function LowStockPage() {
  const { produtos, erro, carregando, recarregar } = useStockBaixo()
  const [pesquisa, setPesquisa] = useState('')
  const termo = pesquisa.trim().toLocaleLowerCase('pt')
  // O relatório devolve a lista completa, por isso a pesquisa local é exacta.
  const visiveis = (produtos || []).filter(produto =>
    !termo || produto.nome.toLocaleLowerCase('pt').includes(termo) || (produto.codigo || '').toLocaleLowerCase('pt').includes(termo)
  )

  return (
    <section className="space-y-6">
      <CabecalhoStock
        titulo="Stock baixo"
        descricao="Critério: produtos activos com stock igual ou inferior ao seu limiar, ou igual ou inferior a 5 unidades."
      />

      <div className="max-w-md space-y-1.5">
        <Label htmlFor="baixo-pesquisa">Pesquisar</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="baixo-pesquisa" type="search" className="pl-9" placeholder="Nome ou código" value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
        </div>
      </div>

      {carregando && <LoadingState mensagem="A carregar relatório…" />}
      {erro && (
        <FeedbackMessage variante="erro" titulo="Não foi possível carregar o relatório de stock baixo." accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>
          {erro}
        </FeedbackMessage>
      )}
      {produtos && !visiveis.length && (
        <EmptyState
          Icone={AlertTriangle}
          titulo={termo ? 'Nenhum produto corresponde à pesquisa.' : 'Não há produtos com stock baixo.'}
          accao={termo ? <Button variant="outline" onClick={() => setPesquisa('')}>Limpar pesquisa</Button> : null}
        />
      )}

      {visiveis.length > 0 && <>
        <p className="text-sm text-muted-foreground">{visiveis.length} {visiveis.length === 1 ? 'produto' : 'produtos'}{termo ? ` de ${produtos.length}` : ''}.</p>
        <div className="space-y-3 md:hidden">
          {visiveis.map(produto => (
            <Card key={produto.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={caminhoProduto(produto.id)} className="font-medium hover:underline">{produto.nome}</Link>
                    <p className="text-xs text-muted-foreground">{produto.codigo || 'Sem código'} · limiar {limiarEfectivo(produto)}</p>
                  </div>
                  <p className={`font-mono text-lg font-bold ${produto.quantidadeStock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>{produto.quantidadeStock}</p>
                </div>
                <AccoesStock id={produto.id} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="hidden rounded-md border bg-white md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Limiar</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Preço</TableHead>
                <TableHead><span className="sr-only">Acções</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map(produto => (
                <TableRow key={produto.id}>
                  <TableCell>
                    <Link to={caminhoProduto(produto.id)} className="font-medium hover:underline">{produto.nome}</Link>
                    <p className="font-mono text-xs text-muted-foreground">{produto.codigo || 'Sem código'}</p>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${produto.quantidadeStock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {produto.quantidadeStock <= 0 ? 'Esgotado' : produto.quantidadeStock}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{limiarEfectivo(produto)}</TableCell>
                  <TableCell className="hidden text-right font-mono lg:table-cell">{formatarMZN(produto.preco)}</TableCell>
                  <TableCell><AccoesStock id={produto.id} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>}
    </section>
  )
}

// ==================== Entradas e ajustes ====================

// Produto indicado em ?produto=<id> (vindo das listagens).
function useProdutoInicial() {
  const [params] = useSearchParams()
  const id = params.get('produto')
  const [estado, setEstado] = useState({ id: null, produto: null, erro: '' })
  useEffect(() => {
    if (!id) return undefined
    const controller = new AbortController()
    produtosApi.obter(id, { signal: controller.signal })
      .then(produto => setEstado({ id, produto, erro: produto ? '' : 'O produto indicado não foi encontrado.' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ id, produto: null, erro: error.message })
      })
    return () => controller.abort()
  }, [id])
  return { id, ...estado, carregando: Boolean(id) && estado.id !== id }
}

function FormularioMovimento({ tipo }) {
  const entrada = tipo === 'ENTRADA'
  const inicial = useProdutoInicial()
  const [escolhido, setEscolhido] = useState(undefined)
  const [valores, setValores] = useState({ sentido: 'aumentar', quantidade: '', motivo: '' })
  const [erros, setErros] = useState({})
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })
  // Enquanto o utilizador não escolher outro, usa o produto indicado no endereço.
  const produto = escolhido === undefined ? inicial.produto : escolhido

  const submeter = async evento => {
    evento.preventDefault()
    const novos = {}
    const quantidade = Number(valores.quantidade)
    if (!produto) novos.produto = 'Seleccione um produto.'
    if (!/^\d+$/.test(valores.quantidade.trim()) || !Number.isSafeInteger(quantidade) || quantidade <= 0) {
      novos.quantidade = 'Indique um número inteiro maior que zero.'
    }
    if (!valores.motivo.trim()) novos.motivo = 'O motivo é obrigatório.'
    setErros(novos)
    if (Object.keys(novos).length) return

    const variacao = entrada || valores.sentido === 'aumentar' ? quantidade : -quantidade
    setAGuardar(true)
    setMensagem({ erro: '', sucesso: '' })
    try {
      const resposta = await produtosApi.movimentarStock(produto.id, { tipoMovimento: tipo, variacao, motivo: valores.motivo.trim() })
      setEscolhido({ ...produto, quantidadeStock: resposta.stockAtual })
      setValores({ sentido: valores.sentido, quantidade: '', motivo: '' })
      setMensagem({
        erro: '',
        sucesso: `${entrada ? 'Entrada registada' : 'Ajuste registado'} em "${produto.nome}": stock passou de ${resposta.stockAnterior} para ${resposta.stockAtual} unidades.`,
      })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <Card>
      <CardHeader><Titulo>{entrada ? 'Registar entrada' : 'Registar ajuste'}</Titulo></CardHeader>
      <CardContent className="space-y-5">
        {mensagem.erro && <FeedbackMessage variante="erro" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.erro}</FeedbackMessage>}
        {mensagem.sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.sucesso}</FeedbackMessage>}
        {inicial.erro && escolhido === undefined && <FeedbackMessage variante="aviso">{inicial.erro}</FeedbackMessage>}

        <form onSubmit={submeter} noValidate className="space-y-5">
          {inicial.carregando && escolhido === undefined
            ? <p className="text-sm text-muted-foreground">A carregar produto…</p>
            : (
              <div>
                {produto && <p className="mb-1.5 text-sm font-medium">Produto</p>}
                <ProdutoSelector id={`produto-${tipo.toLowerCase()}`} produto={produto} onSeleccionar={setEscolhido} />
                {erros.produto && <p className="mt-1 text-xs text-destructive">{erros.produto}</p>}
              </div>
            )}

          <div className={`grid gap-4 ${entrada ? '' : 'sm:grid-cols-2'}`}>
            {!entrada && (
              <div className="space-y-1.5">
                <Label htmlFor="ajuste-sentido">Tipo de ajuste</Label>
                <Select value={valores.sentido} onValueChange={sentido => setValores({ ...valores, sentido })}>
                  <SelectTrigger id="ajuste-sentido"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aumentar">Aumentar stock</SelectItem>
                    <SelectItem value="diminuir">Diminuir stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`quantidade-${tipo}`}>{entrada ? 'Quantidade recebida *' : 'Quantidade *'}</Label>
              <Input
                id={`quantidade-${tipo}`}
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={valores.quantidade}
                onChange={e => setValores({ ...valores, quantidade: e.target.value })}
                aria-invalid={!!erros.quantidade}
              />
              {erros.quantidade && <p className="text-xs text-destructive">{erros.quantidade}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`motivo-${tipo}`}>Motivo *</Label>
            <Textarea
              id={`motivo-${tipo}`}
              rows={3}
              maxLength={255}
              placeholder={entrada ? 'Ex.: recepção da encomenda ao fornecedor n.º …' : 'Ex.: correcção após contagem física'}
              value={valores.motivo}
              onChange={e => setValores({ ...valores, motivo: e.target.value })}
              aria-invalid={!!erros.motivo}
            />
            {erros.motivo && <p className="text-xs text-destructive">{erros.motivo}</p>}
            <p className="text-xs text-muted-foreground">O movimento fica registado com o motivo e o administrador responsável.</p>
          </div>

          <Button type="submit" disabled={aGuardar}>
            {aGuardar ? 'A registar…' : entrada ? 'Registar entrada' : 'Registar ajuste'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

const TIPOS_MOVIMENTO = {
  ENTRADA: 'Entrada',
  AJUSTE: 'Ajuste',
  VENDA: 'Venda',
  REPOSICAO_CANCELAMENTO: 'Reposição (cancelamento)',
  REPOSICAO_DEVOLUCAO: 'Reposição (devolução)',
}
const TODOS_TIPOS = 'todos'

function useMovimentos({ tipo, pagina = 1, limite = 20, versao = 0 }) {
  const [estado, setEstado] = useState({ dados: null, erro: '' })
  useEffect(() => {
    const controller = new AbortController()
    consultasAdminApi.movimentos({ tipo: tipo || undefined, pagina, limite }, { signal: controller.signal })
      .then(dados => setEstado({ dados, erro: '' }))
      .catch(error => { if (!controller.signal.aborted) setEstado({ dados: null, erro: error.message }) })
    return () => controller.abort()
  }, [tipo, pagina, limite, versao])
  return estado
}

function Variacao({ valor }) {
  return <span className={`font-mono ${valor > 0 ? 'text-emerald-700' : valor < 0 ? 'text-red-600' : ''}`}>{valor > 0 ? `+${valor}` : valor}</span>
}

// Últimos movimentos de um tipo, ao lado do formulário de entradas ou ajustes.
function UltimosMovimentos({ tipo, titulo }) {
  const { dados, erro } = useMovimentos({ tipo, limite: 10 })
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" aria-hidden="true" />{titulo}</CardTitle></CardHeader>
      <CardContent>
        {!dados && !erro && <LoadingState mensagem="A carregar…" />}
        {erro && <FeedbackMessage variante="erro">{erro}</FeedbackMessage>}
        {dados?.movimentos.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há registos.</p>}
        {dados?.movimentos.length > 0 && (
          <ul className="divide-y text-sm">
            {dados.movimentos.map(m => (
              <li key={m.id} className="py-2">
                <div className="flex justify-between gap-2">
                  <Link to={caminhoProduto(m.produto.id)} className="min-w-0 truncate font-medium hover:underline">{m.produto.nome}</Link>
                  <Variacao valor={m.variacaoQuantidade} />
                </div>
                <p className="text-xs text-muted-foreground">{new Date(m.criadoEm).toLocaleString('pt-MZ')} · stock após: {m.stockApos}{m.autor ? ` · ${m.autor}` : ''}{m.motivo ? ` · ${m.motivo}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="link" className="mt-2 px-0"><Link to="/admin/stock/movimentos">Ver todos os movimentos</Link></Button>
      </CardContent>
    </Card>
  )
}

export function StockEntriesPage() {
  const [params] = useSearchParams()
  return (
    <section className="space-y-6">
      <CabecalhoStock titulo="Entradas de stock" descricao="Registo de mercadoria recebida. A quantidade é somada ao stock actual." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FormularioMovimento key={params.get('produto') || ''} tipo="ENTRADA" />
        <UltimosMovimentos tipo="ENTRADA" titulo="Últimas entradas" />
      </div>
    </section>
  )
}

export function StockAdjustmentsPage() {
  const [params] = useSearchParams()
  return (
    <section className="space-y-6">
      <CabecalhoStock titulo="Ajustes de stock" descricao="Correcções ao stock (por exemplo, após contagem física, quebras ou perdas). O stock nunca fica negativo." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FormularioMovimento key={params.get('produto') || ''} tipo="AJUSTE" />
        <UltimosMovimentos tipo="AJUSTE" titulo="Últimos ajustes" />
      </div>
    </section>
  )
}

// ==================== Movimentos ====================

export function StockMovementsPage() {
  const [tipo, setTipo] = useState('')
  const [pagina, setPagina] = useState(1)
  const { dados, erro } = useMovimentos({ tipo, pagina, limite: 25 })
  return (
    <section className="space-y-6">
      <CabecalhoStock titulo="Movimentos de stock" descricao="Entradas, ajustes, vendas e reposições, do mais recente para o mais antigo." />
      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="movimentos-tipo">Tipo de movimento</Label>
        <Select value={tipo || TODOS_TIPOS} onValueChange={v => { setTipo(v === TODOS_TIPOS ? '' : v); setPagina(1) }}>
          <SelectTrigger id="movimentos-tipo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_TIPOS}>Todos</SelectItem>
            {Object.entries(TIPOS_MOVIMENTO).map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {!dados && !erro && <LoadingState mensagem="A carregar movimentos…" />}
      {erro && <FeedbackMessage variante="erro">{erro}</FeedbackMessage>}
      {dados?.movimentos.length === 0 && <EmptyState Icone={History} titulo="Sem movimentos para este filtro." />}
      {dados?.movimentos.length > 0 && (
        <div className="overflow-x-auto rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">Stock após</TableHead>
                <TableHead className="hidden lg:table-cell">Motivo / autor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.movimentos.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(m.criadoEm).toLocaleString('pt-MZ')}</TableCell>
                  <TableCell><Link to={caminhoProduto(m.produto.id)} className="font-medium hover:underline">{m.produto.nome}</Link><p className="font-mono text-xs text-muted-foreground">{m.produto.codigo || ''}</p></TableCell>
                  <TableCell><Badge variant="outline">{TIPOS_MOVIMENTO[m.tipoMovimento] || m.tipoMovimento}</Badge></TableCell>
                  <TableCell className="text-right"><Variacao valor={m.variacaoQuantidade} /></TableCell>
                  <TableCell className="text-right font-mono">{m.stockApos}</TableCell>
                  <TableCell className="hidden max-w-[18rem] text-xs text-muted-foreground lg:table-cell">{[m.motivo, m.autor].filter(Boolean).join(' · ') || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {dados?.totalPaginas > 1 && (
        <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Página {dados.pagina} de {dados.totalPaginas} · {dados.total} movimentos</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={pagina >= dados.totalPaginas} onClick={() => setPagina(pagina + 1)}>Seguinte</Button>
          </div>
        </nav>
      )}
    </section>
  )
}
