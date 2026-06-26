import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type {
  ProfessionalRequestAdminDetail,
  ProfessionalRequestAdminList,
  ProfessionalRequestAdminStatus,
} from '@/types/professional-requests'
import { adminProfessionalRequestsStore } from './professional-requests.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchAdminProfessionalRequestsList(
  query: string,
  options?: { append?: boolean },
) {
  const append = options?.append ?? false
  if (append) {
    adminProfessionalRequestsStore.listLoadingMore = true
  } else {
    adminProfessionalRequestsStore.listLoading = true
    adminProfessionalRequestsStore.listItems = []
  }
  adminProfessionalRequestsStore.listError = null
  try {
    const data = await adminApi<ProfessionalRequestAdminList>(
      `/admin/professional-requests?${query}`,
    )
    adminProfessionalRequestsStore.list = data
    if (append) {
      const seen = new Set(adminProfessionalRequestsStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          adminProfessionalRequestsStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      adminProfessionalRequestsStore.listItems = [...data.items]
    }
  } catch (e) {
    adminProfessionalRequestsStore.listError = errMessage(e)
    if (!append) {
      adminProfessionalRequestsStore.list = null
      adminProfessionalRequestsStore.listItems = []
    }
  } finally {
    adminProfessionalRequestsStore.listLoading = false
    adminProfessionalRequestsStore.listLoadingMore = false
  }
}

export function fetchAdminProfessionalRequestsListDeduped(
  query: string,
  options?: { append?: boolean },
) {
  const key = `admin:professional-requests:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminProfessionalRequestsList(query, options))
}

export async function fetchAdminProfessionalRequestDetail(id: string) {
  adminProfessionalRequestsStore.detailLoading = true
  adminProfessionalRequestsStore.detailError = null
  adminProfessionalRequestsStore.detailId = id
  try {
    adminProfessionalRequestsStore.detail = await adminApi<ProfessionalRequestAdminDetail>(
      `/admin/professional-requests/${id}`,
    )
  } catch (e) {
    adminProfessionalRequestsStore.detailError = errMessage(e)
    adminProfessionalRequestsStore.detail = null
  } finally {
    adminProfessionalRequestsStore.detailLoading = false
  }
}

export async function updateAdminProfessionalRequestStatus(
  id: string,
  status: ProfessionalRequestAdminStatus,
) {
  return patchAdminProfessionalRequest(id, { status })
}

export async function patchAdminProfessionalRequest(
  id: string,
  body: { status?: ProfessionalRequestAdminStatus; adminNotes?: string | null },
) {
  adminProfessionalRequestsStore.statusSaving = true
  try {
    adminProfessionalRequestsStore.detail = await adminApi<ProfessionalRequestAdminDetail>(
      `/admin/professional-requests/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    )
    const item = adminProfessionalRequestsStore.listItems.find((row) => row.id === id)
    if (item && body.status) item.status = body.status
  } finally {
    adminProfessionalRequestsStore.statusSaving = false
  }
}

export function resetAdminProfessionalRequestDetail() {
  adminProfessionalRequestsStore.detail = null
  adminProfessionalRequestsStore.detailId = null
  adminProfessionalRequestsStore.detailError = null
}
