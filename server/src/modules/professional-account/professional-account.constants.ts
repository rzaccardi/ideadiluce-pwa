/** Stati workflow richiesta account professionista (BO + account cliente). */
export const PROFESSIONAL_REQUEST_STATUSES = [
  'NEW',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const

export type ProfessionalRequestStatus = (typeof PROFESSIONAL_REQUEST_STATUSES)[number]

export const PROFESSIONAL_REQUEST_OPEN_STATUSES: ProfessionalRequestStatus[] = ['NEW', 'IN_REVIEW']

export const PROFESSIONAL_REQUEST_STATUS_LABELS_IT: Record<ProfessionalRequestStatus, string> = {
  NEW: 'Nuova',
  IN_REVIEW: 'In valutazione',
  APPROVED: 'Approvata',
  REJECTED: 'Rifiutata',
  ARCHIVED: 'Archiviata',
}

/** Mapping legacy lowercase → stati attuali (post-migrazione). */
export const LEGACY_PROFESSIONAL_REQUEST_STATUS: Record<string, ProfessionalRequestStatus> = {
  pending: 'NEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
}

export function normalizeProfessionalRequestStatus(status: string): ProfessionalRequestStatus {
  const upper = status.toUpperCase() as ProfessionalRequestStatus
  if ((PROFESSIONAL_REQUEST_STATUSES as readonly string[]).includes(upper)) return upper
  return LEGACY_PROFESSIONAL_REQUEST_STATUS[status] ?? 'NEW'
}
