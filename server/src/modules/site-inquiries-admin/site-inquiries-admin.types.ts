export type SiteInquiryAttachmentMetaDTO = {
  filename: string
  url: string | null
}

export type SiteInquiriesAdminListItemDTO = {
  id: string
  kind: string
  name: string
  email: string
  phone: string | null
  status: string
  locale: string | null
  productCode: string | null
  createdAt: string
}

export type SiteInquiriesAdminListDTO = {
  items: SiteInquiriesAdminListItemDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type SiteInquiriesAdminDetailDTO = SiteInquiriesAdminListItemDTO & {
  message: string | null
  brand: string | null
  quantity: number | null
  usage: string | null
  urgency: string | null
  attachments: SiteInquiryAttachmentMetaDTO[]
  adminNotes: string | null
  updatedAt: string
}
