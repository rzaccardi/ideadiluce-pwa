/** Segmenti `/api/v1/*` che non devono mai essere cachati (carrello, checkout, utente, …). */
export const V1_PRIVATE_API_SEGMENTS = [
  'cart',
  'checkout',
  'auth',
  'users',
  'orders',
  'wishlist',
  'quotes',
  'invoices',
  'shipping',
  'payments',
  'address',
  'tax',
  'vat',
] as const

function normalizeApiPath(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path
  if (!withoutQuery.startsWith('/')) return `/${withoutQuery}`
  return withoutQuery
}

/** True per path `/api/v1/cart`, `/cart`, `/api/v1/checkout/session/…`, ecc. */
export function isPrivateApiPath(path: string): boolean {
  const normalized = normalizeApiPath(path)
  const v1Relative = normalized.replace(/^\/api\/v1/, '') || '/'

  return V1_PRIVATE_API_SEGMENTS.some((segment) => {
    const prefix = `/${segment}`
    return v1Relative === prefix || v1Relative.startsWith(`${prefix}/`)
  })
}
