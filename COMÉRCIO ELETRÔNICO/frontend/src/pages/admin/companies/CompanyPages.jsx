import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { empresasAdminApi } from '../../../services/api.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Contas de empresa (B2B): o administrador da loja aprova ou suspende.
// Endpoints: GET /admin/empresas, GET /admin/empresas/:id, PATCH /admin/empresas/:id/estado.
const ESTADOS = {
  PENDENTE: { rotulo: 'Pendente', classe: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  APROVADA: { rotulo: 'Aprovada', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  SUSPENSA: { rotulo: 'Suspensa', classe: 'bg-red-100 text-red-700 hover:bg-red-100' },
}
const TIPOS = { EMPRESA: 'Empresa', REVENDEDOR: 'Revendedor' }
const TODOS = 'todos'
const MAX_MOTIVO = 500

function EstadoEmpresa({ estado }) {
  return <Badge className={ESTADOS[estado]?.classe}>{ESTADOS[estado]?.rotulo || estado}</Badge>
}

const dataHora = valor => (valor ? new Date(valor).toLocaleString('pt-PT') : '—')

export function CompaniesPage() {
  const [filtro, setFiltro] = useState('PENDENTE')
  const [pesquisa, setPesquisa] = useState('')
  const [termo, setTermo] = useState('')
  const [pagina, setPagina] = useState(1)
  const [versao, setVersao] = useState(0)
  const chave = `${filtro}|${termo}|${pagina}|${versao}`
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: '' })

  useEffect(() => {
    const controller = new AbortController()
    empresasAdminApi.listar({ estado: filtro === TODOS ? undefined : filtro, pesquisa: termo || undefined, pagina, limite: 20 }, { signal: controller.signal })
      .then(dados => setEstado({ chave, dados, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, dados: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, filtro, termo, pagina])

  const actual = estado.chave === chave
  const dados = actual ? estado.dados : null
  const erro = actual ? estado.erro : ''

  const pesquisar = evento => {
    evento.preventDefault()
    setTermo(pesquisa.trim())
    setPagina(1)
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Empresas</h1>
        <p className="text-sm text-muted-foreground">Contas de empresa e revendedores. Só as aprovadas podem pedir cotações.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Select value={filtro} onValueChange={valor => { setFiltro(valor); setPagina(1) }}>
          <SelectTrigger className="w-48" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os estados</SelectItem>
            {Object.entries(ESTADOS).map(([valor, { rotulo }]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
          </SelectContent>
        </Select>
        <form onSubmit={pesquisar} className="flex flex-1 flex-wrap gap-2">
          <Input className="min-w-0 flex-1 sm:max-w-sm" maxLength={100} placeholder="Nome, NUIT ou email" value={pesquisa} onChange={e => setPesquisa(e.target.value)} aria-label="Pesquisar empresas" />
          <Button type="submit" variant="outline">Pesquisar</Button>
        </form>
      </div>
      {!actual && <LoadingState mensagem="A carregar empresas…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar as empresas." accao={<Button variant="outline" size="sm" onClick={() => setVersao(v => v + 1)}>Tentar novamente</Button>}>{erro}</FeedbackMessage>}
      {dados && !dados.empresas.length && <EmptyState Icone={Building2} titulo="Não há empresas com estes filtros." />}
      {dados && dados.empresas.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>NUIT</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Registo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.empresas.map(empresa => (
                  <TableRow key={empresa.id}>
                    <TableCell className="max-w-[18rem]"><Link to={`/admin/empresas/${empresa.id}`} className="block truncate font-medium text-primary hover:underline" title={empresa.nome}>{empresa.nome}</Link></TableCell>
                    <TableCell className="font-mono text-sm">{empresa.nuit}</TableCell>
                    <TableCell className="hidden md:table-cell">{TIPOS[empresa.tipoCliente]}</TableCell>
                    <TableCell className="hidden lg:table-cell">{empresa.cidade}</TableCell>
                    <TableCell><EstadoEmpresa estado={empresa.estado} /></TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground sm:table-cell">{dataHora(empresa.criadoEm)}</TableCell>
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

export function CompanyDetailPage() {
  const { id } = useParams()
  const [versao, setVersao] = useState(0)
  const [estado, setEstado] = useState({ chave: null, empresa: null, erro: '' })
  const chave = `${id}|${versao}`

  useEffect(() => {
    const controller = new AbortController()
    empresasAdminApi.obter(id, { signal: controller.signal })
      .then(resposta => setEstado({ chave, empresa: resposta.empresa, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, empresa: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chave, id])

  const carregando = estado.chave !== chave && !estado.empresa
  const { empresa, erro } = estado
  return (
    <section className="space-y-6">
      <Link to="/admin/empresas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Empresas
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">{empresa?.nome || 'Empresa'}</h1>
      {carregando && <LoadingState mensagem="A carregar a empresa…" />}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar a empresa.">{erro}</FeedbackMessage>}
      {empresa && <>
        <Card>
          <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Dados da empresa</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Estado</dt><dd><EstadoEmpresa estado={empresa.estado} /></dd></div>
              <div><dt className="text-muted-foreground">Tipo de cliente</dt><dd>{TIPOS[empresa.tipoCliente]}</dd></div>
              <div><dt className="text-muted-foreground">NUIT</dt><dd className="font-mono">{empresa.nuit}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{empresa.email}</dd></div>
              <div><dt className="text-muted-foreground">Telefone</dt><dd>{empresa.telefone}</dd></div>
              <div><dt className="text-muted-foreground">Registada em</dt><dd>{dataHora(empresa.criadoEm)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Endereço de facturação</dt><dd>{[empresa.rua, empresa.bairro, empresa.cidade, empresa.provincia].join(', ')}</dd></div>
              {empresa.decididoEm && <div><dt className="text-muted-foreground">Última decisão</dt><dd>{dataHora(empresa.decididoEm)}{empresa.responsavel?.nome ? ` por ${empresa.responsavel.nome}` : ''}</dd></div>}
              {empresa.motivoEstado && <div className="sm:col-span-2"><dt className="text-muted-foreground">Motivo</dt><dd className="whitespace-pre-line">{empresa.motivoEstado}</dd></div>}
            </dl>
          </CardContent>
        </Card>
        <DecisaoEmpresa key={empresa.estado} empresa={empresa} aoDecidir={() => setVersao(v => v + 1)} />
      </>}
    </section>
  )
}

// Aprovar (PENDENTE ou SUSPENSA → APROVADA) ou suspender com motivo; a empresa recebe um email.
function DecisaoEmpresa({ empresa, aoDecidir }) {
  const [motivo, setMotivo] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  const decidir = async novoEstado => {
    setAEnviar(true)
    setMensagem(null)
    try {
      const resposta = await empresasAdminApi.decidir(empresa.id, { estado: novoEstado, motivo: motivo.trim() || undefined })
      setMensagem({
        variante: resposta.emailEnviado ? 'sucesso' : 'aviso',
        texto: `${resposta.message} ${resposta.emailEnviado ? 'A empresa foi notificada por email.' : 'O email de notificação não pôde ser enviado; contacte a empresa.'}`,
      })
      setMotivo('')
      aoDecidir()
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
    } finally {
      setAEnviar(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Decisão</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {mensagem && <FeedbackMessage variante={mensagem.variante}>{mensagem.texto}</FeedbackMessage>}
        {empresa.estado !== 'SUSPENSA' && <div className="space-y-2">
          <Label htmlFor="empresa-motivo">Motivo (obrigatório para suspender; enviado à empresa)</Label>
          <Textarea id="empresa-motivo" maxLength={MAX_MOTIVO} value={motivo} onChange={e => setMotivo(e.target.value)} />
          <p className="text-xs text-muted-foreground">{motivo.length}/{MAX_MOTIVO}</p>
        </div>}
        <div className="flex flex-wrap gap-2">
          {empresa.estado !== 'APROVADA' && <Button disabled={aEnviar} onClick={() => decidir('APROVADA')}>{empresa.estado === 'SUSPENSA' ? 'Reactivar' : 'Aprovar'}</Button>}
          {empresa.estado !== 'SUSPENSA' && <Button variant="outline" disabled={aEnviar || !motivo.trim()} onClick={() => decidir('SUSPENSA')}>Suspender</Button>}
        </div>
      </CardContent>
    </Card>
  )
}
