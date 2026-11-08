import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FolderX, Pencil } from 'lucide-react'
import { categoriasApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { useCategoriasAdmin } from '../../../hooks/useCategoriasAdmin.js'
import CategoryForm from '../../../components/admin/CategoryForm.jsx'
import ConfirmarApagar from '../../../components/admin/ConfirmarApagar.jsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const DISPONIBILIDADE = {
  EM_STOCK: { etiqueta: 'Em stock', classe: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  STOCK_LIMITADO: { etiqueta: 'Stock limitado', classe: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  ESGOTADO: { etiqueta: 'Esgotado', classe: 'bg-red-100 text-red-700 hover:bg-red-100' },
}

function Titulo({ children }) {
  return <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{children}</CardTitle>
}

function VoltarCategorias() {
  return (
    <Link to="/admin/categorias" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Categorias
    </Link>
  )
}

// Estrutura comum de /admin/categorias/:id e /admin/categorias/:id/editar.
// Não existe GET /admin/categorias/:id: a categoria vem da listagem completa.
function CategoriaAdminPagina({ titulo, children }) {
  const { id } = useParams()
  const dados = useCategoriasAdmin()
  const idValido = /^\d+$/.test(id) && Number(id) > 0

  if (!idValido) {
    return (
      <section className="space-y-4">
        <VoltarCategorias />
        <EmptyState Icone={FolderX} titulo="Identificador inválido" descricao={`"${id}" não é um identificador de categoria válido.`} />
      </section>
    )
  }
  if (dados.carregando) return <LoadingState mensagem="A carregar categoria…" />
  if (dados.erro) {
    return (
      <section className="space-y-4">
        <VoltarCategorias />
        <FeedbackMessage
          variante="erro"
          titulo="Não foi possível carregar a categoria."
          accao={<Button variant="outline" size="sm" onClick={dados.recarregar}>Tentar novamente</Button>}
        >
          {dados.erro}
        </FeedbackMessage>
      </section>
    )
  }

  const categoria = dados.categorias.find(item => item.id === Number(id))
  if (!categoria) {
    return (
      <section className="space-y-4">
        <VoltarCategorias />
        <EmptyState
          Icone={FolderX}
          titulo="Categoria não encontrada"
          descricao="A categoria indicada não existe."
          accao={<Button asChild variant="outline"><Link to="/admin/categorias">Voltar às categorias</Link></Button>}
        />
      </section>
    )
  }

  const base = `/admin/categorias/${categoria.id}`
  const pai = dados.categorias.find(item => item.id === categoria.categoriaPaiId)

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <VoltarCategorias />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{titulo}</p>
            <h1 className="break-words font-heading text-2xl font-bold tracking-tight">{categoria.nome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{pai ? `Subcategoria de ${pai.nome}` : 'Categoria principal'}</p>
          </div>
          {categoria.activo
            ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Activa</Badge>
            : <Badge variant="secondary">Inactiva</Badge>}
        </div>
      </div>

      <nav aria-label="Secções da categoria" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
        {[{ to: base, label: 'Detalhes' }, { to: `${base}/editar`, label: 'Editar' }].map(seccao => (
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
            {seccao.label}
          </NavLink>
        ))}
      </nav>

      <div key={categoria.id}>{children({ categoria, ...dados })}</div>
    </section>
  )
}

// ==================== Criação ====================

export function CategoryCreatePage() {
  const navigate = useNavigate()
  const { categorias, erro, carregando, recarregar } = useCategoriasAdmin()

  const criar = async dados => {
    const resposta = await categoriasApi.criar(dados)
    navigate(`/admin/categorias/${resposta.categoria.id}`, { state: { aviso: 'Categoria criada com sucesso.' } })
  }

  return (
    <section className="space-y-6">
      <div>
        <VoltarCategorias />
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">Nova categoria</h1>
        <p className="text-sm text-muted-foreground">Os campos assinalados com * são obrigatórios.</p>
      </div>
      {carregando && <LoadingState mensagem="A carregar categorias…" />}
      {erro && (
        <FeedbackMessage variante="erro" titulo="Não foi possível carregar as categorias." accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}>
          {erro}
        </FeedbackMessage>
      )}
      {categorias && (
        <Card>
          <CardContent className="pt-6">
            <CategoryForm categorias={categorias} onSubmeter={criar} onCancelar={() => navigate('/admin/categorias')} />
          </CardContent>
        </Card>
      )}
    </section>
  )
}

// ==================== Detalhes ====================

function ProdutosActivos({ categoria }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ chave: null, produtos: [], total: 0, totalPaginas: 0, erro: '' })
  const chave = `${categoria.id}-${pagina}`

  useEffect(() => {
    const controller = new AbortController()
    categoriasApi.produtosActivos(categoria.id, { pagina, limite: 12, ordenar: 'nome-asc' }, { signal: controller.signal })
      .then(resposta => setEstado({ chave, produtos: resposta.produtos || [], total: resposta.total || 0, totalPaginas: resposta.totalPaginas || 0, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ chave, produtos: [], total: 0, totalPaginas: 0, erro: error.message })
      })
    return () => controller.abort()
  }, [categoria.id, pagina, chave])

  const carregando = estado.chave !== chave

  return (
    <Card>
      <CardHeader className="space-y-1">
        <Titulo>Produtos activos</Titulo>
        <p className="text-xs text-muted-foreground">
          Produtos activos associados directamente a esta categoria, tal como aparecem no catálogo.
          {categoria.totalProdutos !== estado.total && !carregando && !estado.erro
            ? ` O total de ${categoria.totalProdutos} inclui produtos inactivos.`
            : ''}
        </p>
      </CardHeader>
      <CardContent>
        {carregando && estado.chave === null && <LoadingState mensagem="A carregar produtos…" className="py-8" />}
        {!carregando && estado.erro && <FeedbackMessage variante="erro">{estado.erro}</FeedbackMessage>}
        {!carregando && !estado.erro && !estado.produtos.length && (
          <p className="py-6 text-center text-sm text-muted-foreground">Não há produtos activos nesta categoria.</p>
        )}
        {estado.produtos.length > 0 && (
          <ul className={`divide-y ${carregando ? 'opacity-60' : ''}`}>
            {estado.produtos.map(produto => {
              const disponibilidade = DISPONIBILIDADE[produto.disponibilidade]
              return (
                <li key={produto.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <Link to={`/admin/produtos/${encodeURIComponent(produto.id)}`} className="font-medium hover:underline">{produto.nome}</Link>
                    <p className="font-mono text-xs text-muted-foreground">{produto.codigo || 'Sem código'}{produto.marca ? ` · ${produto.marca}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{formatarMZN(produto.preco)}</span>
                    {disponibilidade && <Badge className={disponibilidade.classe}>{disponibilidade.etiqueta}</Badge>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {estado.totalPaginas > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Página {pagina} de {estado.totalPaginas}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagina <= 1 || carregando} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={pagina >= estado.totalPaginas || carregando} onClick={() => setPagina(pagina + 1)}>Seguinte</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DetalheCategoria({ categoria, categorias, actualizarCategoria }) {
  const location = useLocation()
  const [avisoCriacao, setAvisoCriacao] = useState(location.state?.aviso || '')
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })
  const [confirmar, setConfirmar] = useState(false)
  const [aProcessar, setAProcessar] = useState(false)
  const pai = categorias.find(item => item.id === categoria.categoriaPaiId)
  const subcategorias = categorias.filter(item => item.categoriaPaiId === categoria.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))

  const executar = async (accao, sucesso) => {
    setAProcessar(true)
    try {
      const resposta = await accao()
      actualizarCategoria(resposta.categoria)
      setMensagem({ erro: '', sucesso })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <div className="space-y-6">
      {avisoCriacao && <FeedbackMessage variante="sucesso" onFechar={() => setAvisoCriacao('')}>{avisoCriacao}</FeedbackMessage>}
      {mensagem.erro && <FeedbackMessage variante="erro" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.erro}</FeedbackMessage>}
      {mensagem.sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.sucesso}</FeedbackMessage>}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm"><Link to="editar"><Pencil className="h-4 w-4" />Editar</Link></Button>
        {categoria.activo
          ? <Button size="sm" variant="destructive" disabled={aProcessar} onClick={() => setConfirmar(true)}>Desactivar</Button>
          : <Button size="sm" variant="outline" disabled={aProcessar} onClick={() => executar(() => categoriasApi.actualizar(categoria.id, { nome: categoria.nome, activo: true }), 'Categoria reactivada.')}>
              {aProcessar ? 'A reactivar…' : 'Reactivar'}
            </Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><Titulo>Informação</Titulo></CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Identificador</dt><dd className="font-mono">{categoria.id}</dd></div>
              <div><dt className="text-muted-foreground">Estado</dt><dd>{categoria.activo ? 'Activa' : 'Inactiva'}</dd></div>
              <div>
                <dt className="text-muted-foreground">Categoria principal</dt>
                <dd>{pai ? <Link to={`/admin/categorias/${pai.id}`} className="text-primary hover:underline">{pai.nome}</Link> : '— (é principal)'}</dd>
              </div>
              <div><dt className="text-muted-foreground">Produtos associados</dt><dd className="font-mono">{categoria.totalProdutos} <span className="font-sans text-xs text-muted-foreground">(activos e inactivos)</span></dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><Titulo>Subcategorias</Titulo></CardHeader>
          <CardContent>
            {subcategorias.length ? (
              <ul className="divide-y text-sm">
                {subcategorias.map(sub => (
                  <li key={sub.id} className="flex items-center justify-between gap-2 py-2">
                    <Link to={`/admin/categorias/${sub.id}`} className="hover:underline">{sub.nome}</Link>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {sub.totalProdutos} {sub.totalProdutos === 1 ? 'produto' : 'produtos'}
                      {!sub.activo && <Badge variant="secondary">Inactiva</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Esta categoria não tem subcategorias.</p>}
          </CardContent>
        </Card>
      </div>

      <ProdutosActivos categoria={categoria} />

      <ConfirmarApagar
        aberto={confirmar}
        onOpenChange={setConfirmar}
        titulo="Desactivar categoria?"
        descricao={`"${categoria.nome}" deixará de aparecer na lista de categorias da loja. Os produtos e as subcategorias associados não são alterados.`}
        rotuloConfirmar="Desactivar"
        onConfirmar={() => executar(() => categoriasApi.apagar(categoria.id), 'Categoria desactivada.')}
      />
    </div>
  )
}

export function CategoryDetailPage() {
  return <CategoriaAdminPagina titulo="Detalhes da categoria">{props => <DetalheCategoria {...props} />}</CategoriaAdminPagina>
}

// ==================== Edição ====================

function EdicaoCategoria({ categoria, categorias, actualizarCategoria }) {
  const navigate = useNavigate()
  const [sucesso, setSucesso] = useState('')

  const guardar = async dados => {
    setSucesso('')
    const resposta = await categoriasApi.actualizar(categoria.id, dados)
    actualizarCategoria(resposta.categoria)
    setSucesso('Alterações guardadas.')
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setSucesso('')}>{sucesso}</FeedbackMessage>}
        <CategoryForm
          categoria={categoria}
          categorias={categorias}
          onSubmeter={guardar}
          onCancelar={() => navigate(`/admin/categorias/${categoria.id}`)}
        />
      </CardContent>
    </Card>
  )
}

export function CategoryEditPage() {
  return <CategoriaAdminPagina titulo="Editar categoria">{props => <EdicaoCategoria {...props} />}</CategoriaAdminPagina>
}
