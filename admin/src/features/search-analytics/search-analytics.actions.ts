import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type {
  CatalogSearchAnalyticsList,
  CatalogSearchAnalyticsStats,
} from '@/types/search-analytics'
import type { SearchHintsOdooApplyResult, SearchHintsOdooPreview } from '@/types/search-hints'
import { searchAnalyticsStore } from './search-analytics.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function previewOdooSearchHints(lookbackDays: number, limit: number) {
  searchAnalyticsStore.odooHintsLoading = true
  searchAnalyticsStore.odooHintsError = null
  searchAnalyticsStore.odooHintsMessage = null
  try {
    const params = new URLSearchParams({
      lookbackDays: String(lookbackDays),
      limit: String(limit),
    })
    searchAnalyticsStore.odooHints = await adminApi<SearchHintsOdooPreview>(
      `/admin/search-analytics/odoo-hints?${params}`,
    )
  } catch (e) {
    searchAnalyticsStore.odooHintsError = errMessage(e)
    searchAnalyticsStore.odooHints = null
    throw e
  } finally {
    searchAnalyticsStore.odooHintsLoading = false
  }
}

export async function applyOdooSearchHints(lookbackDays: number, limit: number) {
  searchAnalyticsStore.odooHintsApplying = true
  searchAnalyticsStore.odooHintsError = null
  searchAnalyticsStore.odooHintsMessage = null
  try {
    const result = await adminApi<SearchHintsOdooApplyResult>(
      '/admin/search-analytics/apply-odoo-hints',
      {
        method: 'POST',
        body: JSON.stringify({ lookbackDays, limit }),
      },
    )
    searchAnalyticsStore.odooHints = {
      odooConfigured: true,
      autoSyncEnabled: true,
      staleHours: 72,
      lookbackDays: result.lookbackDays,
      limit: result.limit,
      currentHints: result.hints,
      lastOdooSyncedAt: result.updatedAt,
      isStale: false,
      suggestions: result.suggestions,
    }
    searchAnalyticsStore.odooHintsMessage = `Salvate ${result.hints.length} query in Home (${result.updatedLocales.join(', ')}).`
    return result
  } catch (e) {
    searchAnalyticsStore.odooHintsError = errMessage(e)
    throw e
  } finally {
    searchAnalyticsStore.odooHintsApplying = false
  }
}

export async function fetchSearchAnalyticsStats(query: string) {
  searchAnalyticsStore.statsLoading = true
  searchAnalyticsStore.statsError = null
  try {
    searchAnalyticsStore.stats = await adminApi<CatalogSearchAnalyticsStats>(
      `/admin/search-analytics/stats?${query}`,
    )
  } catch (e) {
    searchAnalyticsStore.statsError = errMessage(e)
    searchAnalyticsStore.stats = null
  } finally {
    searchAnalyticsStore.statsLoading = false
  }
}

export function fetchSearchAnalyticsStatsDeduped(query: string) {
  return dedupeAsync(`admin:search-analytics:stats:${query}`, () => fetchSearchAnalyticsStats(query))
}

export async function fetchSearchAnalyticsList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    searchAnalyticsStore.listLoadingMore = true
  } else {
    searchAnalyticsStore.listLoading = true
    searchAnalyticsStore.listItems = []
  }
  searchAnalyticsStore.listError = null
  try {
    const data = await adminApi<CatalogSearchAnalyticsList>(`/admin/search-analytics?${query}`)
    searchAnalyticsStore.list = data
    if (append) {
      const seen = new Set(searchAnalyticsStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          searchAnalyticsStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      searchAnalyticsStore.listItems = [...data.items]
    }
  } catch (e) {
    searchAnalyticsStore.listError = errMessage(e)
    if (!append) {
      searchAnalyticsStore.list = null
      searchAnalyticsStore.listItems = []
    }
  } finally {
    searchAnalyticsStore.listLoading = false
    searchAnalyticsStore.listLoadingMore = false
  }
}

export function fetchSearchAnalyticsListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:search-analytics:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchSearchAnalyticsList(query, options))
}
