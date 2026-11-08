import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, LifeBuoy, MessageSquareWarning, ShieldCheck } from 'lucide-react'
import { atendimentoAdminApi } from '../../../services/api.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Assistência, reclamações e garantias são o mesmo modelo (PedidoAssistencia),
// distinguido por tipoPedido. Endpoints: /admin/pedidos-assistencia.
const AREAS = {
  assistencia: { titulo: 'Assistência', tituloDetalhe: 'Pedido de assistência', caminho: '/admin/assistencia', Icone: LifeBuoy, tipo: 'DUVIDA' },
  reclamacoes: { titulo: 'Reclamações', tituloDetalhe: 'Reclamação', caminho: '/admin/reclamacoes', Icone: MessageSquareWarning, tipo: 'RECLAMACAO' },
  garantias: { titulo: 'Garantias', tituloDetalhe: 'Processo de garantia', caminho: '/admin/garantias', Icone: ShieldCheck, tipo: 'GARANTIA' },
}

const ESTADOS = {
  ABERTO: { rotulo: 'Aberto', classe: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  EM_CURSO: { rotulo: 'Em curso', classe: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  RESOLVIDO: { rotulo: 'Resolvido', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  FECHADO: { rotulo: 'Fechado', classe: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
}
const TODOS = 'todos'

function EstadoPedido({ estado }) {
  return <Badge className={ESTADOS[estado]?.classe}>{ESTADOS[estado]?.rotulo || estado}</Badge>
}

function ListaPedidos({ area }) {
  const { titulo, caminho, Icone, tipo } = AREAS[area]
  const [filtro, setFiltro] = useState(TODOS)
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const chave = `${tipo}|${filtro}|${pagina}|${versao}`
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: '' })

  useEffect(() => {
    const controller = new AbortController()
    atendimentoAdminApi.pedidos({ tipo, estado: filtro === TODOS ? undefined : filtro, pagina, limite: 20 }, { signal: controller.signal })
      .then(dados => setEstado({ chave, dados, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, dados: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, tipo, filtro, pagina])

  const actual = estado.chave === chave
  const dados = actual ? estado.dados : null
  const erro = actual ? estado.erro : ''
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">{titulo}</h1>
        <Select value={filtro} onValueChange={valor => { setFiltro(valor); setPagina(1) }}>
          <SelectTrigger className="w-48" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os estados</SelectItem>
            {Object.entries(ESTADOS).map(([valor, { rotulo }]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {!actual && <LoadingState mensagem="A carregar pedidos…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar os pedidos." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>{erro}</FeedbackMessage>}
      {dados && !dados.pedidos.length && <EmptyState Icone={Icone} titulo="Não há pedidos." />}
      {dados && dados.pedidos.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Encomenda</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.pedidos.map(pedido => (
                  <TableRow key={pedido.id}>
                    <TableCell className="max-w-[20rem]">
                      <Link to={`${caminho}/${pedido.id}`} className="block truncate font-medium text-primary hover:underline" title={pedido.assunto}>{pedido.assunto}</Link>
                    </TableCell>
                    <TableCell className="hidden max-w-[16rem] truncate md:table-cell">{pedido.nomeContacto}</TableCell>
                    <TableCell className="hidden font-mono text-sm lg:table-cell">{pedido.encomenda?.codigoEncomenda || '—'}</TableCell>
                    <TableCell><EstadoPedido estado={pedido.estado} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {dados?.totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
          <span>Página {dados.pagina} de {dados.totalPaginas}</span>
          <Button variant="outline" size="sm" disabled={pagina >= dados.totalPaginas} onClick={() => setPagina(p => p + 1)}>Seguinte</Button>
        </div>
      )}
    </section>
  )
}

function DetalhePedido({ area }) {
  const { titulo, tituloDetalhe, caminho } = AREAS[area]
  const { id } = useParams()
  const [estado, setEstado] = useState({ pedido: null, erro: '' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    atendimentoAdminApi.pedido(id, { signal: controller.signal })
      .then(resposta => setEstado({ pedido: resposta.pedido, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ pedido: null, erro: error.message })
      })
    return () => controller.abort()
  }, [id, versao])

  const { pedido, erro } = estado
  return (
    <section className="space-y-6">
      <Link to={caminho} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {titulo}
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">{tituloDetalhe}</h1>
      {!pedido && !erro && <LoadingState mensagem="A carregar o pedido…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar o pedido.">{erro}</FeedbackMessage>}
      {pedido && <>
        <Card>
          <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{pedido.assunto}</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Estado</dt><dd><EstadoPedido estado={pedido.estado} /></dd></div>
              <div><dt className="text-muted-foreground">Cliente</dt><dd>{pedido.nomeContacto}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{pedido.emailContacto}</dd></div>
              {pedido.telefoneContacto && <div><dt className="text-muted-foreground">Telefone</dt><dd>{pedido.telefoneContacto}</dd></div>}
              {pedido.encomenda && <div><dt className="text-muted-foreground">Encomenda</dt><dd><Link className="font-mono text-primary hover:underline" to={`/admin/encomendas/${encodeURIComponent(pedido.encomenda.codigoEncomenda)}`}>{pedido.encomenda.codigoEncomenda}</Link></dd></div>}
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Mensagem</dt><dd className="whitespace-pre-line">{pedido.mensagem}</dd></div>
              {pedido.resposta && <div className="sm:col-span-2"><dt className="text-muted-foreground">Resposta{pedido.responsavel?.nome ? ` de ${pedido.responsavel.nome}` : ''}{pedido.respondidoEm ? ` em ${new Date(pedido.respondidoEm).toLocaleString('pt-PT')}` : ''}</dt><dd className="whitespace-pre-line">{pedido.resposta}</dd></div>}
            </dl>
          </CardContent>
        </Card>
        <ResponderPedido key={`${pedido.estado}|${pedido.resposta}`} pedido={pedido} aoGuardar={() => setVersao(v => v + 1)} />
      </>}
    </section>
  )
}

// A resposta é obrigatória para marcar como resolvido; um pedido fechado já não pode ser alterado.
function ResponderPedido({ pedido, aoGuardar }) {
  const [novoEstado, setNovoEstado] = useState(pedido.estado)
  const [resposta, setResposta] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  if (pedido.estado === 'FECHADO') {
    return <FeedbackMessage variante="info">Este pedido está fechado e já não pode ser alterado.</FeedbackMessage>
  }

  const guardar = async evento => {
    evento.preventDefault()
    setAEnviar(true)
    setMensagem(null)
    try {
      const resultado = await atendimentoAdminApi.responderPedido(pedido.id, { estado: novoEstado, resposta: resposta.trim() || undefined })
      setMensagem({ variante: 'sucesso', texto: resultado.message })
      aoGuardar()
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
      setAEnviar(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Responder</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={guardar}>
          {mensagem && <FeedbackMessage variante={mensagem.variante}>{mensagem.texto}</FeedbackMessage>}
          <div className="space-y-2">
            <Label htmlFor="pedido-estado">Estado</Label>
            <Select value={novoEstado} onValueChange={setNovoEstado}>
              <SelectTrigger id="pedido-estado" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ESTADOS).map(([valor, { rotulo }]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pedido-resposta">Resposta ao cliente{novoEstado === 'RESOLVIDO' ? '' : ' (opcional)'}</Label>
            <Textarea id="pedido-resposta" maxLength={5000} rows={5} value={resposta} onChange={e => setResposta(e.target.value)} />
            <p className="text-xs text-muted-foreground">A resposta fica visível para o cliente na área da conta. {pedido.resposta ? 'Uma nova resposta substitui a anterior.' : ''}</p>
          </div>
          <Button type="submit" disabled={aEnviar}>{aEnviar ? 'A guardar…' : 'Guardar'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SupportPage() {
  return <ListaPedidos area="assistencia" />
}

export function SupportDetailPage() {
  return <DetalhePedido area="assistencia" />
}

export function ComplaintsPage() {
  return <ListaPedidos area="reclamacoes" />
}

export function ComplaintDetailPage() {
  return <DetalhePedido area="reclamacoes" />
}

export function WarrantiesPage() {
  return <ListaPedidos area="garantias" />
}

export function WarrantyDetailPage() {
  return <DetalhePedido area="garantias" />
}
