import { useProdutos } from '../hooks/useProdutos.js'
import {
  HomeAdvantages,
  HomeBusinesses,
  HomeBrands,
  HomeCategories,
  HomeFeaturedProducts,
  HomeHero,
  HomeContacto,
  HomePagamentos,
  HomeOffers,
  HomeSectors,
} from '../components/home/HomeSections.jsx'
import '../styles/home.css'

export function HomePage() {
  const { produtos } = useProdutos()

  return <div id="home">
    <HomeHero />
    <HomeCategories />
    <HomeFeaturedProducts />
    <HomeOffers />
    <HomeBrands produtos={produtos} />
    <HomeSectors />
    <HomeBusinesses />
    <HomeAdvantages />
    <HomePagamentos />
    <HomeContacto />
  </div>
}