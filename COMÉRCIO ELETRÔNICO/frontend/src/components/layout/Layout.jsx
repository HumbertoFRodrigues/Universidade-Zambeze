import { Outlet, useLocation } from 'react-router-dom'
import { useCarrinho } from '../../contexto/CarrinhoContexto.jsx'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'
import { PromoPopup } from '../PromoPopup.jsx'
import '../../styles/layout.css'

export function Layout() {
  const { aviso } = useCarrinho()
  const { pathname } = useLocation()

  return <>
    <Header />

    <main className={
      pathname === '/'
        ? 'pagina-inicial'
        : pathname === '/produtos'
          ? 'pagina-catalogo'
          : pathname === '/conta' || pathname.startsWith('/conta/')
            ? 'pagina-conta'
            : ''
    }><Outlet /></main>
    {aviso && <div className="aviso" role="status">{aviso}</div>}
    <Footer />
    <PromoPopup />
  </>
}