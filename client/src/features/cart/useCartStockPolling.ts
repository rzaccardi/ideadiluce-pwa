import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { checkCartAvailability } from './cart.actions'
import { cartStore } from './cart.store'

export const CART_STOCK_POLL_MS = 30_000

export function useCartStockPolling(enabled = true) {
  const { cart, isLoading } = useSnapshot(cartStore)
  const hasItems = (cart?.items.length ?? 0) > 0

  useEffect(() => {
    if (!enabled || !hasItems || isLoading) {
      if (!hasItems) cartStore.stockInsufficient = []
      return
    }

    const run = () => {
      if (!document.hidden) void checkCartAvailability()
    }

    let idleId: number | undefined
    let timeoutId: number | undefined
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(run, { timeout: 2500 })
    } else {
      timeoutId = window.setTimeout(run, 400)
    }

    window.addEventListener('focus', run)
    document.addEventListener('visibilitychange', run)
    const intervalId = window.setInterval(run, CART_STOCK_POLL_MS)

    return () => {
      if (idleId != null) cancelIdleCallback(idleId)
      if (timeoutId != null) window.clearTimeout(timeoutId)
      window.removeEventListener('focus', run)
      document.removeEventListener('visibilitychange', run)
      window.clearInterval(intervalId)
    }
  }, [enabled, hasItems, isLoading, cart?.id])
}
