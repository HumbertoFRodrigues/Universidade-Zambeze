import { PagePlaceholder } from '../PagePlaceholder.jsx'

const criarPagina = title => function Pagina() {
  return <PagePlaceholder title={title} />
}

export const CheckoutContactPage = criarPagina('Etapa de contacto do checkout.')
export const CheckoutAddressPage = criarPagina('Etapa de endereço do checkout.')
export const CheckoutDeliveryPage = criarPagina('Etapa de entrega do checkout.')
export const CheckoutPaymentPage = criarPagina('Etapa de pagamento do checkout.')
export const CheckoutReviewPage = criarPagina('Etapa de revisão do checkout.')
export const CheckoutProcessingPage = criarPagina('Página de processamento do checkout.')
export const CheckoutSuccessPage = criarPagina('Página de sucesso do checkout.')
export const CheckoutFailurePage = criarPagina('Página de falha do checkout.')
export const CheckoutResultPage = criarPagina('Página de resultado do checkout.')
export const CheckoutCancelledPage = criarPagina('Página de cancelamento do checkout.')
