import type { UserDTO } from '@/types/dto'
import { formatStreetLine } from '@/lib/checkout-address.validators'

export type AccountProfilePrefill = {
  firstName: string
  lastName: string
  contactName: string
  email: string
  phone: string
  companyName: string
  vatNumber: string
  fiscalCode: string
  pec: string
  sdiCode: string
  country: string
  addressLine: string
}

type AccountProfilePrefillSource = Pick<
  UserDTO,
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'companyName'
  | 'vatNumber'
  | 'fiscalCode'
  | 'pec'
  | 'sdiCode'
  | 'vatCountryCode'
  | 'shippingAddress'
>

function trim(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export function emptyAccountProfilePrefill(): AccountProfilePrefill {
  return {
    firstName: '',
    lastName: '',
    contactName: '',
    email: '',
    phone: '',
    companyName: '',
    vatNumber: '',
    fiscalCode: '',
    pec: '',
    sdiCode: '',
    country: 'IT',
    addressLine: '',
  }
}

function formatAccountAddressLine(user: AccountProfilePrefillSource): string {
  const address = user.shippingAddress
  if (!address?.line1?.trim()) return ''
  const locality = [address.postalCode, address.city].filter(Boolean).join(' ')
  return [formatStreetLine(address), locality].filter(Boolean).join(', ')
}

/** Anagrafica e dati aziendali da `authStore.me` / form Dati e password. */
export function accountProfilePrefillFromUser(
  user: AccountProfilePrefillSource | null | undefined,
): AccountProfilePrefill {
  if (!user) return emptyAccountProfilePrefill()

  const firstName = trim(user.firstName) || trim(user.shippingAddress?.firstName)
  const lastName = trim(user.lastName) || trim(user.shippingAddress?.lastName)
  const country = (
    trim(user.vatCountryCode) ||
    trim(user.shippingAddress?.country) ||
    'IT'
  )
    .toUpperCase()
    .slice(0, 2)

  return {
    firstName,
    lastName,
    contactName: [firstName, lastName].filter(Boolean).join(' '),
    email: trim(user.email),
    phone: trim(user.phone) || trim(user.shippingAddress?.phone),
    companyName: trim(user.companyName),
    vatNumber: trim(user.vatNumber),
    fiscalCode: trim(user.fiscalCode),
    pec: trim(user.pec),
    sdiCode: trim(user.sdiCode),
    country: country || 'IT',
    addressLine: formatAccountAddressLine(user),
  }
}

/** Riempie solo i campi ancora vuoti: non azzera valori già presenti. */
export function applyAccountProfilePrefill<T extends Record<string, string>>(
  current: T,
  prefill: Partial<T>,
): T {
  const next: Record<string, string> = { ...current }
  for (const key of Object.keys(prefill)) {
    const incoming = prefill[key]
    if (typeof incoming !== 'string' || !incoming.trim()) continue
    const existing = next[key]
    if (typeof existing === 'string' && existing.trim()) continue
    next[key] = incoming
  }
  return next as T
}

export function professionalRequestNotesFromPrefill(input: {
  message: string
  fiscalCode: string
  addressLine: string
}): string {
  const notes = [
    input.fiscalCode.trim() ? `Codice fiscale: ${input.fiscalCode.trim()}` : null,
    input.addressLine.trim() ? `Indirizzo: ${input.addressLine.trim()}` : null,
  ].filter(Boolean)
  return [input.message.trim(), ...notes].filter(Boolean).join('\n')
}
