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
  | 'guide-article'
  | 'category-landing'
  | 'category'
  | 'content'

const CONTENT_PATHS = new Set([
  '/chi-siamo',
  '/contatti',
  '/spedizioni',
  '/pagamenti',
  '/garanzia',
  '/privacy-policy',
  '/privacy',
  '/tos',
  '/on-demand',
  '/lavora-con-noi',
  '/prodotto-non-trovato',
  '/homepage2',
])

/** Route logica (senza prefisso lingua) per lo skeleton di bootstrap / loading. */
export function resolveBootstrapRoute(pathname: string): BootstrapRoute {
  const path = stripLocalePrefix(pathname)
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  if (normalized === '/' || normalized === '') return 'home'
  if (
    normalized === '/negozio' ||
    normalized === '/catalog' ||
    normalized === '/catalogo'
  ) {
    return 'catalog'
  }
  if (/^\/(product|prodotto)\/[^/]+/.test(normalized)) return 'product'
  if (normalized === '/wishlist') return 'wishlist'
  if (normalized === '/cart') return 'cart'
  if (normalized === '/login') return 'login'
  if (normalized === '/register') return 'register'
  if (normalized === '/checkout') return 'checkout'
  if (/^\/checkout\/return\/[^/]+/.test(normalized)) return 'checkout-return'
  if (/^\/checkout\/result\/[^/]+/.test(normalized)) return 'checkout-result'
  if (/^\/checkout\//.test(normalized)) return 'checkout'

  if (normalized === '/account/profile') return 'account-profile'
  if (normalized === '/account/orders') return 'account-orders'
  if (/^\/account\/orders\/[^/]+/.test(normalized)) return 'account-order-detail'
  if (normalized === '/account' || normalized.startsWith('/account/')) return 'account'

  if (normalized === '/professionisti') return 'professionisti'
  if (normalized === '/brand' || normalized.startsWith('/brand/')) return 'brand'
  if (
    normalized === '/ambienti' ||
    normalized.startsWith('/ambienti/') ||
    normalized === '/acquista-ambiente'
  ) {
    return 'ambienti'
  }
  if (normalized === '/attacco' || normalized.startsWith('/attacco/')) return 'attacco'
  if (/^\/guide\/[^/]+/.test(normalized)) return 'guide-article'
  if (normalized === '/guide' || normalized === '/blog') return 'guide'

  if (
    normalized.startsWith('/categoria-prodotto/') ||
    normalized === '/illuminazione-arredo'
  ) {
    return 'category-landing'
  }

  if (/^\/(categoria|category)\/[^/]+/.test(normalized)) return 'category'

  if (CONTENT_PATHS.has(normalized)) return 'content'

  return 'content'
}
