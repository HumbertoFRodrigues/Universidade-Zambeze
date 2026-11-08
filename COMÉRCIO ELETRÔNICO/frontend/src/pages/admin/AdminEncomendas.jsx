import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal, Search, ShoppingCart } from 'lucide-react'
import { encomendasApi } from '../../services/api.js'
import { dataLegivel, formatarMZN } from '../../lib/format.js'
import {
  ESTADOS_ENCOMENDA,
  ESTADOS_ENTREGA,
  ESTADOS_PAGAMENTO,
  caminhoEncomenda,
  caminhoPagamento,
  temPagamento,
} from '../../lib/encomendasAdmin.js'
import EstadosEncomenda from '../../components/admin/EstadosEncomenda.jsx'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
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
const TODOS = 'todos'

function FiltroEstados({ id, label, valor, opcoes, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={valor || TODOS} onValueChange={v => onChange(v === TODOS ? '' : v)}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {Object.entries(opcoes).map(([chave, rotulo]) => <SelectItem key={chave} value={chave}>{rotulo}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function Accoes({ encomenda }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`Acções para ${encomenda.codigo}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to={caminhoEncomenda(encomenda.codigo)}>Ver detalhes</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to={caminhoEncomenda(encomenda.codigo, 'historico')}>Histórico</Link></DropdownMenuItem>
        {temPagamento(encomenda) && (
          <DropdownMenuItem asChild><Link to={caminhoPagamento(encomenda.pagamentoReferencia)}>Ver pagamento</Link></DropdownMenuItem>
        )}
        {encomenda.estado !== 'CANCELADA' && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
            <Link to={caminhoEncomenda(encomenda.codigo, 'cancelar')}>Cancelar encomenda</Link>
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdminEncomendas() {
  const [texto, setTexto] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [filtros, setFiltros] = useState({ estado: '', pagamento: '', entrega: '' })
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ chave: null, encomendas: [], total: 0, totalPaginas: 0, erro: '' })
  const temporizador = useRef(null)
  const chave = JSON.stringify({ pesquisa, filtros, pagina, versao })

  useEffect(() => () => clearTimeout(temporizador.current), [])

  useEffect(() => {
    const controller = new AbortController()
    encomendasApi.listar({ pesquisa, ...filtros, pagina, limite: LIMITE }, { signal: controller.signal })
      .then(resposta => setResultado({
        chave,
        encomendas: resposta.encomendas || [],
        total: resposta.total || 0,
        totalPaginas: resposta.totalPaginas || 0,
        erro: '',
      }))
      .catch(error => {
        if (!controller.signal.aborted) setResultado({ chave, encomendas: [], total: 0, totalPaginas: 0, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, pesquisa, filtros, pagina])

  const alterarPesquisa = valor => {
    setTexto(valor)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => { setPesquisa(valor.trim()); setPagina(1) }, 350)
  }
  const alterarFiltro = (nome, valor) => { setFiltros(actual => ({ ...actual, [nome]: valor })); setPagina(1) }
  const limpar = () => { setTexto(''); setPesquisa(''); setFiltros({ estado: '', pagamento: '', entrega: '' }); setPagina(1) }

  const carregando = resultado.chave !== chave
  const primeiraCarga = carregando && resultado.chave === null
  const { encomendas, total, totalPaginas, erro } = resultado
  const filtrado = Boolean(pesquisa) || Object.values(filtros).some(Boolean)

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Encomendas</h1>
        <p className="text-sm text-muted-foreground">
          {primeiraCarga || erro ? 'Consulta e gestão das encomendas da loja.' : `${total} ${total === 1 ? 'encomenda encontrada' : 'encomendas encontradas'}.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="encomendas-pesquisa">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="encomendas-pesquisa" type="search" className="pl-9" value={texto} onChange={e => alterarPesquisa(e.target.value)} placeholder="Código, nome ou email do cliente" />
          </div>
        </div>
        <FiltroEstados id="encomendas-estado" label="Estado" valor={filtros.estado} opcoes={ESTADOS_ENCOMENDA} onChange={v => alterarFiltro('estado', v)} />
        <FiltroEstados id="encomendas-pagamento" label="Pagamento" valor={filtros.pagamento} opcoes={ESTADOS_PAGAMENTO} onChange={v => alterarFiltro('pagamento', v)} />
        <FiltroEstados id="encomendas-entrega" label="Entrega" valor={filtros.entrega} opcoes={ESTADOS_ENTREGA} onChange={v => alterarFiltro('entrega', v)} />
      </div>
      {filtros.pagamento && (
        <p className="text-xs text-muted-foreground">O filtro de pagamento inclui encomendas com pelo menos um pagamento nesse estado.</p>
      )}

      {primeiraCarga && <LoadingState mensagem="A carregar encomendas…" />}
      {!carregando && erro && (
        <FeedbackMessage variante="erro" titulo="Não foi possível carregar as encomendas." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>
          {erro}
        </FeedbackMessage>
      )}
      {!carregando && !erro && !encomendas.length && (
        <EmptyState
          Icone={ShoppingCart}
          titulo={filtrado ? 'Nenhuma encomenda corresponde aos filtros.' : 'Ainda não existem encomendas.'}
          accao={filtrado ? <Button variant="outline" onClick={limpar}>Limpar filtros</Button> : null}
        />
      )}

      {!primeiraCarga && encomendas.length > 0 && (
        <div className={carregando ? 'opacity-60' : ''} aria-busy={carregando}>
          {/* Telemóvel */}
          <div className="space-y-3 md:hidden">
            {encomendas.map(encomenda => (
              <Card key={encomenda.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={caminhoEncomenda(encomenda.codigo)} className="font-mono font-semibold hover:underline">{encomenda.codigo}</Link>
                      <p className="truncate text-sm">{encomenda.nomeCliente}</p>
                      <p className="text-xs text-muted-foreground">{dataLegivel(encomenda.data)}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <strong className="font-mono text-sm">{formatarMZN(encomenda.total)}</strong>
                      <Accoes encomenda={encomenda} />
                    </div>
                  </div>
                  <EstadosEncomenda encomenda={encomenda} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Computador e tablet */}
          <div className="hidden rounded-md border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Encomenda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estados</TableHead>
                  <TableHead><span className="sr-only">Acções</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomendas.map(encomenda => (
                  <TableRow key={encomenda.id}>
                    <TableCell>
                      <Link to={caminhoEncomenda(encomenda.codigo)} className="font-mono font-semibold hover:underline">{encomenda.codigo}</Link>
                      <p className="text-xs text-muted-foreground">{dataLegivel(encomenda.data)}</p>
                    </TableCell>
                    <TableCell className="max-w-[16rem] xl:max-w-[24rem] 2xl:max-w-[32rem]">
                      <p className="truncate">{encomenda.nomeCliente}</p>
                      <p className="truncate text-xs text-muted-foreground">{encomenda.emailCliente}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatarMZN(encomenda.total)}</TableCell>
                    <TableCell><EstadosEncomenda encomenda={encomenda} /></TableCell>
                    <TableCell className="text-right"><Accoes encomenda={encomenda} /></TableCell>
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
            <Button variant="outline" size="sm" disabled={pagina <= 1 || carregando} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={pagina >= totalPaginas || carregando} onClick={() => setPagina(pagina + 1)}>Seguinte</Button>
          </div>
        </nav>
      )}
    </section>
  )
}
