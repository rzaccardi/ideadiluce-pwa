export const SITE_INQUIRY_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'] as const

export type SiteInquiryStatus = (typeof SITE_INQUIRY_STATUSES)[number]

export const SITE_INQUIRY_KINDS = [
  'contact',
  'product-not-found',
  'b2b',
  'professional-quote',
] as const

export type SiteInquiryKind = (typeof SITE_INQUIRY_KINDS)[number]

export function normalizeSiteInquiryStatus(value: string): SiteInquiryStatus {
  const upper = value.toUpperCase()
  if (upper === 'NEW' || upper === 'IN_PROGRESS' || upper === 'DONE' || upper === 'ARCHIVED') {
    return upper
  }
  return 'NEW'
}
