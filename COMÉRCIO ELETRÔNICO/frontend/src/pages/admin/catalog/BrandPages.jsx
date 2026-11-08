import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, Search } from 'lucide-react'
import { produtosApi } from '../../../services/api.js'
import { formatarMZN } from '../../../lib/format.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

// Não existe modelo Marca: a marca é o campo de texto produto.marca (até 100 caracteres).
const AVISO_MODELO = 'O EasyShop não tem uma entidade "marca" própria: a marca é um campo de texto de cada produto. Para criar, renomear ou atribuir uma marca, edite os produtos correspondentes.'

const caminhoMarca = nome => `/admin/marcas/${encodeURIComponent(nome)}/editar`

function useTodosProdutos() {
  const [estado, setEstado] = useState({ produtos: null, erro: '' })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    produtosApi.listarTodos({ signal: controller.signal })
      .then(produtos => setEstado({ produtos, erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setEstado({ produtos: null, erro: error.message })
      })
    return () => controller.abort()
  }, [versao])
  const recarregar = useCallback(() => setVersao(valor => valor + 1), [])
  return { ...estado, carregando: !estado.produtos && !estado.erro, recarregar }
}

// Agrupa exactamente como está gravado (sem juntar variantes de maiúsculas/espaços).
function agruparMarcas(produtos) {
  const mapa = new Map()
  for (const produto of produtos) {
    if (!produto.marca) continue
    const actual = mapa.get(produto.marca) || { nome: produto.marca, total: 0, activos: 0 }
    actual.total += 1
    if (produto.activo) actual.activos += 1
    mapa.set(produto.marca, actual)
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
}

function ErroCarregamento({ erro, recarregar }) {
  return (
    <FeedbackMessage
      variante="erro"
      titulo="Não foi possível carregar as marcas."
      accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}
    >
      {erro}
    </FeedbackMessage>
  )
}

function VoltarMarcas() {
  return (
    <Link to="/admin/marcas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Marcas
    </Link>
  )
}

// ==================== Listagem ====================

export function BrandsPage() {
  const { produtos, erro, carregando, recarregar } = useTodosProdutos()
  const [pesquisa, setPesquisa] = useState('')
  const marcas = produtos ? agruparMarcas(produtos) : []
  const semMarca = produtos ? produtos.filter(produto => !produto.marca).length : 0
  const termo = pesquisa.trim().toLocaleLowerCase('pt')
  const visiveis = termo ? marcas.filter(marca => marca.nome.toLocaleLowerCase('pt').includes(termo)) : marcas

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Marcas</h1>
        <p className="text-sm text-muted-foreground">
          {produtos ? `${marcas.length} ${marcas.length === 1 ? 'marca' : 'marcas'} em ${produtos.length} produtos.` : 'Marcas usadas nos produtos do catálogo.'}
        </p>
      </div>

      <FeedbackMessage variante="info">{AVISO_MODELO}</FeedbackMessage>

      <div className="max-w-md space-y-1.5">
        <Label htmlFor="marcas-pesquisa">Pesquisar</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="marcas-pesquisa" type="search" className="pl-9" placeholder="Nome da marca" value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
        </div>
      </div>

      {carregando && <LoadingState mensagem="A carregar marcas…" />}
      {erro && <ErroCarregamento erro={erro} recarregar={recarregar} />}

      {produtos && !visiveis.length && (
        <EmptyState
          Icone={Award}
          titulo={termo ? 'Nenhuma marca corresponde à pesquisa.' : 'Nenhum produto tem marca definida.'}
          accao={termo ? <Button variant="outline" onClick={() => setPesquisa('')}>Limpar pesquisa</Button> : null}
        />
      )}

      {produtos && visiveis.length > 0 && <>
        {/* Telemóvel */}
        <div className="space-y-3 md:hidden">
          {visiveis.map(marca => (
            <Card key={marca.nome}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="break-words font-medium">{marca.nome}</p>
                  <p className="text-xs text-muted-foreground">{marca.total} {marca.total === 1 ? 'produto' : 'produtos'} · {marca.activos} activos</p>
                </div>
                <Button asChild size="sm" variant="outline"><Link to={caminhoMarca(marca.nome)}>Gerir</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Computador e tablet */}
        <div className="hidden rounded-md border bg-white md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Activos</TableHead>
                <TableHead className="text-right">Inactivos</TableHead>
                <TableHead><span className="sr-only">Acções</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map(marca => (
                <TableRow key={marca.nome}>
                  <TableCell className="font-medium">{marca.nome}</TableCell>
                  <TableCell className="text-right font-mono">{marca.total}</TableCell>
                  <TableCell className="text-right font-mono">{marca.activos}</TableCell>
                  <TableCell className="text-right font-mono">{marca.total - marca.activos}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline"><Link to={caminhoMarca(marca.nome)}>Gerir produtos</Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>}

      {produtos && semMarca > 0 && !termo && (
        <p className="text-sm text-muted-foreground">{semMarca} {semMarca === 1 ? 'produto não tem' : 'produtos não têm'} marca definida.</p>
      )}
    </section>
  )
}

// ==================== Criação ====================

export function BrandCreatePage() {
  return (
    <section className="space-y-6">
      <div>
        <VoltarMarcas />
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">Nova marca</h1>
      </div>
      <FeedbackMessage
        variante="aviso"
        titulo="Criação de marcas indisponível"
        accao={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/admin/produtos/novo">Novo produto</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/admin/produtos">Ver produtos</Link></Button>
          </div>
        }
      >
        {AVISO_MODELO} Uma marca nova passa a existir quando é indicada num produto.
      </FeedbackMessage>
    </section>
  )
}

// ==================== Edição ====================

export function BrandEditPage() {
  const { id } = useParams()
  const { produtos, erro, carregando, recarregar } = useTodosProdutos()
  const nome = id
  const daMarca = produtos ? produtos.filter(produto => produto.marca === nome) : []

  return (
    <section className="space-y-6">
      <div>
        <VoltarMarcas />
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Editar marca</p>
        <h1 className="break-words font-heading text-2xl font-bold tracking-tight">{nome}</h1>
      </div>

      {carregando && <LoadingState mensagem="A carregar produtos da marca…" />}
      {erro && <ErroCarregamento erro={erro} recarregar={recarregar} />}

      {produtos && !daMarca.length && (
        <EmptyState
          Icone={Award}
          titulo="Marca não encontrada"
          descricao="Nenhum produto tem esta marca."
          accao={<Button asChild variant="outline"><Link to="/admin/marcas">Voltar às marcas</Link></Button>}
        />
      )}

      {daMarca.length > 0 && <>
        <FeedbackMessage variante="info" titulo="Não é possível renomear a marca de uma só vez">
          {AVISO_MODELO}
        </FeedbackMessage>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">
              Produtos desta marca ({daMarca.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {daMarca.map(produto => (
                <li key={produto.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/admin/produtos/${encodeURIComponent(produto.id)}`} className="font-medium hover:underline">{produto.nome}</Link>
                    <p className="text-xs text-muted-foreground">
                      {produto.codigo || 'Sem código'} · {produto.categoria?.nome || 'Sem categoria'} · <span className="font-mono">{formatarMZN(produto.preco)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!produto.activo && <Badge variant="destructive">Inactivo</Badge>}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/produtos/${encodeURIComponent(produto.id)}/editar`}>Editar produto</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </>}
    </section>
  )
}
