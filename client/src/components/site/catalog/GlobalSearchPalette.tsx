'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSnapshot } from 'valtio/react'
import { useIsClient } from '@/hooks/use-is-client'
import { useI18n } from '@/hooks/use-i18n'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useCatalogSearchAutocomplete } from '@/hooks/use-catalog-search-autocomplete'
import { getGlobalSearchShortcutLabel } from '@/hooks/use-global-search-shortcut'
import { catalogStore, fetchCatalogBootstrap } from '@/features/catalog'
import { siteStore } from '@/features/site'
import {
  clearRecentSearchQueries,
  getRecentSearchQueries,
  recentQueriesToSuggestionGroup,
} from '@/lib/catalog-search-recent'
import { CATALOG_SEARCH_LIMITS, sanitizeCatalogSearchInput } from '@/lib/catalog-search-limits'
import {
  buildPaletteDisplayGroups,
  nextSearchActiveIndex,
  suggestionOptionId,
} from '@/lib/catalog-search-palette'
import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import type { CatalogSearchSource } from '@/types/catalog-search-events'
import type { HomePageContent } from '@/types/site-content'
import {
  CATALOG_SEARCH_GROUP_LABEL_KEYS,
  CatalogSearchInputSpinner,
  CatalogSearchSuggestionRow,
  CatalogSearchSuggestionSkeleton,
} from './CatalogSearchSuggestionViews'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { layers } from '@/lib/layering'

type Props = {
  open: boolean
  initialQuery?: string
  searchSource?: CatalogSearchSource
  onClose: () => void
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function KeyboardHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-6 items-center justify-center rounded border border-idl-border bg-idl-paper px-1.5 py-0.5 font-mono text-[10px] text-idl-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

export function GlobalSearchPalette({ open, initialQuery, searchSource = 'palette', onClose }: Props) {
  const isClient = useIsClient()
  const reduceMotion = useReducedMotion()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { t, tParams } = useI18n()
  const lp = useLocalePath()
  const { locale } = useLocale()
  const cat = useSnapshot(catalogStore)
  const site = useSnapshot(siteStore)

  const homeCms =
    site.pages.home && typeof site.pages.home === 'object'
      ? (site.pages.home as HomePageContent)
      : null
  const searchCms = homeCms?.search

  const [recentVersion, setRecentVersion] = useState(0)

  const {
    query,
    setQuery,
    loading,
    groups,
    activeIndex,
    setActiveIndex,
    productTotal,
    submitQuery,
    pickSuggestion,
    scheduleAutocomplete,
    resetAutocomplete,
  } = useCatalogSearchAutocomplete({
    lp,
    brands: cat.brands,
    categories: cat.categories,
    hints: searchCms?.hints,
    maxPerGroup: 5,
    recordRecentOnSubmit: true,
    searchSource,
    onAfterSubmit: onClose,
  })

  const trimmedQuery = sanitizeCatalogSearchInput(query)
  const showIdle = trimmedQuery.length === 0
  const recentQueries = getRecentSearchQueries(locale)
  const recentGroup = showIdle ? recentQueriesToSuggestionGroup(recentQueries) : null
  const displayGroups = buildPaletteDisplayGroups({ showIdle, recentGroup, groups })
  const displayFlat = displayGroups.flatMap((group) => group.items)
  const hasResults = displayFlat.length > 0
  const showEmpty =
    trimmedQuery.length >= CATALOG_SEARCH_LIMITS.minLocalLength && !loading && !hasResults
  const shortcut = getGlobalSearchShortcutLabel()
  const activeDescendantId =
    activeIndex >= 0 && displayFlat[activeIndex]
      ? suggestionOptionId(listId, displayFlat[activeIndex]!.id)
      : undefined

  useEffect(() => {
    if (!open) return
    void fetchCatalogBootstrap({ locale })
    setRecentVersion((value) => value + 1)
  }, [locale, open])

  const wasOpenRef = useRef(open)

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      resetAutocomplete()
      setQuery('')
      setActiveIndex(-1)
    }
    wasOpenRef.current = open
  }, [open, resetAutocomplete, setActiveIndex, setQuery])

  useEffect(() => {
    if (!open) return

    if (initialQuery) {
      setQuery(initialQuery)
      scheduleAutocomplete(initialQuery)
    }

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = prevOverflow
    }
  }, [initialQuery, open, scheduleAutocomplete, setQuery])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  useEffect(() => {
    if (activeDescendantId) {
      document.getElementById(activeDescendantId)?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeDescendantId])

  function bumpRecent() {
    setRecentVersion((value) => value + 1)
  }

  function onSearch(event: FormEvent) {
    event.preventDefault()
    if (activeIndex >= 0 && displayFlat[activeIndex]) {
      pickSuggestion(displayFlat[activeIndex]!)
      bumpRecent()
      return
    }
    submitQuery(query)
    bumpRecent()
  }

  function handlePick(item: Parameters<typeof pickSuggestion>[0]) {
    pickSuggestion(item)
    bumpRecent()
  }

  function handleViewAll() {
    submitQuery(query, 'view_all')
    bumpRecent()
  }

  function handleClearRecent() {
    clearRecentSearchQueries(locale)
    bumpRecent()
  }

  if (!isClient) return null

  const viewAllLabel =
    productTotal != null && productTotal > 0
      ? tParams('catalog.searchViewAllResults', { count: productTotal })
      : t('catalog.searchViewAllResultsNoCount')

  const panel = (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      ref={resultsRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('catalog.searchLabel')}
      className="pointer-events-auto relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-idl-border bg-idl-paper shadow-2xl"
    >
      <form onSubmit={onSearch} className="border-b border-idl-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <SearchIcon className="size-5 shrink-0 text-idl-muted" />
          <input
            ref={inputRef}
            value={query}
            role="combobox"
            aria-expanded={hasResults || showEmpty}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendantId}
            aria-label={t('catalog.searchLabel')}
            placeholder={searchCms?.placeholder ?? t('catalog.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-idl-ink outline-none placeholder:text-idl-placeholder"
            maxLength={CATALOG_SEARCH_LIMITS.maxQueryLength}
            onChange={(event) => {
              const next = sanitizeCatalogSearchInput(event.target.value)
              setQuery(next)
              setActiveIndex(-1)
              scheduleAutocomplete(next)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActiveIndex((index) => nextSearchActiveIndex(index, displayFlat.length, 'down'))
                return
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActiveIndex((index) => nextSearchActiveIndex(index, displayFlat.length, 'up'))
              }
            }}
          />
          {loading ? <CatalogSearchInputSpinner /> : null}
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setActiveIndex(-1)
                resetAutocomplete()
                inputRef.current?.focus()
              }}
              className={cn(
                ui.interactive,
                'rounded-full px-2 py-1 text-xs text-idl-muted hover:text-idl-ink',
              )}
            >
              {t('catalog.clearSearch')}
            </button>
          ) : (
            <KeyboardHint className="hidden sm:inline-flex">{shortcut}</KeyboardHint>
          )}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              ui.interactive,
              'inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-idl-border text-idl-muted hover:text-idl-ink',
            )}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
      </form>

      <div className="max-h-[min(52vh,520px)] overflow-y-auto overscroll-contain" key={recentVersion}>
        {loading ? <CatalogSearchSuggestionSkeleton count={4} /> : null}

        {!loading && hasResults ? (
          <ul id={listId} role="listbox" className="py-1">
            {displayGroups.map((group) => (
              <li key={`${group.kind}-${group.items[0]?.id ?? 'empty'}`} role="presentation">
                <div className="flex items-center justify-between gap-3 px-4 py-2">
                  <div className="font-mono text-[10px] tracking-[0.12em] text-idl-muted uppercase">
                    {group.kind === 'query' && showIdle
                      ? t('catalog.searchRecentLabel')
                      : t(CATALOG_SEARCH_GROUP_LABEL_KEYS[group.kind])}
                  </div>
                  {group.kind === 'query' && showIdle && recentQueries.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      className={cn(ui.interactive, 'text-[11px] text-idl-muted hover:text-idl-ink')}
                    >
                      {t('catalog.searchClearRecent')}
                    </button>
                  ) : null}
                </div>
                {group.items.map((item) => {
                  const index = displayFlat.indexOf(item)
                  return (
                    <CatalogSearchSuggestionRow
                      key={item.id}
                      listId={listId}
                      item={item}
                      query={trimmedQuery}
                      active={index === activeIndex}
                      variant="palette"
                      isRecent={group.kind === 'query' && showIdle}
                      onPick={handlePick}
                      onHover={() => setActiveIndex(index)}
                    />
                  )
                })}
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && showEmpty ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-idl-cream text-idl-muted">
              <SearchIcon className="size-5" />
            </div>
            <p className="font-serif text-lg text-idl-ink">{t('catalog.searchEmptyTitle')}</p>
            <p className="mt-2 text-sm text-idl-muted">{t('catalog.searchEmptyDescription')}</p>
            {trimmedQuery.length >= CATALOG_SEARCH_LIMITS.minLocalLength ? (
              <button
                type="button"
                onClick={handleViewAll}
                className={cn(ui.interactive, 'mt-4 text-sm font-medium text-idl-ink hover:text-idl-brass')}
              >
                {viewAllLabel}
              </button>
            ) : null}
          </div>
        ) : null}

        {!loading && showIdle && searchCms?.hints?.length ? (
          <div className="border-t border-idl-border/70 px-5 py-5">
            <p className="mb-3 text-[12px] text-idl-muted">{t('catalog.searchPopularLabel')}</p>
            <div className="flex flex-wrap gap-2">
              {searchCms.hints.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => {
                    setQuery(hint)
                    submitQuery(hint)
                    bumpRecent()
                  }}
                  className={cn(
                    ui.chipInteractive,
                    'rounded-full bg-idl-cream px-3 py-1.5 font-mono text-[12px] text-idl-ink-soft hover:text-idl-ink',
                  )}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-idl-border bg-idl-tech-panel/60 px-4 py-3 text-[11px] text-idl-muted sm:px-5">
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <span>{t('catalog.searchKeyboardNavigate')}</span>
          <KeyboardHint>↑</KeyboardHint>
          <KeyboardHint>↓</KeyboardHint>
          <span className="mx-1">·</span>
          <span>{t('catalog.searchKeyboardSelect')}</span>
          <KeyboardHint>↵</KeyboardHint>
          <span className="mx-1">·</span>
          <span>{t('catalog.searchKeyboardClose')}</span>
          <KeyboardHint>Esc</KeyboardHint>
        </div>

        {trimmedQuery.length >= CATALOG_SEARCH_LIMITS.minLocalLength ? (
          <button
            type="button"
            onClick={handleViewAll}
            className={cn(
              ui.interactive,
              'ml-auto font-medium text-idl-ink hover:text-idl-brass sm:ml-0',
            )}
          >
            {viewAllLabel}
          </button>
        ) : (
          <span className="ml-auto hidden sm:inline">{tParams('catalog.searchShortcutHint', { shortcut })}</span>
        )}
      </div>
    </motion.div>
  )

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="global-search-backdrop"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'pointer-events-none fixed inset-0 flex items-start justify-center overflow-y-auto p-3 pt-[6vh] backdrop-blur-sm sm:p-4 sm:pt-[10vh]',
            layers.searchModal,
          )}
        >
          <button
            type="button"
            aria-label={t('common.close')}
            className="pointer-events-auto fixed inset-0 cursor-default bg-idl-backdrop/90"
            onClick={onClose}
          />
          <div className="pointer-events-none relative z-10 flex w-full max-w-3xl shrink-0 justify-center">
            {panel}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
