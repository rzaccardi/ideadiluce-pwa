import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AdminAuthProvider } from '@/context/admin-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { LoginPage } from '@/pages/login/login-page'
import { ShippingPage } from '@/pages/shipping/shipping-page'
import { SocialProofPage } from '@/pages/social-proof/social-proof-page'
import { OrdersPage } from '@/pages/orders/orders-page'
import { OrderDetailPage } from '@/pages/orders/order-detail-page'
import { RestockDetailPage } from '@/pages/restock/restock-detail-page'
import { RestockPage } from '@/pages/restock/restock-page'
import { AbandonedCartsPage } from '@/pages/abandoned-carts/abandoned-carts-page'
import { AbandonedCartDetailPage } from '@/pages/abandoned-carts/abandoned-cart-detail-page'
import { SitePagesPage } from '@/pages/site/site-pages-page'
import { ProfessionalRequestsPage } from '@/pages/professional-requests/professional-requests-page'
import { ProfessionalRequestDetailPage } from '@/pages/professional-requests/professional-request-detail-page'
import { TaxRulesPage } from '@/pages/tax-rules/tax-rules-page'
import { IntegrationLogsPage } from '@/pages/integration-logs/integration-logs-page'
import { DocumentDownloadsPage } from '@/pages/document-downloads/document-downloads-page'
import { SyncQueuePage } from '@/pages/sync-queue/sync-queue-page'
import { OdooPricelistsPage } from '@/pages/odoo/pricelists-page'
import { OdooQuotationDetailPage } from '@/pages/odoo/quotation-detail-page'
import { OdooQuotationsPage } from '@/pages/odoo/quotations-page'

export function App() {
  return (
    <AdminAuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/orders" replace />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
              <Route path="abandoned-carts/:id" element={<AbandonedCartDetailPage />} />
              <Route path="restock" element={<RestockPage />} />
              <Route path="restock/:id" element={<RestockDetailPage />} />
              <Route path="shipping" element={<ShippingPage />} />
              <Route path="tax-rules" element={<TaxRulesPage />} />
              <Route path="integration-logs" element={<IntegrationLogsPage />} />
              <Route path="document-downloads" element={<DocumentDownloadsPage />} />
              <Route path="odoo/quotations" element={<OdooQuotationsPage />} />
              <Route path="odoo/quotations/:id" element={<OdooQuotationDetailPage />} />
              <Route path="odoo/pricelists" element={<OdooPricelistsPage />} />
              <Route path="sync-queue" element={<SyncQueuePage />} />
              <Route path="social-proof" element={<SocialProofPage />} />
              <Route path="site" element={<SitePagesPage />} />
              <Route path="professional-requests" element={<ProfessionalRequestsPage />} />
              <Route path="professional-requests/:id" element={<ProfessionalRequestDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  )
}
