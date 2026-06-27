import { appStore } from '@/features/app'
import { fetchMe } from '@/features/auth'
import { fetchCart } from '@/features/cart'
import { fetchWishlist } from '@/features/wishlist'

let bootstrapPromise: Promise<void> | null = null

function deferWishlistFetch() {
  const run = () => void fetchWishlist()
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 3000 })
  } else {
    window.setTimeout(run, 100)
  }
}

/** Sessione, carrello e preferiti iniziali: una sola esecuzione anche con React StrictMode. */
export function bootstrapSession(): Promise<void> {
  if (!bootstrapPromise) {
    appStore.isBootstrapped = true
    bootstrapPromise = fetchMe()
      .then(() => fetchCart({ force: false }))
      .then(() => {
        deferWishlistFetch()
      })
      .catch(() => {
        void fetchCart({ force: false })
        deferWishlistFetch()
      })
  }
  return bootstrapPromise
}
