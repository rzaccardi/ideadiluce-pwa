'use client'

import { useEffect } from 'react'
import { fetchCart, useCartReservationSync, useCartStockPolling } from '@/features/cart'
import { fetchWishlist } from '@/features/wishlist'

const POLL_MS = 30_000

/** Polling carrello e preferiti quando la scheda è attiva. */
export function useCartSync(enabled = true, options?: { pollStock?: boolean }) {
  useCartStockPolling(enabled && options?.pollStock !== false)
  useCartReservationSync(enabled)

  useEffect(() => {
    if (!enabled) return

    const refresh = () => {
      if (!document.hidden) {
        void fetchCart()
        void fetchWishlist()
      }
    }

    // All’apertura mini-cart / ingresso flusso: sync subito (non solo al focus).
    refresh()

    const onVisibilityChange = () => {
      if (!document.hidden) refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
    const intervalId = window.setInterval(refresh, POLL_MS)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [enabled])
}
