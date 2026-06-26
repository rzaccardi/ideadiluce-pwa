import { useEffect } from 'react'
import { fetchCart } from '@/features/cart'
import { fetchWishlist } from '@/features/wishlist'

/** Allinea carrello e preferiti per lo stato delle card (dedupe su richieste parallele). */
export function useProductCardStores() {
  useEffect(() => {
    void fetchCart()
    void fetchWishlist()
  }, [])
}
