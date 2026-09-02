import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { MailLogDetail, MailLogList } from '@/types/mail-log'
import { adminMailLogStore } from './mail-log.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchAdminMailLogList(query: string, options?: { append?: boolean }) {
  const append = options?.append ?? false
  if (append) {
    adminMailLogStore.listLoadingMore = true
  } else {
    adminMailLogStore.listLoading = true
    adminMailLogStore.listItems = []
  }
  adminMailLogStore.listError = null
  try {
    const data = await adminApi<MailLogList>(`/admin/mail-log?${query}`)
    adminMailLogStore.list = data
    if (append) {
      const seen = new Set(adminMailLogStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          adminMailLogStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      adminMailLogStore.listItems = [...data.items]
    }
  } catch (e) {
    adminMailLogStore.listError = errMessage(e)
    if (!append) {
      adminMailLogStore.list = null
      adminMailLogStore.listItems = []
    }
  } finally {
    adminMailLogStore.listLoading = false
    adminMailLogStore.listLoadingMore = false
  }
}

export function fetchAdminMailLogListDeduped(query: string, options?: { append?: boolean }) {
  const key = `admin:mail-log:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminMailLogList(query, options))
}

export async function fetchAdminMailLogDetail(id: string) {
  adminMailLogStore.detailLoading = true
  adminMailLogStore.detailError = null
  adminMailLogStore.detailId = id
  try {
    adminMailLogStore.detail = await adminApi<MailLogDetail>(`/admin/mail-log/${id}`)
  } catch (e) {
    adminMailLogStore.detailError = errMessage(e)
    adminMailLogStore.detail = null
  } finally {
    adminMailLogStore.detailLoading = false
  }
}

export function resetAdminMailLogDetail() {
  adminMailLogStore.detail = null
  adminMailLogStore.detailId = null
  adminMailLogStore.detailError = null
}
