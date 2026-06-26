'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/api/endpoints'
import { mapArflyListResponse } from '@/lib/arfly/mapper'
import { toPwaLocale } from '@/lib/arfly/lookup'
import { getCategoryLandingContent } from '@/lib/category-landing.defaults'
import { DesignCategoryView, TechnicalCategoryView } from '@/components/site/category'
import { SeoHead } from '@/components/SeoHead'
import { useLocale } from '@/context/locale-context'
import type { CategoryLandingKey } from '@/types/category-landing'
import type { ProductCardDTO } from '@/types/dto'

type Props = {
  pageKey: CategoryLandingKey
}

export function ProductCategoryLandingPage({ pageKey }: Props) {
  const { locale } = useLocale()
  const content = getCategoryLandingContent(pageKey)
  const isDesign = pageKey === 'design'

  const [products, setProducts] = useState<ProductCardDTO[]>([])
  const [totalCount, setTotalCount] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProducts = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true)
      try {
        const pwaLocale = toPwaLocale(locale)
        const raw = await api.arfly.products({
          locale: pwaLocale,
          page: nextPage,
          pageSize: content.pageSize,
          q: content.searchQuery,
          enrichSpecTags: !isDesign,
        })
        const mapped = mapArflyListResponse(raw, pwaLocale)
        setProducts((prev) => (append ? [...prev, ...mapped.items] : mapped.items))
        setTotalCount(mapped.total)
        setHasMore(mapped.hasNextPage)
        setPage(mapped.page)
      } catch {
        if (!append) {
          setProducts([])
          setTotalCount(undefined)
          setHasMore(false)
        }
      } finally {
        setLoading(false)
      }
    },
    [content.pageSize, content.searchQuery, locale],
  )

  useEffect(() => {
    void loadProducts(1, false)
  }, [loadProducts])

  const onLoadMore = useCallback(() => {
    if (!hasMore || loading) return
    void loadProducts(page + 1, true)
  }, [hasMore, loadProducts, loading, page])

  return (
    <>
      <SeoHead title={`${content.title} — Idea di Luce`} description={content.description} />
      {isDesign ? (
        <DesignCategoryView
          content={content}
          products={products}
          totalCount={totalCount}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      ) : (
        <TechnicalCategoryView
          content={content}
          products={products}
          totalCount={totalCount}
          loading={loading}
        />
      )}
    </>
  )
}
