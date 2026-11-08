import { PagePlaceholder } from '../PagePlaceholder.jsx'

const criarPagina = title => function Pagina() {
  return <PagePlaceholder title={title} />
}

export const CategoriesPage = criarPagina('Página de categorias.')
export const CategoryPage = criarPagina('Página da categoria.')
export const BrandsPage = criarPagina('Página de marcas.')
export const BrandPage = criarPagina('Página da marca.')
export const SearchPage = criarPagina('Página de pesquisa de produtos.')
export const PromotionsPage = criarPagina('Página de promoções.')
export const NewArrivalsPage = criarPagina('Página de novidades.')
export const BestSellersPage = criarPagina('Página de produtos mais vendidos.')
export const ProductReviewsPage = criarPagina('Página de avaliações do produto.')
export const ProductWarrantyPage = criarPagina('Página de garantia do produto.')
