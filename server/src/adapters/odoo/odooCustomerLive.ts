import { env } from '../../config/env.js'
import { formatStreetLine } from '../../modules/checkout/checkout-address.validators.js'
import { odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { normalizeOdooCreateId } from './odooId.js'
import type {
  FindOrCreateCustomerInput,
  OdooBusinessProfile,
  OdooCustomerAdapter,
  OdooCustomerProfile,
  OdooCustomerResult,
} from './odooCustomerAdapter.js'
import { buildViesOdooComment, isUsableViesText, pickViesCompanyName } from '../../modules/tax/vies-utils.js'

type PartnerRow = { id: number }
type PartnerProfileRow = {
  id: number
  name?: string | false
  phone?: string | false
  street?: string | false
  street2?: string | false
  city?: string | false
  zip?: string | false
  country_id?: [number, string] | false
  property_product_pricelist?: [number, string] | false
}
type CountryRow = { code?: string | false }

async function findPartnerByEmail(ctx: OdooCallContext, email: string): Promise<OdooCustomerResult | null> {
  const domain: unknown[] = [['email', '=', email.toLowerCase().trim()]]
  const rows = await odooExecuteKw<PartnerRow[]>(
    ctx,
    'res.partner',
    'search_read',
    [domain],
    { fields: ['id'], limit: 1 },
  )
  const id = rows[0]?.id
  return id != null ? { odooPartnerId: id } : null
}

function splitPartnerName(name: string): Pick<OdooCustomerProfile, 'firstName' | 'lastName'> {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? '', lastName: '' }
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) ?? '',
  }
}

async function countryCodeForPartner(ctx: OdooCallContext, countryId: PartnerProfileRow['country_id']) {
  if (!Array.isArray(countryId)) return 'IT'
  const rows = await odooExecuteKw<CountryRow[]>(
    ctx,
    'res.country',
    'read',
    [[countryId[0]]],
    { fields: ['code'] },
  )
  return (rows[0]?.code || 'IT').toUpperCase()
}

async function countryIdForCode(ctx: OdooCallContext, code: string): Promise<number | null> {
  const rows = await odooExecuteKw<Array<{ id: number }>>(
    ctx,
    'res.country',
    'search_read',
    [[['code', '=', code.toUpperCase()]]],
    { fields: ['id'], limit: 1 },
  )
  return rows[0]?.id ?? null
}

async function getPartnerProfileByEmail(
  ctx: OdooCallContext,
  email: string,
): Promise<OdooCustomerProfile | null> {
  const domain: unknown[] = [['email', '=', email.toLowerCase().trim()]]
  const rows = await odooExecuteKw<PartnerProfileRow[]>(
    ctx,
    'res.partner',
    'search_read',
    [domain],
    {
      fields: ['id', 'name', 'phone', 'street', 'street2', 'city', 'zip', 'country_id'],
      limit: 1,
    },
  )
  const partner = rows[0]
  if (!partner) return null

  const name = typeof partner.name === 'string' ? partner.name : ''
  const country = await countryCodeForPartner(ctx, partner.country_id)
  return {
    ...splitPartnerName(name),
    line1: typeof partner.street === 'string' ? partner.street : '',
    streetNumber: '',
    isSnc: false,
    line2: typeof partner.street2 === 'string' ? partner.street2 : undefined,
    city: typeof partner.city === 'string' ? partner.city : '',
    postalCode: typeof partner.zip === 'string' ? partner.zip : '',
    country,
    phone: typeof partner.phone === 'string' ? partner.phone : undefined,
  }
}

function partnerDisplayName(input: FindOrCreateCustomerInput): string {
  if (input.business?.isCompany && input.business.companyName?.trim()) {
    return input.business.companyName.trim()
  }
  return [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || input.email
}

function businessPartnerVals(business?: OdooBusinessProfile | null): Record<string, unknown> {
  if (!business) return {}
  const vals: Record<string, unknown> = {}
  if (business.isCompany) {
    vals.is_company = true
    vals.company_type = 'company'
  }
  if (business.vatNumber?.trim()) vals.vat = business.vatNumber.trim().toUpperCase()
  if (business.fiscalCode?.trim()) vals.l10n_it_codice_fiscale = business.fiscalCode.trim().toUpperCase()
  if (business.pec?.trim()) vals.l10n_it_pec_email = business.pec.trim()
  if (business.sdiCode?.trim()) vals.l10n_it_codice_destinatario = business.sdiCode.trim().toUpperCase()

  const companyName =
    business.companyName?.trim() || pickViesCompanyName(business.viesName) || null
  if (companyName) vals.name = companyName

  const viesComment = buildViesOdooComment(
    business.viesName,
    business.viesAddress,
    business.viesRequestDate,
  )
  if (viesComment) vals.comment = viesComment

  return vals
}

async function addressPartnerVals(
  ctx: OdooCallContext,
  billing?: Partial<OdooCustomerProfile> | null,
): Promise<Record<string, unknown>> {
  if (!billing?.line1?.trim()) return {}
  const countryId = billing.country ? await countryIdForCode(ctx, billing.country) : null
  return {
    street: formatStreetLine({
      line1: billing.line1,
      streetNumber: billing.streetNumber,
      isSnc: billing.isSnc,
    }),
    street2: billing.line2 ?? '',
    city: billing.city ?? '',
    zip: billing.postalCode ?? '',
    ...(countryId ? { country_id: countryId } : {}),
  }
}

async function createPartner(ctx: OdooCallContext, input: FindOrCreateCustomerInput): Promise<OdooCustomerResult> {
  const vals = {
    name: partnerDisplayName(input),
    email: input.email.toLowerCase().trim(),
    phone: input.phone ?? '',
    customer_rank: 1,
    ...businessPartnerVals(input.business),
    ...(await addressPartnerVals(ctx, input.billingAddress)),
  }
  const created = await odooExecuteKw<unknown>(ctx, 'res.partner', 'create', [vals], {})
  const id = normalizeOdooCreateId(created)
  return { odooPartnerId: id }
}

async function updateCustomerProfile(
  ctx: OdooCallContext,
  partnerId: number,
  input: {
    firstName?: string
    lastName?: string
    phone?: string | null
    shippingAddress?: Partial<OdooCustomerProfile> | null
  },
): Promise<void> {
  const vals: Record<string, unknown> = {}
  if (input.firstName !== undefined || input.lastName !== undefined) {
    const name = [input.firstName, input.lastName].filter(Boolean).join(' ').trim()
    if (name) vals.name = name
  }
  if (input.phone !== undefined) vals.phone = input.phone ?? ''
  if (input.shippingAddress) {
    Object.assign(vals, await addressPartnerVals(ctx, input.shippingAddress))
  }
  if (Object.keys(vals).length === 0) return
  await odooExecuteKw<boolean>(ctx, 'res.partner', 'write', [[partnerId], vals], {})
}

async function updateCustomerBusiness(
  ctx: OdooCallContext,
  partnerId: number,
  input: OdooBusinessProfile,
): Promise<void> {
  const vals: Record<string, unknown> = {
    ...businessPartnerVals(input),
  }
  const companyName = input.companyName?.trim() || pickViesCompanyName(input.viesName)
  if (companyName) vals.name = companyName

  if (isUsableViesText(input.viesAddress)) {
    const parsed = input.viesAddress!.split('\n').map((l) => l.trim()).filter(Boolean)
    if (parsed[0] && !vals.street) vals.street = parsed[0]
    if (parsed.length > 1 && !vals.street2) vals.street2 = parsed.slice(1).join(', ')
  }

  if (Object.keys(vals).length === 0) return
  await odooExecuteKw<boolean>(ctx, 'res.partner', 'write', [[partnerId], vals], {})
}

async function createDeliveryPartner(
  ctx: OdooCallContext,
  parentPartnerId: number,
  profile: OdooCustomerProfile,
): Promise<OdooCustomerResult> {
  const countryId = profile.country ? await countryIdForCode(ctx, profile.country) : null
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'Destinatario'
  const vals = {
    name,
    type: 'delivery',
    parent_id: parentPartnerId,
    phone: profile.phone ?? '',
    street: formatStreetLine(profile),
    street2: profile.line2 ?? '',
    city: profile.city,
    zip: profile.postalCode,
    ...(countryId ? { country_id: countryId } : {}),
  }
  const created = await odooExecuteKw<unknown>(ctx, 'res.partner', 'create', [vals], {})
  return { odooPartnerId: normalizeOdooCreateId(created) }
}

async function syncProfessionalFlagFromPartner(ctx: OdooCallContext, partnerId: number): Promise<boolean> {
  const rows = await odooExecuteKw<PartnerProfileRow[]>(
    ctx,
    'res.partner',
    'read',
    [[partnerId]],
    { fields: ['property_product_pricelist'] },
  )
  const pl = rows[0]?.property_product_pricelist
  const pricelistId = Array.isArray(pl) ? pl[0] : null
  if (pricelistId == null) return false

  const professionalIds = [env.ODOO_PRICELIST_B2B_ID, env.ODOO_PRICELIST_PROFESSIONAL_ID].filter(
    (id): id is number => id != null && id > 0,
  )
  if (professionalIds.includes(pricelistId)) return true

  try {
    const plRows = await odooExecuteKw<Array<{ name?: string | false }>>(
      ctx,
      'product.pricelist',
      'read',
      [[pricelistId]],
      { fields: ['name'] },
    )
    const name = typeof plRows[0]?.name === 'string' ? plRows[0].name.toLowerCase() : ''
    return /professional|professionist|installator|rivenditor/.test(name)
  } catch {
    return false
  }
}

export function createLiveOdooCustomerAdapter(): OdooCustomerAdapter {
  return {
    findCustomerByEmail: findPartnerByEmail,
    getCustomerProfileByEmail: getPartnerProfileByEmail,
    createCustomer: createPartner,
    async findOrCreateCustomer(ctx, input) {
      const existing = await findPartnerByEmail(ctx, input.email)
      if (existing) {
        if (input.business) {
          await updateCustomerBusiness(ctx, existing.odooPartnerId, input.business)
        }
        return existing
      }
      return createPartner(ctx, input)
    },
    updateCustomerBusiness,
    updateCustomerProfile,
    createDeliveryPartner,
    syncProfessionalFlagFromPartner,
  }
}
