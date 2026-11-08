import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Percent, Trash2 } from 'lucide-react'
import { cotacoesAdminApi } from '../../../services/api.js'
import { useCategoriasAdmin } from '../../../hooks/useCategoriasAdmin.js'
import { formatarMZN } from '../../../lib/format.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Cotações B2B (GET/PATCH /admin/cotacoes) e descontos por grupo (/admin/descontos-grupo).
// O preço sugerido é calculado pelo servidor: preço base → maior entre promoção e desconto
// de grupo → escalão de quantidade. O preço proposto pela loja é o que vale.
const ESTADOS = {
  PEDIDA: { rotulo: 'Pedida', classe: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  RESPONDIDA: { rotulo: 'Respondida', classe: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  ACEITE: { rotulo: 'Aceite', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  RECUSADA: { rotulo: 'Recusada', classe: 'bg-red-100 text-red-700 hover:bg-red-100' },
  EXPIRADA: { rotulo: 'Expirada', classe: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
}
const GRUPOS = { EMPRESA: 'Empresas', REVENDEDOR: 'Revendedores' }
const TODOS = 'todos'
const dataHora = valor => (valor ? new Date(valor).toLocaleString('pt-PT') : '—')

function EstadoCotacao({ estado }) {
  return <Badge className={ESTADOS[estado]?.classe}>{ESTADOS[estado]?.rotulo || estado}</Badge>
}

function Titulo({ children }) {
  return <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{children}</CardTitle>
}

export function QuotesPage() {
  const [filtro, setFiltro] = useState('PEDIDA')
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const chave = `${filtro}|${pagina}|${versao}`
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: '' })

  useEffect(() => {
    const controller = new AbortController()
    cotacoesAdminApi.listar({ estado: filtro === TODOS ? undefined : filtro, pagina, limite: 20 }, { signal: controller.signal })
      .then(dados => setEstado({ chave, dados, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, dados: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, filtro, pagina])

  const actual = estado.chave === chave
  const dados = actual ? estado.dados : null
  const erro = actual ? estado.erro : ''
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Cotações</h1>
          <p className="text-sm text-muted-foreground">Pedidos de preço das empresas aprovadas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/admin/cotacoes/descontos"><Percent className="h-4 w-4" />Descontos por grupo</Link></Button>
          <Select value={filtro} onValueChange={valor => { setFiltro(valor); setPagina(1) }}>
            <SelectTrigger className="w-44" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os estados</SelectItem>
              {Object.entries(ESTADOS).map(([valor, { rotulo }]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {!actual && <LoadingState mensagem="A carregar cotações…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar as cotações." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>{erro}</FeedbackMessage>}
      {dados && !dados.cotacoes.length && <EmptyState Icone={FileText} titulo="Não há cotações com este estado." />}
      {dados && dados.cotacoes.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cotação</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Produtos</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Total proposto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Pedida em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.cotacoes.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><Link to={`/admin/cotacoes/${c.id}`} className="font-mono text-sm font-semibold text-primary hover:underline">{c.codigo}</Link></TableCell>
                    <TableCell className="max-w-[16rem] truncate">{c.empresa.nome} <span className="text-xs text-muted-foreground">({GRUPOS[c.empresa.tipoCliente]})</span></TableCell>
                    <TableCell className="hidden md:table-cell">{c.itens.length}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-right font-mono lg:table-cell">{c.totalProposto ? formatarMZN(c.totalProposto) : '—'}</TableCell>
                    <TableCell><EstadoCotacao estado={c.estado} /></TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground sm:table-cell">{dataHora(c.criadoEm)}</TableCell>
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

export function QuoteDetailPage() {
  const { id } = useParams()
  const [versao, setVersao] = useState(0)
  const chave = `${id}|${versao}`
  const [estado, setEstado] = useState({ chave: null, cotacao: null, erro: '' })

  useEffect(() => {
    const controller = new AbortController()
    cotacoesAdminApi.obter(id, { signal: controller.signal })
      .then(resposta => setEstado({ chave, cotacao: resposta.cotacao, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, cotacao: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, id])

  const { cotacao, erro } = estado
  const carregando = estado.chave !== chave && !cotacao
  return (
    <section className="space-y-6">
      <Link to="/admin/cotacoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Cotações
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Cotação {cotacao?.codigo || ''}</h1>
      {carregando && <LoadingState mensagem="A carregar a cotação…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar a cotação.">{erro}</FeedbackMessage>}
      {cotacao && <>
        <Card>
          <CardHeader><Titulo>Pedido</Titulo></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Estado</dt><dd><EstadoCotacao estado={cotacao.estado} /></dd></div>
              <div><dt className="text-muted-foreground">Empresa</dt><dd><Link className="text-primary hover:underline" to={`/admin/empresas/${cotacao.empresa.id}`}>{cotacao.empresa.nome}</Link> · NUIT {cotacao.empresa.nuit} · {GRUPOS[cotacao.empresa.tipoCliente]}</dd></div>
              <div><dt className="text-muted-foreground">Pedida em</dt><dd>{dataHora(cotacao.criadoEm)}</dd></div>
              {cotacao.validaAte && <div><dt className="text-muted-foreground">Válida até</dt><dd>{dataHora(cotacao.validaAte)}</dd></div>}
              {cotacao.respondidaEm && <div><dt className="text-muted-foreground">Respondida em</dt><dd>{dataHora(cotacao.respondidaEm)}{cotacao.responsavel?.nome ? ` por ${cotacao.responsavel.nome}` : ''}</dd></div>}
              {cotacao.encomenda && <div><dt className="text-muted-foreground">Encomenda</dt><dd><Link className="font-mono text-primary hover:underline" to={`/admin/encomendas/${encodeURIComponent(cotacao.encomenda.codigoEncomenda)}`}>{cotacao.encomenda.codigoEncomenda}</Link> · {formatarMZN(cotacao.encomenda.valorTotal)}</dd></div>}
              {cotacao.notasCliente && <div className="sm:col-span-2"><dt className="text-muted-foreground">Notas da empresa</dt><dd className="whitespace-pre-line">{cotacao.notasCliente}</dd></div>}
              {cotacao.notasLoja && <div className="sm:col-span-2"><dt className="text-muted-foreground">Notas da loja</dt><dd className="whitespace-pre-line">{cotacao.notasLoja}</dd></div>}
            </dl>
          </CardContent>
        </Card>
        {cotacao.estado === 'PEDIDA'
          ? <ResponderCotacao key={cotacao.id} cotacao={cotacao} aoResponder={() => setVersao(v => v + 1)} />
          : <ItensCotacao cotacao={cotacao} />}
      </>}
    </section>
  )
}

function DetalheSugestao({ sugestao }) {
  const partes = []
  if (sugestao.origemDesconto === 'GRUPO') partes.push(`grupo −${sugestao.percentagemGrupo}%`)
  if (sugestao.origemDesconto === 'PROMOCAO') partes.push(`promoção −${formatarMZN(sugestao.descontoPromocao)}`)
  if (sugestao.escalao > 0) partes.push(`quantidade −${Math.round(sugestao.escalao * 100)}%`)
  return <span className="text-xs text-muted-foreground">{partes.length ? partes.join(' · ') : 'sem descontos'}</span>
}

function ItensCotacao({ cotacao }) {
  return (
    <Card>
      <CardHeader><Titulo>Produtos</Titulo></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="hidden text-right md:table-cell">Catálogo</TableHead>
              <TableHead className="hidden text-right md:table-cell">Pedido</TableHead>
              <TableHead className="text-right">Proposto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cotacao.itens.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.produto.nome} <span className="font-mono text-xs text-muted-foreground">{item.produto.codigo}</span></TableCell>
                <TableCell className="text-right">{item.quantidade}</TableCell>
                <TableCell className="hidden text-right font-mono md:table-cell">{formatarMZN(item.produto.preco)}</TableCell>
                <TableCell className="hidden text-right font-mono md:table-cell">{item.precoPedido ? formatarMZN(item.precoPedido) : '—'}</TableCell>
                <TableCell className="text-right font-mono">{item.precoProposto ? formatarMZN(item.precoProposto) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {cotacao.totalProposto && <p className="px-4 py-3 text-right text-sm">Total proposto (sem entrega): <strong className="font-mono">{formatarMZN(cotacao.totalProposto)}</strong></p>}
      </CardContent>
    </Card>
  )
}

const emDias = dias => {
  const data = new Date(Date.now() + dias * 86400000)
  return data.toISOString().slice(0, 10)
}

// Um preço por item (pré-preenchido com o sugerido) e a validade da proposta.
function ResponderCotacao({ cotacao, aoResponder }) {
  const [precos, setPrecos] = useState(() => Object.fromEntries(cotacao.itens.map(item => [item.id, item.sugestao.precoSugerido])))
  const [validaAte, setValidaAte] = useState(emDias(15))
  const [notasLoja, setNotasLoja] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  const total = cotacao.itens.reduce((soma, item) => soma + (Number(precos[item.id]) || 0) * item.quantidade, 0)

  const responder = async evento => {
    evento.preventDefault()
    setAEnviar(true)
    setMensagem(null)
    try {
      const resposta = await cotacoesAdminApi.responder(cotacao.id, {
        // Fim do dia escolhido, na hora local.
        validaAte: new Date(`${validaAte}T23:59:59`).toISOString(),
        notasLoja: notasLoja.trim() || undefined,
        itens: cotacao.itens.map(item => ({ itemId: item.id, precoProposto: Number(precos[item.id]) })),
      })
      setMensagem({ variante: resposta.emailEnviado ? 'sucesso' : 'aviso', texto: `${resposta.message} ${resposta.emailEnviado ? 'A empresa foi notificada por email.' : 'O email não pôde ser enviado.'}` })
      aoResponder()
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
      setAEnviar(false)
    }
  }

  return (
    <Card>
      <CardHeader><Titulo>Responder com preços</Titulo></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={responder}>
          {mensagem && <FeedbackMessage variante={mensagem.variante}>{mensagem.texto}</FeedbackMessage>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Catálogo</TableHead>
                  <TableHead className="text-right">Pedido</TableHead>
                  <TableHead className="text-right">Sugerido</TableHead>
                  <TableHead className="w-40">Proposto (un.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotacao.itens.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-[12rem]">{item.produto.nome}</TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right font-mono">{formatarMZN(item.produto.preco)}</TableCell>
                    <TableCell className="text-right font-mono">{item.precoPedido ? formatarMZN(item.precoPedido) : '—'}</TableCell>
                    <TableCell className="text-right"><span className="font-mono">{formatarMZN(item.sugestao.precoSugerido)}</span><br /><DetalheSugestao sugestao={item.sugestao} /></TableCell>
                    <TableCell>
                      <Input type="number" min="0.01" step="0.01" required aria-label={`Preço proposto para ${item.produto.nome}`}
                        value={precos[item.id]} onChange={e => setPrecos({ ...precos, [item.id]: e.target.value })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-right text-sm">Total proposto (sem entrega): <strong className="font-mono">{formatarMZN(total)}</strong></p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cotacao-validade">Proposta válida até</Label>
              <Input id="cotacao-validade" type="date" required min={emDias(1)} max={emDias(180)} value={validaAte} onChange={e => setValidaAte(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cotacao-notas">Notas para a empresa (opcional)</Label>
              <Textarea id="cotacao-notas" maxLength={2000} value={notasLoja} onChange={e => setNotasLoja(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={aEnviar}>{aEnviar ? 'A enviar…' : 'Enviar proposta'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ==================== Descontos por grupo ====================

export function GroupDiscountsPage() {
  const { categorias } = useCategoriasAdmin()
  const [versao, setVersao] = useState(0)
  const [estado, setEstado] = useState({ versao: null, descontos: null, erro: '' })
  const [novo, setNovo] = useState({ grupo: 'EMPRESA', categoriaId: TODOS, percentagem: '' })
  const [mensagem, setMensagem] = useState(null)
  const [aEnviar, setAEnviar] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    cotacoesAdminApi.descontos({ signal: controller.signal })
      .then(resposta => setEstado({ versao, descontos: resposta.descontos, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ versao, descontos: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])

  const executar = async (operacao, sucesso) => {
    setAEnviar(true)
    setMensagem(null)
    try {
      await operacao()
      setMensagem({ variante: 'sucesso', texto: sucesso })
      setVersao(v => v + 1)
      return true
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
      return false
    } finally {
      setAEnviar(false)
    }
  }

  const criar = async evento => {
    evento.preventDefault()
    const ok = await executar(() => cotacoesAdminApi.criarDesconto({
      grupo: novo.grupo,
      categoriaId: novo.categoriaId === TODOS ? null : Number(novo.categoriaId),
      percentagem: Number(novo.percentagem),
    }), 'Desconto criado.')
    if (ok) setNovo({ ...novo, percentagem: '' })
  }

  const { descontos, erro } = estado
  return (
    <section className="space-y-6">
      <Link to="/admin/cotacoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Cotações
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Descontos por grupo</h1>
        <p className="text-sm text-muted-foreground">Usados para calcular o preço sugerido ao responder a cotações. O desconto de uma categoria prevalece sobre o geral do grupo.</p>
      </div>
      {mensagem && <FeedbackMessage variante={mensagem.variante}>{mensagem.texto}</FeedbackMessage>}
      {!descontos && !erro && <LoadingState mensagem="A carregar descontos…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar os descontos.">{erro}</FeedbackMessage>}
      {descontos && !descontos.length && <EmptyState Icone={Percent} titulo="Ainda não há descontos por grupo." />}
      {descontos && descontos.length > 0 && (
        <Card>
          <CardContent className="divide-y p-0">
            {descontos.map(desconto => (
              <div key={desconto.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{GRUPOS[desconto.grupo]} · {desconto.categoria?.nome || 'Todas as categorias'}</p>
                  <p className="font-mono text-muted-foreground">−{Number(desconto.percentagem)}%</p>
                </div>
                <Switch checked={desconto.activo} disabled={aEnviar} aria-label={desconto.activo ? 'Desactivar desconto' : 'Activar desconto'}
                  onCheckedChange={activo => executar(() => cotacoesAdminApi.actualizarDesconto(desconto.id, {
                    grupo: desconto.grupo, categoriaId: desconto.categoria?.id ?? null, percentagem: Number(desconto.percentagem), activo,
                  }), activo ? 'Desconto activado.' : 'Desconto desactivado.')} />
                <Button variant="ghost" size="icon" disabled={aEnviar} aria-label="Apagar desconto"
                  onClick={() => window.confirm('Apagar este desconto?') && executar(() => cotacoesAdminApi.apagarDesconto(desconto.id), 'Desconto apagado.')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><Titulo>Novo desconto</Titulo></CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end" onSubmit={criar}>
            <div className="space-y-2">
              <Label htmlFor="desconto-grupo">Grupo</Label>
              <Select value={novo.grupo} onValueChange={grupo => setNovo({ ...novo, grupo })}>
                <SelectTrigger id="desconto-grupo"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(GRUPOS).map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desconto-categoria">Categoria</Label>
              <Select value={novo.categoriaId} onValueChange={categoriaId => setNovo({ ...novo, categoriaId })}>
                <SelectTrigger id="desconto-categoria"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as categorias</SelectItem>
                  {(categorias || []).map(categoria => <SelectItem key={categoria.id} value={String(categoria.id)}>{categoria.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desconto-percentagem">Percentagem (%)</Label>
              <Input id="desconto-percentagem" type="number" min="0.01" max="99.99" step="0.01" required value={novo.percentagem} onChange={e => setNovo({ ...novo, percentagem: e.target.value })} />
            </div>
            <Button type="submit" disabled={aEnviar}>Criar</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
