'use client'

import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  cartStore,
  fetchCart,
  fetchRecommendations,
  useCartReservationSync,
  useCartStockPolling,
} from '@/features/cart'
import { CartPageView } from '@/components/cart/CartPageView'
import { CartPageSkeleton } from '@/components/cart/CartPageSkeleton'
import { PageLoadTransition } from '@/components/motion'
import { ToastOnError } from '@/components/ToastFeedback'
import { useI18n } from '@/hooks/use-i18n'

export function CartPage() {
  const { t } = useI18n()
  const cart = useSnapshot(cartStore)
  const [isPageReady, setIsPageReady] = useState(false)
  const recommendationKey =
    cart.cart?.items.map((line) => `${line.productRef}:${line.quantity}`).sort().join('|') ?? ''

  useCartStockPolling()
  useCartReservationSync()

  useEffect(() => {
    let active = true
    void fetchCart({ force: true, reprice: true }).finally(() => {
      if (active) setIsPageReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isPageReady || !recommendationKey) return
    void fetchRecommendations()
  }, [isPageReady, recommendationKey])

  if (isPageReady && cart.error && !cart.cart) {
    return (
      <>
        <ToastOnError message={cart.error} />
        <div className="bg-idl-tech-panel py-12 text-center">
          <h1 className="text-2xl font-extrabold text-idl-graphite">{t('cart.title')}</h1>
          <p className="mt-4 text-sm text-idl-muted">{t('error.genericTitle')}</p>
        </div>
      </>
    )
  }

  return (
    <PageLoadTransition isLoading={!isPageReady} skeleton={<CartPageSkeleton />}>
      {isPageReady ? <CartPageView state={cart} /> : null}
    </PageLoadTransition>
  )
}
