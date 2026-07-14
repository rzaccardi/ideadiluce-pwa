'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ProductCardDTO } from '@/types/dto'

export function useTechnicalCatalogSelection(products: ReadonlyArray<ProductCardDTO>) {
  const [selectionEnabled, setSelectionEnabled] = useState(false)
  const [selectedSlugs, setSelectedSlugs] = useState<ReadonlySet<string>>(() => new Set())

  const selectedCount = selectedSlugs.size

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedSlugs.has(product.slug)),
    [products, selectedSlugs],
  )

  const allVisibleSelected = products.length > 0 && products.every((product) => selectedSlugs.has(product.slug))

  const setSelectionMode = useCallback((enabled: boolean) => {
    setSelectionEnabled(enabled)
    if (!enabled) {
      setSelectedSlugs(new Set())
    }
  }, [])

  const toggleProduct = useCallback((slug: string) => {
    setSelectedSlugs((current) => {
      const next = new Set(current)
      if (next.has(slug)) {
        next.delete(slug)
        return next
      }
      next.add(slug)
      return next
    })
  }, [])

  const isSelected = useCallback((slug: string) => selectedSlugs.has(slug), [selectedSlugs])

  const selectAllVisible = useCallback(() => {
    setSelectedSlugs(new Set(products.map((product) => product.slug)))
  }, [products])

  const clearSelection = useCallback(() => {
    setSelectedSlugs(new Set())
  }, [])

  return {
    selectionEnabled,
    selectedSlugs,
    selectedCount,
    selectedProducts,
    allVisibleSelected,
    setSelectionMode,
    toggleProduct,
    isSelected,
    selectAllVisible,
    clearSelection,
  }
}

export type TechnicalCatalogSelection = ReturnType<typeof useTechnicalCatalogSelection>
