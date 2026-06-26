import { cartFeedbackStore } from './cart-feedback.store'

const TOAST_TTL_MS = 4_000

export type CartAddedFeedback = {
  productName: string
  quantity?: number
  imageUrl?: string | null
}

export function notifyCartItemAdded(input: CartAddedFeedback) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const quantity = input.quantity ?? 1

  cartFeedbackStore.toasts.push({
    id,
    productName: input.productName,
    quantity,
    imageUrl: input.imageUrl,
    createdAt: Date.now(),
  })
  cartFeedbackStore.cartPulse += 1
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
