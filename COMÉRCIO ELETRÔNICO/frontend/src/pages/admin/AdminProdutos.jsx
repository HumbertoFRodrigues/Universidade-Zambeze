import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ImageOff, MoreHorizontal, PackageSearch, Plus, Search } from 'lucide-react'
import { produtosApi } from '../../services/api.js'
import { formatarMZN } from '../../lib/format.js'
import { estadoStockAdmin } from '../../lib/produtosAdmin.js'
import ConfirmarApagar from '../../components/admin/ConfirmarApagar.jsx'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const LIMITE = 20
const FILTRO_ACTIVO = { activos: 'true', inactivos: 'false' }

const SUBPAGINAS = [
  { caminho: '', label: 'Ver detalhes' },
  { caminho: 'editar', label: 'Editar' },
  { caminho: 'imagens', label: 'Imagens' },
  { caminho: 'especificacoes', label: 'Especificações' },
  { caminho: 'precos', label: 'Preços' },
  { caminho: 'garantia', label: 'Garantia' },
]

const caminhoProduto = (produto, sub = '') =>
  `/admin/produtos/${encodeURIComponent(produto.id)}${sub ? `/${sub}` : ''}`

function Miniatura({ produto }) {
  const imagem = produto.imagens?.[0]
  return imagem
    ? <img src={imagem.url} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded border bg-slate-50 object-cover" />
    : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border bg-slate-50 text-muted-foreground"><ImageOff className="h-4 w-4" aria-hidden="true" /></div>
}

function Accoes({ produto, onDesactivar }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`Acções para ${produto.nome}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUBPAGINAS.map(sub => (
          <DropdownMenuItem key={sub.caminho} asChild>
            <Link to={caminhoProduto(produto, sub.caminho)}>{sub.label}</Link>
          </DropdownMenuItem>
        ))}
        {produto.activo && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDesactivar(produto)}>
            Desactivar
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EstadoBadges({ produto }) {
  const stock = estadoStockAdmin(produto)
  return (
    <div className="flex flex-wrap gap-1">
      {produto.activo ? <Badge variant="secondary">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
      {produto.promocoes?.length > 0 && <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Promoção</Badge>}
      {stock.etiqueta !== 'Em stock' && <Badge className={stock.classe}>{stock.etiqueta}</Badge>}
    </div>
  )
}

export default function AdminProdutos() {
  const [params, setParams] = useSearchParams()
  const pesquisa = params.get('pesquisa') || ''
  const estado = FILTRO_ACTIVO[params.get('estado')] ? params.get('estado') : 'todos'
  const pagina = Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1)

  const [texto, setTexto] = useState(pesquisa)
  const [pesquisaVista, setPesquisaVista] = useState(pesquisa)
  const temporizador = useRef(null)
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ chave: null, produtos: [], total: 0, totalPaginas: 0, erro: '' })
  const [aDesactivar, setADesactivar] = useState(null)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })

  // Sincroniza o campo quando a pesquisa muda pelo histórico do navegador.
  if (pesquisa !== pesquisaVista) {
    setPesquisaVista(pesquisa)
    if (texto.trim() !== pesquisa) setTexto(pesquisa)
  }

  const chave = JSON.stringify({ pesquisa, estado, pagina, versao })

  useEffect(() => {
    const controller = new AbortController()
    produtosApi.listar({ pesquisa, activo: FILTRO_ACTIVO[estado], pagina, limite: LIMITE }, { signal: controller.signal })
      .then(resposta => setResultado({
        chave,
        produtos: resposta.produtos || [],
        total: resposta.total || 0,
        totalPaginas: resposta.totalPaginas || 0,
        erro: '',
      }))
      .catch(error => {
        if (!controller.signal.aborted) setResultado({ chave, produtos: [], total: 0, totalPaginas: 0, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, pesquisa, estado, pagina])

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const definirFiltros = (alteracoes, opcoes) => {
    setParams(anteriores => {
      const novos = new URLSearchParams(anteriores)
      for (const [nome, valor] of Object.entries(alteracoes)) {
        if (valor && valor !== 'todos' && !(nome === 'pagina' && valor === 1)) novos.set(nome, String(valor))
        else novos.delete(nome)
      }
      if (!('pagina' in alteracoes)) novos.delete('pagina')
      return novos
    }, opcoes)
  }

  const alterarPesquisa = valor => {
    setTexto(valor)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => definirFiltros({ pesquisa: valor.trim() }, { replace: true }), 350)
  }

  const desactivar = async () => {
    const produto = aDesactivar
    try {
      await produtosApi.apagar(produto.id)
      setMensagem({ erro: '', sucesso: `Produto "${produto.nome}" desactivado.` })
      setVersao(valor => valor + 1)
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    }
  }

  const carregando = resultado.chave !== chave
  const primeiraCarga = carregando && resultado.chave === null
  const { produtos, total, totalPaginas, erro } = resultado
  const filtrado = Boolean(pesquisa) || estado !== 'todos'

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {primeiraCarga || erro ? 'Gestão do catálogo de produtos.' : `${total} ${total === 1 ? 'produto encontrado' : 'produtos encontrados'}.`}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/produtos/novo"><Plus className="h-4 w-4" />Novo produto</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="space-y-1.5">
          <Label htmlFor="produtos-pesquisa">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="produtos-pesquisa"
              type="search"
              className="pl-9"
              value={texto}
              onChange={evento => alterarPesquisa(evento.target.value)}
              placeholder="Nome, código ou marca"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="produtos-estado">Estado</Label>
          <Select value={estado} onValueChange={valor => definirFiltros({ estado: valor })}>
            <SelectTrigger id="produtos-estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mensagem.erro && <FeedbackMessage variante="erro" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.erro}</FeedbackMessage>}
      {mensagem.sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.sucesso}</FeedbackMessage>}

      {primeiraCarga && <LoadingState mensagem="A carregar produtos…" />}

      {!carregando && erro && (
        <FeedbackMessage
          variante="erro"
          titulo="Não foi possível carregar os produtos."
          accao={<Button variant="outline" size="sm" onClick={() => setVersao(valor => valor + 1)}>Tentar novamente</Button>}
        >
          {erro}
        </FeedbackMessage>
      )}

      {!primeiraCarga && !erro && !produtos.length && !carregando && (
        <EmptyState
          Icone={PackageSearch}
          titulo={filtrado || pagina > 1 ? 'Nenhum produto corresponde aos filtros.' : 'Ainda não existem produtos.'}
          descricao={filtrado || pagina > 1 ? 'Altere a pesquisa ou o estado seleccionado.' : 'Crie o primeiro produto do catálogo.'}
          accao={filtrado || pagina > 1
            ? <Button variant="outline" onClick={() => { setTexto(''); setParams({}) }}>Limpar filtros</Button>
            : <Button asChild><Link to="/admin/produtos/novo">Novo produto</Link></Button>}
        />
      )}

      {!primeiraCarga && produtos.length > 0 && (
        <div className={carregando ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={carregando}>
          {/* Telemóvel */}
          <div className="space-y-3 md:hidden">
            {produtos.map(produto => (
              <Card key={produto.id}>
                <CardContent className="flex gap-3 p-4">
                  <Miniatura produto={produto} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link to={caminhoProduto(produto)} className="block font-medium hover:underline">{produto.nome}</Link>
                    <p className="text-xs text-muted-foreground">{produto.codigo || 'Sem código'} · {produto.categoria?.nome || 'Sem categoria'}</p>
                    <p className="text-sm"><span className="font-mono">{formatarMZN(produto.preco)}</span> · stock {produto.quantidadeStock}</p>
                    <EstadoBadges produto={produto} />
                  </div>
                  <Accoes produto={produto} onDesactivar={setADesactivar} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Computador e tablet */}
          <div className="hidden rounded-md border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="hidden lg:table-cell">Marca</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead><span className="sr-only">Acções</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map(produto => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Miniatura produto={produto} />
                        <div className="min-w-0">
                          <Link to={caminhoProduto(produto)} className="font-medium hover:underline">{produto.nome}</Link>
                          <p className="font-mono text-xs text-muted-foreground">{produto.codigo || 'Sem código'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{produto.categoria?.nome || <span className="text-muted-foreground">Sem categoria</span>}</TableCell>
                    <TableCell className="hidden lg:table-cell">{produto.marca || '—'}</TableCell>
                    <TableCell className="text-right font-mono">{formatarMZN(produto.preco)}</TableCell>
                    <TableCell className="text-right font-mono">{produto.quantidadeStock}</TableCell>
                    <TableCell><EstadoBadges produto={produto} /></TableCell>
                    <TableCell className="text-right"><Accoes produto={produto} onDesactivar={setADesactivar} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!erro && totalPaginas > 1 && (
        <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagina <= 1 || carregando} onClick={() => definirFiltros({ pagina: pagina - 1 })}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={pagina >= totalPaginas || carregando} onClick={() => definirFiltros({ pagina: pagina + 1 })}>Seguinte</Button>
          </div>
        </nav>
      )}

      <ConfirmarApagar
        aberto={Boolean(aDesactivar)}
        onOpenChange={aberto => { if (!aberto) setADesactivar(null) }}
        titulo="Desactivar produto?"
        descricao={aDesactivar ? `"${aDesactivar.nome}" deixará de estar visível na loja. Pode reactivá-lo na página do produto.` : ''}
        rotuloConfirmar="Desactivar"
        onConfirmar={desactivar}
      />
    </section>
  )
}
