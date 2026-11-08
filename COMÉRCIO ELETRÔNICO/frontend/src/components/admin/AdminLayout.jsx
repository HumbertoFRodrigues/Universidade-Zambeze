import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Star,
  RotateCcw,
  Store,
  LogOut,
  Menu,
  Award,
  Warehouse,
  BadgePercent,
  CreditCard,
  Truck,
  Settings,
  Building2,
  FileText,
  Receipt,
  Landmark,
} from 'lucide-react'

const LINKS = [
  { to: '/admin', label: 'Painel', Icone: LayoutDashboard },
  { to: '/admin/encomendas', label: 'Encomendas', Icone: ShoppingCart },
  { to: '/admin/empresas', label: 'Empresas', Icone: Building2 },
  { to: '/admin/cotacoes', label: 'Cotações', Icone: FileText },
  { to: '/admin/pagamentos', label: 'Pagamentos', Icone: CreditCard },
  { to: '/admin/transferencias', label: 'Transferências', Icone: Landmark },
  { to: '/admin/facturas', label: 'Facturas', Icone: Receipt },
  { to: '/admin/entregas', label: 'Entregas', Icone: Truck },
  { to: '/admin/produtos', label: 'Produtos', Icone: Package },
  { to: '/admin/categorias', label: 'Categorias', Icone: Tags },
  { to: '/admin/marcas', label: 'Marcas', Icone: Award },
  { to: '/admin/stock', label: 'Stock', Icone: Warehouse },
  { to: '/admin/promocoes', label: 'Promoções', Icone: BadgePercent },
  { to: '/admin/devolucoes', label: 'Devoluções', Icone: RotateCcw },
  { to: '/admin/avaliacoes', label: 'Avaliações', Icone: Star },
  { to: '/admin/configuracoes', label: 'Configurações', Icone: Settings },
]

function NavegacaoAdmin({ onNavegar, className = '' }) {
  return (
    <nav aria-label="Administração" className={`flex flex-col gap-1 ${className}`}>
      {LINKS.map(link => {
        const Icone = link.Icone
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            onClick={onNavegar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icone className="h-4 w-4 shrink-0" />
            {link.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function AdminLayout() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth()
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">A verificar sessão…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (user?.perfil !== 'ADMINISTRADOR') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Acesso restrito</h1>
        <p className="mt-2 text-slate-600">Esta área está reservada à administração da EasyShop.</p>
        <Link to="/" className="mt-4 text-primary hover:underline">Voltar à loja</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 shadow-sm sm:gap-3 sm:px-4 lg:px-6">
        {/* Menu em gaveta (telemóvel e tablet) */}
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Abrir menu de administração">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
            <SheetHeader className="border-b border-slate-200 p-4 text-left">
              <SheetTitle className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-slate-800">
                EasyShop · Admin
              </SheetTitle>
              <SheetDescription className="truncate text-xs">
                {user?.nome || user?.email || 'Administração'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-3">
              <NavegacaoAdmin onNavegar={() => setMenuAberto(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Link
          to="/admin"
          className="min-w-0 truncate font-heading text-sm font-bold uppercase tracking-[0.2em] text-slate-800"
        >
          EasyShop · Admin
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {user?.nome && (
            <span className="hidden max-w-[14rem] truncate text-sm text-slate-600 md:inline">{user.nome}</span>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/" aria-label="Ver loja">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Ver loja</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void logout()} aria-label="Sair">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (computador) */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
          <NavegacaoAdmin />
        </aside>

        {/* Conteúdo Principal */}
        {/* Ocupa toda a largura disponível, com o mesmo padding à esquerda e à direita.
            mx-0/max-w-none anulam a regra global `main` (global.css), pensada para a loja. */}
        {/* [&_.grid>*]:min-w-0 — filhos de grelhas encolhem: tabelas largas fazem scroll em vez de alargar a página. */}
        <main className="mx-0 min-w-0 max-w-none flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 [&_.grid>*]:min-w-0 [&_h1]:mb-0 [&_td]:align-top">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
