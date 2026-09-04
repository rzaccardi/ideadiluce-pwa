/** Mapping anagrafica Odoo (contact vs partner commerciale) → profilo PWA. */
import type { OdooBusinessProfile } from './odooCustomerAdapter.js'

export type OdooPartnerAccountRow = {
  id: number
  name?: string | false
  phone?: string | false
  street?: string | false
  street2?: string | false
  city?: string | false
  zip?: string | false
  country_id?: [number, string] | false
  is_company?: boolean
  parent_id?: [number, string] | number | false
  commercial_partner_id?: [number, string] | number | false
  vat?: string | false
  l10n_it_codice_fiscale?: string | false
  l10n_it_pec_email?: string | false
  l10n_it_codice_destinatario?: string | false
  l10n_it_pa_index?: string | false
}

export type MappedOdooPartnerAccount = {
  contactPartnerId: number
  commercialPartnerId: number
  contactIsCompany: boolean
  firstName: string
  lastName: string
  phone: string
  street: string
  street2: string
  city: string
  zip: string
  countryId: OdooPartnerAccountRow['country_id']
  business: OdooBusinessProfile
}

export type UserBusinessPatchFields = {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  companyName?: string | null
  vatNumber?: string | null
  fiscalCode?: string | null
  pec?: string | null
  sdiCode?: string | null
}

export function odooText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function odooM2oId(value: unknown): number | null {
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

export function odooBool(value: unknown): boolean {
  return value === true
}

export function normalizeOdooSdiCode(value: string): string | null {
  const v = value.trim().toUpperCase()
  if (!v || /^0+$/.test(v)) return null
  return v
}

export function splitPartnerName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? '', lastName: '' }
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) ?? '',
  }
}

/** Tra più partner con la stessa email preferisce il contatto persona (non l'azienda). */
export function pickPartnerRowByEmail<T extends { is_company?: boolean }>(rows: T[]): T | undefined {
  return rows.find((row) => !odooBool(row.is_company)) ?? rows[0]
}

function pickFiscalField(
  commercial: OdooPartnerAccountRow | null,
  contact: OdooPartnerAccountRow,
  key: keyof Pick<
    OdooPartnerAccountRow,
    'vat' | 'l10n_it_codice_fiscale' | 'l10n_it_pec_email' | 'l10n_it_codice_destinatario' | 'l10n_it_pa_index'
  >,
): string {
  return odooText(commercial?.[key]) || odooText(contact[key])
}

export function mapOdooPartnerAccount(
  contact: OdooPartnerAccountRow,
  commercial: OdooPartnerAccountRow | null,
): MappedOdooPartnerAccount {
  const company = commercial ?? contact
  const vatNumber = pickFiscalField(commercial, contact, 'vat').toUpperCase() || null
  const fiscalCode = pickFiscalField(commercial, contact, 'l10n_it_codice_fiscale').toUpperCase() || null
  const pec = pickFiscalField(commercial, contact, 'l10n_it_pec_email') || null
  const sdiCode =
    normalizeOdooSdiCode(pickFiscalField(commercial, contact, 'l10n_it_codice_destinatario')) ||
    normalizeOdooSdiCode(pickFiscalField(commercial, contact, 'l10n_it_pa_index'))

  const contactIsCompany = odooBool(contact.is_company)
  const commercialIsCompany = odooBool(company.is_company) || Boolean(vatNumber)
  const companyName = commercialIsCompany || contactIsCompany ? odooText(company.name) || null : null

  const contactName = odooText(contact.name)
  const personNames = contactIsCompany ? { firstName: '', lastName: '' } : splitPartnerName(contactName)

  return {
    contactPartnerId: contact.id,
    commercialPartnerId: company.id,
    contactIsCompany,
    firstName: personNames.firstName,
    lastName: personNames.lastName,
    phone: odooText(contact.phone) || odooText(company.phone),
    street: odooText(contact.street) || odooText(company.street),
    street2: odooText(contact.street2) || odooText(company.street2),
    city: odooText(contact.city) || odooText(company.city),
    zip: odooText(contact.zip) || odooText(company.zip),
    countryId: contact.country_id || company.country_id,
    business: {
      companyName,
      vatNumber,
      fiscalCode,
      pec,
      sdiCode,
      isCompany: commercialIsCompany || contactIsCompany,
    },
  }
}

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim()
}

function isSplitOfCompanyName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  companyName: string | null | undefined,
): boolean {
  const first = firstName?.trim() ?? ''
  const last = lastName?.trim() ?? ''
  const company = companyName?.trim() ?? ''
  if (!company || !first) return false
  if ([first, last].filter(Boolean).join(' ') === company) return true
  return first === company && Boolean(last) && !last.includes(' ')
}

/**
 * Compila solo i campi PWA vuoti da Odoo.
 * Se Nome+Cognome sono lo split della ragione sociale, sposta la persona in Nome
 * e tiene la ragione sociale nei dati aziendali (senza toccare i privati).
 */
export function buildUserBusinessPatch(
  user: {
    firstName: string | null
    lastName: string | null
    phone: string | null
    companyName: string | null
    vatNumber: string | null
    fiscalCode: string | null
    pec: string | null
    sdiCode: string | null
  },
  account: Pick<MappedOdooPartnerAccount, 'contactIsCompany' | 'firstName' | 'lastName' | 'phone' | 'business'>,
): UserBusinessPatchFields | null {
  const patch: UserBusinessPatchFields = {}
  const odooCompany = account.business.companyName?.trim() || null

  if (isEmpty(user.companyName) && odooCompany) patch.companyName = odooCompany
  if (isEmpty(user.vatNumber) && account.business.vatNumber) patch.vatNumber = account.business.vatNumber
  if (isEmpty(user.fiscalCode) && account.business.fiscalCode) patch.fiscalCode = account.business.fiscalCode
  if (isEmpty(user.pec) && account.business.pec) patch.pec = account.business.pec
  if (isEmpty(user.sdiCode) && account.business.sdiCode) patch.sdiCode = account.business.sdiCode
  if (isEmpty(user.phone) && account.phone) patch.phone = account.phone

  const existingIsCompanySplit = isSplitOfCompanyName(user.firstName, user.lastName, odooCompany)

  if (account.contactIsCompany) {
    if (existingIsCompanySplit && user.firstName?.trim() && user.lastName?.trim()) {
      const first = user.firstName.trim()
      const last = user.lastName.trim()
      const firstParts = first.split(/\s+/).filter(Boolean)
      if (firstParts.length >= 2 && !last.includes(' ')) {
        patch.companyName = first
        patch.firstName = last
        patch.lastName = ''
      }
    }
  } else if (account.firstName || account.lastName) {
    if ((isEmpty(user.firstName) && isEmpty(user.lastName)) || existingIsCompanySplit) {
      patch.firstName = account.firstName
      patch.lastName = account.lastName
    }
  }

  return Object.keys(patch).length > 0 ? patch : null
}
