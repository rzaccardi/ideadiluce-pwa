import { proxy } from 'valtio'
import type { SiteInquiryAdminDetail, SiteInquiryAdminList } from '@/types/site-inquiries'

export const adminSiteInquiriesStore = proxy({
  list: null as SiteInquiryAdminList | null,
  listItems: [] as SiteInquiryAdminList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
  detail: null as SiteInquiryAdminDetail | null,
  detailId: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
  statusSaving: false,
})
