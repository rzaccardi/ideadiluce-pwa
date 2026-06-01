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
  /** Incrementato a ogni aggiunta: trigger bounce icona e fly-in. */
  cartPulse: 0,
  flyInImageUrl: null as string | null,
  flyInToken: 0,
})
