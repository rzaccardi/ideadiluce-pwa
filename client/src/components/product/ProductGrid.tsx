'use client'

import type { ProductCardDTO } from '@/types/dto'
import { ProductCard } from '@/components/product/ProductCard'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  emptyMessage?: string
}

export function ProductGrid({ products, emptyMessage }: Props) {
  const { t } = useI18n()
  const message = emptyMessage ?? t('product.grid.empty')

  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-idl-muted">{message}</p>
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
