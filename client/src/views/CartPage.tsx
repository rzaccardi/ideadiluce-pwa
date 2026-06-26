'use client'

import { useEffect } from 'react'
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
  const recommendationKey =
    cart.cart?.items.map((line) => `${line.productRef}:${line.quantity}`).sort().join('|') ?? ''

  useCartStockPolling()
  useCartReservationSync()

  useEffect(() => {
    void fetchCart()
  }, [])

  useEffect(() => {
    if (recommendationKey) void fetchRecommendations()
  }, [recommendationKey])

  const isInitialLoading = cart.isLoading && !cart.cart

  if (cart.error && !cart.cart) {
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
    <PageLoadTransition isLoading={isInitialLoading} skeleton={<CartPageSkeleton />}>
      <CartPageView state={cart} />
    </PageLoadTransition>
  )
}
