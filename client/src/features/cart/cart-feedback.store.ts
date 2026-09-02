import { proxy } from 'valtio'

export type CartActivityToast = {
  id: string
  productName: string
  quantity: number
  imageUrl?: string | null
  createdAt: number
}

export const cartFeedbackStore = proxy({
  toasts: [] as CartActivityToast[],
  /** Incrementato a ogni aggiunta: bounce icona carrello. */
  cartPulse: 0,
  /** Incrementato per aprire il mini-carrello dall'esterno (es. toast aggiunta). */
  miniCartOpenRequest: 0,
})
