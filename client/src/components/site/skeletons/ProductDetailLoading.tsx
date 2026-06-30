'use client'

import { useParam } from '@/lib/navigation'
import { resolveProductCatalogKindFromSlug } from '@/lib/product-catalog-kind'
import { ProductDetailPageSkeleton } from './product-detail-page-skeleton'

export function ProductDetailLoading() {
  const slug = useParam('slug')
  const variant = slug ? resolveProductCatalogKindFromSlug(slug) : 'design'

  return <ProductDetailPageSkeleton variant={variant} />
}
