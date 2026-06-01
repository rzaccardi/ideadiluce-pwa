import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { catalogStore, fetchCategories, fetchProducts } from '@/features/catalog'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ErrorState } from '@/components/ErrorState'
import { ProductGridSkeleton } from '@/components/Skeleton'

export function HomePage() {
  const cat = useSnapshot(catalogStore)

  useEffect(() => {
    void fetchCategories()
    void fetchProducts({ categorySlug: undefined, pageSize: 3 })
  }, [])

  return (
    <div>
      <section>
        <PageHeader
          title="Prodotti in evidenza"
          description="Una selezione dal catalogo disponibile."
          actions={
            <Link to="/catalog">
              <Button variant="secondary">Vai al catalogo</Button>
            </Link>
          }
        />
        {cat.error ? <ErrorState message={cat.error} className="mb-6" /> : null}
        {cat.isLoading && cat.products.length === 0 ? (
          <ProductGridSkeleton count={3} />
        ) : (
          <ProductGrid products={cat.products} emptyMessage="Caricamento catalogo in corso…" />
        )}
        <div className="mt-6 text-center">
          <Link to="/catalog" className="text-sm font-medium text-zinc-900 underline">
            Vedi tutti i prodotti
          </Link>
        </div>
      </section>

      {cat.categories.length > 0 ? (
        <section className="mt-12">
          <PageHeader title="Categorie" />
          <ul className="flex flex-wrap gap-2">
            {cat.categories.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/catalog?category=${encodeURIComponent(c.slug)}`}
                  className="inline-block rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-300"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
