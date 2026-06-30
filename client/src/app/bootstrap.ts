import { appStore } from '@/features/app'
import { fetchMe } from '@/features/auth'
import { fetchCart } from '@/features/cart'
import { isCartFlowPath } from '@/features/cart/cart.utils'
import { fetchWishlist } from '@/features/wishlist'

let bootstrapPromise: Promise<void> | null = null

export type BootstrapSessionOptions = {
  /** Path iniziale (senza query): su carrello/checkout il fetch carrello è demandato alla pagina. */
  pathname?: string
}

function deferWishlistFetch() {
  const run = () => void fetchWishlist()
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 3000 })
  } else {
    window.setTimeout(run, 100)
  }
}

/** Sessione, carrello e preferiti iniziali: una sola esecuzione anche con React StrictMode. */
export function bootstrapSession(options?: BootstrapSessionOptions): Promise<void> {
  if (!bootstrapPromise) {
    const skipInitialCart =
      options?.pathname != null && isCartFlowPath(options.pathname)
    appStore.isBootstrapped = true
    bootstrapPromise = fetchMe()
      .then(() => (skipInitialCart ? undefined : fetchCart({ force: false })))
      .then(() => {
        deferWishlistFetch()
      })
      .catch(() => {
        if (!skipInitialCart) void fetchCart({ force: false })
        deferWishlistFetch()
      })
  }
  return bootstrapPromise
}
