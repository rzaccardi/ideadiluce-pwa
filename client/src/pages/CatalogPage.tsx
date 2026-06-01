import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { catalogStore, fetchCategories, fetchNextProductsPage, fetchProducts } from '@/features/catalog'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { ProductGridSkeleton } from '@/components/Skeleton'

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const initialCategory = params.get('category') ?? undefined
  const queryParam = params.get('q')?.trim() ?? ''
  const isClassicPagination = params.get('pagination') === 'classic'
  const pageParam = Number(params.get('page') ?? '1')
  const currentPageParam = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const cat = useSnapshot(catalogStore)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState(queryParam)
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false)

  useEffect(() => {
    void fetchCategories()
  }, [])

  useEffect(() => {
    void fetchProducts({
      categorySlug: initialCategory,
      q: queryParam || undefined,
      page: isClassicPagination ? currentPageParam : 1,
      pageSize: 24,
    })
  }, [currentPageParam, initialCategory, isClassicPagination, queryParam])

  useEffect(() => {
    setSearchTerm(queryParam)
  }, [queryParam])

  useEffect(() => {
    const nextQuery = searchTerm.trim()
    if (nextQuery === queryParam) return

    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(params)
      next.delete('page')
      if (nextQuery) {
        next.set('q', nextQuery)
      } else {
        next.delete('q')
      }
      setParams(next)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [params, queryParam, searchTerm, setParams])

  useEffect(() => {
    const node = loadMoreRef.current
    if (isClassicPagination || !node || !cat.pagination.hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextProductsPage()
        }
      },
      { rootMargin: '360px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [cat.pagination.hasNextPage, cat.pagination.page, isClassicPagination])

  function selectCategory(categorySlug?: string) {
    const next = new URLSearchParams(params)
    next.delete('page')
    if (categorySlug) {
      next.set('category', categorySlug)
    } else {
      next.delete('category')
    }
    setIsCategoryPanelOpen(false)
    setParams(next)
  }

  function applySuggestion(name: string) {
    const next = new URLSearchParams(params)
    next.delete('page')
    next.set('q', name)
    setSearchTerm(name)
    setParams(next)
  }

  function clearSearch() {
    const next = new URLSearchParams(params)
    next.delete('page')
    next.delete('q')
    setSearchTerm('')
    setParams(next)
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(params)
    next.set('pagination', 'classic')
    next.set('page', String(page))
    setParams(next)
  }

  const suggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (q.length < 3) return []
    const seen = new Set<string>()
    return cat.products
      .filter((product) => product.name.toLowerCase().includes(q))
      .map((product) => product.name)
      .filter((name) => {
        if (seen.has(name)) return false
        seen.add(name)
        return true
      })
      .slice(0, 6)
  }, [cat.products, searchTerm])

  const selectedCategory = useMemo(
    () => cat.categories.find((category) => category.slug === cat.filters.categorySlug),
    [cat.categories, cat.filters.categorySlug],
  )

  const visibleCategories = useMemo(() => {
    const q = categorySearchTerm.trim().toLowerCase()
    if (!q) return cat.categories

    return cat.categories.filter((category) =>
      [category.name, category.slug].some((value) => value.toLowerCase().includes(q)),
    )
  }, [cat.categories, categorySearchTerm])

  return (
    <div>
      <PageHeader
        title="Catalogo"
        description="Cerca prodotti, filtra per categoria e condividi lo stato del catalogo tramite query string."
      />

      {cat.error ? <ErrorState message={cat.error} className="mb-6" /> : null}

      <div className="mb-8 space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div>
          <label htmlFor="catalog-search" className="text-sm font-medium text-zinc-900">
            Cerca nel catalogo
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="catalog-search"
              list="catalog-search-suggestions"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Scrivi almeno 3 caratteri..."
              className="min-h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
            />
            {queryParam ? (
              <Button variant="secondary" onClick={clearSearch}>
                Cancella ricerca
              </Button>
            ) : null}
          </div>
          <datalist id="catalog-search-suggestions">
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <p className="mt-2 text-xs text-zinc-500">
            La ricerca aggiorna l’URL con `q` e interroga il catalogo dopo una breve pausa.
          </p>
          {suggestions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => applySuggestion(name)}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 hover:border-zinc-300 hover:bg-white"
                >
                  {name}
                </button>
              ))}
            </div>
          ) : searchTerm.trim().length >= 3 && !cat.isLoading ? (
            <p className="mt-3 text-xs text-zinc-500">Nessun suggerimento nei prodotti caricati.</p>
          ) : null}
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">Categoria</p>
              <p className="mt-1 text-xs text-zinc-500">
                {selectedCategory ? `Filtro attivo: ${selectedCategory.name}` : 'Tutte le categorie'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCategory ? (
                <Button variant="ghost" size="sm" onClick={() => selectCategory(undefined)}>
                  Cancella categoria
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                aria-expanded={isCategoryPanelOpen}
                aria-controls="catalog-category-panel"
                onClick={() => setIsCategoryPanelOpen((value) => !value)}
              >
                {isCategoryPanelOpen ? 'Nascondi categorie' : `Scegli categoria (${cat.categories.length})`}
              </Button>
            </div>
          </div>

          {isCategoryPanelOpen ? (
            <div id="catalog-category-panel" className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <label htmlFor="catalog-category-search" className="sr-only">
                Cerca categoria
              </label>
              <input
                id="catalog-category-search"
                type="search"
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                placeholder="Cerca categoria..."
                className="mb-3 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
              />
              <div className="max-h-72 overflow-y-auto pr-1">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Button
                    variant={!cat.filters.categorySlug ? 'primary' : 'secondary'}
                    size="sm"
                    className="justify-start"
                    onClick={() => selectCategory(undefined)}
                  >
                    Tutti
                  </Button>
                  {visibleCategories.map((c) => (
                    <Button
                      key={c.id}
                      variant={cat.filters.categorySlug === c.slug ? 'primary' : 'secondary'}
                      size="sm"
                      className="justify-start truncate"
                      title={c.name}
                      onClick={() => selectCategory(c.slug)}
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
                {visibleCategories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">Nessuna categoria trovata.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {cat.isLoading && cat.products.length === 0 ? (
        <ProductGridSkeleton count={6} />
      ) : cat.products.length === 0 ? (
        <EmptyState title="Nessun prodotto" description="Prova un altro filtro." />
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
            Mostrati {cat.products.length} di {cat.pagination.total} prodotti
            {queryParam ? <span> per “{queryParam}”</span> : null}
          </div>
          <ProductGrid products={cat.products} />
          {cat.isLoadingMore ? <ProductGridSkeleton count={3} className="mt-6" /> : null}
          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            {isClassicPagination ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  disabled={!cat.pagination.hasPreviousPage || cat.isLoading}
                  onClick={() => goToPage(cat.pagination.page - 1)}
                >
                  Precedente
                </Button>
                <span className="text-sm text-zinc-500">
                  Pagina {cat.pagination.page} di {cat.pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={!cat.pagination.hasNextPage || cat.isLoading}
                  onClick={() => goToPage(cat.pagination.page + 1)}
                >
                  Successiva
                </Button>
              </div>
            ) : cat.pagination.hasNextPage ? (
              <Button
                variant="secondary"
                disabled={cat.isLoadingMore}
                onClick={() => void fetchNextProductsPage()}
              >
                {cat.isLoadingMore ? 'Caricamento...' : 'Carica altri prodotti'}
              </Button>
            ) : (
              <p className="text-sm text-zinc-500">Hai visto tutti i prodotti.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
