'use client'

import { CartActivityToasts } from '@/components/cart/CartActivityToasts'

/** Toast di feedback aggiunta al carrello — fisso in basso a destra. */
export function CartFeedbackLayer() {
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col items-end sm:bottom-5 sm:right-5">
      <CartActivityToasts className="pointer-events-auto" />
    </div>
  )
}
