import type { Transition, Variants } from 'framer-motion'
import { stripLocalePrefix } from '@/lib/locale'
import { isDcStaticPath } from '@/lib/dc-static-routes'
import { EASE_OUT, transitionBase, transitionFast } from '@/lib/motion/presets'

export type PageTransitionKind = 'editorial' | 'catalog' | 'product' | 'checkout' | 'default'

function pageVariants(
  enter: { opacity: number; y?: number; scale?: number },
  exit: { opacity: number; y?: number; scale?: number },
  enterDuration: number,
  exitDuration: number,
): Variants {
  return {
    initial: enter,
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: enterDuration, ease: EASE_OUT },
    },
    exit: {
      ...exit,
      transition: { duration: exitDuration, ease: EASE_OUT },
    },
  }
}

/** Editorial: fade breve — home e pagine istituzionali. */
const editorialVariants = pageVariants(
  { opacity: 0, y: 8 },
  { opacity: 0 },
  0.18,
  0.1,
)

/** Catalogo: rapido e leggero — navigazione frequente tra liste e filtri. */
const catalogVariants = pageVariants(
  { opacity: 0, y: 6 },
  { opacity: 0 },
  0.14,
  0.08,
)

/** Prodotto: sottile profondità — focus sul contenuto. */
const productVariants: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.16, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08, ease: EASE_OUT },
  },
}

/** Checkout/account: discreto, senza movimento verticale. */
const checkoutVariants = pageVariants(
  { opacity: 0 },
  { opacity: 0 },
  0.16,
  0.1,
)

/** Default: fade-up equilibrato. */
const defaultVariants = pageVariants(
  { opacity: 0, y: 10 },
  { opacity: 0, y: -4 },
  0.26,
  0.14,
)

export const pageTransitionVariants: Record<PageTransitionKind, Variants> = {
  editorial: editorialVariants,
  catalog: catalogVariants,
  product: productVariants,
  checkout: checkoutVariants,
  default: defaultVariants,
}

export const pageTransitionTiming: Record<PageTransitionKind, Transition> = {
  editorial: { duration: 0.18, ease: EASE_OUT },
  catalog: { duration: 0.14, ease: EASE_OUT },
  product: { duration: 0.16, ease: EASE_OUT },
  checkout: transitionFast,
  default: transitionBase,
}

export function resolvePageTransitionKind(pathname: string): PageTransitionKind {
  const path = stripLocalePrefix(pathname)
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

  if (normalized === '/' || isDcStaticPath(pathname)) return 'editorial'
  if (
    normalized.startsWith('/checkout') ||
    normalized.startsWith('/account') ||
    normalized.startsWith('/login') ||
    normalized.startsWith('/register')
  ) {
    return 'checkout'
  }
  if (normalized.startsWith('/prodotto/') || normalized.startsWith('/product/')) return 'product'
  if (
    normalized.startsWith('/negozio') ||
    normalized.startsWith('/categoria') ||
    normalized.startsWith('/category') ||
    normalized.startsWith('/brand') ||
    normalized.startsWith('/ambienti') ||
    normalized.startsWith('/attacco') ||
    normalized.startsWith('/guide') ||
    normalized.startsWith('/wishlist')
  ) {
    return 'catalog'
  }

  return 'default'
}
