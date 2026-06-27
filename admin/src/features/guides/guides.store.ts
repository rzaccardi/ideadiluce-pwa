import { proxy } from 'valtio'
import type { GuideDetail, GuideListItem } from '@/types/guides'

export const guidesStore = proxy({
  items: [] as GuideListItem[],
  current: null as GuideDetail | null,
  isLoading: false,
  isSaving: false,
  isTranslating: false,
  error: null as string | null,
  fieldSearch: '',
})
