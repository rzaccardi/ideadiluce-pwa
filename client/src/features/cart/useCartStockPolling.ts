import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { checkCartAvailability } from './cart.actions'
import { cartStore } from './cart.store'

export const CART_STOCK_POLL_MS = 30_000

export function useCartStockPolling(enabled = true) {
  const { cart } = useSnapshot(cartStore)
  const hasItems = (cart?.items.length ?? 0) > 0

  useEffect(() => {
    if (!enabled || !hasItems) {
      cartStore.stockInsufficient = []
      return
    }

    const run = () => {
      if (!document.hidden) void checkCartAvailability()
    }

    void checkCartAvailability()
    window.addEventListener('focus', run)
    document.addEventListener('visibilitychange', run)
    const intervalId = window.setInterval(run, CART_STOCK_POLL_MS)

    return () => {
      window.removeEventListener('focus', run)
      document.removeEventListener('visibilitychange', run)
      window.clearInterval(intervalId)
    }
  }, [enabled, hasItems, cart?.id])
}
