import { apiClient } from '@/api/client'
import type {
  CartDTO,
  CategoryDTO,
  CheckoutStartDTO,
  CheckoutSessionDTO,
  OrderDTO,
  PaymentConfirmDTO,
  PaymentSessionDTO,
  PaymentUrlDTO,
  PwaOrderStatusResponseDTO,
  PwaPaymentMethodDTO,
  ShippingQuoteDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ProductListDTO,
  UserDTO,
  WishlistItemDTO,
} from '@/types/dto'

/** Contratto con GET /api/v1 del backend — solo proxy interno. */
export const api = {
  auth: {
    register(body: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
    }) {
      return apiClient.post<{ user: UserDTO }>('/api/v1/auth/register', body)
    },
    login(body: { email: string; password: string }) {
      return apiClient.post<{ user: UserDTO }>('/api/v1/auth/login', body)
    },
    logout() {
      return apiClient.post<{ loggedOut: boolean }>('/api/v1/auth/logout')
    },
    me() {
      return apiClient.get<{ user: UserDTO }>('/api/v1/auth/me')
    },
  },
  catalog: {
    categories() {
      return apiClient.get<CategoryDTO[]>('/api/v1/catalog/categories')
    },
    products(params: { category?: string; q?: string; page?: number; pageSize?: number } = {}) {
      const search = new URLSearchParams()
      if (params.category) search.set('category', params.category)
      if (params.q) search.set('q', params.q)
      if (params.page) search.set('page', String(params.page))
      if (params.pageSize) search.set('pageSize', String(params.pageSize))
      const q = search.toString() ? `?${search.toString()}` : ''
      return apiClient.get<ProductListDTO>(`/api/v1/catalog/products${q}`)
    },
    product(slug: string) {
      return apiClient.get<ProductDetailDTO>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`)
    },
  },
  cart: {
    get() {
      return apiClient.get<CartDTO>('/api/v1/cart')
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
      billingAddress: {
        firstName: string
        lastName: string
        line1: string
        line2?: string
        city: string
        postalCode: string
        country: string
        phone?: string
      }
      shippingAddress: {
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
      return apiClient.post<CheckoutStartDTO>('/api/v1/checkout/start', body)
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
      return apiClient.get<OrderDTO>(`/api/v1/orders/${id}`)
    },
    status(id: string) {
      return apiClient.get<PwaOrderStatusResponseDTO>(`/api/v1/orders/${id}/status`)
    },
    abandon(id: string) {
      return apiClient.post<PwaOrderStatusResponseDTO>(`/api/v1/orders/${id}/abandon`)
    },
  },
  shipping: {
    quotes(body: {
      shippingAddress: {
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
      return apiClient.post<ShippingQuoteDTO[]>('/api/v1/shipping/quotes', body)
    },
    select(body: {
      shippingAddress: {
        firstName: string
        lastName: string
        line1: string
        line2?: string
        city: string
        postalCode: string
        country: string
        phone?: string
      }
      methodRef: string
    }) {
      return apiClient.post<{ selected: true; amountCents: number }>('/api/v1/shipping/select', body)
    },
  },
  payments: {
    createSession(body: { orderId: string; paymentMethod: PwaPaymentMethodDTO }) {
      return apiClient.post<PaymentSessionDTO>('/api/v1/payments/create-session', body)
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
    patchMe(body: { firstName?: string; lastName?: string; phone?: string | null }) {
      return apiClient.patch<{ user: UserDTO }>('/api/v1/users/me', body)
    },
  },
}
