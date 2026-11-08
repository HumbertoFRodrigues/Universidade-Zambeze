import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Search, Truck } from 'lucide-react'
import { encomendasApi, entregasApi } from '../../../services/api.js'
import { dataLegivel } from '../../../lib/format.js'
import { dataHoraLegivel } from '../../../lib/produtosAdmin.js'
import {
  CLASSES_ENCOMENDA,
  CLASSES_ENTREGA,
  ESTADOS_ENCOMENDA,
  ESTADOS_ENTREGA,
  MAX_OBSERVACAO,
  MAX_RECEBIDO_POR,
  TRANSICOES_ENTREGA,
  caminhoEncomenda,
  caminhoEntrega,
  entregaEditavel,
  podeConfirmarEntrega,
} from '../../../lib/encomendasAdmin.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const LIMITE = 20
const TODOS = 'todos'

function Titulo({ children }) {
  return <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{children}</CardTitle>
}

function EstadoEntrega({ estado }) {
  return <Badge className={CLASSES_ENTREGA[estado]}>{ESTADOS_ENTREGA[estado] || estado}</Badge>
}

function EstadoEncomenda({ estado }) {
  return <Badge className={CLASSES_ENCOMENDA[estado]}>{ESTADOS_ENCOMENDA[estado] || estado}</Badge>
}

// ==================== Listagem ====================

function Accoes({ encomenda }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`Acções para a entrega de ${encomenda.codigo}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to={caminhoEntrega(encomenda.id)}>Ver detalhes</Link></DropdownMenuItem>
        {entregaEditavel(encomenda) && <DropdownMenuItem asChild><Link to={caminhoEntrega(encomenda.id, 'actualizar')}>Actualizar estado</Link></DropdownMenuItem>}
        {podeConfirmarEntrega(encomenda) && <DropdownMenuItem asChild><Link to={caminhoEntrega(encomenda.id, 'confirmar')}>Confirmar entrega</Link></DropdownMenuItem>}
        <DropdownMenuItem asChild><Link to={caminhoEncomenda(encomenda.codigo)}>Ver encomenda</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// As entregas vêm da listagem de encomendas (relação 1:1), com filtro e paginação no servidor.
export function DeliveriesPage() {
  const [texto, setTexto] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ chave: null, encomendas: [], total: 0, totalPaginas: 0, erro: '' })
  const temporizador = useRef(null)
  const chave = JSON.stringify({ pesquisa, estado, pagina, versao })

  useEffect(() => () => clearTimeout(temporizador.current), [])

  useEffect(() => {
    const controller = new AbortController()
    encomendasApi.listar({ pesquisa, entrega: estado, pagina, limite: LIMITE }, { signal: controller.signal })
      .then(resposta => setResultado({ chave, encomendas: resposta.encomendas || [], total: resposta.total || 0, totalPaginas: resposta.totalPaginas || 0, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setResultado({ chave, encomendas: [], total: 0, totalPaginas: 0, erro: error.message })
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
  const { encomendas, total, totalPaginas, erro } = resultado
  const filtrado = Boolean(pesquisa || estado)

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Entregas</h1>
        <p className="text-sm text-muted-foreground">
          {primeiraCarga || erro ? 'Acompanhamento das entregas das encomendas.' : `${total} ${total === 1 ? 'entrega encontrada' : 'entregas encontradas'}.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="space-y-1.5">
          <Label htmlFor="entregas-pesquisa">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="entregas-pesquisa" type="search" className="pl-9" value={texto} onChange={e => alterarPesquisa(e.target.value)} placeholder="Código da encomenda, nome ou email" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="entregas-estado">Estado da entrega</Label>
          <Select value={estado || TODOS} onValueChange={v => { setEstado(v === TODOS ? '' : v); setPagina(1) }}>
            <SelectTrigger id="entregas-estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {Object.entries(ESTADOS_ENTREGA).map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {primeiraCarga && <LoadingState mensagem="A carregar entregas…" />}
      {!carregando && erro && (
        <FeedbackMessage variante="erro" titulo="Não foi possível carregar as entregas." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>
          {erro}
        </FeedbackMessage>
      )}
      {!carregando && !erro && !encomendas.length && (
        <EmptyState
          Icone={Truck}
          titulo={filtrado ? 'Nenhuma entrega corresponde aos filtros.' : 'Ainda não existem entregas.'}
          accao={filtrado ? <Button variant="outline" onClick={() => { setTexto(''); setPesquisa(''); setEstado(''); setPagina(1) }}>Limpar filtros</Button> : null}
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
                      <Link to={caminhoEntrega(encomenda.id)} className="font-mono font-semibold hover:underline">{encomenda.codigo}</Link>
                      <p className="truncate text-sm">{encomenda.nomeCliente}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{encomenda.moradaEntrega || 'Morada não indicada'}</p>
                    </div>
                    <Accoes encomenda={encomenda} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <EstadoEntrega estado={encomenda.entregaEstado} />
                    <EstadoEncomenda estado={encomenda.estado} />
                  </div>
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
                  <TableHead>Destino</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="hidden lg:table-cell">Encomenda</TableHead>
                  <TableHead><span className="sr-only">Acções</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomendas.map(encomenda => (
                  <TableRow key={encomenda.id}>
                    <TableCell>
                      <Link to={caminhoEntrega(encomenda.id)} className="font-mono font-semibold hover:underline">{encomenda.codigo}</Link>
                      <p className="text-xs text-muted-foreground">{dataLegivel(encomenda.data)}</p>
                    </TableCell>
                    <TableCell className="max-w-[20rem] xl:max-w-[28rem] 2xl:max-w-[36rem]">
                      <p className="truncate">{encomenda.nomeCliente}</p>
                      <p className="truncate text-xs text-muted-foreground">{encomenda.moradaEntrega || 'Morada não indicada'}</p>
                    </TableCell>
                    <TableCell><EstadoEntrega estado={encomenda.entregaEstado} /></TableCell>
                    <TableCell className="hidden lg:table-cell"><EstadoEncomenda estado={encomenda.estado} /></TableCell>
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

// ==================== Estrutura de uma entrega ====================

// Datas, quem recebeu e observação vêm de GET /encomendas/:codigo/entrega.
async function consultarEntrega(encomenda, signal) {
  try {
    const resposta = await entregasApi.consultar(encomenda.codigo, encomenda.emailCliente, { signal })
    return { entrega: resposta.entrega, erroEntrega: '' }
  } catch (error) {
    if (signal?.aborted) throw error
    return { entrega: null, erroEntrega: error.message }
  }
}

function useEntrega(id) {
  const [estado, setEstado] = useState({ id: null, encomenda: null, entrega: null, erro: '', erroEntrega: '' })
  const [versao, setVersao] = useState(0)
  const valido = /^\d+$/.test(id || '') && Number(id) > 0

  useEffect(() => {
    if (!valido) return undefined
    const controller = new AbortController()
    // Não existe GET por id: procura-se na listagem completa de encomendas.
    encomendasApi.listarTodas({ signal: controller.signal })
      .then(async encomendas => {
        const encomenda = encomendas.find(item => item.id === Number(id)) || null
        const detalhe = encomenda ? await consultarEntrega(encomenda, controller.signal) : { entrega: null, erroEntrega: '' }
        setEstado({ id, encomenda, ...detalhe, erro: '' })
      })
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ id, encomenda: null, entrega: null, erro: error.message, erroEntrega: '' })
      })
    return () => controller.abort()
  }, [id, valido, versao])

  // Depois de uma operação confirmada, volta a ler encomenda e entrega do servidor,
  // porque o backend pode ter mudado também o estado da encomenda.
  const recarregarDoServidor = useCallback(async encomendaActual => {
    const encomenda = await encomendasApi.obterPorCodigo(encomendaActual.codigo)
    if (!encomenda) return
    const detalhe = await consultarEntrega(encomenda)
    setEstado({ id, encomenda, ...detalhe, erro: '' })
  }, [id])

  return {
    valido,
    carregando: valido && estado.id !== id,
    ...(estado.id === id ? estado : { encomenda: null, entrega: null, erro: '', erroEntrega: '' }),
    recarregar: () => setVersao(valor => valor + 1),
    recarregarDoServidor,
  }
}

function VoltarEntregas() {
  return (
    <Link to="/admin/entregas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Entregas
    </Link>
  )
}

function EntregaAdminPagina({ titulo, children }) {
  const { id } = useParams()
  const dados = useEntrega(id)
  const { valido, carregando, encomenda, erro } = dados

  let conteudo = null
  if (!valido) conteudo = <EmptyState Icone={Truck} titulo="Identificador inválido" descricao="O identificador de entrega indicado não é válido." />
  else if (carregando) conteudo = <LoadingState mensagem="A carregar entrega…" />
  else if (erro) {
    conteudo = (
      <FeedbackMessage variante="erro" titulo="Não foi possível carregar a entrega." accao={<Button variant="outline" size="sm" onClick={dados.recarregar}>Tentar novamente</Button>}>
        {erro}
      </FeedbackMessage>
    )
  } else if (!encomenda) {
    conteudo = (
      <EmptyState
        Icone={Truck}
        titulo="Entrega não encontrada"
        descricao="Não existe nenhuma encomenda com este identificador."
        accao={<Button asChild variant="outline"><Link to="/admin/entregas">Voltar às entregas</Link></Button>}
      />
    )
  }
  if (conteudo) return <section className="space-y-4"><VoltarEntregas />{conteudo}</section>

  const seccoes = [
    { to: caminhoEntrega(encomenda.id), label: 'Detalhes' },
    { to: caminhoEntrega(encomenda.id, 'actualizar'), label: 'Actualizar' },
    { to: caminhoEntrega(encomenda.id, 'confirmar'), label: 'Confirmar' },
  ]

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <VoltarEntregas />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{titulo}</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Entrega da encomenda <Link to={caminhoEncomenda(encomenda.codigo)} className="break-all font-mono hover:underline">{encomenda.codigo}</Link>
            </h1>
          </div>
          <div className="flex flex-wrap gap-1">
            <EstadoEntrega estado={encomenda.entregaEstado} />
            <EstadoEncomenda estado={encomenda.estado} />
          </div>
        </div>
      </div>

      <nav aria-label="Secções da entrega" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
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

      {dados.erroEntrega && (
        <FeedbackMessage variante="aviso" titulo="Não foi possível obter as datas e observações da entrega.">{dados.erroEntrega}</FeedbackMessage>
      )}

      <div key={encomenda.id}>{children(dados)}</div>
    </section>
  )
}

function MotivoBloqueio({ encomenda }) {
  if (encomenda.estado === 'CANCELADA') {
    return <FeedbackMessage variante="info" titulo="Encomenda cancelada">O servidor não permite actualizar a entrega de uma encomenda cancelada.</FeedbackMessage>
  }
  if (encomenda.entregaEstado === 'ENTREGUE') {
    return <FeedbackMessage variante="info" titulo="Entrega concluída">A entrega já foi confirmada; não existem mais transições possíveis.</FeedbackMessage>
  }
  return null
}

// ==================== Detalhes ====================

function DetalheEntrega({ encomenda, entrega }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {entregaEditavel(encomenda) && <Button asChild size="sm" variant="outline"><Link to="actualizar">Actualizar estado</Link></Button>}
        {podeConfirmarEntrega(encomenda) && <Button asChild size="sm"><Link to="confirmar">Confirmar entrega</Link></Button>}
      </div>
      <MotivoBloqueio encomenda={encomenda} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><Titulo>Entrega</Titulo></CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Estado</dt><dd>{ESTADOS_ENTREGA[encomenda.entregaEstado] || encomenda.entregaEstado}</dd></div>
              <div><dt className="text-muted-foreground">Expedida em</dt><dd>{entrega?.expedidoEm ? dataHoraLegivel(entrega.expedidoEm) : '—'}</dd></div>
              <div><dt className="text-muted-foreground">Entregue em</dt><dd>{entrega?.entregueEm ? dataHoraLegivel(entrega.entregueEm) : '—'}</dd></div>
              <div><dt className="text-muted-foreground">Recebida por</dt><dd className="break-words">{entrega?.recebidoPor || '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Observação</dt><dd className="whitespace-pre-line break-words">{entrega?.observacao || '—'}</dd></div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Titulo>Destino e contacto</Titulo></CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              {encomenda.modalidadeEntrega && <div><dt className="text-muted-foreground">Modalidade</dt><dd className="break-words">{encomenda.modalidadeEntrega}{encomenda.zonaEntrega ? ` · ${encomenda.zonaEntrega}` : ''}</dd></div>}
              {encomenda.destinatario && <div><dt className="text-muted-foreground">Destinatário</dt><dd className="break-words">{encomenda.destinatario}{encomenda.telefoneDestinatario ? ` · ${encomenda.telefoneDestinatario}` : ''}</dd></div>}
              <div><dt className="text-muted-foreground">Morada</dt><dd className="break-words">{encomenda.moradaEntrega || 'Não indicada'}</dd></div>
              {encomenda.referenciaLocalizacao && <div><dt className="text-muted-foreground">Ponto de referência</dt><dd className="break-words">{encomenda.referenciaLocalizacao}</dd></div>}
              <div><dt className="text-muted-foreground">Contacto da encomenda</dt><dd className="break-words">{encomenda.nomeCliente} · {encomenda.telefoneCliente}</dd></div>
              <div><dt className="text-muted-foreground">Encomenda</dt><dd><Link to={caminhoEncomenda(encomenda.codigo)} className="font-mono text-primary hover:underline">{encomenda.codigo}</Link> · {dataLegivel(encomenda.data)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DeliveryDetailPage() {
  return <EntregaAdminPagina titulo="Detalhes da entrega">{props => <DetalheEntrega {...props} />}</EntregaAdminPagina>
}

// ==================== Actualização ====================

// A operação já foi confirmada; uma falha ao reler os dados não a torna num erro.
async function recarregarComAviso(recarregarDoServidor, encomenda, sucesso) {
  try {
    await recarregarDoServidor(encomenda)
    return sucesso
  } catch {
    return `${sucesso} Não foi possível actualizar os dados apresentados; recarregue a página.`
  }
}

function ResultadoOperacao({ mensagem, onFechar }) {
  if (mensagem.erro) return <FeedbackMessage variante="erro" onFechar={onFechar}>{mensagem.erro}</FeedbackMessage>
  if (mensagem.sucesso) return <FeedbackMessage variante="sucesso" onFechar={onFechar}>{mensagem.sucesso}</FeedbackMessage>
  return null
}

function ActualizarEntrega({ encomenda, entrega, recarregarDoServidor }) {
  const destinos = (TRANSICOES_ENTREGA[encomenda.entregaEstado] || []).filter(estado => estado !== 'ENTREGUE')
  const [escolha, setDestino] = useState('')
  // Após uma transição, a escolha anterior pode deixar de ser válida.
  const destino = destinos.includes(escolha) ? escolha : destinos[0] || ''
  const [observacao, setObservacao] = useState(entrega?.observacao || '')
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })

  const bloqueio = <MotivoBloqueio encomenda={encomenda} />
  if (!entregaEditavel(encomenda)) return <div className="space-y-4"><ResultadoOperacao mensagem={mensagem} onFechar={() => setMensagem({ erro: '', sucesso: '' })} />{bloqueio}</div>

  const guardar = async evento => {
    evento.preventDefault()
    if (!destino || aGuardar) return
    setAGuardar(true)
    setMensagem({ erro: '', sucesso: '' })
    try {
      const resposta = await entregasApi.actualizar(encomenda.id, { estado: destino, observacao: observacao.trim() })
      const sucesso = `Entrega actualizada para "${ESTADOS_ENTREGA[resposta.entrega.estado] || resposta.entrega.estado}".`
      setMensagem({ erro: '', sucesso: await recarregarComAviso(recarregarDoServidor, encomenda, sucesso) })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <Card>
      <CardHeader><Titulo>Actualizar estado da entrega</Titulo></CardHeader>
      <CardContent>
        <form onSubmit={guardar} className="space-y-5">
          <ResultadoOperacao mensagem={mensagem} onFechar={() => setMensagem({ erro: '', sucesso: '' })} />
          <p className="text-sm">Estado actual: <strong>{ESTADOS_ENTREGA[encomenda.entregaEstado]}</strong></p>
          <div className="space-y-1.5 sm:max-w-sm">
            <Label htmlFor="entrega-destino">Novo estado</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger id="entrega-destino"><SelectValue /></SelectTrigger>
              <SelectContent>
                {destinos.map(estado => <SelectItem key={estado} value={estado}>{ESTADOS_ENTREGA[estado]}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Só são apresentadas as transições aceites pelo servidor. Para marcar como entregue, use “Confirmar”.</p>
          </div>
          {destino === 'EM_TRANSPORTE' && encomenda.estado === 'REGISTADA' && (
            <FeedbackMessage variante="info">O servidor passa automaticamente a encomenda para “Em processamento” e regista-o no histórico.</FeedbackMessage>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="entrega-observacao">Observação</Label>
            <Textarea id="entrega-observacao" rows={3} maxLength={MAX_OBSERVACAO} value={observacao} onChange={e => setObservacao(e.target.value)} />
            <p className="text-xs text-muted-foreground">Substitui a observação actual da entrega; se ficar vazia, a observação é apagada. Máximo de {MAX_OBSERVACAO} caracteres.</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!destino || aGuardar}>{aGuardar ? 'A guardar…' : 'Actualizar entrega'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function DeliveryUpdatePage() {
  return <EntregaAdminPagina titulo="Actualizar entrega">{props => <ActualizarEntrega {...props} />}</EntregaAdminPagina>
}

// ==================== Confirmação ====================

function ConfirmarEntrega({ encomenda, entrega, recarregarDoServidor }) {
  const [recebidoPor, setRecebidoPor] = useState('')
  const [observacao, setObservacao] = useState(entrega?.observacao || '')
  const [confirmado, setConfirmado] = useState(false)
  const [erroCampo, setErroCampo] = useState('')
  const [aConfirmar, setAConfirmar] = useState(false)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })

  if (!podeConfirmarEntrega(encomenda)) {
    return (
      <div className="space-y-4">
        <ResultadoOperacao mensagem={mensagem} onFechar={() => setMensagem({ erro: '', sucesso: '' })} />
        <MotivoBloqueio encomenda={encomenda} />
        {encomenda.entregaEstado === 'NAO_ENTREGUE' && (
          <FeedbackMessage variante="info" titulo="Entrega não realizada">
            Para confirmar, a entrega tem primeiro de voltar a “Em transporte”. <Link to={caminhoEntrega(encomenda.id, 'actualizar')} className="text-primary hover:underline">Actualizar estado</Link>
          </FeedbackMessage>
        )}
      </div>
    )
  }

  const confirmar = async evento => {
    evento.preventDefault()
    if (aConfirmar) return
    const nome = recebidoPor.trim()
    if (!nome) return setErroCampo('Indique quem recebeu a encomenda.')
    setErroCampo('')
    if (!confirmado) return
    setAConfirmar(true)
    setMensagem({ erro: '', sucesso: '' })
    try {
      const resposta = await entregasApi.actualizar(encomenda.id, { estado: 'ENTREGUE', recebidoPor: nome, observacao: observacao.trim() })
      if (resposta.entrega?.estado !== 'ENTREGUE') throw new Error('O servidor não confirmou a entrega.')
      const sucesso = 'Entrega confirmada pelo servidor, que marcou também a encomenda como concluída.'
      setMensagem({ erro: '', sucesso: await recarregarComAviso(recarregarDoServidor, encomenda, sucesso) })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    } finally {
      setAConfirmar(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader><Titulo>Confirmar entrega</Titulo></CardHeader>
        <CardContent>
          <form onSubmit={confirmar} noValidate className="space-y-5">
            <ResultadoOperacao mensagem={mensagem} onFechar={() => setMensagem({ erro: '', sucesso: '' })} />
            {encomenda.entregaEstado === 'POR_EXPEDIR' && (
              <FeedbackMessage variante="aviso">
                A entrega ainda não foi expedida. O servidor só aceita a confirmação directa em encomendas com levantamento na loja; caso contrário, devolve um erro.
              </FeedbackMessage>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="entrega-recebido">Recebida por *</Label>
              <Input id="entrega-recebido" maxLength={MAX_RECEBIDO_POR} value={recebidoPor} onChange={e => setRecebidoPor(e.target.value)} aria-invalid={!!erroCampo} placeholder="Nome de quem recebeu" />
              {erroCampo && <p className="text-xs text-destructive">{erroCampo}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entrega-obs-confirmar">Observação</Label>
              <Textarea id="entrega-obs-confirmar" rows={3} maxLength={MAX_OBSERVACAO} value={observacao} onChange={e => setObservacao(e.target.value)} />
              <p className="text-xs text-muted-foreground">Substitui a observação actual da entrega. Máximo de {MAX_OBSERVACAO} caracteres.</p>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={confirmado} onCheckedChange={valor => setConfirmado(valor === true)} className="mt-0.5" />
              <span>Confirmo que a encomenda <strong className="font-mono">{encomenda.codigo}</strong> foi entregue.</span>
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={!confirmado || aConfirmar}>{aConfirmar ? 'A confirmar…' : 'Confirmar entrega'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Titulo>O que acontece</Titulo></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>O servidor, numa única operação:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>marca a entrega como entregue, com a data actual e quem recebeu;</li>
            <li>passa a encomenda para “Concluída” e regista-o no histórico;</li>
            <li>grava o registo de auditoria.</li>
          </ul>
          <p className="text-muted-foreground">Depois de confirmada, a entrega não pode voltar a ser alterada.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function DeliveryConfirmPage() {
  return <EntregaAdminPagina titulo="Confirmar entrega">{props => <ConfirmarEntrega {...props} />}</EntregaAdminPagina>
}
