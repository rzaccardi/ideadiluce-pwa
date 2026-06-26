export type DocumentDownloadAdminItem = {
  id: string
  productSlug: string
  productRef: string | null
  variantRef: string | null
  documentId: string
  documentName: string | null
  userId: string | null
  locale: string
  sourcePage: string | null
  success: boolean
  createdAt: string
}

export type DocumentDownloadsAdminList = {
  items: DocumentDownloadAdminItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
