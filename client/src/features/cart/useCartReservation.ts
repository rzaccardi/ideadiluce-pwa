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

    const expiresMs = new Date(reservation.expiresAt).getTime()
    let intervalId: number | undefined

    const syncAfterExpiry = () => {
      if (intervalId != null) {
        window.clearInterval(intervalId)
        intervalId = undefined
      }
      void fetchCart({ force: true, reprice: true })
    }

    const tick = () => {
      if (Date.now() >= expiresMs) syncAfterExpiry()
    }

    tick()
    intervalId = window.setInterval(tick, 1000)

    return () => {
      if (intervalId != null) window.clearInterval(intervalId)
    }
  }, [enabled, hasItems, cart?.id, reservation?.enabled, reservation?.expiresAt])
}
