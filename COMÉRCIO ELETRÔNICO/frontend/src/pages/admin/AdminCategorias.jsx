import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderTree, MoreHorizontal, Plus, Search } from 'lucide-react'
import { categoriasApi } from '../../services/api.js'
import { ordenarHierarquia, useCategoriasAdmin } from '../../hooks/useCategoriasAdmin.js'
import ConfirmarApagar from '../../components/admin/ConfirmarApagar.jsx'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const caminhoCategoria = (categoria, sub = '') => `/admin/categorias/${categoria.id}${sub ? `/${sub}` : ''}`

function EstadoCategoria({ categoria }) {
  return categoria.activo
    ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Activa</Badge>
    : <Badge variant="secondary">Inactiva</Badge>
}

function Accoes({ categoria, onDesactivar, onReactivar }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`Acções para ${categoria.nome}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to={caminhoCategoria(categoria)}>Ver detalhes</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to={caminhoCategoria(categoria, 'editar')}>Editar</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        {categoria.activo
          ? <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDesactivar(categoria)}>Desactivar</DropdownMenuItem>
          : <DropdownMenuItem onSelect={() => onReactivar(categoria)}>Reactivar</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdminCategorias() {
  const { categorias, erro, carregando, recarregar, actualizarCategoria } = useCategoriasAdmin()
  const [pesquisa, setPesquisa] = useState('')
  const [estado, setEstado] = useState('todas')
  const [nivel, setNivel] = useState('todos')
  const [aDesactivar, setADesactivar] = useState(null)
  const [mensagem, setMensagem] = useState({ erro: '', sucesso: '' })

  const nomes = new Map((categorias || []).map(categoria => [categoria.id, categoria.nome]))
  const termo = pesquisa.trim().toLocaleLowerCase('pt')
  const filtrado = Boolean(termo) || estado !== 'todas' || nivel !== 'todos'
  // A listagem completa é carregada de uma vez, por isso a filtragem local é exacta.
  const visiveis = ordenarHierarquia(categorias || []).filter(categoria =>
    (!termo || categoria.nome.toLocaleLowerCase('pt').includes(termo)) &&
    (estado === 'todas' || (estado === 'activas') === categoria.activo) &&
    (nivel === 'todos' || (nivel === 'principais') === (categoria.categoriaPaiId == null))
  )

  const desactivar = async () => {
    const categoria = aDesactivar
    try {
      const resposta = await categoriasApi.apagar(categoria.id)
      actualizarCategoria(resposta.categoria)
      setMensagem({ erro: '', sucesso: `Categoria "${categoria.nome}" desactivada.` })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    }
  }

  const reactivar = async categoria => {
    try {
      const resposta = await categoriasApi.actualizar(categoria.id, { nome: categoria.nome, activo: true })
      actualizarCategoria(resposta.categoria)
      setMensagem({ erro: '', sucesso: `Categoria "${categoria.nome}" reactivada.` })
    } catch (error) {
      setMensagem({ erro: error.message, sucesso: '' })
    }
  }

  const limparFiltros = () => { setPesquisa(''); setEstado('todas'); setNivel('todos') }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            {categorias
              ? `${categorias.length} ${categorias.length === 1 ? 'categoria' : 'categorias'} no catálogo${filtrado ? ` · ${visiveis.length} visíveis` : ''}.`
              : 'Organização do catálogo por categorias e subcategorias.'}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/categorias/nova"><Plus className="h-4 w-4" />Nova categoria</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem]">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="categorias-pesquisa">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="categorias-pesquisa" type="search" className="pl-9" placeholder="Nome da categoria" value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categorias-estado">Estado</Label>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger id="categorias-estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="activas">Activas</SelectItem>
              <SelectItem value="inactivas">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categorias-nivel">Nível</Label>
          <Select value={nivel} onValueChange={setNivel}>
            <SelectTrigger id="categorias-nivel"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="principais">Principais</SelectItem>
              <SelectItem value="subcategorias">Subcategorias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mensagem.erro && <FeedbackMessage variante="erro" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.erro}</FeedbackMessage>}
      {mensagem.sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setMensagem({ erro: '', sucesso: '' })}>{mensagem.sucesso}</FeedbackMessage>}

      {carregando && <LoadingState mensagem="A carregar categorias…" />}

      {erro && (
        <FeedbackMessage
          variante="erro"
          titulo="Não foi possível carregar as categorias."
          accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}
        >
          {erro}
        </FeedbackMessage>
      )}

      {categorias && !visiveis.length && (
        <EmptyState
          Icone={FolderTree}
          titulo={filtrado ? 'Nenhuma categoria corresponde aos filtros.' : 'Ainda não existem categorias.'}
          descricao={filtrado ? 'Altere a pesquisa ou os filtros seleccionados.' : 'Crie a primeira categoria do catálogo.'}
          accao={filtrado
            ? <Button variant="outline" onClick={limparFiltros}>Limpar filtros</Button>
            : <Button asChild><Link to="/admin/categorias/nova">Nova categoria</Link></Button>}
        />
      )}

      {categorias && visiveis.length > 0 && <>
        {/* Telemóvel */}
        <div className="space-y-3 md:hidden">
          {visiveis.map(categoria => (
            <Card key={categoria.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <Link to={caminhoCategoria(categoria)} className="block font-medium hover:underline">{categoria.nome}</Link>
                  <p className="text-xs text-muted-foreground">
                    {categoria.categoriaPaiId ? `Subcategoria de ${nomes.get(categoria.categoriaPaiId) || '—'}` : 'Categoria principal'}
                    {' · '}{categoria.totalProdutos} {categoria.totalProdutos === 1 ? 'produto' : 'produtos'}
                  </p>
                  <EstadoCategoria categoria={categoria} />
                </div>
                <Accoes categoria={categoria} onDesactivar={setADesactivar} onReactivar={reactivar} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Computador e tablet */}
        <div className="hidden rounded-md border bg-white md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria principal</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead><span className="sr-only">Acções</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map(categoria => (
                <TableRow key={categoria.id}>
                  <TableCell>
                    {/* Indentação da hierarquia apenas quando a lista não está filtrada. */}
                    <span style={filtrado ? undefined : { paddingLeft: `${categoria.nivel * 1.25}rem` }} className="inline-flex items-center gap-1">
                      {!filtrado && categoria.nivel > 0 && <span className="text-muted-foreground" aria-hidden="true">↳</span>}
                      <Link to={caminhoCategoria(categoria)} className={`hover:underline ${categoria.nivel === 0 ? 'font-semibold' : ''}`}>{categoria.nome}</Link>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{categoria.categoriaPaiId ? nomes.get(categoria.categoriaPaiId) || '—' : '—'}</TableCell>
                  <TableCell className="text-right font-mono">{categoria.totalProdutos}</TableCell>
                  <TableCell><EstadoCategoria categoria={categoria} /></TableCell>
                  <TableCell className="text-right"><Accoes categoria={categoria} onDesactivar={setADesactivar} onReactivar={reactivar} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>}

      <ConfirmarApagar
        aberto={Boolean(aDesactivar)}
        onOpenChange={aberto => { if (!aberto) setADesactivar(null) }}
        titulo="Desactivar categoria?"
        descricao={aDesactivar ? `"${aDesactivar.nome}" deixará de aparecer na lista de categorias da loja. Os produtos e as subcategorias associados não são alterados.` : ''}
        rotuloConfirmar="Desactivar"
        onConfirmar={desactivar}
      />
    </section>
  )
}
