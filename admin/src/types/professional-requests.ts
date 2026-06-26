export type ProfessionalRequestAdminStatus =
  | 'NEW'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED'

export type ProfessionalRequestAdminListItem = {
  id: string
  companyName: string
  vatNumber: string
  sector: string
  contactName: string
  email: string
  phone: string | null
  status: ProfessionalRequestAdminStatus | string
  locale: string
  createdAt: string
}

export type ProfessionalRequestAdminList = {
  items: ProfessionalRequestAdminListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ProfessionalRequestAdminDetail = ProfessionalRequestAdminListItem & {
  message: string | null
  sectorOther: string | null
  userId: string | null
  country: string
  pec: string | null
  sdiCode: string | null
  visuraUrl: string | null
  odooPartnerId: number | null
  vatValidated: boolean
  vatForceAccepted: boolean
  odooSyncError: string | null
  adminNotes: string | null
  updatedAt: string
}

export const PROFESSIONAL_REQUEST_STATUS_LABELS: Record<ProfessionalRequestAdminStatus, string> = {
  NEW: 'Nuova',
  IN_REVIEW: 'In valutazione',
  APPROVED: 'Approvata',
  REJECTED: 'Rifiutata',
  ARCHIVED: 'Archiviata',
}

const LEGACY_STATUS_LABELS: Record<string, string> = {
  pending: 'In attesa',
  approved: 'Approvata',
  rejected: 'Rifiutata',
}

export function professionalRequestStatusLabel(status: string): string {
  return (
    PROFESSIONAL_REQUEST_STATUS_LABELS[status as ProfessionalRequestAdminStatus] ??
    LEGACY_STATUS_LABELS[status] ??
    status
  )
}

export const PROFESSIONAL_REQUEST_STATUS_OPTIONS: {
  value: ProfessionalRequestAdminStatus
  label: string
}[] = [
  { value: 'NEW', label: 'Nuova' },
  { value: 'IN_REVIEW', label: 'In valutazione' },
  { value: 'APPROVED', label: 'Approvata' },
  { value: 'REJECTED', label: 'Rifiutata' },
  { value: 'ARCHIVED', label: 'Archiviata' },
]

export const PROFESSIONAL_REQUEST_FILTER_OPTIONS: {
  value: 'all' | ProfessionalRequestAdminStatus
  label: string
}[] = [{ value: 'all', label: 'Tutte' }, ...PROFESSIONAL_REQUEST_STATUS_OPTIONS]
