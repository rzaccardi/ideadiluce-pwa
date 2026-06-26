import { appStore } from '@/features/app'
import { fetchMe } from '@/features/auth'
import { fetchCart } from '@/features/cart'
import { fetchWishlist } from '@/features/wishlist'

let bootstrapPromise: Promise<void> | null = null

/** Sessione, carrello e preferiti iniziali: una sola esecuzione anche con React StrictMode. */
export function bootstrapSession(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetchMe()
      .then(() => Promise.all([fetchCart({ force: true }), fetchWishlist()]))
      .then(() => {
        appStore.isBootstrapped = true
      })
      .catch(() => {
        appStore.isBootstrapped = true
      })
  }
  return bootstrapPromise
}
