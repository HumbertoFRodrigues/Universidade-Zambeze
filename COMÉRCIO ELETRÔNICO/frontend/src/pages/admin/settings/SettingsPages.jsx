import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowLeft, CreditCard, Truck } from 'lucide-react'
import { configuracaoApi, formasPagamentoAdminApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { dataHoraLegivel } from '../../../lib/produtosAdmin.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Capacidade real de cada secção no backend.
const DISPONIBILIDADE = {
  editavel: { etiqueta: 'Editável', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  consulta: { etiqueta: 'Só consulta', classe: 'bg-sky-100 text-sky-700 hover:bg-sky-100' },
  indisponivel: { etiqueta: 'Indisponível', classe: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
}

const SECCOES = [
  { to: '/admin/configuracoes/vendedor', titulo: 'Dados do vendedor', descricao: 'Nome da loja, designação legal e apresentação.', disponibilidade: 'editavel' },
  { to: '/admin/configuracoes/contactos', titulo: 'Contactos', descricao: 'Telefone, email e horário de atendimento.', disponibilidade: 'editavel' },
  { to: '/admin/configuracoes/localizacao', titulo: 'Localização', descricao: 'Morada da loja e ponto de referência.', disponibilidade: 'editavel' },
  { to: '/admin/configuracoes/politicas', titulo: 'Políticas', descricao: 'Privacidade, termos, entrega e devolução.', disponibilidade: 'editavel' },
  { to: '/admin/configuracoes/garantias', titulo: 'Garantias', descricao: 'Política de garantia da loja.', disponibilidade: 'editavel' },
  { to: '/admin/configuracoes/pagamentos', titulo: 'Pagamentos', descricao: 'Activar ou desactivar formas de pagamento.', disponibilidade: 'editavel' },
  { to: '/admin/configuracoes/entregas/modalidades', titulo: 'Modalidades de entrega', descricao: 'Formas de entrega oferecidas.', disponibilidade: 'consulta' },
  { to: '/admin/configuracoes/entregas/zonas', titulo: 'Zonas de entrega', descricao: 'Zonas servidas pela loja.', disponibilidade: 'consulta' },
  { to: '/admin/configuracoes/entregas/fretes', titulo: 'Fretes', descricao: 'Valor e prazo por zona e modalidade.', disponibilidade: 'consulta' },
]

// Limites das colunas de configuracao_loja e politica_loja.
const CAMPOS = {
  nomeMarca: { rotulo: 'Nome da loja', max: 150, obrigatorio: true },
  designacaoLegal: { rotulo: 'Designação legal', max: 200 },
  sobre: { rotulo: 'Sobre a loja', tipo: 'textarea' },
  telefone: { rotulo: 'Telefone', max: 30 },
  email: { rotulo: 'Email', max: 254, tipo: 'email' },
  horarioAtendimento: { rotulo: 'Horário de atendimento', max: 255 },
  morada: { rotulo: 'Morada', max: 255 },
  referenciaLocalizacao: { rotulo: 'Ponto de referência', max: 255 },
}
const MAX_TITULO_POLITICA = 150

const POLITICAS = {
  PRIVACIDADE: 'Privacidade',
  TERMOS: 'Termos e condições',
  ENTREGA: 'Entrega',
  DEVOLUCAO: 'Devolução',
  GARANTIA: 'Garantia',
}

function Titulo({ children }) {
  return <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{children}</CardTitle>
}

function Disponibilidade({ valor }) {
  const config = DISPONIBILIDADE[valor]
  return <Badge className={config.classe}>{config.etiqueta}</Badge>
}

function CabecalhoConfiguracao({ titulo, descricao }) {
  return (
    <div className="space-y-4">
      <div>
        <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Configurações
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">{titulo}</h1>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      <nav aria-label="Secções de configuração" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
        {SECCOES.map(seccao => (
          <NavLink
            key={seccao.to}
            to={seccao.to}
            end
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {seccao.titulo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function ErroCarregamento({ titulo, erro, recarregar }) {
  return (
    <FeedbackMessage variante="erro" titulo={titulo} accao={recarregar ? <Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button> : null}>
      {erro}
    </FeedbackMessage>
  )
}

// ==================== Configuração da loja ====================

function useConfiguracao() {
  const [estado, setEstado] = useState({ configuracao: undefined, naoCriada: false, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    configuracaoApi.obter({ signal: controller.signal })
      .then(resposta => setEstado({ configuracao: resposta.configuracao, naoCriada: false, erro: '' }))
      .catch(error => {
        if (controller.signal.aborted) return
        if (error.status === 404) setEstado({ configuracao: null, naoCriada: true, erro: '' })
        else setEstado({ configuracao: undefined, naoCriada: false, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])
  const recarregar = useCallback(() => setVersao(v => v + 1), [])
  const definir = useCallback(configuracao => setEstado({ configuracao, naoCriada: false, erro: '' }), [])
  return { ...estado, carregando: estado.configuracao === undefined && !estado.erro, recarregar, definir }
}

const valorInicial = (configuracao, nomes) => Object.fromEntries(nomes.map(nome => [nome, configuracao?.[nome] ?? '']))

// Formulário partilhado pelas páginas de vendedor, contactos e localização.
// Envia apenas os campos da secção (o backend preserva os restantes) e nunca
// envia regrasComerciais, para não substituir esse objecto.
function FormularioConfiguracao({ campos, configuracao, onGuardado }) {
  const [valores, setValores] = useState(() => valorInicial(configuracao, campos))
  const [erros, setErros] = useState({})
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })
  const original = valorInicial(configuracao, campos)
  const alterado = campos.some(nome => String(valores[nome]).trim() !== String(original[nome]).trim())
  const semNome = !campos.includes('nomeMarca') && !configuracao?.nomeMarca

  const guardar = async evento => {
    evento.preventDefault()
    if (aGuardar) return
    const novos = {}
    for (const nome of campos) {
      const { rotulo, max, obrigatorio, tipo } = CAMPOS[nome]
      const valor = String(valores[nome]).trim()
      if (obrigatorio && !valor) novos[nome] = `${rotulo} é obrigatório.`
      else if (max && valor.length > max) novos[nome] = `Máximo de ${max} caracteres.`
      else if (tipo === 'email' && valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) novos[nome] = 'Indique um email válido.'
    }
    setErros(novos)
    if (Object.keys(novos).length) return
    setAGuardar(true)
    setMensagem({ erro: '', sucesso: '' })
    try {
      const dados = { nomeMarca: configuracao?.nomeMarca }
      for (const nome of campos) {
        const valor = String(valores[nome]).trim()
        dados[nome] = valor || (CAMPOS[nome].obrigatorio ? valor : null)
      }
      const resposta = await configuracaoApi.actualizar(dados)
      onGuardado(resposta.configuracao)
      setValores(valorInicial(resposta.configuracao, campos))
      setMensagem({ erro: '', sucesso: 'Configuração guardada.' })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    } finally {
      setAGuardar(false)
    }
  }

  if (semNome) {
    return (
      <FeedbackMessage variante="aviso" titulo="Configuração da loja ainda não criada">
        Defina primeiro o nome da loja em <Link to="/admin/configuracoes/vendedor" className="text-primary hover:underline">Dados do vendedor</Link>; o servidor exige-o para guardar qualquer configuração.
      </FeedbackMessage>
    )
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-5">
      {mensagem.erro && <FeedbackMessage variante="erro" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.erro}</FeedbackMessage>}
      {mensagem.sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.sucesso}</FeedbackMessage>}
      {campos.map(nome => {
        const { rotulo, max, obrigatorio, tipo } = CAMPOS[nome]
        const propriedades = {
          id: `config-${nome}`,
          value: valores[nome],
          onChange: e => setValores({ ...valores, [nome]: e.target.value }),
          'aria-invalid': !!erros[nome],
          ...(max ? { maxLength: max } : {}),
        }
        return (
          <div key={nome} className="space-y-1.5">
            <Label htmlFor={propriedades.id}>{rotulo}{obrigatorio ? ' *' : ''}</Label>
            {tipo === 'textarea'
              ? <Textarea rows={5} {...propriedades} />
              : <Input type={tipo === 'email' ? 'email' : 'text'} {...propriedades} />}
            {erros[nome] && <p className="text-xs text-destructive">{erros[nome]}</p>}
          </div>
        )
      })}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={!alterado || aGuardar} onClick={() => { setValores(original); setErros({}) }}>Descartar alterações</Button>
        <Button type="submit" disabled={!alterado || aGuardar}>{aGuardar ? 'A guardar…' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

function PaginaConfiguracao({ titulo, descricao, campos, extra }) {
  const { configuracao, naoCriada, erro, carregando, recarregar, definir } = useConfiguracao()
  return (
    <section className="space-y-6">
      <CabecalhoConfiguracao titulo={titulo} descricao={descricao} />
      {carregando && <LoadingState mensagem="A carregar configuração…" />}
      {erro && <ErroCarregamento titulo="Não foi possível carregar a configuração." erro={erro} recarregar={recarregar} />}
      {naoCriada && campos.includes('nomeMarca') && (
        <FeedbackMessage variante="info">A configuração da loja ainda não foi criada. Ao guardar, o servidor cria-a.</FeedbackMessage>
      )}
      {!carregando && !erro && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card>
            <CardContent className="pt-6">
              <FormularioConfiguracao campos={campos} configuracao={configuracao} onGuardado={definir} />
            </CardContent>
          </Card>
          <div className="space-y-6">
            {configuracao?.actualizadoEm && (
              <p className="text-sm text-muted-foreground">Última actualização da configuração: {dataHoraLegivel(configuracao.actualizadoEm)}</p>
            )}
            {extra?.(configuracao)}
          </div>
        </div>
      )}
    </section>
  )
}

function EscaloesAtacado({ regras }) {
  const escaloes = Array.isArray(regras?.atacado) ? regras.atacado : []
  if (!escaloes.length) return null
  return (
    <Card>
      <CardHeader><Titulo>Descontos por quantidade</Titulo></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <ul className="divide-y">
          {escaloes.map(escalao => (
            <li key={`${escalao.de}-${escalao.ate}`} className="flex justify-between gap-3 py-1.5">
              <span>{escalao.ate == null ? `${escalao.de} ou mais unidades` : `${escalao.de} a ${escalao.ate} unidades`}</span>
              <span className="font-mono">{Math.round(Number(escalao.desconto) * 100)}%</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Definidos nas regras comerciais da loja.</p>
      </CardContent>
    </Card>
  )
}

export function SellerSettingsPage() {
  return (
    <PaginaConfiguracao
      titulo="Dados do vendedor"
      descricao="Identificação comercial apresentada na loja."
      campos={['nomeMarca', 'designacaoLegal', 'sobre']}
      extra={configuracao => <>
        <Card>
          <CardHeader><Titulo>Moeda da loja</Titulo></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-mono text-lg font-semibold">{configuracao?.codigoMoeda || '—'}</p>
            <p className="text-xs text-muted-foreground">Só consulta: o checkout recusa encomendas quando a moeda dos produtos não corresponde a esta.</p>
          </CardContent>
        </Card>
        <EscaloesAtacado regras={configuracao?.regrasComerciais} />
      </>}
    />
  )
}

export function ContactSettingsPage() {
  return <PaginaConfiguracao titulo="Contactos" descricao="Contactos apresentados aos clientes na loja." campos={['telefone', 'email', 'horarioAtendimento']} />
}

export function LocationSettingsPage() {
  return <PaginaConfiguracao titulo="Localização" descricao="Morada da loja apresentada aos clientes." campos={['morada', 'referenciaLocalizacao']} />
}

// ==================== Políticas ====================

function usePoliticas() {
  const [estado, setEstado] = useState({ politicas: null, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    configuracaoApi.politicas({ signal: controller.signal })
      .then(resposta => setEstado({ politicas: resposta.politicas || [], erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ politicas: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])
  const recarregar = useCallback(() => setVersao(v => v + 1), [])
  return { ...estado, carregando: !estado.politicas && !estado.erro, recarregar }
}

function EditorPolitica({ tipo, politica }) {
  const [actual, setActual] = useState(politica)
  const [valores, setValores] = useState({ titulo: politica?.titulo || '', conteudo: politica?.conteudo || '' })
  const [erros, setErros] = useState({})
  const [confirmar, setConfirmar] = useState(false)
  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })
  const alterado = valores.titulo.trim() !== (actual?.titulo || '') || valores.conteudo.trim() !== (actual?.conteudo || '')

  const validar = evento => {
    evento.preventDefault()
    const novos = {}
    if (!valores.titulo.trim()) novos.titulo = 'O título é obrigatório.'
    else if (valores.titulo.trim().length > MAX_TITULO_POLITICA) novos.titulo = `Máximo de ${MAX_TITULO_POLITICA} caracteres.`
    if (!valores.conteudo.trim()) novos.conteudo = 'O conteúdo é obrigatório.'
    setErros(novos)
    if (!Object.keys(novos).length) setConfirmar(true)
  }

  const guardar = async () => {
    if (aGuardar) return
    setAGuardar(true)
    setMensagem({ erro: '', sucesso: '' })
    try {
      const resposta = await configuracaoApi.actualizarPolitica(tipo, { titulo: valores.titulo.trim(), conteudo: valores.conteudo.trim() })
      setActual(resposta.politica)
      setValores({ titulo: resposta.politica.titulo, conteudo: resposta.politica.conteudo })
      setMensagem({ erro: '', sucesso: `Política guardada (versão ${resposta.politica.versao}).` })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <Titulo>{POLITICAS[tipo]}</Titulo>
        <span className="text-xs text-muted-foreground">
          {actual ? `Versão ${actual.versao} · actualizada em ${dataHoraLegivel(actual.actualizadoEm)}` : 'Ainda não publicada'}
        </span>
      </CardHeader>
      <CardContent>
        <form onSubmit={validar} noValidate className="space-y-4">
          {mensagem.erro && <FeedbackMessage variante="erro" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.erro}</FeedbackMessage>}
          {mensagem.sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.sucesso}</FeedbackMessage>}
          <div className="space-y-1.5">
            <Label htmlFor={`politica-${tipo}-titulo`}>Título *</Label>
            <Input id={`politica-${tipo}-titulo`} maxLength={MAX_TITULO_POLITICA} value={valores.titulo} onChange={e => setValores({ ...valores, titulo: e.target.value })} aria-invalid={!!erros.titulo} />
            {erros.titulo && <p className="text-xs text-destructive">{erros.titulo}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`politica-${tipo}-conteudo`}>Conteúdo *</Label>
            <Textarea id={`politica-${tipo}-conteudo`} rows={8} value={valores.conteudo} onChange={e => setValores({ ...valores, conteudo: e.target.value })} aria-invalid={!!erros.conteudo} />
            {erros.conteudo && <p className="text-xs text-destructive">{erros.conteudo}</p>}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={!alterado || aGuardar} onClick={() => { setValores({ titulo: actual?.titulo || '', conteudo: actual?.conteudo || '' }); setErros({}) }}>Descartar alterações</Button>
            <Button type="submit" disabled={!alterado || aGuardar}>{aGuardar ? 'A guardar…' : 'Publicar nova versão'}</Button>
          </div>
        </form>
      </CardContent>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar nova versão?</AlertDialogTitle>
            <AlertDialogDescription>
              A política “{POLITICAS[tipo]}” passa a ser apresentada aos clientes com este texto
              {actual ? ` e fica com a versão ${actual.versao + 1}` : ''}.
              {tipo === 'TERMOS' ? ' As encomendas seguintes ficam associadas à nova versão dos termos.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={guardar}>Publicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function PaginaPoliticas({ titulo, descricao, tipos, extra }) {
  const { politicas, erro, carregando, recarregar } = usePoliticas()
  return (
    <section className="space-y-6">
      <CabecalhoConfiguracao titulo={titulo} descricao={descricao} />
      {carregando && <LoadingState mensagem="A carregar políticas…" />}
      {erro && <ErroCarregamento titulo="Não foi possível carregar as políticas." erro={erro} recarregar={recarregar} />}
      {politicas && <>
        {extra}
        <div className="space-y-6">
          {tipos.map(tipo => <EditorPolitica key={tipo} tipo={tipo} politica={politicas.find(p => p.tipoPolitica === tipo) || null} />)}
        </div>
      </>}
    </section>
  )
}

function PrazoDevolucao() {
  const { configuracao } = useConfiguracao()
  const prazo = configuracao?.regrasComerciais?.prazoDevolucaoDias
  if (prazo == null) return null
  return (
    <FeedbackMessage variante="info" titulo={`Prazo de devolução configurado: ${prazo} dias`}>
      Valor das regras comerciais da loja, apresentado no checkout e na página de produto. Confirme que o texto da política de devolução é coerente com este prazo.
    </FeedbackMessage>
  )
}

export function PolicySettingsPage() {
  return (
    <PaginaPoliticas
      titulo="Políticas"
      descricao="Textos legais e comerciais apresentados na loja. Cada gravação cria uma nova versão."
      tipos={['PRIVACIDADE', 'TERMOS', 'ENTREGA', 'DEVOLUCAO']}
      extra={<PrazoDevolucao />}
    />
  )
}

export function WarrantySettingsPage() {
  return (
    <PaginaPoliticas
      titulo="Garantias"
      descricao="Política de garantia geral da loja."
      tipos={['GARANTIA']}
      extra={
        <FeedbackMessage variante="info">
          A garantia específica de cada produto é um texto do próprio produto e edita-se na página “Garantia” de cada produto. Não existem prazos nem regras de aprovação de garantia configuráveis no sistema.
          <div className="mt-3"><Button asChild size="sm" variant="outline"><Link to="/admin/produtos">Ver produtos</Link></Button></div>
        </FeedbackMessage>
      }
    />
  )
}

// ==================== Pagamentos ====================

// GET /admin/pagamentos lista as formas de pagamento; PATCH .../estado activa ou desactiva.
// Uma forma inactiva deixa de aparecer no checkout. Não há credenciais de fornecedores.
export function PaymentSettingsPage() {
  const [estado, setEstado] = useState({ formas: null, erro: '' })
  const [versao, setVersao] = useState(0)
  const [aAlterar, setAAlterar] = useState(null)
  const [mensagem, setMensagem] = useState(null)
  const [pendente, setPendente] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    formasPagamentoAdminApi.listar({ signal: controller.signal })
      .then(formas => setEstado({ formas: formas || [], erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ formas: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])

  const alterar = async (forma, activo) => {
    setPendente(null)
    setAAlterar(forma.id)
    setMensagem(null)
    try {
      await formasPagamentoAdminApi.alterarEstado(forma.id, activo)
      setMensagem({ variante: 'sucesso', texto: `${forma.nome} ${activo ? 'activada' : 'desactivada'}.` })
      setVersao(v => v + 1)
    } catch (error) {
      setMensagem({ variante: 'erro', texto: error.message })
    } finally {
      setAAlterar(null)
    }
  }

  const { formas, erro } = estado
  return (
    <section className="space-y-6">
      <CabecalhoConfiguracao titulo="Pagamentos" descricao="Formas de pagamento oferecidas no checkout." />
      <FeedbackMessage variante="info">
        Todas as formas de pagamento são simuladas: o servidor regista os pagamentos como simulação e não guarda credenciais de nenhum fornecedor.
      </FeedbackMessage>
      {mensagem && <FeedbackMessage variante={mensagem.variante}>{mensagem.texto}</FeedbackMessage>}
      {!formas && !erro && <LoadingState mensagem="A carregar formas de pagamento…" />}
      {erro && <ErroCarregamento titulo="Não foi possível carregar as formas de pagamento." erro={erro} recarregar={() => setVersao(v => v + 1)} />}
      {formas && !formas.length && <EmptyState Icone={CreditCard} titulo="Não existem formas de pagamento." />}
      {formas && formas.length > 0 && (
        <Card>
          <CardContent className="divide-y p-0">
            {formas.map(forma => (
              <div key={forma.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{forma.nome}</p>
                  <p className="font-mono text-xs text-muted-foreground">{forma.codigo}</p>
                </div>
                {forma.simulado && <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Simulado</Badge>}
                <Badge className={forma.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}>
                  {forma.activo ? 'Activa' : 'Inactiva'}
                </Badge>
                <Switch
                  checked={forma.activo}
                  disabled={aAlterar !== null}
                  onCheckedChange={activo => (activo ? alterar(forma, true) : setPendente(forma))}
                  aria-label={`${forma.activo ? 'Desactivar' : 'Activar'} ${forma.nome}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <AlertDialog open={pendente !== null} onOpenChange={aberto => { if (!aberto) setPendente(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar {pendente?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>Deixa de aparecer no checkout. Pode voltar a activá-la mais tarde.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => alterar(pendente, false)}>Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

// ==================== Entregas ====================

function useOpcoesEntrega() {
  const [estado, setEstado] = useState({ opcoes: null, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    configuracaoApi.opcoesEntrega({ signal: controller.signal })
      .then(resposta => setEstado({ opcoes: resposta.opcoes || [], erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ opcoes: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])
  const recarregar = useCallback(() => setVersao(v => v + 1), [])
  return { ...estado, carregando: !estado.opcoes && !estado.erro, recarregar }
}

const AVISO_ENTREGAS = 'Zonas, modalidades e tarifas de entrega em vigor, aplicadas automaticamente no cálculo do frete no checkout.'

function agrupar(opcoes, chave) {
  const mapa = new Map()
  for (const opcao of opcoes) {
    const item = opcao[chave]
    const actual = mapa.get(item.id) || { ...item, tarifas: [] }
    actual.tarifas.push(opcao)
    mapa.set(item.id, actual)
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
}

function PaginaEntregas({ titulo, children }) {
  const { opcoes, erro, carregando, recarregar } = useOpcoesEntrega()
  return (
    <section className="space-y-6">
      <CabecalhoConfiguracao titulo={titulo} />
      <FeedbackMessage variante="info">{AVISO_ENTREGAS}</FeedbackMessage>
      {carregando && <LoadingState mensagem="A carregar opções de entrega…" />}
      {erro && <ErroCarregamento titulo="Não foi possível carregar as opções de entrega." erro={erro} recarregar={recarregar} />}
      {opcoes && !opcoes.length && <EmptyState Icone={Truck} titulo="Não existem opções de entrega activas." />}
      {opcoes && opcoes.length > 0 && children(opcoes)}
    </section>
  )
}

function PrazosEntrega() {
  const { configuracao } = useConfiguracao()
  const prazos = configuracao?.regrasComerciais?.prazosEntrega
  if (!prazos || typeof prazos !== 'object') return null
  return (
    <Card>
      <CardHeader><Titulo>Prazos indicativos apresentados na loja</Titulo></CardHeader>
      <CardContent className="space-y-1 text-sm">
        {prazos.cidade && <p>Cidade: {prazos.cidade}</p>}
        {prazos.nacional && <p>Nacional: {prazos.nacional}</p>}
        <p className="pt-1 text-xs text-muted-foreground">Texto das regras comerciais da loja, independente do prazo de cada tarifa. Só consulta.</p>
      </CardContent>
    </Card>
  )
}

export function DeliveryMethodsSettingsPage() {
  return (
    <PaginaEntregas titulo="Modalidades de entrega">
      {opcoes => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agrupar(opcoes, 'modalidade').map(modalidade => (
              <Card key={modalidade.id}>
                <CardContent className="space-y-2 p-4">
                  <p className="font-medium">{modalidade.nome}</p>
                  {modalidade.levantamentoLoja && <Badge variant="secondary">Levantamento na loja</Badge>}
                  <p className="text-sm text-muted-foreground">Disponível em {modalidade.tarifas.length} {modalidade.tarifas.length === 1 ? 'zona' : 'zonas'}.</p>
                  <Link to="/admin/configuracoes/entregas/fretes" className="text-sm text-primary hover:underline">Ver fretes</Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <PrazosEntrega />
        </div>
      )}
    </PaginaEntregas>
  )
}

export function DeliveryZonesSettingsPage() {
  return (
    <PaginaEntregas titulo="Zonas de entrega">
      {opcoes => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agrupar(opcoes, 'zona').map(zona => (
            <Card key={zona.id}>
              <CardContent className="space-y-2 p-4">
                <p className="font-medium">{zona.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {zona.tarifas.length} {zona.tarifas.length === 1 ? 'modalidade' : 'modalidades'}: {zona.tarifas.map(t => t.modalidade.nome).join(', ')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PaginaEntregas>
  )
}

const TODAS = 'todas'

function TabelaFretes({ opcoes }) {
  const [zona, setZona] = useState('')
  const [modalidade, setModalidade] = useState('')
  const zonas = agrupar(opcoes, 'zona')
  const modalidades = agrupar(opcoes, 'modalidade')
  const visiveis = opcoes.filter(o => (!zona || String(o.zona.id) === zona) && (!modalidade || String(o.modalidade.id) === modalidade))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 sm:max-w-xl">
        <div className="space-y-1.5">
          <Label htmlFor="fretes-zona">Zona</Label>
          <Select value={zona || TODAS} onValueChange={v => setZona(v === TODAS ? '' : v)}>
            <SelectTrigger id="fretes-zona"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas</SelectItem>
              {zonas.map(z => <SelectItem key={z.id} value={String(z.id)}>{z.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fretes-modalidade">Modalidade</Label>
          <Select value={modalidade || TODAS} onValueChange={v => setModalidade(v === TODAS ? '' : v)}>
            <SelectTrigger id="fretes-modalidade"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas</SelectItem>
              {modalidades.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{visiveis.length} {visiveis.length === 1 ? 'tarifa' : 'tarifas'}.</p>
      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead className="text-right">Frete</TableHead>
              <TableHead className="text-right">Prazo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map(o => (
              <TableRow key={`${o.zona.id}-${o.modalidade.id}`}>
                <TableCell>{o.zona.nome}</TableCell>
                <TableCell>{o.modalidade.nome}</TableCell>
                <TableCell className="text-right font-mono">{o.codigoMoeda === 'MZN' ? formatarMZN(o.frete) : `${o.frete} ${o.codigoMoeda}`}</TableCell>
                <TableCell className="text-right">{o.prazoDias == null ? '—' : `${o.prazoDias} ${o.prazoDias === 1 ? 'dia' : 'dias'}`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">O valor do frete é o que o checkout aplica a cada combinação de zona e modalidade.</p>
    </div>
  )
}

export function DeliveryFeesSettingsPage() {
  return <PaginaEntregas titulo="Fretes">{opcoes => <TabelaFretes opcoes={opcoes} />}</PaginaEntregas>
}

// ==================== Página principal ====================

export function SettingsPage() {
  const { configuracao, naoCriada, erro } = useConfiguracao()
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          {configuracao?.nomeMarca
            ? `Configuração de “${configuracao.nomeMarca}” · última actualização em ${dataHoraLegivel(configuracao.actualizadoEm)}.`
            : 'Dados da loja, políticas, pagamentos e entregas.'}
        </p>
      </div>
      {naoCriada && <FeedbackMessage variante="aviso">A configuração da loja ainda não foi criada. Comece pelos dados do vendedor.</FeedbackMessage>}
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar a configuração.">{erro}</FeedbackMessage>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECCOES.map(seccao => (
          <Link key={seccao.to} to={seccao.to} className="block">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{seccao.titulo}</p>
                  <Disponibilidade valor={seccao.disponibilidade} />
                </div>
                <p className="text-sm text-muted-foreground">{seccao.descricao}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
