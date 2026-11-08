import { Link, NavLink, useParams } from 'react-router-dom'
import { ArrowLeft, PackageX } from 'lucide-react'
import { useProdutoAdmin } from '../../hooks/useProdutoAdmin.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

const SECCOES = [
  { caminho: '', label: 'Detalhes' },
  { caminho: 'editar', label: 'Editar' },
  { caminho: 'imagens', label: 'Imagens' },
  { caminho: 'especificacoes', label: 'Especificações' },
  { caminho: 'precos', label: 'Preços' },
  { caminho: 'garantia', label: 'Garantia' },
]

function VoltarProdutos() {
  return (
    <Link to="/admin/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Produtos
    </Link>
  )
}

// Estrutura comum às páginas /admin/produtos/:id/*. O conteúdo recebe o produto
// carregado e uma função para substituir o produto após confirmação do backend.
export default function ProdutoAdminPagina({ titulo, descricao, children }) {
  const { id } = useParams()
  const { produto, erro, carregando, recarregar, definirProduto } = useProdutoAdmin(id)

  if (carregando) return <LoadingState mensagem="A carregar produto…" />

  if (erro) {
    return (
      <section className="space-y-4">
        <VoltarProdutos />
        <FeedbackMessage
          variante="erro"
          titulo="Não foi possível carregar o produto."
          accao={<Button variant="outline" size="sm" onClick={recarregar}>Tentar novamente</Button>}
        >
          {erro}
        </FeedbackMessage>
      </section>
    )
  }

  if (!produto) {
    return (
      <section className="space-y-4">
        <VoltarProdutos />
        <EmptyState
          Icone={PackageX}
          titulo="Produto não encontrado"
          descricao="O produto indicado não existe ou foi removido."
          accao={<Button asChild variant="outline"><Link to="/admin/produtos">Voltar à lista de produtos</Link></Button>}
        />
      </section>
    )
  }

  const base = `/admin/produtos/${encodeURIComponent(produto.id)}`

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <VoltarProdutos />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{titulo}</p>
            <h1 className="break-words font-heading text-2xl font-bold tracking-tight">{produto.nome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {produto.codigo || 'Sem código'} · {produto.categoria?.nome || 'Sem categoria'}
            </p>
          </div>
          <Badge variant={produto.activo ? 'secondary' : 'destructive'}>{produto.activo ? 'Activo' : 'Inactivo'}</Badge>
        </div>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>

      <nav aria-label="Secções do produto" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
        {SECCOES.map(seccao => (
          <NavLink
            key={seccao.caminho}
            to={seccao.caminho ? `${base}/${seccao.caminho}` : base}
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

      {/* A chave reinicia os rascunhos locais quando se muda de produto. */}
      <div key={produto.id}>{children({ produto, definirProduto })}</div>
    </section>
  )
}
