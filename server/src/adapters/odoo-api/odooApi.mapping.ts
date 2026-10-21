import { formatStreetLine } from '../../modules/checkout/checkout-address.validators.js'
import { normalizeAddressProvince } from '../../modules/checkout/italian-provinces.js'
import type {
  FindOrCreateCustomerInput,
  OdooBusinessProfile,
  OdooCustomerAccount,
  OdooCustomerProfile,
} from '../odoo/odooCustomerAdapter.js'
import { splitPartnerDisplayName } from '../odoo/odoo-partner-shipping.js'
import type { SaleOrderShippingLine } from '../odoo/odooOrderAdapter.js'
import type { PwaPaymentMethodDTO } from '../../types/dto.js'
import type {
  OdooApiAddress,
  OdooApiAddressRecipient,
  OdooApiAddressWrite,
  OdooApiCustomer,
  OdooApiCustomerWrite,
  OdooApiPaymentMethod,
} from './odooApi.types.js'

export function mapOdooApiPaymentMethod(
  method: PwaPaymentMethodDTO | string | null | undefined,
): OdooApiPaymentMethod {
  const key = String(method ?? '').toLowerCase()
  if (key === 'paypal') return 'paypal'
  if (key === 'bank_transfer') return 'bank_transfer'
  return 'card'
}

/** Codici vettore del proxy per la mappa Odoo `carrier → delivery.carrier`. */
export function mapOdooApiCarrier(
  shipping?: Pick<SaleOrderShippingLine, 'carrierCode' | 'serviceCode' | 'label'> | null,
): string {
  const carrier = shipping?.carrierCode?.trim().toLowerCase() ?? ''
  const service = shipping?.serviceCode?.trim().toLowerCase() ?? ''
  // Odoo sceglie il vettore per servizio (tlb_hl_carrier_map: "fedex:fedex_priority", "dhl:p", ...)
  const rawService = shipping?.serviceCode?.trim() ?? ''
  if (carrier === 'dhl' || carrier === 'dhl_express') return rawService ? `dhl:${rawService}` : 'dhl'
  if (carrier === 'fedex') return rawService ? `fedex:${rawService}` : 'fedex'
  if (carrier === 'internal' || carrier === '') {
    if (service.startsWith('pickup') || /ritiro|pickup/i.test(shipping?.label ?? '')) return 'pickup'
    if (service === 'free' || /gratis|free/i.test(shipping?.label ?? '')) return 'free'
    if (service === 'flat' || /fissa|flat/i.test(shipping?.label ?? '')) return 'flat'
    return service || 'internal'
  }
  return carrier
}

export function netEurosFromCents(cents: number | undefined, taxRatePct = 22): number {
  if (cents == null || !Number.isFinite(cents)) return 0
  const rate = Number.isFinite(taxRatePct) ? taxRatePct : 0
  const netCents = rate > 0 ? Math.round(cents / (1 + rate / 100)) : Math.round(cents)
  return Math.round(netCents) / 100
}

export function netEurosFromNetCents(cents: number | undefined): number {
  if (cents == null || !Number.isFinite(cents)) return 0
  return Math.round(cents) / 100
}

export function displayNameFromProfile(input: FindOrCreateCustomerInput): string {
  const fromParts = [input.firstName, input.lastName].filter(Boolean).join(' ').trim()
  if (fromParts) return fromParts
  const company = input.business?.companyName?.trim()
  if (company) return company
  return input.email
}

export function buildOdooApiCustomerWrite(input: FindOrCreateCustomerInput): OdooApiCustomerWrite {
  const addr = input.billingAddress
  const payload: OdooApiCustomerWrite = {
    email: input.email.toLowerCase().trim(),
    name: displayNameFromProfile(input),
    lang: 'it_IT',
    // Registrazione /register non ha ancora billing: senza country_code
    // `/customers/validate` risponde `country_missing` (blocking) e blocca l’upsert.
    country_code: 'IT',
  }
  const phone = input.phone?.trim() || addr?.phone?.trim()
  if (phone) payload.phone = phone
  if (addr) {
    payload.street = formatStreetLine({
      line1: addr.line1 ?? '',
      streetNumber: addr.streetNumber,
      isSnc: addr.isSnc,
    })
    if (addr.line2?.trim()) payload.street2 = addr.line2.trim()
    if (addr.postalCode?.trim()) payload.zip = addr.postalCode.trim()
    if (addr.city?.trim()) payload.city = addr.city.trim()
    if (addr.country?.trim()) payload.country_code = addr.country.trim().toUpperCase()
    const province = normalizeAddressProvince(addr.country ?? 'IT', addr.province)
    if (province) payload.state_code = province
  }
  applyBusiness(payload, input.business)
  return payload
}

function applyBusiness(payload: OdooApiCustomerWrite, business?: OdooBusinessProfile | null) {
  if (!business) return
  if (business.companyName?.trim()) payload.company_name = business.companyName.trim()
  if (business.vatNumber?.trim()) payload.vat = business.vatNumber.trim()
  if (business.fiscalCode?.trim()) payload.fiscal_code = business.fiscalCode.trim()
  if (business.sdiCode?.trim()) payload.pa_index = business.sdiCode.trim()
  if (business.pec?.trim()) payload.pec = business.pec.trim()
  if (business.isCompany != null) payload.is_company = business.isCompany
}

export function buildOdooApiAddressWrite(
  profile: OdooCustomerProfile,
  email?: string | null,
  options?: { recipient?: OdooApiAddressRecipient },
): OdooApiAddressWrite {
  const country = profile.country?.trim().toUpperCase() || undefined
  const province = normalizeAddressProvince(country ?? 'IT', profile.province)
  const lastName = profile.lastName?.trim() === '-' ? '' : profile.lastName
  const displayName =
    [profile.firstName, lastName].filter(Boolean).join(' ').trim() || profile.firstName
  const write: OdooApiAddressWrite = {
    name: displayName,
    street: formatStreetLine(profile),
    street2: profile.line2?.trim() || undefined,
    zip: profile.postalCode,
    city: profile.city,
    country_code: country,
    state_code: province || undefined,
    phone: profile.phone,
    email: email?.trim() || undefined,
  }
  if (options?.recipient === 'third_party') {
    write.recipient = 'third_party'
  } else {
    write.type = 'delivery'
    if (options?.recipient === 'own') write.recipient = 'own'
  }
  return write
}

export function odooApiAddressToProfile(addr: OdooApiAddress, fallbackEmail?: string): OdooCustomerProfile {
  const { firstName, lastName } = splitPartnerDisplayName(addr.name || fallbackEmail || 'Cliente')
  const street = `${addr.street ?? ''}`.trim()
  const split = street.match(/^(.*?)[,\s]+(\d+[a-zA-Z]?(?:\s*\/\s*\d*[a-zA-Z]?)?)\s*$/)
  return {
    firstName,
    lastName,
    line1: split?.[1]?.trim() || street,
    streetNumber: split?.[2]?.replace(/\s+/g, '') || '',
    isSnc: Boolean(street) && !split?.[2],
    line2: addr.street2?.trim() || undefined,
    city: addr.city?.trim() || '',
    postalCode: addr.zip?.trim() || '',
    province: normalizeAddressProvince(addr.country_code ?? 'IT', addr.state_code) || undefined,
    country: (addr.country_code ?? 'IT').toUpperCase(),
    phone: addr.phone?.trim() || undefined,
  }
}

export function odooApiCustomerToAccount(customer: OdooApiCustomer): OdooCustomerAccount {
  const main = customer.main_address
  const name = customer.name || main?.name || customer.email
  const { firstName, lastName } = splitPartnerDisplayName(name)
  const profile = main
    ? odooApiAddressToProfile(main, customer.email)
    : {
        firstName,
        lastName,
        line1: customer.street?.trim() || '',
        streetNumber: '',
        isSnc: true,
        line2: customer.street2?.trim() || undefined,
        city: customer.city?.trim() || '',
        postalCode: customer.zip?.trim() || '',
        province: normalizeAddressProvince(customer.country_code ?? 'IT', customer.state_code) || undefined,
        country: (customer.country_code ?? 'IT').toUpperCase(),
        phone: customer.phone?.trim() || undefined,
      }
  return {
    contactPartnerId: customer.id,
    commercialPartnerId: customer.commercial_partner_id ?? customer.id,
    contactIsCompany: Boolean(customer.is_company),
    b2bActive: Boolean(customer.b2b_active),
    profile: {
      ...profile,
      firstName: profile.firstName || firstName,
      lastName: profile.lastName || lastName,
      phone: profile.phone || customer.phone || undefined,
    },
    business: {
      companyName: customer.company_name ?? null,
      vatNumber: customer.vat ?? null,
      fiscalCode: customer.fiscal_code ?? null,
      pec: customer.pec ?? null,
      sdiCode: customer.pa_index ?? null,
      isCompany: Boolean(customer.is_company),
    },
  }
}

/** Converte timestamp Odoo UTC `YYYY-MM-DD HH:MM:SS` in ISO 8601. */
export function odooUtcDateTimeToIso(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const parsed = Date.parse(trimmed)
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
  }
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  )
  if (!match) return null
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] ?? '00'}Z`
  const parsed = Date.parse(iso)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

export function firstBlockingIssue(issues: Array<{ blocking?: boolean; message?: string }> | undefined): string | null {
  const hit = issues?.find((issue) => issue.blocking)
  return hit?.message?.trim() || null
}
