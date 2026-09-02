import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { NotFoundPathDetail, NotFoundPathList, NotFoundStats } from '@/types/not-found'
import { notFoundAnalyticsStore } from './not-found.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchNotFoundStats(query: string) {
  notFoundAnalyticsStore.statsLoading = true
  notFoundAnalyticsStore.statsError = null
  try {
    notFoundAnalyticsStore.stats = await adminApi<NotFoundStats>(`/admin/not-found/stats?${query}`)
  } catch (e) {
    notFoundAnalyticsStore.statsError = errMessage(e)
    notFoundAnalyticsStore.stats = null
  } finally {
    notFoundAnalyticsStore.statsLoading = false
  }
}

export function fetchNotFoundStatsDeduped(query: string) {
  return dedupeAsync(`admin:not-found:stats:${query}`, () => fetchNotFoundStats(query))
}

export async function fetchNotFoundPaths(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    notFoundAnalyticsStore.listLoadingMore = true
  } else {
    notFoundAnalyticsStore.listLoading = true
    notFoundAnalyticsStore.listItems = []
  }
  notFoundAnalyticsStore.listError = null
  try {
    const data = await adminApi<NotFoundPathList>(`/admin/not-found?${query}`)
    notFoundAnalyticsStore.list = data
    if (append) {
      const seen = new Set(notFoundAnalyticsStore.listItems.map((i) => i.path))
      for (const item of data.items) {
        if (!seen.has(item.path)) {
          notFoundAnalyticsStore.listItems.push(item)
          seen.add(item.path)
        }
      }
    } else {
      notFoundAnalyticsStore.listItems = [...data.items]
    }
  } catch (e) {
    notFoundAnalyticsStore.listError = errMessage(e)
    if (!append) {
      notFoundAnalyticsStore.list = null
      notFoundAnalyticsStore.listItems = []
    }
  } finally {
    notFoundAnalyticsStore.listLoading = false
    notFoundAnalyticsStore.listLoadingMore = false
  }
}

export function fetchNotFoundPathsDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:not-found:paths:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchNotFoundPaths(query, options))
}

export async function fetchNotFoundPathDetail(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  const params = new URLSearchParams(query)
  const path = params.get('path') ?? ''
  notFoundAnalyticsStore.detailPath = path
  if (append) {
    notFoundAnalyticsStore.detailLoadingMore = true
  } else {
    notFoundAnalyticsStore.detailLoading = true
    notFoundAnalyticsStore.detailItems = []
  }
  notFoundAnalyticsStore.detailError = null
  try {
    const data = await adminApi<NotFoundPathDetail>(`/admin/not-found/hits?${query}`)
    notFoundAnalyticsStore.detail = data
    if (append) {
      const seen = new Set(notFoundAnalyticsStore.detailItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          notFoundAnalyticsStore.detailItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      notFoundAnalyticsStore.detailItems = [...data.items]
    }
  } catch (e) {
    notFoundAnalyticsStore.detailError = errMessage(e)
    if (!append) {
      notFoundAnalyticsStore.detail = null
      notFoundAnalyticsStore.detailItems = []
    }
  } finally {
    notFoundAnalyticsStore.detailLoading = false
    notFoundAnalyticsStore.detailLoadingMore = false
  }
}

export function fetchNotFoundPathDetailDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:not-found:hits:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchNotFoundPathDetail(query, options))
}
