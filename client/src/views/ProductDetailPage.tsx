'use client'

import { Link } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/Button'
import { ProductDetailSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { useProductDetailState } from '@/hooks/use-product-detail-state'
import { resolveProductCatalogKind, applyProductCatalogOverrides, resolveProductCatalogKindFromSlug } from '@/lib/product-catalog-kind'
import {
  DesignProductDetailView,
  TechnicalProductDetailView,
} from '@/components/site/product-detail'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'

type ProductDetailPageProps = {
  slug?: string
  initialProduct?: ProductDetailDTO | null
  initialRelatedProducts?: ProductCardDTO[]
}

export function ProductDetailPage({
  slug: slugProp,
  initialProduct,
  initialRelatedProducts,
}: ProductDetailPageProps = {}) {
  const { localize } = useLocale()
  const state = useProductDetailState({ slug: slugProp, initialProduct, initialRelatedProducts })
  const { product, relatedProducts, isLoading, error, t, slug } = state
  const skeletonVariant = product
    ? resolveProductCatalogKind(applyProductCatalogOverrides(product as ProductDetailDTO))
    : resolveProductCatalogKindFromSlug(slug ?? '')

  if (isLoading && !product) {
    return (
      <PageLoadTransition isLoading skeleton={<ProductDetailSkeleton variant={skeletonVariant} />}>
        {null}
      </PageLoadTransition>
    )
  }

  if (error || !product) {
    return (
      <ErrorState
        message={error ?? t('product.notAvailable')}
        action={
          <Link to={localize('/negozio')}>
            <Button variant="secondary">{t('product.backToCatalog')}</Button>
          </Link>
        }
      />
    )
  }

  const productForView = applyProductCatalogOverrides(product as ProductDetailDTO)
  const catalogKind = resolveProductCatalogKind(productForView)

  const detailView =
    catalogKind === 'design' ? (
      <DesignProductDetailView
        product={productForView}
        relatedProducts={[...relatedProducts] as ProductCardDTO[]}
        state={state}
      />
    ) : (
      <TechnicalProductDetailView
        product={productForView}
        relatedProducts={[...relatedProducts] as ProductCardDTO[]}
        state={state}
      />
    )

  return (
    <PageLoadTransition isLoading={false} skeleton={<ProductDetailSkeleton variant={skeletonVariant} />}>
      {detailView}
    </PageLoadTransition>
  )
}
