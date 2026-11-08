import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, History, PackageX } from 'lucide-react'
import { atendimentoAdminApi, encomendasApi, facturasApi } from '../../../services/api.js'
import { dataLegivel, formatarMZN } from '../../../lib/format.js'
import {
  ESTADOS_ENCOMENDA,
  ESTADOS_ENTREGA,
  ESTADOS_PAGAMENTO,
  MAX_OBSERVACAO,
  caminhoEncomenda,
  caminhoEntrega,
  caminhoPagamento,
  temPagamento,
} from '../../../lib/encomendasAdmin.js'
import EstadosEncomenda from '../../../components/admin/EstadosEncomenda.jsx'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// codigo_encomenda é VARCHAR(20).
const codigoValido = codigo => typeof codigo === 'string' && codigo.trim().length > 0 && codigo.trim().length <= 20

function Titulo({ children }) {
  return <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{children}</CardTitle>
}

function VoltarEncomendas() {
  return (
    <Link to="/admin/encomendas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Encomendas
    </Link>
  )
}

function useEncomendaAdmin(codigo) {
  const [estado, setEstado] = useState({ codigo: null, encomenda: null, erro: '' })
  const [versao, setVersao] = useState(0)
  const valido = codigoValido(codigo)

  useEffect(() => {
    if (!valido) return undefined
    const controller = new AbortController()
    encomendasApi.obterPorCodigo(codigo.trim(), { signal: controller.signal })
      .then(encomenda => setEstado({ codigo, encomenda, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ codigo, encomenda: null, erro: error.message })
      })
    return () => controller.abort()
  }, [codigo, valido, versao])

  const recarregar = useCallback(() => setVersao(valor => valor + 1), [])
  const definirEncomenda = useCallback(encomenda => setEstado({ codigo, encomenda, erro: '' }), [codigo])
  return {
    valido,
    carregando: valido && estado.codigo !== codigo,
    encomenda: estado.codigo === codigo ? estado.encomenda : null,
    erro: estado.codigo === codigo ? estado.erro : '',
    recarregar,
    definirEncomenda,
  }
}

// Estrutura comum de /admin/encomendas/:codigo/*.
function EncomendaAdminPagina({ titulo, children }) {
  const { codigo } = useParams()
  const { valido, carregando, encomenda, erro, recarregar, definirEncomenda } = useEncomendaAdmin(codigo)

  let conteudo = null
  if (!valido) {
    conteudo = <EmptyState Icone={PackageX} titulo="Código inválido" descricao="O código de encomenda indicado não é válido." />
  } else if (carregando) {
    conteudo = <LoadingState mensagem="A carregar encomenda…" />
  } else if (erro) {
    conteudo = (
      <FeedbackMessage variante="erro" titulo="Não foi possível carregar a encomenda." accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>
        {erro}
      </FeedbackMessage>
    )
  } else if (!encomenda) {
    conteudo = (
      <EmptyState
        Icone={PackageX}
        titulo="Encomenda não encontrada"
        descricao={`Não existe nenhuma encomenda com o código "${codigo}".`}
        accao={<Button asChild variant="outline"><Link to="/admin/encomendas">Voltar às encomendas</Link></Button>}
      />
    )
  }
  if (conteudo) return <section className="space-y-4"><VoltarEncomendas />{conteudo}</section>

  const seccoes = [
    { to: caminhoEncomenda(encomenda.codigo), label: 'Detalhes' },
    { to: caminhoEncomenda(encomenda.codigo, 'historico'), label: 'Histórico' },
    { to: caminhoEncomenda(encomenda.codigo, 'cancelar'), label: 'Cancelar' },
  ]

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <VoltarEncomendas />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{titulo}</p>
            <h1 className="break-all font-mono text-2xl font-bold tracking-tight">{encomenda.codigo}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{dataLegivel(encomenda.data)} · {encomenda.nomeCliente}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold">{formatarMZN(encomenda.total)}</p>
          </div>
        </div>
        <EstadosEncomenda encomenda={encomenda} />
      </div>

      <nav aria-label="Secções da encomenda" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
        {seccoes.map(seccao => (
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

      <div key={encomenda.id}>{children({ encomenda, definirEncomenda })}</div>
    </section>
  )
}

// ==================== Detalhes ====================

// Edição manual de estados que já existia na listagem (PATCH /admin/encomendas/:id).
// O cancelamento tem página própria.
function ActualizarEstados({ encomenda, definirEncomenda }) {
  const [valores, setValores] = useState({})
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })
  const alteracoes = Object.fromEntries(Object.entries(valores).filter(([chave, valor]) =>
    chave === 'observacao' ? valor.trim() : valor !== encomenda[chave]))
  const temAlteracoes = Object.keys(alteracoes).some(chave => chave !== 'observacao')

  const guardar = async evento => {
    evento.preventDefault()
    if (!temAlteracoes || aGuardar) return
    setAGuardar(true)
    setMensagem({ erro: '', sucesso: '' })
    try {
      const dados = { ...alteracoes, ...(alteracoes.observacao ? { observacao: alteracoes.observacao.trim() } : {}) }
      const resposta = await encomendasApi.actualizar(encomenda.id, dados)
      definirEncomenda(resposta.encomenda)
      setValores({})
      setMensagem({ erro: '', sucesso: 'Estados actualizados.' })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    } finally {
      setAGuardar(false)
    }
  }

  const campo = (chave, rotulo, opcoes) => (
    <div className="space-y-1.5">
      <Label htmlFor={`estado-${chave}`}>{rotulo}</Label>
      <Select value={valores[chave] ?? encomenda[chave]} onValueChange={v => setValores({ ...valores, [chave]: v })}>
        <SelectTrigger id={`estado-${chave}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(opcoes).map(([valor, texto]) => <SelectItem key={valor} value={valor}>{texto}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
  // O cancelamento é feito na página própria, com confirmação explícita.
  const estadosSemCancelar = Object.fromEntries(Object.entries(ESTADOS_ENCOMENDA)
    .filter(([valor]) => valor !== 'CANCELADA' || encomenda.estado === 'CANCELADA'))

  return (
    <Card>
      <CardHeader><Titulo>Actualizar estados</Titulo></CardHeader>
      <CardContent>
        <form onSubmit={guardar} className="space-y-4">
          {mensagem.erro && <FeedbackMessage variante="erro" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.erro}</FeedbackMessage>}
          {mensagem.sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.sucesso}</FeedbackMessage>}
          <div className="grid gap-4 sm:grid-cols-3">
            {campo('estado', 'Encomenda', estadosSemCancelar)}
            {temPagamento(encomenda)
              ? campo('pagamentoEstado', 'Último pagamento', ESTADOS_PAGAMENTO)
              : <div className="space-y-1.5"><p className="text-sm font-medium">Último pagamento</p><p className="py-2 text-sm text-muted-foreground">Sem pagamento registado</p></div>}
            {/* A entrega tem página própria, que aplica as transições validadas pelo servidor. */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Entrega</p>
              <p className="py-2 text-sm">
                {ESTADOS_ENTREGA[encomenda.entregaEstado] || encomenda.entregaEstado}
                {' · '}<Link to={caminhoEntrega(encomenda.id)} className="text-primary hover:underline">Gerir entrega</Link>
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estado-observacao">Observação</Label>
            <Textarea id="estado-observacao" rows={2} maxLength={MAX_OBSERVACAO} value={valores.observacao || ''} onChange={e => setValores({ ...valores, observacao: e.target.value })} placeholder="Observação interna (opcional)" />
            <p className="text-xs text-muted-foreground">Fica registada no histórico quando o estado da encomenda muda. Máximo de {MAX_OBSERVACAO} caracteres.</p>
          </div>
          <FeedbackMessage variante="aviso">
            Alteração manual: os estados escolhidos ficam registados no histórico da encomenda. Mudar aqui o estado do pagamento não movimenta dinheiro; os reembolsos fazem-se a partir das devoluções.
          </FeedbackMessage>
          <div className="flex justify-end">
            <Button type="submit" disabled={!temAlteracoes || aGuardar}>{aGuardar ? 'A guardar…' : 'Guardar alterações'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Factura: emitida automaticamente quando o pagamento é confirmado; para encomendas pagas
// antes desta funcionalidade pode ser emitida aqui. Modelo por validar por contabilista.
function FacturaEncomenda({ encomenda }) {
  const [factura, setFactura] = useState(encomenda.factura)
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState('')

  const executar = async operacao => {
    setAEnviar(true)
    setErro('')
    try {
      await operacao()
    } catch (error) {
      setErro(error.message)
    } finally {
      setAEnviar(false)
    }
  }

  return (
    <div className="border-t pt-3">
      {factura
        ? <Button size="sm" variant="outline" disabled={aEnviar} onClick={() => executar(() => facturasApi.pdfAdmin(factura.id, factura.numero))}>Factura {factura.numero} (PDF)</Button>
        : encomenda.pagamentoEstado === 'CONFIRMADO'
          ? <Button size="sm" variant="outline" disabled={aEnviar} onClick={() => executar(async () => setFactura((await facturasApi.emitir(encomenda.id)).factura))}>Emitir factura</Button>
          : <p className="text-xs text-muted-foreground">A factura é emitida quando o pagamento for confirmado.</p>}
      {erro && <p className="pt-1 text-xs text-destructive" role="alert">{erro}</p>}
    </div>
  )
}

function DetalheEncomenda({ encomenda, definirEncomenda }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline"><Link to="historico"><History className="h-4 w-4" />Histórico</Link></Button>
        {encomenda.estado !== 'CANCELADA' && (
          <Button asChild size="sm" variant="destructive"><Link to="cancelar">Cancelar encomenda</Link></Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><Titulo>Cliente</Titulo></CardHeader>
          <CardContent className="space-y-1 break-words text-sm">
            <p className="font-medium">{encomenda.nomeCliente}</p>
            <p><a href={`mailto:${encomenda.emailCliente}`} className="text-primary hover:underline">{encomenda.emailCliente}</a></p>
            <p>{encomenda.telefoneCliente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Titulo>Entrega</Titulo></CardHeader>
          <CardContent className="space-y-1 break-words text-sm">
            <p>{encomenda.moradaEntrega || 'Morada não indicada'}</p>
            {encomenda.referenciaLocalizacao && <p className="text-muted-foreground">Referência: {encomenda.referenciaLocalizacao}</p>}
            <p className="pt-1">Estado: <strong>{ESTADOS_ENTREGA[encomenda.entregaEstado] || encomenda.entregaEstado}</strong></p>
            <Link to={caminhoEntrega(encomenda.id)} className="inline-block pt-1 text-primary hover:underline">Gerir entrega</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Titulo>Pagamento</Titulo></CardHeader>
          <CardContent className="space-y-1 break-words text-sm">
            {temPagamento(encomenda) ? <>
              <p>{encomenda.pagamentoMetodo || 'Método não indicado'}</p>
              <p className="font-mono text-xs">{encomenda.pagamentoReferencia}</p>
              <p className="pt-1">Estado: <strong>{ESTADOS_PAGAMENTO[encomenda.pagamentoEstado] || encomenda.pagamentoEstado}</strong></p>
              <Link to={caminhoPagamento(encomenda.pagamentoReferencia)} className="inline-block pt-1 text-primary hover:underline">Ver pagamento</Link>
              <p className="pt-1 text-xs text-muted-foreground">É apresentado o pagamento mais recente da encomenda.</p>
            </> : <p className="text-muted-foreground">Sem pagamento registado.</p>}
            <FacturaEncomenda key={encomenda.factura?.numero || encomenda.pagamentoEstado} encomenda={encomenda} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><Titulo>Produtos encomendados</Titulo></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Preço unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomenda.itens.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-[10rem]">{item.nome}</TableCell>
                    <TableCell className="text-right font-mono">{item.quantidade}</TableCell>
                    <TableCell className="text-right font-mono">{formatarMZN(item.preco)}</TableCell>
                    <TableCell className="text-right font-mono">{formatarMZN(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <dl className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-mono">{formatarMZN(encomenda.subtotal)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Portes</dt><dd className="font-mono">{formatarMZN(encomenda.frete)}</dd></div>
            <div className="flex justify-between gap-4 border-t pt-1 font-semibold"><dt>Total</dt><dd className="font-mono">{formatarMZN(encomenda.total)}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Valores registados no momento da encomenda. O subtotal de cada linha já inclui o desconto de promoção, quando existiu.
          </p>
        </CardContent>
      </Card>

      <ActualizarEstados encomenda={encomenda} definirEncomenda={definirEncomenda} />
    </div>
  )
}

export function OrderDetailPage() {
  return <EncomendaAdminPagina titulo="Detalhes da encomenda">{props => <DetalheEncomenda {...props} />}</EncomendaAdminPagina>
}

// ==================== Histórico ====================

// GET /admin/encomendas/:id/historico (historico_estado_encomenda), do mais antigo para o mais recente.
function HistoricoEncomenda({ encomenda }) {
  const [estado, setEstado] = useState({ historico: null, erro: '' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    atendimentoAdminApi.historicoEncomenda(encomenda.id, { signal: controller.signal })
      .then(resposta => setEstado({ historico: resposta.historico || [], erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ historico: null, erro: error.message })
      })
    return () => controller.abort()
  }, [encomenda.id, versao])

  const { historico, erro } = estado
  return (
    <div className="space-y-6">
      {!historico && !erro && <LoadingState mensagem="A carregar o histórico…" />}
      {erro && (
        <FeedbackMessage variante="erro" titulo="Não foi possível carregar o histórico." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>
          {erro}
        </FeedbackMessage>
      )}
      {historico && !historico.length && <EmptyState Icone={History} titulo="Sem alterações de estado registadas." />}
      {historico && historico.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ol className="divide-y">
              {historico.map(evento => (
                <li key={evento.id} className="space-y-1 px-4 py-3 text-sm">
                  <p className="font-medium">
                    {evento.estadoAnterior ? `${ESTADOS_ENCOMENDA[evento.estadoAnterior] || evento.estadoAnterior} → ` : ''}
                    {ESTADOS_ENCOMENDA[evento.estadoNovo] || evento.estadoNovo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(evento.criadoEm).toLocaleString('pt-PT')}
                    {' · '}{evento.autor?.nome || 'Sistema ou cliente'}
                  </p>
                  {evento.observacao && <p className="text-muted-foreground">{evento.observacao}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function OrderHistoryPage() {
  return <EncomendaAdminPagina titulo="Histórico da encomenda">{props => <HistoricoEncomenda {...props} />}</EncomendaAdminPagina>
}

// ==================== Cancelamento ====================

function CancelarEncomenda({ encomenda, definirEncomenda }) {
  const [motivo, setMotivo] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [aCancelar, setACancelar] = useState(false)
  const [erro, setErro] = useState('')
  const [cancelada, setCancelada] = useState(false)

  if (encomenda.estado === 'CANCELADA') {
    return (
      <FeedbackMessage
        variante={cancelada ? 'sucesso' : 'info'}
        titulo={cancelada ? 'Encomenda cancelada.' : 'Esta encomenda já está cancelada.'}
        accao={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to={caminhoEncomenda(encomenda.codigo)}>Ver detalhes</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/admin/encomendas">Voltar às encomendas</Link></Button>
          </div>
        }
      >
        {cancelada
          ? 'O cancelamento foi confirmado pelo servidor e registado no histórico.'
          : 'Não há nada a cancelar.'}
      </FeedbackMessage>
    )
  }

  const avisos = [
    encomenda.estado === 'CONCLUIDA' && 'A encomenda já está concluída.',
    encomenda.entregaEstado === 'EM_TRANSPORTE' && 'A entrega está em transporte.',
    encomenda.entregaEstado === 'ENTREGUE' && 'A entrega já foi feita ao cliente.',
    temPagamento(encomenda) && encomenda.pagamentoEstado === 'CONFIRMADO' && 'O pagamento está confirmado; um eventual reembolso tem de ser tratado à parte.',
  ].filter(Boolean)

  const cancelar = async evento => {
    evento.preventDefault()
    if (!confirmado || aCancelar) return
    setACancelar(true)
    setErro('')
    try {
      const resposta = await encomendasApi.actualizar(encomenda.id, {
        estado: 'CANCELADA',
        ...(motivo.trim() ? { observacao: motivo.trim() } : {}),
      })
      if (resposta.encomenda?.estado !== 'CANCELADA') throw new Error('O servidor não confirmou o cancelamento.')
      setCancelada(true)
      definirEncomenda(resposta.encomenda)
    } catch (error) {
      setErro(error.message)
    } finally {
      setACancelar(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader><Titulo>Cancelar encomenda</Titulo></CardHeader>
        <CardContent>
          <form onSubmit={cancelar} className="space-y-5">
            <dl className="grid gap-3 rounded-md border bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Encomenda</dt><dd className="font-mono font-semibold">{encomenda.codigo}</dd></div>
              <div><dt className="text-muted-foreground">Total</dt><dd className="font-mono">{formatarMZN(encomenda.total)}</dd></div>
              <div><dt className="text-muted-foreground">Cliente</dt><dd className="break-words">{encomenda.nomeCliente}</dd></div>
              <div><dt className="text-muted-foreground">Data</dt><dd>{dataLegivel(encomenda.data)}</dd></div>
            </dl>

            {avisos.length > 0 && (
              <FeedbackMessage variante="aviso" titulo="Atenção">
                <ul className="list-disc space-y-1 pl-4">{avisos.map(aviso => <li key={aviso}>{aviso}</li>)}</ul>
              </FeedbackMessage>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cancelar-motivo">Motivo do cancelamento</Label>
              <Textarea id="cancelar-motivo" rows={3} maxLength={MAX_OBSERVACAO} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Opcional, mas recomendado" />
              <p className="text-xs text-muted-foreground">Fica registado no histórico da encomenda. Máximo de {MAX_OBSERVACAO} caracteres.</p>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={confirmado} onCheckedChange={valor => setConfirmado(valor === true)} className="mt-0.5" />
              <span>Confirmo que pretendo cancelar a encomenda <strong className="font-mono">{encomenda.codigo}</strong>.</span>
            </label>

            {erro && <FeedbackMessage variante="erro">{erro}</FeedbackMessage>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline"><Link to={caminhoEncomenda(encomenda.codigo)}>Voltar</Link></Button>
              <Button type="submit" variant="destructive" disabled={!confirmado || aCancelar}>
                {aCancelar ? 'A cancelar…' : 'Cancelar encomenda'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
          <Titulo>O que o cancelamento faz</Titulo>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Altera o estado da encomenda para <strong>Cancelada</strong> e regista a alteração no histórico, com o seu nome e o motivo.</p>
          <p>O sistema <strong>não</strong> faz automaticamente:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>reposição do stock dos produtos;</li>
            <li>alteração do estado do pagamento;</li>
            <li>reembolso ao cliente;</li>
            <li>alteração do estado da entrega.</li>
          </ul>
          <p className="text-muted-foreground">Depois de cancelada, a entrega desta encomenda deixa de poder ser actualizada.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function OrderCancelPage() {
  return <EncomendaAdminPagina titulo="Cancelamento da encomenda">{props => <CancelarEncomenda {...props} />}</EncomendaAdminPagina>
}
