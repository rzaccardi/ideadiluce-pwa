import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { IntegrationLogsList } from '@/types/integration-logs'
import { integrationLogsStore } from './integration-logs.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchIntegrationLogsList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    integrationLogsStore.listLoadingMore = true
  } else {
    integrationLogsStore.listLoading = true
    integrationLogsStore.listItems = []
  }
  integrationLogsStore.listError = null
  try {
    const data = await adminApi<IntegrationLogsList>(`/admin/integration-logs?${query}`)
    integrationLogsStore.list = data
    if (append) {
      const seen = new Set(integrationLogsStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          integrationLogsStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      integrationLogsStore.listItems = [...data.items]
    }
  } catch (e) {
    integrationLogsStore.listError = errMessage(e)
    if (!append) {
      integrationLogsStore.list = null
      integrationLogsStore.listItems = []
    }
  } finally {
    integrationLogsStore.listLoading = false
    integrationLogsStore.listLoadingMore = false
  }
}

export function fetchIntegrationLogsListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:integration-logs:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchIntegrationLogsList(query, options))
}
