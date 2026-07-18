import { proxy } from 'valtio'
import type { InvoiceDTO } from '@/types/dto'

export const invoicesStore = proxy({
  list: null as InvoiceDTO[] | null,
  isListLoading: false,
  listError: null as string | null,
})
