import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgePercent, Search, X } from 'lucide-react'
import { categoriasApi, produtosApi, promocoesAdminApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { dataHoraLegivel } from '../../../lib/produtosAdmin.js'
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

const SITUACOES = {
  ACTIVA: { etiqueta: 'Activa', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  AGENDADA: { etiqueta: 'Agendada', classe: 'bg-sky-100 text-sky-700 hover:bg-sky-100' },
  TERMINADA: { etiqueta: 'Terminada', classe: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
  DESACTIVADA: { etiqueta: 'Desactivada', classe: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

const textoDesconto = promocao => (promocao.tipoDesconto === 'PERCENTAGEM'
  ? `-${Number(promocao.valorDesconto)}%`
  : `-${formatarMZN(promocao.valorDesconto)}`)

const periodo = promocao => `${dataHoraLegivel(promocao.inicioEm)} → ${dataHoraLegivel(promocao.fimEm)}`

// datetime-local trabalha na hora local, sem fuso.
function paraLocal(data) {
  const d = new Date(data)
  const dois = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`
}

function Situacao({ situacao }) {
  const s = SITUACOES[situacao] || SITUACOES.TERMINADA
  return <Badge className={s.classe}>{s.etiqueta}</Badge>
}

function VoltarPromocoes() {
  return (
    <Link to="/admin/promocoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Promoções
    </Link>
  )
}

function ErroCarregamento({ erro, recarregar }) {
  return (
    <FeedbackMessage variante="erro" titulo="Não foi possível carregar as promoções." accao={recarregar && <Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>
      {erro}
    </FeedbackMessage>
  )
}

// Activar/desactivar com um clique, a partir da lista ou do detalhe.
function useAlternar(recarregar, setMensagem) {
  const [aProcessar, setAProcessar] = useState(null)
  const alternar = async promocao => {
    setAProcessar(promocao.id)
    setMensagem(null)
    try {
      const resposta = await promocoesAdminApi.actualizar(promocao.id, { activo: !promocao.activo })
      setMensagem({ variante: 'sucesso', texto: resposta.message })
      recarregar()
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
    } finally {
      setAProcessar(null)
    }
  }
  return { aProcessar, alternar }
}

// ==================== Listagem ====================

export function PromotionsPage() {
  const [estado, setEstado] = useState({ promocoes: null, erro: '' })
  const [versao, setVersao] = useState(0)
  const [pesquisa, setPesquisa] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [mensagem, setMensagem] = useState(null)
  const recarregar = useCallback(() => setVersao(v => v + 1), [])
  const { aProcessar, alternar } = useAlternar(recarregar, setMensagem)

  useEffect(() => {
    const controller = new AbortController()
    promocoesAdminApi.listar({ signal: controller.signal })
      .then(resposta => setEstado({ promocoes: resposta.promocoes || [], erro: '' }))
      .catch(error => { if (!controller.signal.aborted) setEstado({ promocoes: null, erro: error.message }) })
    return () => controller.abort()
  }, [versao])

  const { promocoes, erro } = estado
  const termo = pesquisa.trim().toLocaleLowerCase('pt')
  const visiveis = (promocoes || []).filter(p =>
    (!termo || p.nome.toLocaleLowerCase('pt').includes(termo)) && (filtro === 'todas' || p.situacao === filtro))

  const Accoes = ({ promocao }) => (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild size="sm" variant="outline"><Link to={`/admin/promocoes/${promocao.id}`}>Ver</Link></Button>
      <Button asChild size="sm" variant="outline"><Link to={`/admin/promocoes/${promocao.id}/editar`}>Editar</Link></Button>
      <Button size="sm" variant={promocao.activo ? 'destructive' : 'default'} disabled={aProcessar === promocao.id} onClick={() => alternar(promocao)}>
        {promocao.activo ? 'Desactivar' : 'Activar'}
      </Button>
    </div>
  )

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Promoções</h1>
          <p className="text-sm text-muted-foreground">
            {promocoes ? `${promocoes.length} ${promocoes.length === 1 ? 'promoção' : 'promoções'} · ${promocoes.filter(p => p.situacao === 'ACTIVA').length} activas agora.` : 'Campanhas de desconto em produtos ou categorias.'}
          </p>
        </div>
        <Button asChild><Link to="/admin/promocoes/nova"><BadgePercent className="mr-1.5 h-4 w-4" aria-hidden="true" />Nova promoção</Link></Button>
      </div>

      {mensagem && <FeedbackMessage variante={mensagem.variante} onFechar={() => setMensagem(null)}>{mensagem.texto}</FeedbackMessage>}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="space-y-1.5">
          <Label htmlFor="promocoes-pesquisa">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="promocoes-pesquisa" type="search" className="pl-9" placeholder="Nome da promoção" value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="promocoes-situacao">Situação</Label>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger id="promocoes-situacao"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {Object.entries(SITUACOES).map(([valor, { etiqueta }]) => <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!promocoes && !erro && <LoadingState mensagem="A carregar promoções…" />}
      {erro && <ErroCarregamento erro={erro} recarregar={recarregar} />}
      {promocoes && !visiveis.length && (
        <EmptyState Icone={BadgePercent} titulo={promocoes.length ? 'Nenhuma promoção corresponde ao filtro.' : 'Ainda não existem promoções.'}
          accao={<Button asChild><Link to="/admin/promocoes/nova">Criar promoção</Link></Button>} />
      )}

      {visiveis.length > 0 && <>
        <div className="space-y-3 md:hidden">
          {visiveis.map(p => (
            <Card key={p.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link to={`/admin/promocoes/${p.id}`} className="font-medium hover:underline">{p.nome}</Link>
                  <Situacao situacao={p.situacao} />
                </div>
                <p className="text-sm"><b>{textoDesconto(p)}</b> · {p.totalProdutos} produtos{p.categoria ? ` · ${p.categoria.nome}` : ''}</p>
                <p className="text-xs text-muted-foreground">{periodo(p)}</p>
                <Accoes promocao={p} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="hidden rounded-md border bg-white md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promoção</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead><span className="sr-only">Acções</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link to={`/admin/promocoes/${p.id}`} className="font-medium hover:underline">{p.nome}</Link>
                    {p.categoria && <p className="text-xs text-muted-foreground">Categoria: {p.categoria.nome}</p>}
                  </TableCell>
                  <TableCell className="font-semibold">{textoDesconto(p)}</TableCell>
                  <TableCell className="text-sm">{periodo(p)}</TableCell>
                  <TableCell><Situacao situacao={p.situacao} /></TableCell>
                  <TableCell className="text-right font-mono">{p.totalProdutos}</TableCell>
                  <TableCell><Accoes promocao={p} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>}
    </section>
  )
}

// ==================== Formulário (criar / editar) ====================

function valoresIniciais(promocao) {
  if (promocao) {
    return {
      nome: promocao.nome, descricao: promocao.descricao || '', tipoDesconto: promocao.tipoDesconto,
      valorDesconto: String(promocao.valorDesconto), inicioEm: paraLocal(promocao.inicioEm), fimEm: paraLocal(promocao.fimEm),
      activo: promocao.activo, alcance: promocao.categoria ? 'categoria' : 'produtos',
      categoriaId: promocao.categoria ? String(promocao.categoria.id) : '',
      produtos: promocao.categoria ? [] : (promocao.produtos || []).map(p => ({ id: p.id, nome: p.nome })),
    }
  }
  const agora = new Date()
  return {
    nome: '', descricao: '', tipoDesconto: 'PERCENTAGEM', valorDesconto: '', inicioEm: paraLocal(agora),
    fimEm: paraLocal(new Date(agora.getTime() + 7 * 86400000)), activo: true, alcance: 'categoria', categoriaId: '', produtos: [],
  }
}

function useCategorias() {
  const [categorias, setCategorias] = useState([])
  useEffect(() => {
    const controller = new AbortController()
    categoriasApi.listarAdmin({ signal: controller.signal })
      .then(resposta => setCategorias((resposta.categorias || resposta || []).filter(c => c.activo !== false)))
      .catch(() => {})
    return () => controller.abort()
  }, [])
  // Categorias principais primeiro, cada uma seguida das suas subcategorias (indentadas).
  return useMemo(() => {
    const pais = categorias.filter(c => c.categoriaPaiId == null).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
    return pais.flatMap(pai => [
      { id: pai.id, rotulo: pai.nome },
      ...categorias.filter(c => c.categoriaPaiId === pai.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
        .map(filha => ({ id: filha.id, rotulo: `— ${filha.nome}` })),
    ])
  }, [categorias])
}

function EscolherProdutos({ seleccionados, onChange }) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState([])
  const [aProcurar, setAProcurar] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const temporizador = setTimeout(() => {
      setAProcurar(true)
      produtosApi.listar({ pesquisa: termo.trim(), limite: 20, pagina: 1 }, { signal: controller.signal })
        .then(resposta => setResultados(resposta.produtos || []))
        .catch(() => {})
        .finally(() => { if (!controller.signal.aborted) setAProcurar(false) })
    }, 300)
    return () => { clearTimeout(temporizador); controller.abort() }
  }, [termo])

  const marcado = id => seleccionados.some(p => p.id === id)
  const alternar = produto => onChange(marcado(produto.id)
    ? seleccionados.filter(p => p.id !== produto.id)
    : [...seleccionados, { id: produto.id, nome: produto.nome }])

  return (
    <div className="space-y-3">
      {seleccionados.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seleccionados.map(p => (
            <Badge key={p.id} variant="secondary" className="gap-1 pr-1">
              {p.nome}
              <button type="button" aria-label={`Remover ${p.nome}`} className="rounded p-0.5 hover:bg-black/10" onClick={() => onChange(seleccionados.filter(s => s.id !== p.id))}>
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input type="search" className="pl-9" placeholder="Pesquisar por nome, código ou marca" value={termo} onChange={e => setTermo(e.target.value)} aria-label="Pesquisar produtos" />
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
        {aProcurar && <p className="p-2 text-sm text-muted-foreground">A procurar…</p>}
        {!aProcurar && !resultados.length && <p className="p-2 text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
        {resultados.map(produto => (
          <label key={produto.id} className="flex cursor-pointer items-center gap-3 rounded p-2 text-sm hover:bg-muted">
            <input type="checkbox" className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" checked={marcado(produto.id)} onChange={() => alternar(produto)} />
            <span className="flex-1">{produto.nome}{produto.marca ? <span className="text-muted-foreground"> · {produto.marca}</span> : null}</span>
            <span className="font-mono text-xs">{formatarMZN(produto.preco)}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function FormularioPromocao({ promocao, modeloBlackFriday = false }) {
  const navigate = useNavigate()
  const categorias = useCategorias()
  const [valores, setValores] = useState(() => valoresIniciais(promocao))
  const [erro, setErro] = useState('')
  const [aGuardar, setAGuardar] = useState(false)
  const definir = campo => valor => setValores(v => ({ ...v, [campo]: valor }))

  const preencherBlackFriday = () => {
    const videovigilancia = categorias.find(c => c.rotulo.toLocaleLowerCase('pt').startsWith('videovigil'))
    setValores(v => ({
      ...v,
      nome: 'Black Friday 2026',
      descricao: 'Descontos de Black Friday em videovigilância e redes',
      tipoDesconto: 'PERCENTAGEM',
      valorDesconto: '25',
      inicioEm: paraLocal(new Date()),
      fimEm: '2026-11-30T23:59',
      activo: true,
      alcance: 'categoria',
      categoriaId: videovigilancia ? String(videovigilancia.id) : v.categoriaId,
    }))
    setErro('')
  }

  const guardar = async e => {
    e.preventDefault()
    setErro('')
    if (valores.alcance === 'categoria' && !valores.categoriaId) return setErro('Escolha a categoria.')
    if (valores.alcance === 'produtos' && !valores.produtos.length) return setErro('Escolha pelo menos um produto.')
    const dados = {
      nome: valores.nome,
      descricao: valores.descricao,
      tipoDesconto: valores.tipoDesconto,
      valorDesconto: Number(valores.valorDesconto),
      inicioEm: new Date(valores.inicioEm).toISOString(),
      fimEm: new Date(valores.fimEm).toISOString(),
      activo: valores.activo,
      ...(valores.alcance === 'categoria'
        ? { categoriaId: Number(valores.categoriaId), produtoIds: [] }
        : { categoriaId: null, produtoIds: valores.produtos.map(p => p.id) }),
    }
    setAGuardar(true)
    try {
      const resposta = promocao
        ? await promocoesAdminApi.actualizar(promocao.id, dados)
        : await promocoesAdminApi.criar(dados)
      navigate(`/admin/promocoes/${promocao ? promocao.id : resposta.id}`, { state: { mensagem: resposta.message } })
    } catch (error) {
      setErro(error.message)
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      {modeloBlackFriday && (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">Preencher com a campanha de <b>Black Friday</b>: -25% em Videovigilância e CCTV até 30/11/2026.</p>
            <Button type="button" variant="outline" onClick={preencherBlackFriday}>Modelo Black Friday</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Dados da promoção</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="promo-nome">Nome</Label>
            <Input id="promo-nome" required maxLength={150} value={valores.nome} onChange={e => definir('nome')(e.target.value)} placeholder="Ex.: Black Friday 2026" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="promo-descricao">Descrição (opcional)</Label>
            <Input id="promo-descricao" maxLength={255} value={valores.descricao} onChange={e => definir('descricao')(e.target.value)} placeholder="Aparece no popup de promoções da loja" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-tipo">Tipo de desconto</Label>
            <Select value={valores.tipoDesconto} onValueChange={definir('tipoDesconto')}>
              <SelectTrigger id="promo-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGEM">Percentagem (%)</SelectItem>
                <SelectItem value="FIXO">Valor fixo em MT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-valor">{valores.tipoDesconto === 'PERCENTAGEM' ? 'Desconto (%)' : 'Desconto (MT)'}</Label>
            <Input id="promo-valor" type="number" required min="0.01" step="0.01" max={valores.tipoDesconto === 'PERCENTAGEM' ? 90 : undefined}
              value={valores.valorDesconto} onChange={e => definir('valorDesconto')(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-inicio">Início</Label>
            <Input id="promo-inicio" type="datetime-local" required value={valores.inicioEm} onChange={e => definir('inicioEm')(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-fim">Fim</Label>
            <Input id="promo-fim" type="datetime-local" required value={valores.fimEm} onChange={e => definir('fimEm')(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" checked={valores.activo} onChange={e => definir('activo')(e.target.checked)} />
            Promoção activa (os descontos aplicam-se durante o período indicado)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Produtos abrangidos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm" role="radiogroup" aria-label="Alcance da promoção">
            <label className="flex items-center gap-2">
              <input type="radio" className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" name="alcance" checked={valores.alcance === 'categoria'} onChange={() => definir('alcance')('categoria')} />
              Categoria inteira
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" name="alcance" checked={valores.alcance === 'produtos'} onChange={() => definir('alcance')('produtos')} />
              Produtos escolhidos
            </label>
          </div>
          {valores.alcance === 'categoria'
            ? (
              <div className="space-y-1.5">
                <Label htmlFor="promo-categoria">Categoria</Label>
                <Select value={valores.categoriaId} onValueChange={definir('categoriaId')}>
                  <SelectTrigger id="promo-categoria"><SelectValue placeholder="Escolha a categoria" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.rotulo}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Inclui todos os produtos activos da categoria e das suas subcategorias.</p>
              </div>
            )
            : <EscolherProdutos seleccionados={valores.produtos} onChange={definir('produtos')} />}
        </CardContent>
      </Card>

      {erro && <FeedbackMessage variante="erro">{erro}</FeedbackMessage>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={aGuardar}>{aGuardar ? 'A guardar…' : promocao ? 'Guardar alterações' : 'Criar promoção'}</Button>
        <Button asChild variant="outline"><Link to={promocao ? `/admin/promocoes/${promocao.id}` : '/admin/promocoes'}>Cancelar</Link></Button>
      </div>
    </form>
  )
}

export function PromotionCreatePage() {
  return (
    <section className="space-y-6">
      <VoltarPromocoes />
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Nova promoção</h1>
        <p className="text-sm text-muted-foreground">Os preços com desconto aparecem logo no catálogo, no popup de promoções e no checkout.</p>
      </div>
      <FormularioPromocao modeloBlackFriday />
    </section>
  )
}

// ==================== Detalhe / edição ====================

function usePromocaoDaRota() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ promocao: null, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    promocoesAdminApi.obter(id, { signal: controller.signal })
      .then(resposta => setEstado({ promocao: resposta.promocao, erro: '' }))
      .catch(error => { if (!controller.signal.aborted) setEstado({ promocao: null, erro: error.message }) })
    return () => controller.abort()
  }, [id, versao])
  const recarregar = useCallback(() => setVersao(v => v + 1), [])
  return { ...estado, recarregar }
}

export function PromotionDetailPage() {
  const { promocao, erro, recarregar } = usePromocaoDaRota()
  const [mensagem, setMensagem] = useState(null)
  const { aProcessar, alternar } = useAlternar(recarregar, setMensagem)

  if (erro) return <section className="space-y-6"><VoltarPromocoes /><ErroCarregamento erro={erro} recarregar={recarregar} /></section>
  if (!promocao) return <LoadingState mensagem="A carregar promoção…" />

  return (
    <section className="space-y-6">
      <VoltarPromocoes />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight">{promocao.nome}</h1>
            <Situacao situacao={promocao.situacao} />
          </div>
          {promocao.descricao && <p className="text-sm text-muted-foreground">{promocao.descricao}</p>}
          <p className="text-sm"><b className="text-lg">{textoDesconto(promocao)}</b> · {periodo(promocao)}</p>
          <p className="text-xs text-muted-foreground">{promocao.categoria ? `Categoria: ${promocao.categoria.nome}` : 'Produtos escolhidos'} · {promocao.totalProdutos} produtos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to={`/admin/promocoes/${promocao.id}/editar`}>Editar</Link></Button>
          <Button variant={promocao.activo ? 'destructive' : 'default'} disabled={aProcessar === promocao.id} onClick={() => alternar(promocao)}>
            {promocao.activo ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </div>

      {mensagem && <FeedbackMessage variante={mensagem.variante} onFechar={() => setMensagem(null)}>{mensagem.texto}</FeedbackMessage>}

      <Card>
        <CardHeader><CardTitle>Produtos com desconto</CardTitle></CardHeader>
        <CardContent>
          {!promocao.produtos.length
            ? <EmptyState Icone={BadgePercent} titulo="Esta promoção não tem produtos." />
            : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Preço promocional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promocao.produtos.map(produto => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <a href={`/produtos/${encodeURIComponent(produto.slug)}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">{produto.nome}</a>
                        {produto.marca && <p className="text-xs text-muted-foreground">{produto.marca}</p>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground line-through">{formatarMZN(produto.preco)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatarMZN(produto.precoPromocional)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </section>
  )
}

export function PromotionEditPage() {
  const { promocao, erro, recarregar } = usePromocaoDaRota()
  if (erro) return <section className="space-y-6"><VoltarPromocoes /><ErroCarregamento erro={erro} recarregar={recarregar} /></section>
  if (!promocao) return <LoadingState mensagem="A carregar promoção…" />
  return (
    <section className="space-y-6">
      <VoltarPromocoes />
      <h1 className="font-heading text-2xl font-bold tracking-tight">Editar promoção</h1>
      <FormularioPromocao key={promocao.id} promocao={promocao} />
    </section>
  )
}
