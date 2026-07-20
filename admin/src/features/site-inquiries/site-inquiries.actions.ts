import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { SiteInquiryAdminDetail, SiteInquiryAdminList, SiteInquiryAdminStatus } from '@/types/site-inquiries'
import { adminSiteInquiriesStore } from './site-inquiries.store'

function errMessage(e: unknown) {
  return String(e)
}

export async function fetchAdminSiteInquiriesList(
  query: string,
  options?: { append?: boolean },
) {
  const append = options?.append ?? false
  if (append) {
    adminSiteInquiriesStore.listLoadingMore = true
  } else {
    adminSiteInquiriesStore.listLoading = true
    adminSiteInquiriesStore.listItems = []
  }
  adminSiteInquiriesStore.listError = null
  try {
    const data = await adminApi<SiteInquiryAdminList>(`/admin/site-inquiries?${query}`)
    adminSiteInquiriesStore.list = data
    if (append) {
      const seen = new Set(adminSiteInquiriesStore.listItems.map((i) => i.id))
      for (const item of data.items) {
        if (!seen.has(item.id)) {
          adminSiteInquiriesStore.listItems.push(item)
          seen.add(item.id)
        }
      }
    } else {
      adminSiteInquiriesStore.listItems = [...data.items]
    }
  } catch (e) {
    adminSiteInquiriesStore.listError = errMessage(e)
    if (!append) {
      adminSiteInquiriesStore.list = null
      adminSiteInquiriesStore.listItems = []
    }
  } finally {
    adminSiteInquiriesStore.listLoading = false
    adminSiteInquiriesStore.listLoadingMore = false
  }
}

export function fetchAdminSiteInquiriesListDeduped(
  query: string,
  options?: { append?: boolean },
) {
  const key = `admin:site-inquiries:list:${query}:${options?.append ? 'append' : 'replace'}`
  return dedupeAsync(key, () => fetchAdminSiteInquiriesList(query, options))
}

export async function fetchAdminSiteInquiryDetail(id: string) {
  adminSiteInquiriesStore.detailLoading = true
  adminSiteInquiriesStore.detailError = null
  adminSiteInquiriesStore.detailId = id
  try {
    adminSiteInquiriesStore.detail = await adminApi<SiteInquiryAdminDetail>(
      `/admin/site-inquiries/${id}`,
    )
  } catch (e) {
    adminSiteInquiriesStore.detailError = errMessage(e)
    adminSiteInquiriesStore.detail = null
  } finally {
    adminSiteInquiriesStore.detailLoading = false
  }
}

export async function patchAdminSiteInquiry(
  id: string,
  body: { status?: SiteInquiryAdminStatus; adminNotes?: string | null },
) {
  adminSiteInquiriesStore.statusSaving = true
  try {
    adminSiteInquiriesStore.detail = await adminApi<SiteInquiryAdminDetail>(
      `/admin/site-inquiries/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    )
    const item = adminSiteInquiriesStore.listItems.find((row) => row.id === id)
    if (item && body.status) item.status = body.status
  } finally {
    adminSiteInquiriesStore.statusSaving = false
  }
}

export function resetAdminSiteInquiryDetail() {
  adminSiteInquiriesStore.detail = null
  adminSiteInquiriesStore.detailId = null
  adminSiteInquiriesStore.detailError = null
}
