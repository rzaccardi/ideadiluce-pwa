import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AdminAuthProvider } from '@/context/admin-auth'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { LoginPage } from '@/pages/login/login-page'
import { ShippingPage } from '@/pages/shipping/shipping-page'
import { SocialProofPage } from '@/pages/social-proof/social-proof-page'
import { RestockDetailPage } from '@/pages/restock/restock-detail-page'
import { RestockPage } from '@/pages/restock/restock-page'
import { AbandonedCartsPage } from '@/pages/abandoned-carts/abandoned-carts-page'
import { AbandonedCartDetailPage } from '@/pages/abandoned-carts/abandoned-cart-detail-page'
import { ProfessionalRequestsPage } from '@/pages/professional-requests/professional-requests-page'
import { ProfessionalRequestDetailPage } from '@/pages/professional-requests/professional-request-detail-page'
import { SiteInquiriesPage } from '@/pages/site-inquiries/site-inquiries-page'
import { SiteInquiryDetailPage } from '@/pages/site-inquiries/site-inquiry-detail-page'
import { TaxRulesPage } from '@/pages/tax-rules/tax-rules-page'
import { SearchAnalyticsPage } from '@/pages/search-analytics/search-analytics-page'
import { CatalogCachePage } from '@/pages/catalog-cache/catalog-cache-page'

const OrdersPage = lazy(() =>
  import('@/pages/orders/orders-page').then((m) => ({ default: m.OrdersPage })),
)
const OrderDetailPage = lazy(() =>
  import('@/pages/orders/order-detail-page').then((m) => ({ default: m.OrderDetailPage })),
)
const GuidesListPage = lazy(() =>
  import('@/pages/guides/guides-list-page').then((m) => ({ default: m.GuidesListPage })),
)
const GuideDetailPage = lazy(() =>
  import('@/pages/guides/guide-detail-page').then((m) => ({ default: m.GuideDetailPage })),
)
const SeoPage = lazy(() => import('@/pages/seo/seo-page').then((m) => ({ default: m.SeoPage })))
const SitePagesListPage = lazy(() =>
  import('@/pages/site/site-pages-list-page').then((m) => ({ default: m.SitePagesListPage })),
)
const SitePageDetailPage = lazy(() =>
  import('@/pages/site/site-page-detail-page').then((m) => ({ default: m.SitePageDetailPage })),
)
const OdooPricelistsPage = lazy(() =>
  import('@/pages/odoo/pricelists-page').then((m) => ({ default: m.OdooPricelistsPage })),
)
const OdooQuotationDetailPage = lazy(() =>
  import('@/pages/odoo/quotation-detail-page').then((m) => ({ default: m.OdooQuotationDetailPage })),
)
const OdooQuotationsPage = lazy(() =>
  import('@/pages/odoo/quotations-page').then((m) => ({ default: m.OdooQuotationsPage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Caricamento…
    </div>
  )
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

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
              <Route
                path="orders"
                element={
                  <LazyPage>
                    <OrdersPage />
                  </LazyPage>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <LazyPage>
                    <OrderDetailPage />
                  </LazyPage>
                }
              />
              <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
              <Route path="abandoned-carts/:id" element={<AbandonedCartDetailPage />} />
              <Route path="restock" element={<RestockPage />} />
              <Route path="restock/:id" element={<RestockDetailPage />} />
              <Route path="shipping" element={<ShippingPage />} />
              <Route path="tax-rules" element={<TaxRulesPage />} />
              <Route path="search-analytics" element={<SearchAnalyticsPage />} />
              <Route
                path="odoo/quotations"
                element={
                  <LazyPage>
                    <OdooQuotationsPage />
                  </LazyPage>
                }
              />
              <Route
                path="odoo/quotations/:id"
                element={
                  <LazyPage>
                    <OdooQuotationDetailPage />
                  </LazyPage>
                }
              />
              <Route
                path="odoo/pricelists"
                element={
                  <LazyPage>
                    <OdooPricelistsPage />
                  </LazyPage>
                }
              />
              <Route path="catalog-cache" element={<CatalogCachePage />} />
              <Route path="sync-queue" element={<Navigate to="/catalog-cache" replace />} />
              <Route path="social-proof" element={<SocialProofPage />} />
              <Route
                path="site"
                element={
                  <LazyPage>
                    <SitePagesListPage />
                  </LazyPage>
                }
              />
              <Route
                path="site/:pageKey"
                element={
                  <LazyPage>
                    <SitePageDetailPage />
                  </LazyPage>
                }
              />
              <Route
                path="guides"
                element={
                  <LazyPage>
                    <GuidesListPage />
                  </LazyPage>
                }
              />
              <Route
                path="guides/:slug"
                element={
                  <LazyPage>
                    <GuideDetailPage />
                  </LazyPage>
                }
              />
              <Route
                path="seo"
                element={
                  <LazyPage>
                    <SeoPage />
                  </LazyPage>
                }
              />
              <Route path="professional-requests" element={<ProfessionalRequestsPage />} />
              <Route path="professional-requests/:id" element={<ProfessionalRequestDetailPage />} />
              <Route path="site-inquiries" element={<SiteInquiriesPage />} />
              <Route path="site-inquiries/:id" element={<SiteInquiryDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  )
}
