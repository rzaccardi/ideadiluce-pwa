'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { useLocale } from '@/context/locale-context'
import {
  wishlistStore,
  fetchWishlist,
  fetchWishlistProducts,
} from '@/features/wishlist'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { AccountDcPartCard } from '@/components/account/dc/AccountDcPartCard'
import { ProductGridSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { ToastOnError } from '@/components/ToastFeedback'
import { useI18n } from '@/hooks/use-i18n'

export function AccountWishlistPage() {
  const { t, tParams } = useI18n()
  const wl = useSnapshot(wishlistStore)
  const { locale } = useLocale()
  const itemsKey = wl.items.map((i) => i.id).join('|')
  const itemsLength = wl.items.length

  useEffect(() => {
    void fetchWishlist()
  }, [])

  useEffect(() => {
    if (itemsLength === 0) {
      wishlistStore.productEntries = []
      wishlistStore.productsError = null
      return
    }
    void fetchWishlistProducts(locale)
  }, [itemsKey, itemsLength, locale])

  const showProductsSkeleton =
    (wl.isLoading && wl.items.length === 0) ||
    (wl.items.length > 0 && wl.isProductsLoading && wl.productEntries.length === 0)

  return (
    <AccountDcPanel
      title={t('account.parts.title')}
      action={
        wl.items.length > 0 ? (
          <span className="text-[13px] text-[#6c727c]">
            {tParams('account.parts.savedCount', { count: wl.items.length })}
          </span>
        ) : null
      }
      description={t('account.parts.description')}
    >
      <ToastOnError message={wl.error} />
      <ToastOnError message={wl.productsError} />

      <PageLoadTransition
        isLoading={showProductsSkeleton}
        skeleton={<ProductGridSkeleton count={Math.min(Math.max(wl.items.length, 4), 8)} />}
      >
        {wl.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#6c727c]">{t('wishlist.emptyDescription')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {wl.productEntries.map((entry) => (
              <AccountDcPartCard
                key={entry.itemId}
                itemId={entry.itemId}
                productRef={entry.productRef}
                variantRef={entry.variantRef}
                product={entry.product}
                unavailable={entry.unavailable}
              />
            ))}
          </div>
        )}
      </PageLoadTransition>
    </AccountDcPanel>
  )
}
