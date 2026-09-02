import type { CatalogSearchSuggestionGroup } from '@/lib/catalog-search-suggestions'

export function buildPaletteDisplayGroups(options: {
  showIdle: boolean
  recentGroup: CatalogSearchSuggestionGroup | null
  groups: CatalogSearchSuggestionGroup[]
}): CatalogSearchSuggestionGroup[] {
  if (!options.showIdle) return options.groups
  return [options.recentGroup, ...options.groups].filter(
    (group): group is CatalogSearchSuggestionGroup => Boolean(group),
  )
}

export function clampSearchActiveIndex(index: number, length: number): number {
  if (length <= 0) return -1
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export function nextSearchActiveIndex(current: number, length: number, direction: 'up' | 'down'): number {
  if (length <= 0) return -1
  if (current < 0) return direction === 'down' ? 0 : length - 1
  if (direction === 'down') return current + 1 >= length ? 0 : current + 1
  return current - 1 < 0 ? length - 1 : current - 1
}

export function suggestionOptionId(listId: string, itemId: string): string {
  return `${listId}-option-${itemId}`
}

export function catalogSearchPaletteView(options: {
  queryLength: number
  minLength: number
  minApiLength?: number
  loading: boolean
  hasResults: boolean
  currentQuery?: string
  resultsQuery?: string | null
}): 'idle' | 'pending' | 'results' | 'empty' {
  if (options.queryLength < options.minLength) return 'idle'
  if (options.loading) return 'pending'
  if (
    options.currentQuery != null &&
    options.resultsQuery != null &&
    options.resultsQuery !== options.currentQuery
  ) {
    return 'pending'
  }
  if (options.hasResults) return 'results'
  const minApiLength = options.minApiLength ?? options.minLength
  if (options.queryLength < minApiLength) return 'pending'
  if (options.currentQuery != null && options.resultsQuery !== options.currentQuery) return 'pending'
  return 'empty'
}
