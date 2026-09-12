'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/endpoints'
import { useLocale } from '@/context/locale-context'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import { mergeProductAndVariantSpecs } from '@/lib/product-specs-parse'
import {
  buildDesignRelatedSearches,
  extractDesignRelatedFilters,
  pickDesignRelatedProducts,
  type DesignRelatedKind,
} from '@/lib/design-related-products'

type RelatedState = {
  products: ProductCardDTO[]
  kind: DesignRelatedKind
  href: string | null
  designerName: string | null
}

export function useDesignRelatedSlider(
  product: ProductDetailDTO,
  fallbackRelated: ReadonlyArray<ProductCardDTO>,
): RelatedState {
  const { locale } = useLocale()
  const specRows = useMemo(
    () =>
      mergeProductAndVariantSpecs({
        productSpecs: product.specs,
        specsTableHtml: product.specsTableHtml,
      }),
    [product.specs, product.specsTableHtml],
  )
  const filters = useMemo(
    () => extractDesignRelatedFilters(product, specRows),
    [product, specRows],
  )
  const searches = useMemo(() => buildDesignRelatedSearches(filters), [filters])
  const fallbackKey = fallbackRelated.map((item) => item.slug).join('|')
  const [state, setState] = useState<RelatedState>({
    products: [],
    kind: 'similar',
    href: null,
    designerName: filters.designerName,
  })

  useEffect(() => {
    const currentSlug = product.slug
    const controller = new AbortController()

    async function load() {
      for (const search of searches) {
        try {
          const result = await api.catalog.search(
            {
              ...search.params,
              locale,
              page: 1,
              pageSize: 16,
            },
            { signal: controller.signal },
          )
          if (controller.signal.aborted) return
          const products = pickDesignRelatedProducts(result.items, currentSlug)
          if (products.length > 0) {
            setState({
              products,
              kind: search.kind,
              href: search.href,
              designerName: filters.designerName,
            })
            return
          }
        } catch {
          if (controller.signal.aborted) return
        }
      }

      if (controller.signal.aborted) return
      setState({
        products: pickDesignRelatedProducts(fallbackRelated, currentSlug),
        kind: 'similar',
        href: searches.find((item) => item.kind === 'similar')?.href ?? searches[0]?.href ?? null,
        designerName: filters.designerName,
      })
    }

    void load()
    return () => controller.abort()
  }, [fallbackKey, fallbackRelated, filters.designerName, locale, product.slug, searches])

  return state
}
