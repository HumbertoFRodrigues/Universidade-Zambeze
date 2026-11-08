import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { consultasAdminApi } from '../../services/api.js'
import { dataHoraLegivel } from '../../lib/produtosAdmin.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingState from '@/components/common/LoadingState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const ROTULOS_ACCAO = {
  CRIAR_PRODUTO: 'Produto criado',
  ACTUALIZAR_PRODUTO: 'Dados do produto actualizados',
  DESACTIVAR_PRODUTO: 'Produto desactivado',
  ALTERAR_PRECO: 'Preço alterado',
  AJUSTAR_STOCK: 'Stock ajustado',
  PROMOCAO_CRIADA: 'Promoção criada',
  PROMOCAO_ALTERADA: 'Promoção alterada',
}

const rotuloAccao = accao => ROTULOS_ACCAO[accao] || accao.replaceAll('_', ' ').toLowerCase().replace(/^./, letra => letra.toUpperCase())

function resumoDetalhes(detalhes) {
  if (!detalhes || typeof detalhes !== 'object') return ''
  return Object.entries(detalhes)
    .filter(([, valor]) => valor !== null && valor !== undefined && typeof valor !== 'object')
    .slice(0, 4)
    .map(([chave, valor]) => `${chave}: ${valor}`)
    .join(' · ')
}

// Histórico de alterações registado na auditoria para uma entidade (por exemplo, um produto).
export default function HistoricoAuditoria({ tipoEntidade, idEntidade, titulo = 'Histórico de alterações', actualizacao }) {
  const [estado, setEstado] = useState({ registos: null, erro: '' })

  useEffect(() => {
    if (!idEntidade) return undefined
    const controller = new AbortController()
    consultasAdminApi.auditoria({ tipoEntidade, idEntidade: String(idEntidade), limite: 10 }, { signal: controller.signal })
      .then(resposta => setEstado({ registos: resposta.registos || [], erro: '' }))
      .catch(error => { if (!controller.signal.aborted) setEstado({ registos: null, erro: error.message }) })
    return () => controller.abort()
  }, [tipoEntidade, idEntidade, actualizacao])

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" aria-hidden="true" />{titulo}</CardTitle></CardHeader>
      <CardContent>
        {!estado.registos && !estado.erro && <LoadingState mensagem="A carregar histórico…" />}
        {estado.erro && <FeedbackMessage variante="erro">{estado.erro}</FeedbackMessage>}
        {estado.registos?.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há alterações registadas.</p>}
        {estado.registos?.length > 0 && (
          <ul className="divide-y text-sm">
            {estado.registos.map(registo => (
              <li key={registo.id} className="py-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{rotuloAccao(registo.accao)}</span>
                  <span className="text-xs text-muted-foreground">{dataHoraLegivel(registo.criadoEm)}{registo.autor ? ` · ${registo.autor}` : ''}</span>
                </div>
                {resumoDetalhes(registo.detalhes) && <p className="mt-0.5 break-words text-xs text-muted-foreground">{resumoDetalhes(registo.detalhes)}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
