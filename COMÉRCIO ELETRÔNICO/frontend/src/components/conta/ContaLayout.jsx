import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import LoadingState from '../common/LoadingState.jsx'
import '../../styles/conta.css'

const LIGACOES = [
  { to: '/conta', rotulo: 'Resumo', end: true },
  { to: '/conta/perfil', rotulo: 'Perfil' },
  { to: '/conta/encomendas', rotulo: 'Encomendas' },
  { to: '/conta/pagamentos', rotulo: 'Pagamentos' },
  { to: '/conta/avaliacoes', rotulo: 'Avaliações' },
  { to: '/conta/devolucoes', rotulo: 'Devoluções' },
  { to: '/conta/reembolsos', rotulo: 'Reembolsos' },
  { to: '/conta/garantias', rotulo: 'Garantias' },
  { to: '/conta/reclamacoes', rotulo: 'Reclamações' },
  { to: '/conta/assistencia', rotulo: 'Assistência' },
  { to: '/conta/enderecos', rotulo: 'Endereços' },
  { to: '/conta/palavra-passe', rotulo: 'Palavra-passe' },
  { to: '/conta/preferencias', rotulo: 'Preferências' },
]

// Contas de empresa: sem compras directas, por isso só as secções que se aplicam.
const LIGACOES_EMPRESA = [
  { to: '/conta/empresa', rotulo: 'A minha empresa' },
  { to: '/empresas', rotulo: 'Cotações' },
  { to: '/conta/encomendas', rotulo: 'Encomendas' },
  { to: '/conta/perfil', rotulo: 'Perfil' },
  { to: '/conta/assistencia', rotulo: 'Assistência' },
  { to: '/conta/palavra-passe', rotulo: 'Palavra-passe' },
]

// Protege as páginas da conta: sem sessão (ou com sessão expirada, que o
// AuthContext limpa ao receber 401) o cliente é enviado para o login.
export function ContaLayout() {
  const { user, isLoadingAuth, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [aSair, setASair] = useState(false)

  if (isLoadingAuth) return <LoadingState mensagem="A verificar a sessão…" />
  if (!user) return <Navigate to="/login" state={{ from: location.state?.from }} replace />

  const aoSair = async () => {
    setASair(true)
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return <section className="conta-area">
    <aside className="conta-menu" aria-label="Menu da conta">
      <div className="conta-menu__perfil">
        <span className="conta-menu__inicial" aria-hidden="true">{user.nome.trim().charAt(0).toUpperCase()}</span>
        <div className="conta-menu__identidade">
          <p className="conta-menu__ola">Olá, {user.nome.split(' ')[0]}</p>
          <p className="conta-menu__email" title={user.email}>{user.email}</p>
        </div>
      </div>
      <nav className="conta-menu__nav">
        {(user.perfil === 'EMPRESA' ? LIGACOES_EMPRESA : LIGACOES).map(ligacao => (
          <NavLink key={ligacao.to} to={ligacao.to} end={ligacao.end} className="conta-menu__link">{ligacao.rotulo}</NavLink>
        ))}
      </nav>
      <div className="conta-menu__accoes">
        <Link className="botao botao-claro botao-pequeno" to={user.perfil === 'EMPRESA' ? '/empresas' : '/produtos'}>{user.perfil === 'EMPRESA' ? 'Cotações' : 'Continuar a comprar'}</Link>
        <button type="button" className="botao botao-pequeno" onClick={aoSair} disabled={aSair}>{aSair ? 'A sair…' : 'Sair'}</button>
      </div>
    </aside>
    <div className="conta-conteudo">
      <Outlet />
    </div>
  </section>
}

export function ContaCabecalho({ titulo, descricao, voltar, accao }) {
  return <header className="conta-cabecalho">
    {voltar && <Link className="conta-voltar" to={voltar.to}>← {voltar.rotulo}</Link>}
    <div className="conta-cabecalho__linha">
      <h1>{titulo}</h1>
      {accao}
    </div>
    {descricao && <p className="suave">{descricao}</p>}
  </header>
}

// Usado quando o backend ainda não disponibiliza a operação: nada é gravado.
export function FuncionalidadeIndisponivel({ titulo = 'Funcionalidade ainda não disponível', children, accao }) {
  return <div className="conta-aviso" role="status">
    <strong>{titulo}</strong>
    {children && <p>{children}</p>}
    {accao && <div className="conta-links">{accao}</div>}
  </div>
}
