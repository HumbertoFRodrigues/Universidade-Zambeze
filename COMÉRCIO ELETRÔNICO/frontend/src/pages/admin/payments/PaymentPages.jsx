import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, Search } from 'lucide-react'
import { consultasAdminApi } from '../../../services/api.js'
import { dataLegivel, formatarMZN } from '../../../lib/format.js'
import {
  CLASSES_PAGAMENTO,
  ESTADOS_ENCOMENDA,
  ESTADOS_PAGAMENTO,
  caminhoEncomenda,
  caminhoPagamento,
} from '../../../lib/encomendasAdmin.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const LIMITE = 20
const TODOS = 'todos'

// Histórico completo de pagamentos (todas as tentativas), de GET /admin/pagamentos/historico.
function normalizar(pagamento) {
  return {
    ...pagamento,
    referencia: pagamento.referenciaOperacao,
    encomenda: {
      codigo: pagamento.encomenda.codigoEncomenda,
      nomeCliente: pagamento.encomenda.nomeContacto,
      emailCliente: pagamento.encomenda.emailContacto,
      estado: pagamento.encomenda.estado,
      total: pagamento.encomenda.valorTotal,
      data: pagamento.encomenda.criadoEm,
    },
  }
}

function usePagamentos() {
  const [estado, setEstado] = useState({ pagamentos: null, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    consultasAdminApi.todosPagamentos({ signal: controller.signal })
      .then(lista => setEstado({ pagamentos: lista.map(normalizar), erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ pagamentos: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])
  const recarregar = useCallback(() => setVersao(valor => valor + 1), [])
  return { ...estado, carregando: !estado.pagamentos && !estado.erro, recarregar }
}

function EstadoPagamento({ estado }) {
  return <Badge className={CLASSES_PAGAMENTO[estado]}>{ESTADOS_PAGAMENTO[estado] || estado}</Badge>
}

function ErroCarregamento({ erro, recarregar }) {
  return (
    <FeedbackMessage variante="erro" titulo="Não foi possível carregar os pagamentos." accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>
      {erro}
    </FeedbackMessage>
  )
}

// ==================== Listagem ====================

export function PaymentsPage() {
  const { pagamentos, erro, carregando, recarregar } = usePagamentos()
  const [pesquisa, setPesquisa] = useState('')
  const [estado, setEstado] = useState('')
  const [metodo, setMetodo] = useState('')
  const [pagina, setPagina] = useState(1)

  // Métodos reais presentes nos dados (FormaPagamento.nome).
  const metodos = [...new Set((pagamentos || []).map(p => p.metodo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'))
  const termo = pesquisa.trim().toLocaleLowerCase('pt')
  // Todos os pagamentos visíveis são carregados, por isso filtros e paginação locais são exactos.
  const filtrados = (pagamentos || []).filter(p =>
    (!termo || [p.referencia, p.encomenda.codigo, p.encomenda.nomeCliente, p.encomenda.emailCliente]
      .some(valor => (valor || '').toLocaleLowerCase('pt').includes(termo))) &&
    (!estado || p.estado === estado) &&
    (!metodo || p.metodo === metodo)
  )
  const totalPaginas = Math.ceil(filtrados.length / LIMITE)
  const paginaActual = Math.min(pagina, Math.max(totalPaginas, 1))
  const visiveis = filtrados.slice((paginaActual - 1) * LIMITE, paginaActual * LIMITE)
  const filtrado = Boolean(termo || estado || metodo)
  const filtrar = definir => valor => { definir(valor); setPagina(1) }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">
          {pagamentos ? `${filtrados.length} ${filtrados.length === 1 ? 'pagamento' : 'pagamentos'}${filtrado ? ` de ${pagamentos.length}` : ''}.` : 'Pagamentos associados às encomendas.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="pagamentos-pesquisa">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="pagamentos-pesquisa" type="search" className="pl-9" placeholder="Referência, encomenda ou cliente" value={pesquisa} onChange={e => filtrar(setPesquisa)(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pagamentos-estado">Estado</Label>
          <Select value={estado || TODOS} onValueChange={v => filtrar(setEstado)(v === TODOS ? '' : v)}>
            <SelectTrigger id="pagamentos-estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {Object.entries(ESTADOS_PAGAMENTO).map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pagamentos-metodo">Método</Label>
          <Select value={metodo || TODOS} onValueChange={v => filtrar(setMetodo)(v === TODOS ? '' : v)}>
            <SelectTrigger id="pagamentos-metodo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {metodos.map(nome => <SelectItem key={nome} value={nome}>{nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {carregando && <LoadingState mensagem="A carregar pagamentos…" />}
      {erro && <ErroCarregamento erro={erro} recarregar={recarregar} />}
      {pagamentos && !filtrados.length && (
        <EmptyState
          Icone={CreditCard}
          titulo={filtrado ? 'Nenhum pagamento corresponde aos filtros.' : 'Não existem pagamentos registados.'}
          accao={filtrado ? <Button variant="outline" onClick={() => { setPesquisa(''); setEstado(''); setMetodo(''); setPagina(1) }}>Limpar filtros</Button> : null}
        />
      )}

      {visiveis.length > 0 && <>
        {/* Telemóvel */}
        <div className="space-y-3 md:hidden">
          {visiveis.map(p => (
            <Card key={p.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link to={caminhoPagamento(p.referencia)} className="min-w-0 break-all font-mono text-sm font-semibold hover:underline">{p.referencia}</Link>
                  <EstadoPagamento estado={p.estado} />
                </div>
                <p className="text-sm">{p.metodo || 'Método não indicado'} · <Link to={caminhoEncomenda(p.encomenda.codigo)} className="font-mono hover:underline">{p.encomenda.codigo}</Link></p>
                <p className="truncate text-xs text-muted-foreground">{p.encomenda.nomeCliente} · {dataLegivel(p.encomenda.data)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Computador e tablet */}
        <div className="hidden rounded-md border bg-white md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Encomenda</TableHead>
                <TableHead className="hidden lg:table-cell">Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map(p => (
                <TableRow key={p.id}>
                  <TableCell><Link to={caminhoPagamento(p.referencia)} className="break-all font-mono text-xs font-semibold hover:underline">{p.referencia}</Link></TableCell>
                  <TableCell>
                    <Link to={caminhoEncomenda(p.encomenda.codigo)} className="font-mono hover:underline">{p.encomenda.codigo}</Link>
                    <p className="text-xs text-muted-foreground">{dataLegivel(p.encomenda.data)}</p>
                  </TableCell>
                  <TableCell className="hidden max-w-[14rem] lg:table-cell xl:max-w-[22rem] 2xl:max-w-[30rem]"><p className="truncate" title={p.encomenda.nomeCliente}>{p.encomenda.nomeCliente}</p></TableCell>
                  <TableCell>{p.metodo || '—'}</TableCell>
                  <TableCell className="text-right font-mono">{formatarMZN(p.valor)}{p.valorReembolsado > 0 && <p className="text-xs text-muted-foreground">reemb. {formatarMZN(p.valorReembolsado)}</p>}</TableCell>
                  <TableCell><EstadoPagamento estado={p.estado} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>}

      {totalPaginas > 1 && (
        <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Página {paginaActual} de {totalPaginas}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)}>Seguinte</Button>
          </div>
        </nav>
      )}
    </section>
  )
}

// ==================== Detalhes ====================

// O parâmetro :id corresponde à referência da operação (única por pagamento).
export function PaymentDetailPage() {
  const { id } = useParams()
  const { pagamentos, erro, carregando, recarregar } = usePagamentos()
  const referenciaValida = typeof id === 'string' && id.trim().length > 0 && id.length <= 64
  const pagamento = referenciaValida && pagamentos ? pagamentos.find(p => p.referencia === id) : null

  let conteudo = null
  if (!referenciaValida) conteudo = <EmptyState Icone={CreditCard} titulo="Referência inválida" descricao="A referência de pagamento indicada não é válida." />
  else if (carregando) conteudo = <LoadingState mensagem="A carregar pagamento…" />
  else if (erro) conteudo = <ErroCarregamento erro={erro} recarregar={recarregar} />
  else if (!pagamento) {
    conteudo = (
      <EmptyState
        Icone={CreditCard}
        titulo="Pagamento não encontrado"
        descricao="Não existe nenhum pagamento com esta referência."
        accao={<Button asChild variant="outline"><Link to="/admin/pagamentos">Voltar aos pagamentos</Link></Button>}
      />
    )
  }

  return (
    <section className="space-y-6">
      <Link to="/admin/pagamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Pagamentos
      </Link>
      {conteudo || <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pagamento</p>
            <h1 className="break-all font-mono text-xl font-bold tracking-tight">{pagamento.referencia}</h1>
          </div>
          <EstadoPagamento estado={pagamento.estado} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Pagamento</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Referência da operação</dt><dd className="break-all font-mono">{pagamento.referencia}</dd></div>
                <div><dt className="text-muted-foreground">Estado</dt><dd>{ESTADOS_PAGAMENTO[pagamento.estado] || pagamento.estado}</dd></div>
                <div><dt className="text-muted-foreground">Método</dt><dd>{pagamento.metodo || '—'}{pagamento.simulado ? ' (simulado)' : ''}</dd></div>
                <div><dt className="text-muted-foreground">Valor</dt><dd className="font-mono">{formatarMZN(pagamento.valor)}</dd></div>
                <div><dt className="text-muted-foreground">Valor reembolsado</dt><dd className="font-mono">{formatarMZN(pagamento.valorReembolsado)}{pagamento.reembolsos.total > 0 ? ` (${pagamento.reembolsos.total} ${pagamento.reembolsos.total === 1 ? 'reembolso' : 'reembolsos'})` : ''}</dd></div>
                <div><dt className="text-muted-foreground">Confirmado em</dt><dd>{pagamento.confirmadoEm ? new Date(pagamento.confirmadoEm).toLocaleString('pt-MZ') : '—'}</dd></div>
                {pagamento.motivoFalha && <div className="sm:col-span-2"><dt className="text-muted-foreground">Motivo da falha</dt><dd className="break-words">{pagamento.motivoFalha}</dd></div>}
                {pagamento.temComprovativo && <div className="sm:col-span-2"><dt className="text-muted-foreground">Comprovativo</dt><dd><Link to="/admin/transferencias" className="text-primary hover:underline">Ver em Transferências</Link></dd></div>}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Encomenda associada</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Código</dt><dd><Link to={caminhoEncomenda(pagamento.encomenda.codigo)} className="font-mono text-primary hover:underline">{pagamento.encomenda.codigo}</Link></dd></div>
                <div><dt className="text-muted-foreground">Estado</dt><dd>{ESTADOS_ENCOMENDA[pagamento.encomenda.estado] || pagamento.encomenda.estado}</dd></div>
                <div><dt className="text-muted-foreground">Cliente</dt><dd className="break-words">{pagamento.encomenda.nomeCliente}</dd></div>
                <div><dt className="text-muted-foreground">Data da encomenda</dt><dd>{dataLegivel(pagamento.encomenda.data)}</dd></div>
                <div><dt className="text-muted-foreground">Total da encomenda</dt><dd className="font-mono">{formatarMZN(pagamento.encomenda.total)}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <FeedbackMessage variante="info" titulo="Gestão do pagamento">
          Os reembolsos são feitos a partir das devoluções e as transferências bancárias são validadas em Transferências. O estado da encomenda gere-se na página da encomenda.
        </FeedbackMessage>
      </>}
    </section>
  )
}
