export type SiteInquiryAdminStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'

export type SiteInquiryAdminKind =
  | 'contact'
  | 'product-not-found'
  | 'b2b'
  | 'professional-quote'

export type SiteInquiryAttachmentMeta = {
  filename: string
  url: string | null
}

export type SiteInquiryAdminListItem = {
  id: string
  kind: SiteInquiryAdminKind | string
  name: string
  email: string
  phone: string | null
  status: SiteInquiryAdminStatus | string
  locale: string | null
  productCode: string | null
  createdAt: string
}

export type SiteInquiryAdminList = {
  items: SiteInquiryAdminListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type SiteInquiryAdminDetail = SiteInquiryAdminListItem & {
  message: string | null
  brand: string | null
  quantity: number | null
  usage: string | null
  urgency: string | null
  attachments: SiteInquiryAttachmentMeta[]
  adminNotes: string | null
  updatedAt: string
}

export const SITE_INQUIRY_STATUS_LABELS: Record<SiteInquiryAdminStatus, string> = {
  NEW: 'Nuova',
  IN_PROGRESS: 'In lavorazione',
  DONE: 'Gestita',
  ARCHIVED: 'Archiviata',
}

export function siteInquiryStatusLabel(status: string): string {
  return SITE_INQUIRY_STATUS_LABELS[status as SiteInquiryAdminStatus] ?? status
}

export const SITE_INQUIRY_STATUS_OPTIONS: {
  value: SiteInquiryAdminStatus
  label: string
}[] = [
  { value: 'NEW', label: 'Nuova' },
  { value: 'IN_PROGRESS', label: 'In lavorazione' },
  { value: 'DONE', label: 'Gestita' },
  { value: 'ARCHIVED', label: 'Archiviata' },
]

export const SITE_INQUIRY_STATUS_FILTER_OPTIONS: {
  value: 'all' | SiteInquiryAdminStatus
  label: string
}[] = [{ value: 'all', label: 'Tutte' }, ...SITE_INQUIRY_STATUS_OPTIONS]

export const SITE_INQUIRY_KIND_LABELS: Record<SiteInquiryAdminKind, string> = {
  contact: 'Contatto',
  'product-not-found': 'Prodotto non trovato',
  b2b: 'Lead business',
  'professional-quote': 'Preventivo professionisti',
}

export function siteInquiryKindLabel(kind: string): string {
  return SITE_INQUIRY_KIND_LABELS[kind as SiteInquiryAdminKind] ?? kind
}

export const SITE_INQUIRY_KIND_FILTER_OPTIONS: {
  value: 'all' | SiteInquiryAdminKind
  label: string
}[] = [
  { value: 'all', label: 'Tutti i tipi' },
  { value: 'contact', label: 'Contatto' },
  { value: 'product-not-found', label: 'Prodotto non trovato' },
  { value: 'b2b', label: 'Lead business' },
  { value: 'professional-quote', label: 'Preventivo professionisti' },
]
