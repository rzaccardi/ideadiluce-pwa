import { proxy } from 'valtio'
import type { GuideDetail, GuideListItem } from '@/types/guides'

export type GuidesListPage = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export const guidesStore = proxy({
  items: [] as GuideListItem[],
  list: null as GuidesListPage | null,
  listLoading: false,
  listLoadingMore: false,
  current: null as GuideDetail | null,
  isLoading: false,
  isSaving: false,
  isTranslating: false,
  error: null as string | null,
  fieldSearch: '',
})
