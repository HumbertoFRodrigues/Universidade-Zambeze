import { useCallback, useEffect, useState } from 'react'
import { Landmark } from 'lucide-react'
import { transferenciasAdminApi } from '../../services/api.js'
import { dataLegivel, formatarMZN } from '../../lib/format.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Transferências bancárias com comprovativo enviado pelo cliente, à espera de validação.
export default function AdminTransferencias() {
  const [estado, setEstado] = useState({ lista: null, erro: '' })
  const [versao, setVersao] = useState(0)
  const [mensagem, setMensagem] = useState(null)
  const [aProcessar, setAProcessar] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    transferenciasAdminApi.listar({ signal: controller.signal })
      .then(resposta => setEstado({ lista: resposta.transferencias || [], erro: '' }))
      .catch(error => { if (!controller.signal.aborted) setEstado({ lista: null, erro: error.message }) })
    return () => controller.abort()
  }, [versao])
  const recarregar = useCallback(() => setVersao(valor => valor + 1), [])

  const executar = async (id, accao) => {
    setAProcessar(id)
    setMensagem(null)
    try {
      const resposta = await accao()
      if (resposta?.message) setMensagem({ tipo: 'sucesso', texto: resposta.message })
      recarregar()
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message })
    } finally {
      setAProcessar(null)
    }
  }

  const rejeitar = id => {
    const motivo = window.prompt('Motivo da rejeição (o cliente poderá enviar outro comprovativo):')
    if (motivo?.trim()) executar(id, () => transferenciasAdminApi.rejeitar(id, motivo.trim()))
  }

  return <div className="space-y-6">
    <div className="flex items-center gap-3">
      <Landmark className="size-6" aria-hidden="true" />
      <div>
        <h1 className="text-2xl font-semibold">Transferências em análise</h1>
        <p className="text-sm text-muted-foreground">Confirme o pagamento depois de verificar o comprovativo e a entrada do valor na conta.</p>
      </div>
    </div>
    {mensagem && <FeedbackMessage variante={mensagem.tipo} onFechar={() => setMensagem(null)}>{mensagem.texto}</FeedbackMessage>}
    <Card>
      <CardHeader><CardTitle>Comprovativos recebidos</CardTitle></CardHeader>
      <CardContent>
        {!estado.lista && !estado.erro && <LoadingState mensagem="A carregar transferências…" />}
        {estado.erro && <FeedbackMessage variante="erro">{estado.erro}</FeedbackMessage>}
        {estado.lista?.length === 0 && <EmptyState titulo="Sem transferências por validar" descricao="Os comprovativos enviados pelos clientes aparecem aqui." />}
        {estado.lista?.length > 0 && <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Encomenda</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estado.lista.map(item => <TableRow key={item.id}>
              <TableCell><b>{item.encomenda.codigoEncomenda}</b><div className="text-xs text-muted-foreground">{dataLegivel(item.encomenda.criadoEm)}</div></TableCell>
              <TableCell>{item.encomenda.nomeContacto}<div className="text-xs text-muted-foreground">{item.encomenda.emailContacto}</div></TableCell>
              <TableCell>{item.referenciaOperacao}</TableCell>
              <TableCell className="text-right">{formatarMZN(item.valor)}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => transferenciasAdminApi.comprovativo(item.id).catch(error => setMensagem({ tipo: 'erro', texto: error.message }))}>Ver comprovativo</Button>
                  <Button size="sm" disabled={aProcessar === item.id} onClick={() => executar(item.id, () => transferenciasAdminApi.confirmar(item.id))}>Confirmar</Button>
                  <Button variant="destructive" size="sm" disabled={aProcessar === item.id} onClick={() => rejeitar(item.id)}>Rejeitar</Button>
                </div>
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>}
      </CardContent>
    </Card>
  </div>
}
