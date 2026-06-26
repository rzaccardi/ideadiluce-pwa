import { proxy } from 'valtio'
import type { ProfessionalRequestAdminDetail, ProfessionalRequestAdminList } from '@/types/professional-requests'

export const adminProfessionalRequestsStore = proxy({
  list: null as ProfessionalRequestAdminList | null,
  listItems: [] as ProfessionalRequestAdminList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
  detail: null as ProfessionalRequestAdminDetail | null,
  detailId: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
  statusSaving: false,
})
