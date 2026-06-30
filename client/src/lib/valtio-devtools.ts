'use client'

import { devtools } from 'valtio/utils'
import { accountStore } from '@/features/account/account.store'
import { appStore } from '@/features/app/app.store'
import { authStore } from '@/features/auth/auth.store'
import { cartFeedbackStore } from '@/features/cart/cart-feedback.store'
import { cartStore } from '@/features/cart/cart.store'
import { catalogStore } from '@/features/catalog/catalog.store'
import { checkoutStore } from '@/features/checkout/checkout.store'
import { ordersStore } from '@/features/orders/orders.store'
import { productStore } from '@/features/product/product.store'
import { professionalRequestStore } from '@/features/professional-request/professional-request.store'
import { quotesStore } from '@/features/quotes/quotes.store'
import { siteStore } from '@/features/site/site.actions'
import { wishlistStore } from '@/features/wishlist/wishlist.store'

const DEVTOOLS_ENABLED = process.env.NODE_ENV === 'development'

/** Collega gli store Valtio all'estensione Redux DevTools (solo dev). */
export function initValtioDevtools(): (() => void) | void {
  if (!DEVTOOLS_ENABLED || typeof window === 'undefined') return

  const stores: Array<{ proxy: object; name: string }> = [
    { proxy: cartStore, name: '[idl] cart' },
    { proxy: cartFeedbackStore, name: '[idl] cartFeedback' },
    { proxy: productStore, name: '[idl] product' },
    { proxy: catalogStore, name: '[idl] catalog' },
    { proxy: wishlistStore, name: '[idl] wishlist' },
    { proxy: checkoutStore, name: '[idl] checkout' },
    { proxy: authStore, name: '[idl] auth' },
    { proxy: siteStore, name: '[idl] site' },
    { proxy: accountStore, name: '[idl] account' },
    { proxy: ordersStore, name: '[idl] orders' },
    { proxy: quotesStore, name: '[idl] quotes' },
    { proxy: appStore, name: '[idl] app' },
    { proxy: professionalRequestStore, name: '[idl] professionalRequest' },
  ]

  const unsubs = stores.map(({ proxy, name }) =>
    devtools(proxy, { name, enabled: true }),
  )

  return () => {
    for (const unsub of unsubs) {
      if (typeof unsub === 'function') unsub()
    }
  }
}
