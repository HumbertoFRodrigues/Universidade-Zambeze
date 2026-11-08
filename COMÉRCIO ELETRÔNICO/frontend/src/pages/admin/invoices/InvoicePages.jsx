import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import { facturasApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Facturas emitidas (GET /admin/facturas), da mais recente para a mais antiga.
export function InvoicesPage() {
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const chave = `${pagina}|${versao}`
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: '' })
  const [erroPdf, setErroPdf] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    facturasApi.listarAdmin({ pagina, limite: 20 }, { signal: controller.signal })
      .then(dados => setEstado({ chave, dados, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, dados: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, pagina])

  const actual = estado.chave === chave
  const dados = actual ? estado.dados : null
  const erro = actual ? estado.erro : ''

  const pdf = async factura => {
    setErroPdf('')
    try {
      await facturasApi.pdfAdmin(factura.id, factura.numero)
    } catch (error) {
      setErroPdf(error.message)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Facturas</h1>
        <p className="text-sm text-muted-foreground">Emitidas automaticamente quando o pagamento de uma encomenda é confirmado.</p>
      </div>
      <FeedbackMessage variante="aviso" titulo="Modelo por validar">
        O modelo de factura (dados obrigatórios, IVA de 16% incluído nos preços e numeração) ainda tem de ser validado por um contabilista antes de uso real.
      </FeedbackMessage>
      {erroPdf && <FeedbackMessage variante="erro">{erroPdf}</FeedbackMessage>}
      {!actual && <LoadingState mensagem="A carregar facturas…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar as facturas." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>{erro}</FeedbackMessage>}
      {dados && !dados.facturas.length && <EmptyState Icone={Receipt} titulo="Ainda não há facturas emitidas." />}
      {dados && dados.facturas.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Encomenda</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">IVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead><span className="sr-only">PDF</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.facturas.map(factura => (
                  <TableRow key={factura.id}>
                    <TableCell className="whitespace-nowrap font-mono text-sm font-semibold">{factura.numero}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground sm:table-cell">{new Date(factura.emitidaEm).toLocaleDateString('pt-PT')}</TableCell>
                    <TableCell className="max-w-[16rem]">
                      <span className="block truncate">{factura.clienteNome}</span>
                      {factura.clienteNuit && <span className="font-mono text-xs text-muted-foreground">NUIT {factura.clienteNuit}</span>}
                    </TableCell>
                    <TableCell className="hidden font-mono text-sm md:table-cell">
                      <Link className="text-primary hover:underline" to={`/admin/encomendas/${encodeURIComponent(factura.encomenda.codigoEncomenda)}`}>{factura.encomenda.codigoEncomenda}</Link>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-right font-mono lg:table-cell">{formatarMZN(factura.valorIva)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono">{formatarMZN(factura.total)}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => pdf(factura)}>PDF</Button></TableCell>
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
