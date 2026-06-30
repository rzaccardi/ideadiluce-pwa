import { apiClient, API_BASE } from '@/api/client'
import { getSitemapUrl } from '@/api/request'
import { ApiRequestError, type ApiFailureBody } from '@/types/api'
import { getIntegrationsToken } from '@/lib/env'
import type {
  CartDTO,
  CartStockCheckDTO,
  CheckoutStartDTO,
  CheckoutSessionDTO,
  OrderDTO,
  OrderDetailDTO,
  OrderReorderResultDTO,
  QuoteCheckoutDTO,
  QuoteDetailDTO,
  QuoteRequestDTO,
  InvoiceDTO,
  PaymentConfirmDTO,
  PaymentSessionDTO,
  StripeClientConfigDTO,
  PaymentUrlDTO,
  PwaOrderStatusResponseDTO,
  ThankYouOrderDTO,
  PwaPaymentMethodDTO,
  ShippingQuotesResponseDTO,
  ProductCardDTO,
  ProductSocialProofDTO,
  StockRestockRequestDTO,
  UserAddressDTO,
  AuthMeDTO,
  AuthRefreshDTO,
  ImpersonationInfoDTO,
  UserDTO,
  WishlistItemDTO,
  ProfessionalRequestSummaryDTO,
  UserPatchResponseDTO,
} from '@/types/dto'
import type { ArflyProductDetailResponse, ArflyProductListResponse } from '@/lib/arfly/types'
import { toArflyLang } from '@/lib/arfly/locale'
import type { PwaLocale } from '@/lib/locale'
import type { AddressInput } from '@/types/integrations'

export type RestockNotifyBody = {
  email: string
  quantity?: number
  variantRef?: string | null
  locale?: string
  requestType?: 'RESTOCK_NOTIFY' | 'PRODUCT_REQUEST'
}

/** Contratto con GET /api/v1 del backend — solo proxy interno. */
export const api = {
  auth: {
    register(body: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
      customerSegment?: 'retail' | 'business'
    }) {
      return apiClient.post<{ user: UserDTO }>('/api/v1/auth/register', body)
    },
    forgotPassword(email: string) {
      return apiClient.post<{ sent: boolean }>('/api/v1/auth/forgot-password', { email })
    },
    checkoutForgotPassword(email: string) {
      return apiClient.post<{ sent: boolean }>('/api/v1/auth/checkout-forgot-password', { email })
    },
    resetPassword(token: string, password: string) {
      return apiClient.post<{ reset: boolean }>('/api/v1/auth/reset-password', {
        token,
        password,
      })
    },
    login(body: { email: string; password: string }) {
      return apiClient.post<{ user: UserDTO }>('/api/v1/auth/login', body)
    },
    checkoutLogin(body: { email: string; password: string }) {
      return apiClient.post<{ user: UserDTO }>('/api/v1/auth/checkout-login', body)
    },
    checkoutRegister(body: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
      customerSegment?: 'retail' | 'business'
    }) {
      return apiClient.post<{ user: UserDTO }>('/api/v1/auth/checkout-register', body)
    },
    logout() {
      return apiClient.post<{ loggedOut: boolean }>('/api/v1/auth/logout')
    },
    refresh() {
      return apiClient.post<AuthRefreshDTO>('/api/v1/auth/refresh')
    },
    me() {
      return apiClient.get<AuthMeDTO>('/api/v1/auth/me')
    },
    impersonateExchange(token: string) {
      return apiClient.post<{ user: UserDTO; impersonation: ImpersonationInfoDTO }>(
        '/api/v1/auth/impersonate/exchange',
        { token },
      )
    },
    impersonateEnd() {
      return apiClient.post<{ ended: boolean }>('/api/v1/auth/impersonate/end')
    },
  },
  arfly: {
    products(
      params: {
        locale?: PwaLocale
        page?: number
        pageSize?: number
        q?: string
        category?: string
        brand?: string
        partnerId?: number
        pricelistId?: number
        enrichSpecTags?: boolean
      } = {},
    ) {
      const search = new URLSearchParams()
      search.set('lang', toArflyLang(params.locale ?? 'IT'))
      if (params.page) search.set('page', String(params.page))
      if (params.pageSize) search.set('per_page', String(params.pageSize))
      if (params.q) search.set('q', params.q)
      if (params.category) search.set('category', params.category)
      if (params.brand) search.set('brand', params.brand)
      if (params.partnerId != null) search.set('partner_id', String(params.partnerId))
      if (params.pricelistId != null) search.set('pricelist_id', String(params.pricelistId))
      if (params.enrichSpecTags) search.set('enrich_spec_tags', '1')
      const q = search.toString() ? `?${search.toString()}` : ''
      return apiClient.get<ArflyProductListResponse>(`/api/v2/products${q}`)
    },
    product(
      productId: number,
      locale: PwaLocale = 'IT',
      options: { partnerId?: number; pricelistId?: number } = {},
    ) {
      const search = new URLSearchParams({ lang: toArflyLang(locale) })
      if (options.partnerId != null) search.set('partner_id', String(options.partnerId))
      if (options.pricelistId != null) search.set('pricelist_id', String(options.pricelistId))
      return apiClient.get<ArflyProductDetailResponse>(
        `/api/v2/product/${productId}?${search.toString()}`,
      )
    },
    productBySlug(
      slug: string,
      locale: PwaLocale = 'IT',
      options: { partnerId?: number; pricelistId?: number } = {},
    ) {
      const search = new URLSearchParams({ lang: toArflyLang(locale), slug })
      if (options.partnerId != null) search.set('partner_id', String(options.partnerId))
      if (options.pricelistId != null) search.set('pricelist_id', String(options.pricelistId))
      return apiClient.get<ArflyProductDetailResponse>(
        `/api/v2/product/by-slug?${search.toString()}`,
      )
    },
    categories(locale: PwaLocale = 'IT') {
      const search = new URLSearchParams({ lang: toArflyLang(locale) })
      return apiClient.get<import('@/lib/arfly/types').ArflyCategoryListResponse>(
        `/api/v2/categories?${search.toString()}`,
      )
    },
    brands(locale: PwaLocale = 'IT') {
      const search = new URLSearchParams({ lang: toArflyLang(locale) })
      return apiClient.get<import('@/lib/arfly/types').ArflyBrandListResponse>(
        `/api/v2/brands?${search.toString()}`,
      )
    },
  },
  site: {
    guides(locale: PwaLocale = 'IT', options?: { featured?: boolean }) {
      const q = new URLSearchParams({ locale })
      if (options?.featured) q.set('featured', 'true')
      return apiClient.get<
        Array<{
          slug: string
          category: string
          meta: string
          title: string
          href: string
          featured: boolean
          sortOrder: number
        }>
      >(`/api/v1/site/guides?${q.toString()}`)
    },
    getPage(pageKey: string, locale: string) {
      const q = new URLSearchParams({ locale })
      return apiClient.get<{ pageKey: string; locale: string; content: unknown; updatedAt: string | null }>(
        `/api/v1/site/pages/${encodeURIComponent(pageKey)}?${q.toString()}`,
      )
    },
    submitInquiry(body: {
      kind: 'product-not-found' | 'contact' | 'b2b' | 'professional-quote'
      name: string
      email: string
      phone?: string
      message?: string
      productCode?: string
      brand?: string
      quantity?: number
      usage?: string
      urgency?: string
      locale?: string
      attachments?: File[]
    }) {
      const files = body.attachments?.filter(Boolean) ?? []
      if (!files.length) {
        return apiClient.post<{ submitted: boolean }>('/api/v1/site/inquiries', body)
      }

      const form = new FormData()
      form.set('kind', body.kind)
      form.set('name', body.name)
      form.set('email', body.email)
      if (body.phone) form.set('phone', body.phone)
      if (body.message) form.set('message', body.message)
      if (body.productCode) form.set('productCode', body.productCode)
      if (body.brand) form.set('brand', body.brand)
      if (body.quantity != null) form.set('quantity', String(body.quantity))
      if (body.usage) form.set('usage', body.usage)
      if (body.urgency) form.set('urgency', body.urgency)
      if (body.locale) form.set('locale', body.locale)
      for (const file of files) {
        form.append('attachments', file)
      }
      return apiClient.postForm<{ submitted: boolean }>('/api/v1/site/inquiries', form)
    },
    submitProductNotFoundInquiry(body: {
      name: string
      email: string
      phone?: string
      message?: string
      productCode?: string
      brand?: string
      quantity?: number
      usage?: string
      urgency?: string
      locale?: string
      productPhoto?: File | null
      socketPhoto?: File | null
    }) {
      const hasFiles = Boolean(body.productPhoto || body.socketPhoto)
      if (!hasFiles) {
        return apiClient.post<{ submitted: boolean }>('/api/v1/site/inquiries', {
          kind: 'product-not-found',
          name: body.name,
          email: body.email,
          phone: body.phone,
          message: body.message,
          productCode: body.productCode,
          brand: body.brand,
          quantity: body.quantity,
          usage: body.usage,
          urgency: body.urgency,
          locale: body.locale,
        })
      }

      const form = new FormData()
      form.set('kind', 'product-not-found')
      form.set('name', body.name)
      form.set('email', body.email)
      if (body.phone) form.set('phone', body.phone)
      if (body.message) form.set('message', body.message)
      if (body.productCode) form.set('productCode', body.productCode)
      if (body.brand) form.set('brand', body.brand)
      if (body.quantity != null) form.set('quantity', String(body.quantity))
      if (body.usage) form.set('usage', body.usage)
      if (body.urgency) form.set('urgency', body.urgency)
      if (body.locale) form.set('locale', body.locale)
      if (body.productPhoto) form.set('productPhoto', body.productPhoto)
      if (body.socketPhoto) form.set('socketPhoto', body.socketPhoto)
      return apiClient.postForm<{ submitted: boolean }>('/api/v1/site/inquiries', form)
    },
    submitProfessionalRequest(body: {
      companyName: string
      vatNumber: string
      sector: string
      sectorOther?: string
      contactName: string
      email: string
      phone?: string
      pec?: string
      sdiCode?: string
      message?: string
      locale?: string
      visuraFile?: File | null
    }) {
      const form = new FormData()
      form.set('companyName', body.companyName)
      form.set('vatNumber', body.vatNumber)
      form.set('sector', body.sector)
      if (body.sectorOther) form.set('sectorOther', body.sectorOther)
      form.set('contactName', body.contactName)
      form.set('email', body.email)
      if (body.phone) form.set('phone', body.phone)
      if (body.pec) form.set('pec', body.pec)
      if (body.sdiCode) form.set('sdiCode', body.sdiCode)
      if (body.message) form.set('message', body.message)
      if (body.locale) form.set('locale', body.locale)
      if (body.visuraFile) form.set('visura', body.visuraFile)
      return apiClient.postForm<{ submitted: boolean; id: string }>(
        '/api/v1/site/professional-requests',
        form,
      )
    },
  },
  catalog: {
    bootstrap(locale?: string) {
      const search = locale ? `?locale=${encodeURIComponent(locale)}` : ''
      return apiClient.get<{
        categories: import('@/types/dto').CategoryDTO[]
        brands: import('@/types/site-content').BrandListItemDTO[]
        cms: import('@/types/site-content').CatalogPageContent
      }>(`/api/v1/catalog/bootstrap${search}`)
    },
    categories(locale?: string) {
      const search = locale ? `?locale=${encodeURIComponent(locale)}` : ''
      return apiClient.get<{ items: import('@/types/dto').CategoryDTO[] }>(
        `/api/v1/catalog/categories${search}`,
      )
    },
    categoryBySlug(slug: string, locale?: string) {
      const search = locale ? `?locale=${encodeURIComponent(locale)}` : ''
      return apiClient.get<{ item: import('@/types/dto').CategoryDTO | null }>(
        `/api/v1/catalog/categories/${encodeURIComponent(slug)}${search}`,
      )
    },
    brands(locale?: string) {
      const search = locale ? `?locale=${encodeURIComponent(locale)}` : ''
      return apiClient.get<{ items: import('@/types/site-content').BrandListItemDTO[] }>(
        `/api/v1/catalog/brands${search}`,
      )
    },
    brandBySlug(slug: string, locale?: string) {
      const search = locale ? `?locale=${encodeURIComponent(locale)}` : ''
      return apiClient.get<{ item: import('@/types/site-content').BrandListItemDTO | null }>(
        `/api/v1/catalog/brands/${encodeURIComponent(slug)}${search}`,
      )
    },
    products(
      params: {
      locale?: string
      page?: number
      pageSize?: number
      q?: string
      category?: string
      brand?: string
    },
      init?: Pick<RequestInit, 'signal'>,
    ) {
      const search = new URLSearchParams()
      if (params.locale) search.set('locale', params.locale)
      if (params.page) search.set('page', String(params.page))
      if (params.pageSize) search.set('pageSize', String(params.pageSize))
      if (params.q) search.set('q', params.q)
      if (params.category) search.set('category', params.category)
      if (params.brand) search.set('brand', params.brand)
      return apiClient.get<import('@/types/dto').ProductListDTO>(
        `/api/v1/catalog/products?${search.toString()}`,
        init,
      )
    },
    enrichProductDetail(product: import('@/types/dto').ProductDetailDTO) {
      return apiClient.post<import('@/types/dto').ProductDetailDTO>(
        '/api/v1/catalog/availability/enrich-detail',
        product,
      )
    },
    resolveCodes(body: { text: string; locale?: string }) {
      return apiClient.post<import('@/types/dto').ResolveCodesResultDTO>(
        '/api/v1/catalog/resolve-codes',
        body,
      )
    },
    socialProof(slug: string) {
      return apiClient.get<ProductSocialProofDTO>(
        `/api/v1/catalog/products/${encodeURIComponent(slug)}/social-proof`,
      )
    },
    homeProductSliders(locale?: string) {
      const search = locale ? `?locale=${encodeURIComponent(locale)}` : ''
      return apiClient.get<import('@/types/home-product-sliders').HomeProductSliderDTO[]>(
        `/api/v1/catalog/home/product-sliders${search}`,
      )
    },
    restockNotify(slug: string, body: RestockNotifyBody) {
      const search = body.locale ? `?locale=${encodeURIComponent(body.locale)}` : ''
      return apiClient.post<StockRestockRequestDTO>(
        `/api/v1/catalog/products/${encodeURIComponent(slug)}/restock-notify${search}`,
        {
          email: body.email,
          quantity: body.quantity ?? 1,
          variantRef: body.variantRef ?? null,
          requestType: body.requestType ?? 'RESTOCK_NOTIFY',
        },
      )
    },
    sitemapUrl() {
      return getSitemapUrl()
    },
  },
  cart: {
    get(options?: { reprice?: boolean }) {
      const q = options?.reprice ? '?reprice=1' : ''
      return apiClient.get<CartDTO>(`/api/v1/cart${q}`)
    },
    addItem(body: { productRef: string; variantRef?: string | null; quantity?: number }) {
      return apiClient.post<CartDTO>('/api/v1/cart/items', body)
    },
    patchItem(id: string, body: { quantity: number }) {
      return apiClient.patch<CartDTO>(`/api/v1/cart/items/${id}`, body)
    },
    removeItem(id: string) {
      return apiClient.delete<CartDTO>(`/api/v1/cart/items/${id}`)
    },
    clear() {
      return apiClient.delete<CartDTO>('/api/v1/cart')
    },
    recommendations() {
      return apiClient.get<ProductCardDTO[]>('/api/v1/cart/recommendations')
    },
    reprice() {
      return apiClient.post<CartDTO>('/api/v1/cart/reprice')
    },
    stock() {
      return apiClient.get<CartStockCheckDTO>('/api/v1/cart/stock')
    },
    syncFromClient(body: {
      items: Array<{ productRef: string; variantRef?: string | null; quantity: number }>
      expiresAt?: string | null
    }) {
      return apiClient.post<CartDTO>('/api/v1/cart/sync-from-client', body)
    },
    quickReorder(body: { text: string; locale?: string }) {
      return apiClient.post<import('@/types/dto').QuickReorderResultDTO>(
        '/api/v1/cart/quick-reorder',
        body,
      )
    },
  },
  wishlist: {
    list() {
      return apiClient.get<WishlistItemDTO[]>('/api/v1/wishlist')
    },
    add(body: { productRef: string; variantRef?: string | null }) {
      return apiClient.post<WishlistItemDTO>('/api/v1/wishlist/items', body)
    },
    remove(id: string) {
      return apiClient.delete<{ removed: boolean }>(`/api/v1/wishlist/items/${id}`)
    },
  },
  checkout: {
    start(body: {
      email: string
      customerSegment?: 'retail' | 'business'
      isProfessional?: boolean
      billingAddress: AddressInput
      shippingAddress: AddressInput
      business?: {
        companyName?: string
        vatNumber?: string
        fiscalCode?: string
        pec?: string
        sdiCode?: string
      }
      clientOrderRef?: string
      deliveryRecipient?: AddressInput
      orderNotes?: string
      vatValidated?: boolean
      vatForceAccepted?: boolean
      createAccount?: boolean
      lockPrices?: boolean
      idempotencyKey?: string
    }) {
      return apiClient.post<CheckoutStartDTO>('/api/v1/checkout/start', body)
    },
    patchDraft(body: {
      step: 'details' | 'shipping' | 'payment_method' | 'lock'
      orderId?: string
      email?: string
      customerSegment?: 'retail' | 'business'
      isProfessional?: boolean
      billingAddress?: AddressInput
      shippingAddress?: AddressInput
      business?: {
        companyName?: string
        vatNumber?: string
        fiscalCode?: string
        pec?: string
        sdiCode?: string
      }
      clientOrderRef?: string
      deliveryRecipient?: AddressInput
      orderNotes?: string
      vatValidated?: boolean
      vatForceAccepted?: boolean
      paymentMethod?: PwaPaymentMethodDTO
      idempotencyKey?: string
    }) {
      return apiClient.patch<CheckoutStartDTO>('/api/v1/checkout/draft', body)
    },
    createSession(body: { email: string }) {
      return apiClient.post<CheckoutSessionDTO>('/api/v1/checkout/session', body)
    },
    getSession(id: string) {
      return apiClient.get<CheckoutSessionDTO>(`/api/v1/checkout/session/${id}`)
    },
    redirect(id: string) {
      return apiClient.post<CheckoutSessionDTO>(`/api/v1/checkout/session/${id}/redirect`)
    },
    paymentUrl(id: string) {
      return apiClient.post<PaymentUrlDTO>(`/api/v1/checkout/session/${id}/payment-url`)
    },
  },
  orders: {
    list() {
      return apiClient.get<OrderDTO[]>('/api/v1/orders')
    },
    get(id: string) {
      return apiClient.get<OrderDetailDTO>(`/api/v1/orders/${id}`)
    },
    reorder(id: string) {
      return apiClient.post<OrderReorderResultDTO>(`/api/v1/orders/${id}/reorder`)
    },
    recommendations(id: string) {
      return apiClient.get<ProductCardDTO[]>(`/api/v1/orders/${id}/recommendations`)
    },
    status(id: string) {
      return apiClient.get<PwaOrderStatusResponseDTO>(`/api/v1/orders/${id}/status`)
    },
    thankYou(id: string) {
      return apiClient.get<ThankYouOrderDTO>(`/api/v1/orders/${id}/thank-you`)
    },
    abandon(id: string) {
      return apiClient.post<PwaOrderStatusResponseDTO>(`/api/v1/orders/${id}/abandon`)
    },
  },
  shipping: {
    quotes(body: { shippingAddress: AddressInput }) {
      return apiClient.post<ShippingQuotesResponseDTO>('/api/v1/shipping/quotes', body)
    },
    select(body: { shippingAddress: AddressInput; methodRef: string }) {
      return apiClient.post<{ selected: true; amountCents: number }>('/api/v1/shipping/select', body)
    },
  },
  tax: {
    estimate(params?: { country?: string; netCents?: number }) {
      const q = new URLSearchParams()
      if (params?.country) q.set('country', params.country)
      if (params?.netCents != null) q.set('netCents', String(params.netCents))
      const suffix = q.toString() ? `?${q.toString()}` : ''
      return apiClient.get<import('@/types/dto').TaxBreakdownDTO>(`/api/v1/tax/estimate${suffix}`)
    },
    calculate(body: {
      netCents: number
      billingCountry: string
      shippingCountry: string
      customerSegment?: 'retail' | 'business' | 'professional'
      isProfessional?: boolean
      vatValidated?: boolean
      vatForceAccepted?: boolean
    }) {
      return apiClient.post<import('@/types/dto').TaxBreakdownDTO>('/api/v1/tax/calculate', body)
    },
    validate(body: {
      countryCode: string
      fiscalCode?: string
      vatNumber?: string
      personType: 'private' | 'company'
    }) {
      return apiClient.post<import('@/types/dto').TaxValidationResultDTO>(
        '/api/v1/tax/validate',
        body,
      )
    },
  },
  vat: {
    validate(body: { vatNumber: string; countryCode?: string }) {
      return apiClient.post<{
        valid: boolean
        vatForceAccepted: boolean
        attempts: number
        companyName?: string | null
        vatNumber: string
        countryCode: string
      }>('/api/v1/vat/validate', body)
    },
  },
  payments: {
    stripeConfig() {
      return apiClient.get<StripeClientConfigDTO>('/api/v1/payments/stripe/config')
    },
    createSession(body: { orderId: string; paymentMethod: PwaPaymentMethodDTO }) {
      return apiClient.post<PaymentSessionDTO>('/api/v1/payments/create-session', body)
    },
    prepareWalletCheckout(body: {
      email?: string
      productRef?: string
      quantity?: number
      variantRef?: string | null
      shippingAddress?: {
        firstName: string
        lastName: string
        line1: string
        line2?: string
        city: string
        postalCode: string
        country: string
        phone?: string
      }
      billingAddress?: {
        firstName: string
        lastName: string
        line1: string
        line2?: string
        city: string
        postalCode: string
        country: string
        phone?: string
      }
    }) {
      return apiClient.post<PaymentSessionDTO>('/api/v1/payments/prepare-wallet-checkout', body)
    },
    confirm(body: { paymentId: string; mockStatus?: 'captured' | 'pending' | 'failed' | 'cancelled' }) {
      return apiClient.post<PaymentConfirmDTO>('/api/v1/payments/confirm', body)
    },
    stripeReturn(params: { sessionId?: string; orderId?: string }) {
      const q = new URLSearchParams()
      if (params.sessionId) q.set('session_id', params.sessionId)
      if (params.orderId) q.set('order_id', params.orderId)
      return apiClient.get<{ orderId: string; alreadyProcessed: boolean }>(
        `/api/v1/payments/stripe/return?${q.toString()}`,
      )
    },
  },
  users: {
    patchMe(body: {
      firstName?: string
      lastName?: string
      phone?: string | null
      shippingAddress?: UserAddressDTO | null
      preferredPaymentMethod?: PwaPaymentMethodDTO | null
    }) {
      return apiClient.patch<UserPatchResponseDTO>('/api/v1/users/me', body)
    },
    patchBusiness(body: {
      customerSegment?: 'retail' | 'business'
      companyName?: string
      vatNumber?: string
      fiscalCode?: string
      pec?: string
      sdiCode?: string
    }) {
      return apiClient.patch<UserPatchResponseDTO>('/api/v1/users/me/business', body)
    },
    professionalRequest() {
      return apiClient.get<ProfessionalRequestSummaryDTO | null>('/api/v1/users/me/professional-request')
    },
  },
  quotes: {
    request(body: {
      notes?: string
      billingAddress?: UserAddressDTO
      shippingAddress?: UserAddressDTO
    }) {
      return apiClient.post<QuoteRequestDTO>('/api/v1/quotes/request', body)
    },
    list() {
      return apiClient.get<QuoteRequestDTO[]>('/api/v1/quotes')
    },
    get(id: string) {
      return apiClient.get<QuoteDetailDTO>(`/api/v1/quotes/${id}`)
    },
    checkout(id: string) {
      return apiClient.post<QuoteCheckoutDTO>(`/api/v1/quotes/${id}/checkout`)
    },
  },
  invoices: {
    list() {
      return apiClient.get<InvoiceDTO[]>('/api/v1/invoices')
    },
    async downloadPdf(invoiceId: string): Promise<Blob> {
      const headers = new Headers()
      const integrationToken = getIntegrationsToken()
      if (integrationToken) headers.set('X-Integrations-Token', integrationToken)

      const base = API_BASE.replace(/\/$/, '')
      const res = await fetch(`${base}/api/v1/invoices/${encodeURIComponent(invoiceId)}/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as ApiFailureBody | null
        const err = json?.error
        throw new ApiRequestError(
          err?.code ?? 'INVOICE_PDF_UNAVAILABLE',
          err?.message ?? 'PDF download failed',
          res.status,
          err?.details,
          err?.userMessage ?? 'Impossibile scaricare il PDF della fattura.',
          err?.retriable,
          err?.correlationId ?? res.headers.get('x-correlation-id') ?? undefined,
        )
      }

      return res.blob()
    },
  },
}
