import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type {
  CatalogSearchAnalyticsList,
  CatalogSearchAnalyticsStats,
} from '@/types/search-analytics'
import { searchAnalyticsStore } from './search-analytics.store'

function errMessage(e: unknown) {
  return String(e)
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
