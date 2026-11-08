import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { avaliacoesApi } from '../../services/api.js'
import { dataLegivel } from '../../lib/format.js'
import StarRating from '@/components/products/StarRating'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import EmptyState from '@/components/common/EmptyState'
import LoadingState from '@/components/common/LoadingState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Moderação das avaliações de produtos: novas avaliações chegam PENDENTE e só são publicadas depois de aprovadas.
const SEPARADORES = [
  ['PENDENTE', 'Pendentes'],
  ['APROVADA', 'Aprovadas'],
  ['REJEITADA', 'Rejeitadas'],
]

export default function AdminAvaliacoes() {
  const [separador, setSeparador] = useState('PENDENTE')
  const [estado, setEstado] = useState({ dados: null, erro: '' })
  const [versao, setVersao] = useState(0)
  const [mensagem, setMensagem] = useState(null)
  const [aProcessar, setAProcessar] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    avaliacoesApi.listarModeracao(separador, { signal: controller.signal })
      .then(dados => setEstado({ dados, erro: '' }))
      .catch(error => { if (!controller.signal.aborted) setEstado({ dados: null, erro: error.message }) })
    return () => controller.abort()
  }, [separador, versao])
  const recarregar = useCallback(() => setVersao(v => v + 1), [])

  const decidir = async (id, decisao) => {
    let motivo
    if (decisao === 'REJEITADA') {
      motivo = window.prompt('Motivo da rejeição (ex.: linguagem imprópria, não diz respeito ao produto):')
      if (!motivo?.trim()) return
    }
    setAProcessar(id)
    setMensagem(null)
    try {
      const resposta = await avaliacoesApi.moderar(id, decisao, motivo?.trim())
      setMensagem({ variante: 'sucesso', texto: resposta.message })
      recarregar()
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
    } finally {
      setAProcessar(null)
    }
  }

  const { dados, erro } = estado
  const contagens = dados?.contagens || {}

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Avaliações</h1>
        <p className="text-sm text-muted-foreground">Aprove ou rejeite as avaliações dos clientes. Só as aprovadas aparecem na loja e contam para a média do produto.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Estado das avaliações">
        {SEPARADORES.map(([valor, rotulo]) => (
          <Button key={valor} role="tab" aria-selected={separador === valor} variant={separador === valor ? 'default' : 'outline'} size="sm" onClick={() => { setSeparador(valor); setMensagem(null) }}>
            {rotulo}{dados ? ` (${contagens[valor] ?? 0})` : ''}
          </Button>
        ))}
      </div>

      {mensagem && <FeedbackMessage variante={mensagem.variante} onFechar={() => setMensagem(null)}>{mensagem.texto}</FeedbackMessage>}
      {!dados && !erro && <LoadingState mensagem="A carregar avaliações…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar as avaliações." accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>{erro}</FeedbackMessage>}
      {dados && !dados.avaliacoes.length && (
        <EmptyState Icone={Star} titulo={separador === 'PENDENTE' ? 'Não há avaliações por moderar.' : 'Sem avaliações neste estado.'} />
      )}

      <div className="space-y-3">
        {dados?.avaliacoes.map(avaliacao => (
          <Card key={avaliacao.id}>
            <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating valor={avaliacao.classificacao} />
                  <span className="text-sm font-semibold">{avaliacao.classificacao}/5</span>
                  <Badge variant="outline">{avaliacao.estado === 'PENDENTE' ? 'Pendente' : avaliacao.estado === 'APROVADA' ? 'Aprovada' : 'Rejeitada'}</Badge>
                  <Badge variant={avaliacao.compraVerificada ? 'default' : 'secondary'}>{avaliacao.compraVerificada ? 'Compra verificada' : 'Sem compra'}</Badge>
                </div>
                <p className="font-medium">
                  {avaliacao.slug ? <Link to={`/produtos/${encodeURIComponent(avaliacao.slug)}`} target="_blank" className="hover:underline">{avaliacao.produto}</Link> : avaliacao.produto}
                </p>
                {avaliacao.comentario ? <p className="text-sm">“{avaliacao.comentario}”</p> : <p className="text-sm italic text-muted-foreground">Sem comentário.</p>}
                {avaliacao.imagens?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {avaliacao.imagens.map(url => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="block size-20 overflow-hidden rounded-md border" aria-label="Abrir fotografia em tamanho real">
                        <img src={url} alt="Fotografia enviada pelo cliente" className="size-full object-cover" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {avaliacao.cliente} · {avaliacao.email}{avaliacao.encomenda ? ` · encomenda ${avaliacao.encomenda}` : ''} · {dataLegivel(avaliacao.criadoEm)}
                </p>
                {avaliacao.motivoRejeicao && <p className="text-xs text-destructive">Motivo da rejeição: {avaliacao.motivoRejeicao}</p>}
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {avaliacao.estado !== 'APROVADA' && <Button size="sm" disabled={aProcessar === avaliacao.id} onClick={() => decidir(avaliacao.id, 'APROVADA')}>Aprovar</Button>}
                {avaliacao.estado !== 'REJEITADA' && <Button size="sm" variant="destructive" disabled={aProcessar === avaliacao.id} onClick={() => decidir(avaliacao.id, 'REJEITADA')}>Rejeitar</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
