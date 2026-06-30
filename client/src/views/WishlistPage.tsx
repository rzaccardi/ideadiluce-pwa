'use client'

import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { notify } from '@/lib/notify'
import { useLocale } from '@/context/locale-context'
import { authStore } from '@/features/auth'
import { addItem } from '@/features/cart'
import {
  wishlistStore,
  fetchWishlist,
  fetchWishlistProducts,
  removeWishlistItem,
} from '@/features/wishlist'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { ToastOnError } from '@/components/ToastFeedback'
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard'
import { Button } from '@/components/Button'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { WishlistPageSkeleton } from '@/components/site/skeletons/wishlist-page-skeleton'
import { PageLoadTransition } from '@/components/motion'
import { useI18n } from '@/hooks/use-i18n'

export function WishlistPage() {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const wl = useSnapshot(wishlistStore)
  const { locale } = useLocale()
  const [bulkLoading, setBulkLoading] = useState(false)
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

  const availableEntries = wl.productEntries.filter(
    (e): e is typeof e & { product: NonNullable<typeof e.product> } =>
      !e.unavailable && e.product != null,
  )
  const unavailableCount = wl.productEntries.filter((e) => e.unavailable).length

  const showProductsSkeleton =
    (wl.isLoading && wl.items.length === 0) ||
    (wl.items.length > 0 && wl.isProductsLoading && wl.productEntries.length === 0)

  async function addAllToCart() {
    if (availableEntries.length === 0) return
    setBulkLoading(true)
    let added = 0
    let failed = 0
    for (const entry of availableEntries) {
      try {
        await addItem(entry.product.slug, 1, entry.variantRef ?? undefined)
        await removeWishlistItem(entry.itemId)
        added += 1
      } catch {
        failed += 1
      }
    }
    setBulkLoading(false)
    if (added > 0) notify.success(t('orders.reorder.success'))
    if (failed > 0) notify.error(t('orders.reorder.error'))
  }

  const wishlistGridSkeleton = (
    <WishlistPageSkeleton count={Math.min(Math.max(wl.items.length, 3), 6)} />
  )

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
      <PageHeader
        title={t('wishlist.title')}
        description={
          auth.isAuthenticated ? t('wishlist.descriptionAccount') : t('wishlist.descriptionGuest')
        }
      />

      {availableEntries.length > 0 ? (
        <div className="mb-6">
          <Button loading={bulkLoading} onClick={() => void addAllToCart()}>
            {t('wishlist.addAllToCart')}
          </Button>
        </div>
      ) : null}

      <ToastOnError message={wl.error} />
      <ToastOnError message={wl.productsError} />
      {unavailableCount > 0 ? (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {unavailableCount === wl.items.length
            ? t('wishlist.unavailableDescription')
            : t('wishlist.unavailableTitle')}
        </p>
      ) : null}

      {showProductsSkeleton ? (
        <PageLoadTransition isLoading skeleton={wishlistGridSkeleton}>
          {null}
        </PageLoadTransition>
      ) : wl.items.length === 0 ? (
        <EmptyState title={t('wishlist.emptyTitle')} description={t('wishlist.emptyDescription')} />
      ) : wl.productEntries.length === 0 ? (
        <EmptyState
          title={t('wishlist.unavailableTitle')}
          description={t('wishlist.unavailableDescription')}
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wl.productEntries.map((entry) => (
            <li key={entry.itemId} className="h-full">
              <WishlistItemCard
                itemId={entry.itemId}
                productRef={entry.productRef}
                variantRef={entry.variantRef}
                product={entry.product}
                unavailable={entry.unavailable}
              />
            </li>
          ))}
        </ul>
      )}
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
