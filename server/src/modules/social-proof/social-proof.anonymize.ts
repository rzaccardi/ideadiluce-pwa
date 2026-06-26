type BillingJson = { firstName?: string; lastName?: string }

function capitalizeWord(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function nameFromEmail(email: string): string | null {
  const local = email.split('@')[0]?.trim()
  if (!local || local.length < 2) return null
  const token = local.split(/[.+_-]/).find((p) => p.length >= 2)
  if (!token) return null
  return capitalizeWord(token)
}

export function anonymizeBuyerLabel(input: {
  email: string
  billingAddressJson: unknown
  userFirstName?: string | null
  userLastName?: string | null
}): string {
  const billing = (input.billingAddressJson ?? null) as BillingJson | null
  const first =
    billing?.firstName?.trim() ||
    input.userFirstName?.trim() ||
    nameFromEmail(input.email)

  if (!first) return 'Un cliente'

  const last = billing?.lastName?.trim() || input.userLastName?.trim()
  if (last && last.length > 0) {
    return `${capitalizeWord(first)} ${last.charAt(0).toUpperCase()}***`
  }
  return `${capitalizeWord(first)} ***`
}

/** Da nome partner Odoo (es. "Mario Rossi" o ragione sociale). */
export function anonymizePartnerDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return 'Un cliente'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return `${capitalizeWord(parts[0])} ***`
  const last = parts[parts.length - 1]
  return `${capitalizeWord(parts[0])} ${last.charAt(0).toUpperCase()}***`
}
