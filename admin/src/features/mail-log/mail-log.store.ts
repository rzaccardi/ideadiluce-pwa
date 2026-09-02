import { proxy } from 'valtio'
import type { MailLogDetail, MailLogList } from '@/types/mail-log'

export const adminMailLogStore = proxy({
  list: null as MailLogList | null,
  listItems: [] as MailLogList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
  detail: null as MailLogDetail | null,
  detailId: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
})
