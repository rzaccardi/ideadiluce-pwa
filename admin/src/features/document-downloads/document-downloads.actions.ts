import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { DocumentDownloadsAdminList } from '@/types/document-downloads'
import { documentDownloadsStore } from './document-downloads.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchDocumentDownloadsList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    documentDownloadsStore.listLoadingMore = true
  } else {
    documentDownloadsStore.listLoading = true
    documentDownloadsStore.listItems = []
  }
  documentDownloadsStore.listError = null
  try {
    const data = await adminApi<DocumentDownloadsAdminList>(`/admin/document-downloads?${query}`)
    documentDownloadsStore.list = data
    if (append) {
      const seen = new Set(documentDownloadsStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          documentDownloadsStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      documentDownloadsStore.listItems = [...data.items]
    }
  } catch (e) {
    documentDownloadsStore.listError = errMessage(e)
    if (!append) {
      documentDownloadsStore.list = null
      documentDownloadsStore.listItems = []
    }
  } finally {
    documentDownloadsStore.listLoading = false
    documentDownloadsStore.listLoadingMore = false
  }
}

export function fetchDocumentDownloadsListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:document-downloads:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchDocumentDownloadsList(query, options))
}
