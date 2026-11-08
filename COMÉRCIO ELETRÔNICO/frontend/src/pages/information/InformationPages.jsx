import { PagePlaceholder } from '../PagePlaceholder.jsx'

const criarPagina = title => function Pagina() {
  return <PagePlaceholder title={title} />
}

export const PaymentMethodsPage = criarPagina('Página de métodos de pagamento.')
export const DeliveryMethodsPage = criarPagina('Página de modalidades de entrega.')
export const DeliveryZonesPage = criarPagina('Página de zonas de entrega.')
