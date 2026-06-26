export type ProfessionalRequestsAdminListItemDTO = {
  id: string
  companyName: string
  vatNumber: string
  sector: string
  contactName: string
  email: string
  phone: string | null
  status: string
  locale: string
  createdAt: string
}

export type ProfessionalRequestsAdminListDTO = {
  items: ProfessionalRequestsAdminListItemDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ProfessionalRequestsAdminDetailDTO = ProfessionalRequestsAdminListItemDTO & {
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
