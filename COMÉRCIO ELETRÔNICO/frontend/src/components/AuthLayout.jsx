import { Link } from 'react-router-dom'
import '../styles/auth.css'

// Entrada, registo e recuperação. Desktop: dentro da loja (cabeçalho e rodapé), fotografia
// à esquerda e formulário à direita. Telemóvel: só o formulário, sem cabeçalho nem rodapé.
// Fotografias do Pexels (licença gratuita).
const IMAGENS = {
  login: { src: '/imagens/auth/engenheira-login.jpg', titulo: 'Segurança em cada obra', texto: 'Equipamentos certificados de lojas verificadas, entregues em todo o país.' },
  registo: { src: '/imagens/auth/engenheira-registo.jpg', titulo: 'Junte-se à EasyShop', texto: 'Equipe a sua obra com lojas verificadas, acompanhe encomendas e participe em leilões.' },
}

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, imagem = 'login' }) {
  const foto = IMAGENS[imagem] || IMAGENS.login
  return (
    <div className="auth-ecra">
      <aside className="auth-ecra__foto" style={{ backgroundImage: `linear-gradient(0deg, rgba(17, 17, 20, 0.88) 0%, rgba(17, 17, 20, 0.15) 55%, rgba(17, 17, 20, 0.35) 100%), url("${foto.src}")` }}>
        <div>
          <strong>{foto.titulo}</strong>
          <span>{foto.texto}</span>
          <ul><li>Pagamento M-Pesa e e-Mola</li><li>Lojas verificadas</li><li>Garantia oficial</li></ul>
        </div>
      </aside>
      <section className="auth-ecra__painel">
        <div className="auth-ecra__topo">
          <Link to="/" className="auth-ecra__logo-movel" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--laranja, #f57224)', textDecoration: 'none' }}>EasyShop</Link>
          <Link to="/" className="auth-ecra__voltar">← Voltar à loja</Link>
        </div>
        <div className="auth-ecra__conteudo">
          <header className="auth-page__heading">
            {Icon && <span className="auth-page__icon"><Icon aria-hidden="true" /></span>}
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </header>
          <div className="auth-page__card">{children}</div>
          {footer && <p className="auth-page__footer">{footer}</p>}
        </div>
        <p className="auth-ecra__legal">© {new Date().getFullYear()} EasyShop · <Link to="/info/termos">Termos</Link> · <Link to="/info/privacidade">Privacidade</Link></p>
      </section>
    </div>
  )
}
