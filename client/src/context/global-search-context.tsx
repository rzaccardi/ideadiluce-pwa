'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useGlobalSearchShortcut } from '@/hooks/use-global-search-shortcut'
import { GlobalSearchPalette } from '@/components/site/catalog/GlobalSearchPalette'
import type { CatalogSearchSource } from '@/types/catalog-search-events'

type GlobalSearchContextValue = {
  open: boolean
  initialQuery: string | undefined
  searchSource: CatalogSearchSource
  openSearch: (initialQuery?: string, source?: CatalogSearchSource) => void
  closeSearch: () => void
  toggleSearch: () => void
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null)

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined)
  const [searchSource, setSearchSource] = useState<CatalogSearchSource>('palette')

  const openSearch = useCallback((query?: string, source: CatalogSearchSource = 'palette') => {
    setInitialQuery(query?.trim() ? query.trim() : undefined)
    setSearchSource(source)
    setOpen(true)
  }, [])
  const closeSearch = useCallback(() => {
    setOpen(false)
    setInitialQuery(undefined)
    setSearchSource('palette')
  }, [])
  const toggleSearch = useCallback(() => {
    setSearchSource('palette')
    setOpen((current) => !current)
  }, [])

  useGlobalSearchShortcut({
    onOpen: () => openSearch(undefined, 'palette'),
    enabled: !open,
  })

  const value = useMemo(
    () => ({ open, initialQuery, searchSource, openSearch, closeSearch, toggleSearch }),
    [closeSearch, initialQuery, open, openSearch, searchSource, toggleSearch],
  )

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      <GlobalSearchPalette
        open={open}
        initialQuery={initialQuery}
        searchSource={searchSource}
        onClose={closeSearch}
      />
    </GlobalSearchContext.Provider>
  )
}

export function useGlobalSearch(): GlobalSearchContextValue {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider')
  }
  return context
}

export function useGlobalSearchOptional(): GlobalSearchContextValue | null {
  return useContext(GlobalSearchContext)
}
