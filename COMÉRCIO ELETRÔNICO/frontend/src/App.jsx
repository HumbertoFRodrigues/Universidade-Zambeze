import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { ProductsPage } from './pages/ProductsPage.jsx'
import { ProductPage } from './pages/ProductPage.jsx'
import { CartPage } from './pages/CartPage.jsx'
import { CheckoutPage } from './pages/CheckoutPage.jsx'
import { EmpresasPage } from './pages/EmpresasPage.jsx'
import { AccountPage } from './pages/AccountPage.jsx'
import { ContaLayout } from './components/conta/ContaLayout.jsx'
import { AuthPage } from './pages/AuthPage.jsx'
import { InfoPage } from './pages/InfoPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminPainel from './pages/admin/AdminPainel.jsx'
import AdminEncomendas from './pages/admin/AdminEncomendas.jsx'
import AdminProdutos from './pages/admin/AdminProdutos.jsx'
import AdminCategorias from './pages/admin/AdminCategorias.jsx'
import AdminAvaliacoes from './pages/admin/AdminAvaliacoes.jsx'
import AdminDevolucoes from './pages/admin/AdminDevolucoes.jsx'
import AdminTransferencias from './pages/admin/AdminTransferencias.jsx'
import * as StorePages from './pages/store/StorePages.jsx'
import * as AuthStatusPages from './pages/auth/AuthStatusPages.jsx'
import * as CustomerPages from './pages/customer/CustomerPages.jsx'
import * as InformationPages from './pages/information/InformationPages.jsx'
import * as CheckoutPages from './pages/checkout/CheckoutPages.jsx'
import * as AdminPages from './pages/admin/AdminPlaceholderPages.jsx'
import * as AdminProductPages from './pages/admin/products/ProductPages.jsx'
import * as AdminCategoryPages from './pages/admin/catalog/CategoryPages.jsx'
import * as AdminBrandPages from './pages/admin/catalog/BrandPages.jsx'
import * as AdminStockPages from './pages/admin/stock/StockPages.jsx'
import * as AdminPromotionPages from './pages/admin/promotions/PromotionPages.jsx'
import * as AdminOrderPages from './pages/admin/orders/OrderPages.jsx'
import * as AdminPaymentPages from './pages/admin/payments/PaymentPages.jsx'
import * as AdminDeliveryPages from './pages/admin/deliveries/DeliveryPages.jsx'
import * as AdminReturnPages from './pages/admin/returns/ReturnPages.jsx'
import * as AdminRefundPages from './pages/admin/refunds/RefundPages.jsx'
import * as AdminReviewPages from './pages/admin/reviews/ReviewPages.jsx'
import * as AdminSupportPages from './pages/admin/support/SupportPages.jsx'
import * as AdminSettingsPages from './pages/admin/settings/SettingsPages.jsx'
import * as AdminCompanyPages from './pages/admin/companies/CompanyPages.jsx'
import * as AdminQuotePages from './pages/admin/quotes/QuotePages.jsx'
import * as AdminInvoicePages from './pages/admin/invoices/InvoicePages.jsx'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function LoginSuccessDialog() {
  const location = useLocation()
  const navigate = useNavigate()
  const aberto = location.state?.loginSuccess === true

  const fechar = () => navigate(
    { pathname: location.pathname, search: location.search, hash: location.hash },
    { replace: true, state: null },
  )

  return <Dialog open={aberto} onOpenChange={open => { if (!open) fechar() }}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Login efectuado com sucesso!</DialogTitle>
        <DialogDescription>Já tem sessão iniciada. Pode continuar a navegar na loja.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={fechar}>Continuar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

export function App() {
  return <>
    <Routes>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminPainel />} />
        <Route path="produtos/novo" element={<AdminProductPages.ProductCreatePage />} />
        <Route path="produtos/:id/editar" element={<AdminProductPages.ProductEditPage />} />
        <Route path="produtos/:id/imagens" element={<AdminProductPages.ProductImagesPage />} />
        <Route path="produtos/:id/especificacoes" element={<AdminProductPages.ProductSpecificationsPage />} />
        <Route path="produtos/:id/precos" element={<AdminProductPages.ProductPricesPage />} />
        <Route path="produtos/:id/garantia" element={<AdminProductPages.ProductWarrantyPage />} />
        <Route path="produtos/:id" element={<AdminProductPages.ProductDetailPage />} />
        <Route path="produtos" element={<AdminProdutos />} />

        <Route path="categorias/nova" element={<AdminCategoryPages.CategoryCreatePage />} />
        <Route path="categorias/:id/editar" element={<AdminCategoryPages.CategoryEditPage />} />
        <Route path="categorias/:id" element={<AdminCategoryPages.CategoryDetailPage />} />
        <Route path="categorias" element={<AdminCategorias />} />

        <Route path="marcas/nova" element={<AdminBrandPages.BrandCreatePage />} />
        <Route path="marcas/:id/editar" element={<AdminBrandPages.BrandEditPage />} />
        <Route path="marcas" element={<AdminBrandPages.BrandsPage />} />
        <Route path="stock/baixo" element={<AdminStockPages.LowStockPage />} />
        <Route path="stock/entradas" element={<AdminStockPages.StockEntriesPage />} />
        <Route path="stock/ajustes" element={<AdminStockPages.StockAdjustmentsPage />} />
        <Route path="stock/movimentos" element={<AdminStockPages.StockMovementsPage />} />
        <Route path="stock" element={<AdminStockPages.StockPage />} />
        <Route path="promocoes/nova" element={<AdminPromotionPages.PromotionCreatePage />} />
        <Route path="promocoes/:id/editar" element={<AdminPromotionPages.PromotionEditPage />} />
        <Route path="promocoes/:id" element={<AdminPromotionPages.PromotionDetailPage />} />
        <Route path="promocoes" element={<AdminPromotionPages.PromotionsPage />} />

        <Route path="encomendas/:codigo/historico" element={<AdminOrderPages.OrderHistoryPage />} />
        <Route path="encomendas/:codigo/cancelar" element={<AdminOrderPages.OrderCancelPage />} />
        <Route path="encomendas/:codigo" element={<AdminOrderPages.OrderDetailPage />} />
        <Route path="encomendas" element={<AdminEncomendas />} />
        <Route path="pagamentos/:id" element={<AdminPaymentPages.PaymentDetailPage />} />
        <Route path="pagamentos" element={<AdminPaymentPages.PaymentsPage />} />
        <Route path="transferencias" element={<AdminTransferencias />} />
        <Route path="entregas/:id/actualizar" element={<AdminDeliveryPages.DeliveryUpdatePage />} />
        <Route path="entregas/:id/confirmar" element={<AdminDeliveryPages.DeliveryConfirmPage />} />
        <Route path="entregas/:id" element={<AdminDeliveryPages.DeliveryDetailPage />} />
        <Route path="entregas" element={<AdminDeliveryPages.DeliveriesPage />} />
        <Route path="devolucoes/:id/decisao" element={<AdminReturnPages.ReturnDecisionPage />} />
        <Route path="devolucoes/:id/recepcao" element={<AdminReturnPages.ReturnReceiptPage />} />
        <Route path="devolucoes/:id" element={<AdminReturnPages.ReturnDetailPage />} />
        <Route path="devolucoes" element={<AdminDevolucoes />} />
        <Route path="reembolsos/novo" element={<AdminRefundPages.RefundCreatePage />} />
        <Route path="reembolsos/:id" element={<AdminRefundPages.RefundDetailPage />} />
        <Route path="reembolsos" element={<AdminRefundPages.RefundsPage />} />
        <Route path="avaliacoes/:id" element={<AdminReviewPages.ReviewDetailPage />} />
        <Route path="avaliacoes" element={<AdminAvaliacoes />} />
        <Route path="assistencia/:id" element={<AdminSupportPages.SupportDetailPage />} />
        <Route path="assistencia" element={<AdminSupportPages.SupportPage />} />
        <Route path="reclamacoes/:id" element={<AdminSupportPages.ComplaintDetailPage />} />
        <Route path="reclamacoes" element={<AdminSupportPages.ComplaintsPage />} />
        <Route path="garantias/:id" element={<AdminSupportPages.WarrantyDetailPage />} />
        <Route path="garantias" element={<AdminSupportPages.WarrantiesPage />} />

        <Route path="configuracoes/vendedor" element={<AdminSettingsPages.SellerSettingsPage />} />
        <Route path="configuracoes/contactos" element={<AdminSettingsPages.ContactSettingsPage />} />
        <Route path="configuracoes/localizacao" element={<AdminSettingsPages.LocationSettingsPage />} />
        <Route path="configuracoes/politicas" element={<AdminSettingsPages.PolicySettingsPage />} />
        <Route path="configuracoes/garantias" element={<AdminSettingsPages.WarrantySettingsPage />} />
        <Route path="configuracoes/pagamentos" element={<AdminSettingsPages.PaymentSettingsPage />} />
        <Route path="configuracoes/entregas/modalidades" element={<AdminSettingsPages.DeliveryMethodsSettingsPage />} />
        <Route path="configuracoes/entregas/zonas" element={<AdminSettingsPages.DeliveryZonesSettingsPage />} />
        <Route path="configuracoes/entregas/fretes" element={<AdminSettingsPages.DeliveryFeesSettingsPage />} />
        <Route path="configuracoes" element={<AdminSettingsPages.SettingsPage />} />
        <Route path="cotacoes/descontos" element={<AdminQuotePages.GroupDiscountsPage />} />
        <Route path="cotacoes/:id" element={<AdminQuotePages.QuoteDetailPage />} />
        <Route path="cotacoes" element={<AdminQuotePages.QuotesPage />} />
        <Route path="facturas" element={<AdminInvoicePages.InvoicesPage />} />
        <Route path="empresas/:id" element={<AdminCompanyPages.CompanyDetailPage />} />
        <Route path="empresas" element={<AdminCompanyPages.CompaniesPage />} />
      </Route>

      <Route element={<Layout />}>
        {/* Loja pública */}
        <Route index element={<HomePage />} />
        <Route path="produtos" element={<ProductsPage />} />
        <Route path="produtos/:slug/avaliacoes" element={<StorePages.ProductReviewsPage />} />
        <Route path="produtos/:slug/garantia" element={<StorePages.ProductWarrantyPage />} />
        <Route path="produtos/:slug" element={<ProductPage />} />
        <Route path="categorias/:slug" element={<StorePages.CategoryPage />} />
        <Route path="categorias" element={<StorePages.CategoriesPage />} />
        <Route path="marcas/:slug" element={<StorePages.BrandPage />} />
        <Route path="marcas" element={<StorePages.BrandsPage />} />
        <Route path="pesquisa" element={<StorePages.SearchPage />} />
        <Route path="promocoes" element={<StorePages.PromotionsPage />} />
        <Route path="novidades" element={<StorePages.NewArrivalsPage />} />
        <Route path="mais-vendidos" element={<StorePages.BestSellersPage />} />

        {/* Autenticação */}
        <Route path="entrar" element={<AuthPage key="login" mode="login" />} />
        <Route path="login" element={<AuthPage key="login-legacy" mode="login" />} />
        <Route path="registar" element={<AuthPage key="register" mode="register" />} />
        <Route path="register" element={<AuthPage key="register-legacy" mode="register" />} />
        <Route path="recuperar-palavra-passe" element={<ForgotPassword />} />
        <Route path="recuperar" element={<AuthPage key="recover" mode="recover" />} />
        <Route path="redefinir-palavra-passe" element={<ResetPassword />} />
        <Route path="verificar-contacto" element={<AuthStatusPages.ContactVerificationPage />} />
        <Route path="verificar-contacto/resultado" element={<AuthStatusPages.ContactVerificationResultPage />} />
        <Route path="sessao-expirada" element={<AuthStatusPages.SessionExpiredPage />} />
        <Route path="acesso-negado" element={<AuthStatusPages.AccessDeniedPage />} />

        {/* Conta do cliente */}
        <Route element={<ContaLayout />}>
          <Route path="conta/empresa" element={<CustomerPages.CompanyPage />} />
          <Route path="conta/perfil/editar" element={<CustomerPages.EditProfilePage />} />
          <Route path="conta/perfil" element={<CustomerPages.ProfilePage />} />
          <Route path="conta/palavra-passe" element={<CustomerPages.ChangePasswordPage />} />
          <Route path="conta/enderecos/novo" element={<CustomerPages.NewAddressPage />} />
          <Route path="conta/enderecos/:id/editar" element={<CustomerPages.EditAddressPage />} />
          <Route path="conta/enderecos/:id" element={<CustomerPages.AddressDetailPage />} />
          <Route path="conta/enderecos" element={<CustomerPages.AddressesPage />} />
          <Route path="conta/preferencias" element={<CustomerPages.PreferencesPage />} />
          <Route path="conta/encomendas/:codigo/avaliar" element={<CustomerPages.RateOrderPage />} />
          <Route path="conta/encomendas/:codigo" element={<CustomerPages.OrderDetailPage />} />
          <Route path="conta/encomendas" element={<CustomerPages.OrdersPage />} />
          <Route path="conta/pagamentos/:id/resultado" element={<CustomerPages.PaymentResultPage />} />
          <Route path="conta/pagamentos/:id" element={<CustomerPages.PaymentDetailPage />} />
          <Route path="conta/pagamentos" element={<CustomerPages.PaymentsPage />} />
          <Route path="conta/avaliacoes" element={<CustomerPages.ReviewsPage />} />
          <Route path="conta/devolucoes/nova" element={<CustomerPages.NewReturnPage />} />
          <Route path="conta/devolucoes/:id/acompanhar" element={<CustomerPages.TrackReturnPage />} />
          <Route path="conta/devolucoes/:id" element={<CustomerPages.ReturnDetailPage />} />
          <Route path="conta/devolucoes" element={<CustomerPages.ReturnsPage />} />
          <Route path="conta/reembolsos/:id" element={<CustomerPages.RefundDetailPage />} />
          <Route path="conta/reembolsos" element={<CustomerPages.RefundsPage />} />
          <Route path="conta/garantias/nova" element={<CustomerPages.NewWarrantyPage />} />
          <Route path="conta/garantias/:id" element={<CustomerPages.WarrantyDetailPage />} />
          <Route path="conta/garantias" element={<CustomerPages.WarrantiesPage />} />
          <Route path="conta/reclamacoes/nova" element={<CustomerPages.NewComplaintPage />} />
          <Route path="conta/reclamacoes/:id" element={<CustomerPages.ComplaintDetailPage />} />
          <Route path="conta/reclamacoes" element={<CustomerPages.ComplaintsPage />} />
          <Route path="conta/assistencia/nova" element={<CustomerPages.NewSupportPage />} />
          <Route path="conta/assistencia/:id" element={<CustomerPages.SupportDetailPage />} />
          <Route path="conta/assistencia" element={<CustomerPages.SupportPage />} />
          <Route path="conta" element={<AccountPage />} />
        </Route>

        {/* Encomendas de convidados */}
        <Route path="acompanhar-encomenda/resultado" element={<CustomerPages.GuestOrderTrackingResultPage />} />
        <Route path="acompanhar-encomenda/:codigo/entrega" element={<CustomerPages.GuestOrderDeliveryPage />} />
        <Route path="acompanhar-encomenda/:codigo" element={<CustomerPages.GuestOrderDetailPage />} />
        <Route path="acompanhar-encomenda" element={<CustomerPages.GuestOrderTrackingPage />} />

        {/* Checkout: o fluxo actual permanece disponível em /pagamento e /checkout. */}
        <Route path="carrinho" element={<CartPage />} />
        <Route path="pagamento" element={<CheckoutPage />} />
        <Route path="checkout/contacto" element={<CheckoutPages.CheckoutContactPage />} />
        <Route path="checkout/endereco" element={<CheckoutPages.CheckoutAddressPage />} />
        <Route path="checkout/entrega" element={<CheckoutPages.CheckoutDeliveryPage />} />
        <Route path="checkout/pagamento" element={<CheckoutPages.CheckoutPaymentPage />} />
        <Route path="checkout/revisao" element={<CheckoutPages.CheckoutReviewPage />} />
        <Route path="checkout/processamento" element={<CheckoutPages.CheckoutProcessingPage />} />
        <Route path="checkout/sucesso" element={<CheckoutPages.CheckoutSuccessPage />} />
        <Route path="checkout/falha" element={<CheckoutPages.CheckoutFailurePage />} />
        <Route path="checkout/resultado/:codigo" element={<CheckoutPages.CheckoutResultPage />} />
        <Route path="checkout/cancelado" element={<CheckoutPages.CheckoutCancelledPage />} />
        <Route path="checkout" element={<CheckoutPage />} />

        {/* Informação institucional */}
        <Route path="sobre" element={<Navigate to="/info/quem-somos" replace />} />
        <Route path="vendedor" element={<EmpresasPage />} />
        <Route path="contactos" element={<Navigate to="/info/contactos" replace />} />
        <Route path="politica-de-privacidade" element={<Navigate to="/info/privacidade" replace />} />
        <Route path="termos-e-condicoes" element={<Navigate to="/info/termos" replace />} />
        <Route path="politica-de-entrega" element={<Navigate to="/info/entrega" replace />} />
        <Route path="politica-de-devolucao" element={<Navigate to="/info/devolucao" replace />} />
        <Route path="garantias" element={<Navigate to="/info/garantia" replace />} />
        <Route path="metodos-de-pagamento" element={<InformationPages.PaymentMethodsPage />} />
        <Route path="modalidades-de-entrega" element={<InformationPages.DeliveryMethodsPage />} />
        <Route path="zonas-de-entrega" element={<InformationPages.DeliveryZonesPage />} />
        <Route path="empresas" element={<EmpresasPage />} />
        <Route path="info/:pagina" element={<InfoPage />} />

        {/* Sistema */}
        <Route path="500" element={<AdminPages.ServerErrorPage />} />
        <Route path="servico-indisponivel" element={<AdminPages.ServiceUnavailablePage />} />
        <Route path="manutencao" element={<AdminPages.MaintenancePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    <Toaster />
    <LoginSuccessDialog />
  </>
}
