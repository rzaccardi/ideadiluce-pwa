'use client'

import { memo } from 'react'
import type { CategoryDTO, ProductCardDTO } from '@/types/dto'
import type { CatalogWorldTab } from '@/lib/catalog-filters'
import { designCardBrandLabel } from '@/lib/catalog-filters'
import { resolveProductCardCatalogKind } from '@/lib/product-catalog-kind'
import { DesignCatalogProductCard, DesignCatalogProductGrid } from '../category/DesignCatalogProductGrid'
import { TechnicalCatalogProductCard, TechnicalCatalogProductGrid } from '../category/TechnicalCatalogProductGrid'
import type { LocalePathFn } from '../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  categories: ReadonlyArray<CategoryDTO>
  lp: LocalePathFn
  worldTab: CatalogWorldTab
  filtersOpen: boolean
}

const MixedCatalogCard = memo(function MixedCatalogCard({
  product,
  categories,
  lp,
}: {
  product: ProductCardDTO
  categories: ReadonlyArray<CategoryDTO>
  lp: LocalePathFn
}) {
  const kind = resolveProductCardCatalogKind(product)

  if (kind === 'technical') {
    return <TechnicalCatalogProductCard product={product} lp={lp} />
  }

  return (
    <DesignCatalogProductCard
      product={product}
      brandLabel={designCardBrandLabel(product, categories)}
      lp={lp}
    />
  )
})

export function CatalogProductGrid({ products, categories, lp, worldTab, filtersOpen }: Props) {
  if (worldTab === 'design') {
    return <DesignCatalogProductGrid products={products} lp={lp} />
  }

  if (worldTab === 'technical') {
    return <TechnicalCatalogProductGrid products={products} lp={lp} />
  }

  const columnClass = filtersOpen
    ? 'grid-cols-2 xl:grid-cols-3'
    : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className={cn('grid gap-3 sm:gap-4', columnClass)}>
      {products.map((product) => (
        <div key={product.slug} className="h-full">
          <MixedCatalogCard product={product} categories={categories} lp={lp} />
        </div>
      ))}
    </div>
  )
}
