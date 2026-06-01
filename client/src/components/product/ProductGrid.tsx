import type { ProductCardDTO } from '@/types/dto'
import { ProductCard } from '@/components/product/ProductCard'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  emptyMessage?: string
}

export function ProductGrid({ products, emptyMessage = 'Nessun prodotto in elenco.' }: Props) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-500">{emptyMessage}</p>
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <li key={p.slug}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  )
}
