import { accountStore } from '@/features/account'
import { clearCheckoutAfterLogout, resetCheckout } from '@/features/checkout'
import { resetOrdersStore } from '@/features/orders'
import { resetQuotesStore } from '@/features/quotes'
import { resetWishlistStore } from '@/features/wishlist'
import { clearAuthSessionMirror } from '@/lib/auth-local-storage'
import { setAuthUser } from './auth.store'

export type ClearClientSessionScope = 'full' | 'checkout'

/** Azzera tutti i dati client legati all'utente autenticato (dopo logout o sessione invalida). */
export function clearClientSessionState(options?: { scope?: ClearClientSessionScope }) {
  clearAuthSessionMirror()
  setAuthUser(null)
  resetWishlistStore()
  resetOrdersStore()
  resetQuotesStore()
  accountStore.error = null
  accountStore.message = null
  accountStore.isSaving = false

  if (options?.scope === 'checkout') {
    clearCheckoutAfterLogout()
  } else {
    resetCheckout()
  }
}
