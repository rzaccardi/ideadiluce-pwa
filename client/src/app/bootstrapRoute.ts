import { stripLocalePrefix } from '@/lib/locale'

export type BootstrapRoute =
  | 'home'
  | 'catalog'
  | 'product'
  | 'wishlist'
  | 'cart'
  | 'login'
  | 'register'
  | 'checkout'
  | 'checkout-return'
  | 'checkout-result'
  | 'account'
  | 'account-profile'
  | 'account-orders'
  | 'account-order-detail'
  | 'professionisti'
  | 'brand'
  | 'ambienti'
  | 'attacco'
  | 'guide'
  | 'category-landing'
  | 'content'

const CONTENT_PATHS = new Set([
  '/chi-siamo',
  '/contatti',
  '/showroom',
  '/spedizioni',
  '/pagamenti',
  '/garanzia',
  '/privacy',
  '/cookie',
  '/lavora-con-noi',
  '/prodotto-non-trovato',
])

/** Route logica (senza prefisso lingua) per lo skeleton di bootstrap. */
export function resolveBootstrapRoute(pathname: string): BootstrapRoute {
  const path = stripLocalePrefix(pathname)
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  if (normalized === '/' || normalized === '') return 'home'
  if (normalized === '/catalog') return 'catalog'
  if (/^\/(product|prodotto)\/[^/]+/.test(normalized)) return 'product'
  if (normalized === '/wishlist') return 'wishlist'
  if (normalized === '/cart') return 'cart'
  if (normalized === '/login') return 'login'
  if (normalized === '/register') return 'register'
  if (normalized === '/checkout') return 'checkout'
  if (/^\/checkout\/return\/[^/]+/.test(normalized)) return 'checkout-return'
  if (/^\/checkout\/result\/[^/]+/.test(normalized)) return 'checkout-result'
  if (normalized === '/account' || normalized === '/account/') return 'account'
  if (normalized === '/account/profile') return 'account-profile'
  if (normalized === '/account/orders') return 'account-orders'
  if (/^\/account\/orders\/[^/]+/.test(normalized)) return 'account-order-detail'
  if (normalized === '/professionisti') return 'professionisti'
  if (normalized === '/brand' || normalized.startsWith('/brand/')) return 'brand'
  if (normalized === '/ambienti' || normalized.startsWith('/ambienti/')) return 'ambienti'
  if (normalized === '/attacco' || normalized.startsWith('/attacco/')) return 'attacco'
  if (normalized === '/guide' || normalized.startsWith('/guide/')) return 'guide'
  if (
    normalized.startsWith('/categoria-prodotto/') ||
    normalized === '/categoria-prodotto/illuminazione-arredo' ||
    normalized === '/categoria-prodotto/illuminazione-tecnica'
  ) {
    return 'category-landing'
  }
  if (CONTENT_PATHS.has(normalized) || normalized.startsWith('/guide/')) return 'content'

  return 'content'
}
