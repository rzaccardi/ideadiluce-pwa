'use client'

import type { ProductCardDTO } from '@/types/dto'
import { ProductCard } from '@/components/product/ProductCard'
import { CatalogEmptyAlternatives } from '@/components/catalog/CatalogEmptyAlternatives'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  emptyMessage?: string
}

export function ProductGrid({ products, emptyMessage }: Props) {
  if (products.length === 0) {
    return <CatalogEmptyAlternatives compact title={emptyMessage} />
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <li key={p.slug} className="h-full">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  )
}
