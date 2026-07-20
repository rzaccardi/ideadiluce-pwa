'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { useLocale } from '@/context/locale-context'
import { api } from '@/api/endpoints'
import { catalogStore, fetchCatalogBootstrap } from '@/features/catalog'
import {
  CATALOG_SEARCH_LIMITS,
  canFetchProductSuggestions,
  createCatalogSearchApiGateState,
  recordProductSuggestionFetch,
  sanitizeCatalogSearchInput,
  type CatalogSearchApiGateState,
} from '@/lib/catalog-search-limits'
import {
  buildCatalogSubmitPath,
  productToSearchSuggestion,
  searchLocalCatalogSuggestions,
  type CatalogSearchSuggestion,
  type CatalogSearchSuggestionGroup,
} from '@/lib/catalog-search-suggestions'
import { recordRecentSearchQuery } from '@/lib/catalog-search-recent'
import { trackCatalogSearchEvent } from '@/lib/catalog-search-events'
import type { CatalogSearchSource, CatalogSearchTrackAction } from '@/types/catalog-search-events'
import type { CategoryDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'
import type { CatalogPreserveParams } from '@/lib/catalog-filters'
import type { LocalePathFn } from '@/components/site/sections/types'

export function flattenCatalogSearchGroups(groups: CatalogSearchSuggestionGroup[]): CatalogSearchSuggestion[] {
  return groups.flatMap((group) => group.items)
}

type HintItem = string | { label: string; query: string }

export function normalizeCatalogSearchHints(hints: ReadonlyArray<HintItem> | undefined): {
  display: ReadonlyArray<{ label: string; query: string }>
  strings: string[]
} {
  if (!hints?.length) return { display: [], strings: [] }
  const display = hints.map((hint) =>
    typeof hint === 'string' ? { label: hint, query: hint } : hint,
  )
  return { display, strings: display.map((h) => h.query) }
}

export type UseCatalogSearchAutocompleteOptions = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  lp: LocalePathFn
  world?: 'technical' | 'design' | 'all'
  brands?: ReadonlyArray<BrandListItemDTO>
  categories?: ReadonlyArray<CategoryDTO>
  hints?: ReadonlyArray<HintItem>
  maxPerGroup?: number
  enableAutocomplete?: boolean
  recordRecentOnSubmit?: boolean
  searchSource?: CatalogSearchSource
  onSubmitQuery?: (query: string) => void
  onAfterSubmit?: () => void
  /** Filtri catalogo da preservare nel submit (attacco, world, …). */
  preserveParams?: CatalogPreserveParams
}

export function useCatalogSearchAutocomplete({
  value,
  defaultValue = '',
  onValueChange,
  lp,
  world = 'all',
  brands = [],
  categories = [],
  hints,
  maxPerGroup = 4,
  enableAutocomplete = true,
  recordRecentOnSubmit = false,
  searchSource = 'inline',
  onSubmitQuery,
  onAfterSubmit,
  preserveParams,
}: UseCatalogSearchAutocompleteOptions) {
  const navigate = useNavigate()
  const { locale } = useLocale()
  const cat = useSnapshot(catalogStore)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const apiGateRef = useRef<CatalogSearchApiGateState>(createCatalogSearchApiGateState())

  const [internalQuery, setInternalQuery] = useState(defaultValue)
  const query = value ?? internalQuery

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<CatalogSearchSuggestionGroup[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [productTotal, setProductTotal] = useState<number | null>(null)
  const lastResultCountRef = useRef(0)

  const hintStrings = useMemo(() => normalizeCatalogSearchHints(hints).strings, [hints])
  const effectiveBrands = brands.length ? brands : cat.brands
  const effectiveCategories = categories.length ? categories : cat.categories
  const flatSuggestions = flattenCatalogSearchGroups(groups)

  useEffect(() => {
    if (!enableAutocomplete) return
    void fetchCatalogBootstrap({ locale, skipIfFresh: true })
  }, [enableAutocomplete, locale])

  useEffect(() => {
    if (defaultValue && value === undefined) setInternalQuery(defaultValue)
  }, [defaultValue, value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const setQuery = useCallback(
    (next: string) => {
      if (value === undefined) setInternalQuery(next)
      onValueChange?.(next)
    },
    [onValueChange, value],
  )

  const submitQuery = useCallback(
    (raw: string, action: CatalogSearchTrackAction = 'submit') => {
      const trimmed = sanitizeCatalogSearchInput(raw)
      setOpen(false)
      setGroups([])
      setProductTotal(null)
      setActiveIndex(-1)

      if (recordRecentOnSubmit && trimmed) {
        recordRecentSearchQuery(locale, trimmed)
      }

      if (trimmed) {
        trackCatalogSearchEvent({
          query: trimmed,
          locale,
          source: searchSource,
          action,
          resultCount: lastResultCountRef.current,
          productTotal,
        })
      }

      if (onSubmitQuery) {
        onSubmitQuery(trimmed)
      } else {
        const path = buildCatalogSubmitPath(trimmed, {
          world: world === 'all' ? undefined : world,
          ...preserveParams,
        })
        navigate(lp(path))
      }
      onAfterSubmit?.()
    },
    [locale, lp, navigate, onAfterSubmit, onSubmitQuery, preserveParams, productTotal, recordRecentOnSubmit, searchSource, world],
  )

  const pickSuggestion = useCallback(
    (item: CatalogSearchSuggestion) => {
      setOpen(false)
      setGroups([])
      setProductTotal(null)
      setActiveIndex(-1)

      if (recordRecentOnSubmit) {
        if (item.kind === 'query') {
          recordRecentSearchQuery(locale, item.label)
        } else {
          const trimmed = sanitizeCatalogSearchInput(query)
          if (trimmed) recordRecentSearchQuery(locale, trimmed)
        }
      }

      const trackedQuery =
        item.kind === 'query'
          ? item.label
          : sanitizeCatalogSearchInput(query) || item.label

      trackCatalogSearchEvent({
        query: trackedQuery,
        locale,
        source: searchSource,
        action: 'suggest_pick',
        resultCount: lastResultCountRef.current,
        productTotal,
        clickedPath: item.path,
        clickedKind: item.kind,
        clickedLabel: item.label,
      })

      navigate(lp(item.path))
      onAfterSubmit?.()
    },
    [locale, lp, navigate, onAfterSubmit, productTotal, query, recordRecentOnSubmit, searchSource],
  )

  const runAutocomplete = useCallback(
    async (raw: string) => {
      const trimmed = sanitizeCatalogSearchInput(raw)
      if (!enableAutocomplete || trimmed.length < CATALOG_SEARCH_LIMITS.minLocalLength) {
        setGroups([])
        setOpen(false)
        setProductTotal(null)
        return
      }

      const localGroups = searchLocalCatalogSuggestions(trimmed, {
        brands: effectiveBrands,
        categories: effectiveCategories,
        hints: hintStrings,
        maxPerGroup,
      })

      const requestId = ++requestRef.current
      setGroups(localGroups)
      setOpen(localGroups.length > 0)
      setActiveIndex(-1)
      setProductTotal(null)

      if (trimmed.length < CATALOG_SEARCH_LIMITS.minApiLength) return

      const gate = canFetchProductSuggestions(trimmed, apiGateRef.current, Date.now())
      if (!gate.allowed) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      try {
        const result = await api.catalog.products(
          {
            q: trimmed,
            page: 1,
            pageSize: CATALOG_SEARCH_LIMITS.suggestPageSize,
            locale,
            suggest: true,
          },
          { signal: controller.signal },
        )
        if (requestId !== requestRef.current) return

        apiGateRef.current = recordProductSuggestionFetch(apiGateRef.current, trimmed, Date.now())

        const productItems = result.items.map(productToSearchSuggestion)
        const nextGroups = [...localGroups]
        if (productItems.length) {
          nextGroups.push({ kind: 'product', items: productItems })
        }
        setGroups(nextGroups)
        setOpen(nextGroups.length > 0 || trimmed.length >= CATALOG_SEARCH_LIMITS.minApiLength)
        setProductTotal(result.total)
        lastResultCountRef.current = productItems.length
      } catch {
        if (controller.signal.aborted) return
        if (requestId === requestRef.current) {
          setGroups(localGroups)
          setOpen(localGroups.length > 0)
          setProductTotal(null)
        }
      } finally {
        if (requestId === requestRef.current) setLoading(false)
      }
    },
    [effectiveBrands, effectiveCategories, enableAutocomplete, hintStrings, locale, maxPerGroup],
  )

  const scheduleAutocomplete = useCallback(
    (raw: string) => {
      if (!enableAutocomplete) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void runAutocomplete(raw)
      }, CATALOG_SEARCH_LIMITS.debounceMs)
    },
    [enableAutocomplete, runAutocomplete],
  )

  const resetAutocomplete = useCallback(() => {
    setOpen(false)
    setGroups([])
    setActiveIndex(-1)
    setProductTotal(null)
    setLoading(false)
    abortRef.current?.abort()
  }, [])

  return {
    query,
    setQuery,
    open,
    setOpen,
    loading,
    groups,
    setGroups,
    flatSuggestions,
    activeIndex,
    setActiveIndex,
    productTotal,
    submitQuery,
    pickSuggestion,
    runAutocomplete,
    scheduleAutocomplete,
    resetAutocomplete,
    effectiveBrands,
    effectiveCategories,
  }
}
