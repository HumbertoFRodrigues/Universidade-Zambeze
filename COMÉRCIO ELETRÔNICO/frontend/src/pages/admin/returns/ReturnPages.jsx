import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { devolucoesApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { dataHoraLegivel } from '../../../lib/produtosAdmin.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

export const ESTADOS_DEVOLUCAO = {
  SOLICITADA: { rotulo: 'Solicitada', classe: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  EM_ANALISE: { rotulo: 'Em análise', classe: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  APROVADA: { rotulo: 'Aprovada', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  REJEITADA: { rotulo: 'Rejeitada', classe: 'bg-red-100 text-red-700 hover:bg-red-100' },
  PRODUTO_RECEBIDO: { rotulo: 'Produto recebido', classe: 'bg-violet-100 text-violet-700 hover:bg-violet-100' },
  REEMBOLSADA: { rotulo: 'Reembolsada', classe: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
}

const MOTIVOS = {
  ARREPENDIMENTO: 'Arrependimento',
  DIFERENTE_DA_DESCRICAO: 'Diferente da descrição',
  DEFEITUOSO: 'Defeituoso',
  OUTRO: 'Outro',
}

const MAX_JUSTIFICACAO = 500

function EstadoDevolucao({ estado }) {
  const config = ESTADOS_DEVOLUCAO[estado]
  return <Badge className={config?.classe}>{config?.rotulo || estado}</Badge>
}

// GET /admin/devolucoes devolve todas as devoluções (não há GET por id nem paginação).
function useDevolucoes() {
  const [estado, setEstado] = useState({ devolucoes: null, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    devolucoesApi.listarAdmin({ signal: controller.signal })
      .then(devolucoes => setEstado({ devolucoes: devolucoes || [], erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ devolucoes: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])
  return { ...estado, recarregar: () => setVersao(v => v + 1) }
}

function Voltar() {
  return (
    <Link to="/admin/devolucoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Devoluções
    </Link>
  )
}

function ErroCarregamento({ erro, recarregar }) {
  return (
    <FeedbackMessage variante="erro" titulo="Não foi possível carregar as devoluções." accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>
      {erro}
    </FeedbackMessage>
  )
}

const valorItens = devolucao => devolucao.itens.reduce(
  (soma, item) => soma + Number(item.itemEncomenda?.precoUnitario || 0) * item.quantidade, 0,
)

export function ReturnsListPage() {
  const { devolucoes, erro, recarregar } = useDevolucoes()
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Devoluções</h1>
        <p className="text-sm text-muted-foreground">Pedidos de devolução feitos pelos clientes.</p>
      </div>
      {!devolucoes && !erro && <LoadingState mensagem="A carregar devoluções…" />}
      {erro && <ErroCarregamento erro={erro} recarregar={recarregar} />}
      {devolucoes && !devolucoes.length && <EmptyState Icone={RotateCcw} titulo="Não existem pedidos de devolução." />}
      {devolucoes && devolucoes.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Devolução</TableHead>
                  <TableHead>Encomenda</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Pedida em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devolucoes.map(devolucao => (
                  <TableRow key={devolucao.id}>
                    <TableCell>
                      <Link to={`/admin/devolucoes/${devolucao.id}`} className="font-mono text-sm font-semibold text-primary hover:underline">
                        {devolucao.codigoDevolucao}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{devolucao.encomenda?.codigoEncomenda}</TableCell>
                    <TableCell className="hidden max-w-[16rem] truncate md:table-cell">{devolucao.encomenda?.nomeContacto}</TableCell>
                    <TableCell className="hidden lg:table-cell">{MOTIVOS[devolucao.tipoMotivo] || devolucao.tipoMotivo}</TableCell>
                    <TableCell><EstadoDevolucao estado={devolucao.estado} /></TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground sm:table-cell">{dataHoraLegivel(devolucao.criadoEm)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

// Detalhe e acções permitidas pelo backend:
// SOLICITADA/EM_ANALISE → decisão; APROVADA → recepção; PRODUTO_RECEBIDO → reembolso (simulado).
export function ReturnDetailPage() {
  const { id } = useParams()
  const { devolucoes, erro, recarregar } = useDevolucoes()
  const devolucao = devolucoes?.find(item => String(item.id) === id)

  return (
    <section className="space-y-6">
      <Voltar />
      <h1 className="font-heading text-2xl font-bold tracking-tight">Devolução {devolucao?.codigoDevolucao || ''}</h1>
      {!devolucoes && !erro && <LoadingState mensagem="A carregar a devolução…" />}
      {erro && <ErroCarregamento erro={erro} recarregar={recarregar} />}
      {devolucoes && !devolucao && <EmptyState Icone={RotateCcw} titulo="Devolução não encontrada." />}
      {devolucao && <>
        <Card>
          <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Pedido</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Estado</dt><dd><EstadoDevolucao estado={devolucao.estado} /></dd></div>
              <div><dt className="text-muted-foreground">Encomenda</dt><dd className="font-mono">{devolucao.encomenda?.codigoEncomenda}</dd></div>
              <div><dt className="text-muted-foreground">Cliente</dt><dd>{devolucao.encomenda?.nomeContacto}</dd></div>
              <div><dt className="text-muted-foreground">Motivo</dt><dd>{MOTIVOS[devolucao.tipoMotivo] || devolucao.tipoMotivo}</dd></div>
              <div><dt className="text-muted-foreground">Pedida em</dt><dd>{dataHoraLegivel(devolucao.criadoEm)}</dd></div>
              {devolucao.decididoEm && <div><dt className="text-muted-foreground">Decidida em</dt><dd>{dataHoraLegivel(devolucao.decididoEm)}{devolucao.responsavel?.nome ? ` por ${devolucao.responsavel.nome}` : ''}</dd></div>}
              {devolucao.recebidoEm && <div><dt className="text-muted-foreground">Produto recebido em</dt><dd>{dataHoraLegivel(devolucao.recebidoEm)}</dd></div>}
              {devolucao.descricaoMotivo && <div className="sm:col-span-2"><dt className="text-muted-foreground">Descrição do cliente</dt><dd className="whitespace-pre-line">{devolucao.descricaoMotivo}</dd></div>}
              {devolucao.justificacaoDecisao && <div className="sm:col-span-2"><dt className="text-muted-foreground">Justificação da decisão</dt><dd className="whitespace-pre-line">{devolucao.justificacaoDecisao}</dd></div>}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Produtos</CardTitle></CardHeader>
          <CardContent className="divide-y p-0">
            {devolucao.itens.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span>{item.quantidade} × {item.itemEncomenda?.nomeProduto}</span>
                <span className="text-muted-foreground">{formatarMZN(Number(item.itemEncomenda?.precoUnitario || 0) * item.quantidade)}</span>
              </div>
            ))}
            <p className="px-4 py-2.5 text-xs text-muted-foreground">
              Valor dos produtos a preço de tabela: {formatarMZN(valorItens(devolucao))}. O reembolso é calculado pelo servidor, descontando promoções.
            </p>
          </CardContent>
        </Card>
        <AccoesDevolucao devolucao={devolucao} aoConcluir={recarregar} />
      </>}
    </section>
  )
}

function AccoesDevolucao({ devolucao, aoConcluir }) {
  const [justificacao, setJustificacao] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  const executar = async operacao => {
    setAEnviar(true)
    setMensagem(null)
    try {
      const resposta = await operacao()
      setMensagem({ variante: 'sucesso', texto: resposta.message })
      setJustificacao('')
      aoConcluir()
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
    } finally {
      setAEnviar(false)
    }
  }

  const decidir = decisao => executar(() => devolucoesApi.decidir(devolucao.id, {
    decisao, justificacaoDecisao: justificacao.trim() || undefined,
  }))

  const { estado } = devolucao
  const podeDecidir = estado === 'SOLICITADA' || estado === 'EM_ANALISE'
  return (
    <Card>
      <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Acções</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {mensagem && <FeedbackMessage variante={mensagem.variante}>{mensagem.texto}</FeedbackMessage>}
        {podeDecidir && <>
          <div className="space-y-2">
            <Label htmlFor="justificacao">Justificação (obrigatória para rejeitar)</Label>
            <Textarea id="justificacao" maxLength={MAX_JUSTIFICACAO} value={justificacao} onChange={e => setJustificacao(e.target.value)} />
            <p className="text-xs text-muted-foreground">{justificacao.length}/{MAX_JUSTIFICACAO}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={aEnviar} onClick={() => decidir('APROVADA')}>Aprovar</Button>
            <Button variant="outline" disabled={aEnviar || !justificacao.trim()} onClick={() => decidir('REJEITADA')}>Rejeitar</Button>
          </div>
        </>}
        {estado === 'APROVADA' && <>
          <p className="text-sm text-muted-foreground">Confirme quando os produtos chegarem à loja. O servidor marca todos os itens como revendáveis.</p>
          <Button disabled={aEnviar} onClick={() => executar(() => devolucoesApi.registarRececao(devolucao.id))}>Registar recepção do produto</Button>
        </>}
        {estado === 'PRODUTO_RECEBIDO' && <>
          <p className="text-sm text-muted-foreground">
            Reembolso simulado: o servidor regista o reembolso, marca o pagamento como reembolsado, cancela a encomenda e repõe o stock. Não movimenta dinheiro.
          </p>
          <Button disabled={aEnviar} onClick={() => executar(() => devolucoesApi.reembolsar(devolucao.id))}>Processar reembolso</Button>
        </>}
        {(estado === 'REJEITADA' || estado === 'REEMBOLSADA') && <p className="text-sm text-muted-foreground">Este pedido está concluído; não há mais acções.</p>}
      </CardContent>
    </Card>
  )
}

// As rotas de decisão e recepção mostram o mesmo detalhe, onde estão as acções.
export const ReturnDecisionPage = ReturnDetailPage
export const ReturnReceiptPage = ReturnDetailPage
