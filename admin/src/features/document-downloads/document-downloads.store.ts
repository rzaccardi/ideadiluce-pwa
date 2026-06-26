import { proxy } from 'valtio'
import type { DocumentDownloadsAdminList } from '@/types/document-downloads'

export const documentDownloadsStore = proxy({
  list: null as DocumentDownloadsAdminList | null,
  listItems: [] as DocumentDownloadsAdminList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
})
