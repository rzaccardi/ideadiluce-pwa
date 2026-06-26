import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchCart } from './cart.actions'
import { cartStore } from './cart.store'

/** Alla scadenza riserva richiede il carrello al server (svuotamento autoritativo). */
export function useCartReservationSync(enabled = true) {
  const { cart } = useSnapshot(cartStore)
  const reservation = cart?.reservation
  const hasItems = (cart?.items.length ?? 0) > 0

  useEffect(() => {
    if (!enabled || !hasItems || !reservation?.enabled || !reservation.expiresAt) return

    const tick = () => {
      const expiresMs = new Date(reservation.expiresAt!).getTime()
      if (Date.now() >= expiresMs) void fetchCart({ force: true })
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [enabled, hasItems, cart?.id, reservation?.enabled, reservation?.expiresAt])
}
