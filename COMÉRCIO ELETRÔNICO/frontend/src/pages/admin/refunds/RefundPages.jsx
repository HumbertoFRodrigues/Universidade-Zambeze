import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote } from 'lucide-react'
import { atendimentoAdminApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Reembolsos registados (GET /admin/reembolsos). São criados ao processar uma devolução
// recebida; enquanto não houver fornecedor de pagamentos, são simulados.
const ESTADOS = {
  PENDENTE: { rotulo: 'Pendente', classe: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  CONCLUIDO: { rotulo: 'Concluído', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  FALHADO: { rotulo: 'Falhado', classe: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

const dataHora = valor => (valor ? new Date(valor).toLocaleString('pt-PT') : '—')

function Voltar() {
  return (
    <Link to="/admin/reembolsos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Reembolsos
    </Link>
  )
}

function EstadoReembolso({ estado }) {
  return <Badge className={ESTADOS[estado]?.classe}>{ESTADOS[estado]?.rotulo || estado}</Badge>
}

function useReembolsos(pagina) {
  const [versao, setVersao] = useState(0)
  const chave = `${pagina}|${versao}`
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: '' })
  useEffect(() => {
    const controller = new AbortController()
    atendimentoAdminApi.reembolsos({ pagina, limite: 50 }, { signal: controller.signal })
      .then(dados => setEstado({ chave, dados, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, dados: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, pagina])
  const actual = estado.chave === chave
  return { dados: actual ? estado.dados : null, erro: actual ? estado.erro : '', carregando: !actual, recarregar: () => setVersao(v => v + 1) }
}

export function RefundsPage() {
  const [pagina, setPagina] = useState(1)
  const { dados, erro, carregando, recarregar } = useReembolsos(pagina)
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Reembolsos</h1>
        <p className="text-sm text-muted-foreground">Reembolsos processados a partir das devoluções recebidas.</p>
      </div>
      {carregando && <LoadingState mensagem="A carregar reembolsos…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar os reembolsos." accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>{erro}</FeedbackMessage>}
      {dados && !dados.reembolsos.length && <EmptyState Icone={Banknote} titulo="Ainda não há reembolsos." />}
      {dados && dados.reembolsos.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referência</TableHead>
                  <TableHead>Encomenda</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Processado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.reembolsos.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Link to={`/admin/reembolsos/${r.id}`} className="font-mono text-sm text-primary hover:underline">{r.referenciaOperacao}</Link></TableCell>
                    <TableCell className="font-mono text-sm">{r.pagamento.encomenda.codigoEncomenda}</TableCell>
                    <TableCell className="hidden max-w-[16rem] truncate md:table-cell">{r.pagamento.encomenda.nomeContacto}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono">{formatarMZN(r.valor)}</TableCell>
                    <TableCell><EstadoReembolso estado={r.estado} />{r.simulado && <span className="ml-2 text-xs text-muted-foreground">simulado</span>}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">{dataHora(r.processadoEm)}</TableCell>
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

// Não há GET por id: procura-se o reembolso na listagem (50 por página).
export function RefundDetailPage() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ id: null, reembolso: null, erro: '' })

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      for (let pagina = 1; ; pagina += 1) {
        const dados = await atendimentoAdminApi.reembolsos({ pagina, limite: 50 }, { signal: controller.signal })
        const encontrado = dados.reembolsos.find(r => String(r.id) === id)
        if (encontrado || pagina >= dados.totalPaginas) return encontrado || null
      }
    })()
      .then(reembolso => setEstado({ id, reembolso, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ id, reembolso: null, erro: error.message })
      })
    return () => controller.abort()
  }, [id])

  const carregando = estado.id !== id
  const r = estado.reembolso
  return (
    <section className="space-y-6">
      <Voltar />
      <h1 className="font-heading text-2xl font-bold tracking-tight">Reembolso {r?.referenciaOperacao || ''}</h1>
      {carregando && <LoadingState mensagem="A carregar o reembolso…" />}
      {!carregando && estado.erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar o reembolso.">{estado.erro}</FeedbackMessage>}
      {!carregando && !estado.erro && !r && <EmptyState Icone={Banknote} titulo="Reembolso não encontrado." />}
      {!carregando && r && (
        <Card>
          <CardContent className="pt-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Estado</dt><dd><EstadoReembolso estado={r.estado} />{r.simulado && <span className="ml-2 text-xs text-muted-foreground">simulado</span>}</dd></div>
              <div><dt className="text-muted-foreground">Valor</dt><dd className="font-mono">{formatarMZN(r.valor)}</dd></div>
              <div><dt className="text-muted-foreground">Encomenda</dt><dd><Link className="font-mono text-primary hover:underline" to={`/admin/encomendas/${encodeURIComponent(r.pagamento.encomenda.codigoEncomenda)}`}>{r.pagamento.encomenda.codigoEncomenda}</Link></dd></div>
              <div><dt className="text-muted-foreground">Cliente</dt><dd>{r.pagamento.encomenda.nomeContacto}</dd></div>
              <div><dt className="text-muted-foreground">Pagamento</dt><dd className="font-mono">{r.pagamento.referenciaOperacao}</dd></div>
              {r.devolucao && <div><dt className="text-muted-foreground">Devolução</dt><dd><Link className="font-mono text-primary hover:underline" to={`/admin/devolucoes/${r.devolucao.id}`}>{r.devolucao.codigoDevolucao}</Link></dd></div>}
              <div><dt className="text-muted-foreground">Processado em</dt><dd>{dataHora(r.processadoEm)}{r.responsavel?.nome ? ` por ${r.responsavel.nome}` : ''}</dd></div>
            </dl>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

// Os reembolsos só nascem de uma devolução com o produto recebido (regra do backend).
export function RefundCreatePage() {
  return (
    <section className="space-y-6">
      <Voltar />
      <h1 className="font-heading text-2xl font-bold tracking-tight">Novo reembolso</h1>
      <FeedbackMessage variante="info" titulo="Os reembolsos são processados nas devoluções">
        Abra uma devolução com o produto recebido e use “Processar reembolso”. O valor é calculado pelo servidor a partir dos produtos devolvidos.
        <div className="mt-3"><Button asChild size="sm" variant="outline"><Link to="/admin/devolucoes">Ver devoluções</Link></Button></div>
      </FeedbackMessage>
    </section>
  )
}
