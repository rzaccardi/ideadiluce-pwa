import { proxy } from 'valtio'
import type { QuoteDetailDTO, QuoteRequestDTO } from '@/types/dto'

export const quotesStore = proxy({
  list: null as QuoteRequestDTO[] | null,
  isListLoading: false,
  listError: null as string | null,
  detail: null as QuoteDetailDTO | null,
  isDetailLoading: false,
  detailError: null as string | null,
  isSubmitting: false,
  submitError: null as string | null,
})
