/** Path API che non devono mai usare cache HTTP (carrello, checkout, utente, …). */
const PRIVATE_API_PREFIXES = [
  '/api/v1/cart',
  '/api/v1/checkout',
  '/api/v1/auth',
  '/api/v1/users',
  '/api/v1/orders',
  '/api/v1/wishlist',
  '/api/v1/quotes',
  '/api/v1/invoices',
  '/api/v1/shipping',
  '/api/v1/payments',
  '/api/v1/address',
  '/api/v1/tax',
  '/api/v1/vat',
] as const

function normalizeApiPath(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path
  if (!withoutQuery.startsWith('/')) return `/${withoutQuery}`
  return withoutQuery
}

export function isPrivateApiPath(path: string): boolean {
  const normalized = normalizeApiPath(path)
  return PRIVATE_API_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

export function privateApiFetchInit(path: string): Pick<RequestInit, 'cache'> | undefined {
  return isPrivateApiPath(path) ? { cache: 'no-store' } : undefined
}
