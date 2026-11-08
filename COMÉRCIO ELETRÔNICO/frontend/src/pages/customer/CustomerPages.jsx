import { PagePlaceholder } from '../PagePlaceholder.jsx'

export { ProfilePage, EditProfilePage, ChangePasswordPage, PreferencesPage } from './ProfilePages.jsx'
export { AddressesPage, NewAddressPage, AddressDetailPage, EditAddressPage } from './AddressPages.jsx'
export { OrdersPage, OrderDetailPage, RateOrderPage } from './OrderPages.jsx'
export { PaymentsPage, PaymentDetailPage, PaymentResultPage } from './PaymentPages.jsx'
export { ReviewsPage } from './ReviewPages.jsx'
export { CompanyPage } from './CompanyPages.jsx'
export { ReturnsPage, NewReturnPage, ReturnDetailPage, TrackReturnPage } from './ReturnPages.jsx'
export { RefundsPage, RefundDetailPage } from './RefundPages.jsx'
export {
  WarrantiesPage, NewWarrantyPage, WarrantyDetailPage,
  ComplaintsPage, NewComplaintPage, ComplaintDetailPage,
  SupportPage, NewSupportPage, SupportDetailPage,
} from './SupportRequestPages.jsx'

const criarPagina = title => function Pagina() {
  return <PagePlaceholder title={title} />
}

export const GuestOrderTrackingPage = criarPagina('Página de acompanhamento de encomenda.')
export const GuestOrderTrackingResultPage = criarPagina('Resultado do acompanhamento da encomenda.')
export const GuestOrderDetailPage = criarPagina('Página de detalhe da encomenda.')
export const GuestOrderDeliveryPage = criarPagina('Página de entrega da encomenda.')
