import { cartFeedbackStore } from './cart-feedback.store'

const TOAST_TTL_MS = 4_000

/** Allineato al breakpoint `lg` e al bottom sheet in HeaderMiniCart. */
function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
}

export type CartAddedFeedback = {
  productName: string
  quantity?: number
  imageUrl?: string | null
}

export function notifyCartItemAdded(input: CartAddedFeedback) {
  const quantity = input.quantity ?? 1

  cartFeedbackStore.cartPulse += 1

  if (isMobileViewport()) {
    requestOpenMiniCart()
    return
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  cartFeedbackStore.toasts.push({
    id,
    productName: input.productName,
    quantity,
    imageUrl: input.imageUrl,
    createdAt: Date.now(),
  })
  cartFeedbackStore.flyInToken = cartFeedbackStore.cartPulse
  cartFeedbackStore.flyInImageUrl = input.imageUrl ?? null

  window.setTimeout(() => {
    cartFeedbackStore.toasts = cartFeedbackStore.toasts.filter((t) => t.id !== id)
  }, TOAST_TTL_MS)
}

export function dismissCartToast(id: string) {
  cartFeedbackStore.toasts = cartFeedbackStore.toasts.filter((t) => t.id !== id)
}

export function requestOpenMiniCart() {
  cartFeedbackStore.miniCartOpenRequest += 1
}
