'use client'

import type { ProductCardDTO } from '@/types/dto'
import { CatalogEmptyAlternatives } from '@/components/catalog/CatalogEmptyAlternatives'
import { DesignCatalogProductCard } from '@/components/site/category/DesignCatalogProductGrid'
import { TechnicalCatalogProductCard } from '@/components/site/category/TechnicalCatalogProductGrid'
import { useLocalePath } from '@/hooks/use-locale-path'
import { resolveProductCardCatalogKind } from '@/lib/product-catalog-kind'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  emptyMessage?: string
  /** Forza il layout card (es. landing Arredo senza Add). */
  forceKind?: 'design' | 'technical'
}

export function ProductGrid({ products, emptyMessage, forceKind }: Props) {
  const lp = useLocalePath()

  if (products.length === 0) {
    return <CatalogEmptyAlternatives compact title={emptyMessage} />
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const kind = forceKind ?? resolveProductCardCatalogKind(p)
        return (
          <li key={p.slug} className="h-full">
            {kind === 'technical' ? (
              <TechnicalCatalogProductCard product={p} lp={lp} />
            ) : (
              <DesignCatalogProductCard product={p} lp={lp} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
