import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { avaliacoesApi } from '../../../services/api.js'
import { dataLegivel } from '../../../lib/format.js'
import StarRating from '@/components/products/StarRating'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import EmptyState from '@/components/common/EmptyState'
import LoadingState from '@/components/common/LoadingState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const LIMITE = 10
const TODAS = 'todas'

function VoltarAvaliacoes() {
  return (
    <Link to="/admin/avaliacoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Avaliações
    </Link>
  )
}

// As avaliações não têm identificador exposto pela API, por isso não é possível abrir
// uma avaliação isolada. O :id desta rota é o slug do produto e a página mostra as
// avaliações desse produto (GET /produtos/:slug/avaliacoes, apenas produtos activos).
export function ReviewDetailPage() {
  const { id: slug } = useParams()
  const [produto, setProduto] = useState({ slug: null, dados: null, erro: '' })
  const [nota, setNota] = useState('')
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const [lista, setLista] = useState({ chave: null, avaliacoes: [], total: 0, totalPaginas: 0, erro: '' })
  const chave = JSON.stringify({ slug, nota, pagina, versao })

  useEffect(() => {
    const controller = new AbortController()
    avaliacoesApi.produto(slug, { signal: controller.signal })
      .then(resposta => setProduto({ slug, dados: resposta.produto, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setProduto({ slug, dados: null, erro: error.message })
      })
    return () => controller.abort()
  }, [slug, versao])

  useEffect(() => {
    const controller = new AbortController()
    avaliacoesApi.doProduto(slug, { nota, pagina, limite: LIMITE }, { signal: controller.signal })
      .then(resposta => setLista({ chave, avaliacoes: resposta.avaliacoes || [], total: resposta.total || 0, totalPaginas: resposta.totalPaginas || 0, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setLista({ chave, avaliacoes: [], total: 0, totalPaginas: 0, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, slug, nota, pagina])

  const carregandoProduto = produto.slug !== slug
  const carregandoLista = lista.chave !== chave

  if (carregandoProduto) return <section className="space-y-4"><VoltarAvaliacoes /><LoadingState mensagem="A carregar avaliações…" /></section>
  if (!produto.dados) {
    return (
      <section className="space-y-4">
        <VoltarAvaliacoes />
        <EmptyState
          Icone={Star}
          titulo="Produto não encontrado"
          descricao={`${produto.erro || 'Produto não encontrado.'} As avaliações só podem ser consultadas para produtos activos.`}
          accao={<div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>
            <Button asChild variant="outline"><Link to="/admin/avaliacoes">Voltar às avaliações</Link></Button>
          </div>}
        />
      </section>
    )
  }

  const p = produto.dados

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <VoltarAvaliacoes />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Avaliações do produto</p>
            <h1 className="break-words font-heading text-2xl font-bold tracking-tight">{p.nome}</h1>
            <Link to={`/admin/produtos/${encodeURIComponent(p.id)}`} className="text-sm text-primary hover:underline">Ver produto na administração</Link>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2"><StarRating valor={p.nota} /><span className="font-mono text-lg font-bold">{Number(p.nota || 0).toFixed(1)}</span></div>
            <p className="text-sm text-muted-foreground">{p.avaliacoes} {p.avaliacoes === 1 ? 'avaliação' : 'avaliações'}</p>
          </div>
        </div>
      </div>

      <FeedbackMessage variante="info">
        Avaliações publicadas deste produto. Para aprovar ou rejeitar avaliações novas, use a página Avaliações (separador Pendentes).
      </FeedbackMessage>

      <div className="space-y-1.5 sm:max-w-xs">
        <Label htmlFor="avaliacoes-nota">Classificação</Label>
        <Select value={nota || TODAS} onValueChange={v => { setNota(v === TODAS ? '' : v); setPagina(1) }}>
          <SelectTrigger id="avaliacoes-nota"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas</SelectItem>
            {[5, 4, 3, 2, 1].map(valor => <SelectItem key={valor} value={String(valor)}>{valor} {valor === 1 ? 'estrela' : 'estrelas'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {carregandoLista && lista.chave === null && <LoadingState mensagem="A carregar avaliações…" />}
      {!carregandoLista && lista.erro && (
        <FeedbackMessage variante="erro" titulo="Não foi possível carregar as avaliações." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>
          {lista.erro}
        </FeedbackMessage>
      )}
      {!carregandoLista && !lista.erro && !lista.avaliacoes.length && (
        <EmptyState Icone={Star} titulo={nota ? `Nenhuma avaliação com ${nota} ${nota === '1' ? 'estrela' : 'estrelas'}.` : 'Este produto ainda não tem avaliações.'} />
      )}

      {lista.avaliacoes.length > 0 && (
        <div className={`space-y-3 ${carregandoLista ? 'opacity-60' : ''}`} aria-busy={carregandoLista}>
          <p className="text-sm text-muted-foreground">{lista.total} {lista.total === 1 ? 'avaliação' : 'avaliações'}{nota ? ' com esta classificação' : ''}.</p>
          {lista.avaliacoes.map((avaliacao, indice) => (
            <Card key={`${pagina}-${indice}`}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StarRating valor={avaliacao.nota} />
                  <span className="text-xs text-muted-foreground">{dataLegivel(avaliacao.data)}</span>
                </div>
                {avaliacao.texto
                  ? <p className="whitespace-pre-line break-words text-sm">{avaliacao.texto}</p>
                  : <p className="text-sm italic text-muted-foreground">Sem comentário.</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{avaliacao.nome}</span>
                  {avaliacao.compraVerificada && <Badge variant="secondary">Compra verificada</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {lista.totalPaginas > 1 && (
        <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Página {pagina} de {lista.totalPaginas}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagina <= 1 || carregandoLista} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={pagina >= lista.totalPaginas || carregandoLista} onClick={() => setPagina(pagina + 1)}>Seguinte</Button>
          </div>
        </nav>
      )}
    </section>
  )
}
