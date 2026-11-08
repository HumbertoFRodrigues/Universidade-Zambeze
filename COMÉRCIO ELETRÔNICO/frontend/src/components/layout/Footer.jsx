import { Link } from 'react-router-dom'
import { useCategorias } from '../../hooks/useCategorias.js'
import { LogoPagamento } from '../LogoPagamento.jsx'
import { categoriasPrincipais } from '../../services/categorias.js'

const informacao = [
  ['Quem somos', '/info/quem-somos'],
  ['Contactos', '/info/contactos'],
  ['Perguntas frequentes', '/info/perguntas-frequentes'],
]

const politicas = [
  ['Termos e condições', '/info/termos'],
  ['Entrega', '/info/entrega'],
  ['Devoluções e reembolso', '/info/devolucao'],
  ['Privacidade', '/info/privacidade'],
  ['Garantia', '/info/garantia'],
]

function Links({ itens }) {
  return <ul>{itens.map(([nome, destino]) => <li key={destino}><Link to={destino}>{nome}</Link></li>)}</ul>
}

export function Footer() {
  const { categorias } = useCategorias()
  return <footer className="hm-footer">
    <div className="hm-container hm-footer__grid">
      <div className="hm-footer__about">
        <Link className="hm-footer__brand" to="/" aria-label="EasyShop - página inicial"><strong>Easy</strong><em>Shop</em></Link>
        <p>Equipamento de segurança física e digital para casas, empresas, lojas e obras. Explore o catálogo ou fale connosco para uma compra por quantidade.</p>
        <Link className="hm-footer__contact-link" to="/info/contactos">Contactos e dados do vendedor</Link>
      </div>
      <nav aria-label="Categorias de produtos">
        <h3>Comprar por categoria</h3>
        <ul>{categoriasPrincipais(categorias).slice(0, 8).map(categoria => <li key={categoria.id}><Link to={`/produtos?categoria=${encodeURIComponent(categoria.nome)}`}>{categoria.nome}</Link></li>)}</ul>
      </nav>
      <nav aria-label="Informação e apoio">
        <h3>Ajuda e informação</h3>
        <Links itens={informacao} />
        <h3 className="hm-footer__h-gap">Políticas</h3>
        <Links itens={politicas} />
      </nav>
      <div>
        <h3>Empresas</h3>
        <p>Precisa de equipar uma equipa ou comprar por quantidade?</p>
        <Link className="hm-footer__seal" to="/empresas">Pedir uma cotação</Link>
        <h3 className="hm-footer__h-gap">Formas de pagamento</h3>
        <div className="hm-footer__pay">{['mpesa', 'emola', 'cartao', 'banco'].map(id => <LogoPagamento key={id} id={id} />)}</div>
      </div>
    </div>
    <div className="hm-footer__bottom">
      <div className="hm-container hm-footer__bottom-in">
        <p>© {new Date().getFullYear()} EasyShop · Comércio electrónico em Moçambique</p>
        <Link to="/info/privacidade">Política de privacidade</Link>
      </div>
    </div>
  </footer>
}
