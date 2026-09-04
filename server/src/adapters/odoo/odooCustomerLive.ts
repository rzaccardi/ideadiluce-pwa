import { env } from '../../config/env.js'
import { formatStreetLine, splitLine1AndStreetNumber } from '../../modules/checkout/checkout-address.validators.js'
import { odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { normalizeOdooCreateId } from './odooId.js'
import type {
  FindOrCreateCustomerInput,
  OdooBusinessProfile,
  OdooCustomerAccount,
  OdooCustomerAdapter,
  OdooCustomerProfile,
  OdooCustomerResult,
  OdooShippingDestination,
} from './odooCustomerAdapter.js'
import {
  mapOdooPartnerAccount,
  odooBool,
  odooM2oId,
  pickPartnerRowByEmail,
  type OdooPartnerAccountRow,
} from './odooCustomerAccount.js'
import {
  isOdooChildShippingDestination,
  odooPartnerStreet,
  odooPartnerToShippingProfile,
  odooShippingDestinationKind,
  parseOdooShippingAddressId,
  shippingAddressesMatch,
} from './odoo-partner-shipping.js'
import { buildViesOdooComment, isUsableViesText, pickViesCompanyName } from '../../modules/tax/vies-utils.js'

type PartnerRow = { id: number; is_company?: boolean }
type PartnerProfileRow = {
  id: number
  name?: string | false
  type?: string | false
  phone?: string | false
  street?: string | false
  street2?: string | false
  city?: string | false
  zip?: string | false
  country_id?: [number, string] | false
  is_company?: boolean
  parent_id?: [number, string] | false
  commercial_partner_id?: [number, string] | false
  property_product_pricelist?: [number, string] | false
}

const PARTNER_ADDRESS_FIELDS = [
  'id',
  'name',
  'type',
  'phone',
  'street',
  'street2',
  'city',
  'zip',
  'country_id',
  'parent_id',
  'commercial_partner_id',
] as const
type CountryRow = { code?: string | false }

const PARTNER_ACCOUNT_BASE_FIELDS = [
  'id',
  'name',
  'phone',
  'street',
  'street2',
  'city',
  'zip',
  'country_id',
  'is_company',
  'parent_id',
  'commercial_partner_id',
  'vat',
] as const

const PARTNER_ACCOUNT_IT_FIELDS = [
  'l10n_it_codice_fiscale',
  'l10n_it_pec_email',
  'l10n_it_codice_destinatario',
  'l10n_it_pa_index',
] as const

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

async function readPartnerAccountRows(
  ctx: OdooCallContext,
  ids: number[],
): Promise<OdooPartnerAccountRow[]> {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))]
  if (unique.length === 0) return []
  try {
    return await odooExecuteKw<OdooPartnerAccountRow[]>(
      ctx,
      'res.partner',
      'read',
      [unique],
      { fields: [...PARTNER_ACCOUNT_BASE_FIELDS, ...PARTNER_ACCOUNT_IT_FIELDS] },
    )
  } catch {
    return odooExecuteKw<OdooPartnerAccountRow[]>(
      ctx,
      'res.partner',
      'read',
      [unique],
      { fields: [...PARTNER_ACCOUNT_BASE_FIELDS] },
    )
  }
}

async function accountFromContactRow(
  ctx: OdooCallContext,
  contact: OdooPartnerAccountRow,
): Promise<OdooCustomerAccount> {
  const commercialId = odooM2oId(contact.commercial_partner_id) ?? odooM2oId(contact.parent_id)
  let commercial: OdooPartnerAccountRow | null = null
  if (commercialId && commercialId !== contact.id) {
    const rows = await readPartnerAccountRows(ctx, [commercialId])
    commercial = rows[0] ?? null
  }
  const mapped = mapOdooPartnerAccount(contact, commercial)
  const country = await countryCodeForPartner(ctx, mapped.countryId)
  const split = splitLine1AndStreetNumber(mapped.street)
  return {
    contactPartnerId: mapped.contactPartnerId,
    commercialPartnerId: mapped.commercialPartnerId,
    contactIsCompany: mapped.contactIsCompany,
    profile: {
      firstName: mapped.firstName,
      lastName: mapped.lastName,
      line1: split.line1,
      streetNumber: split.streetNumber,
      isSnc: split.isSnc,
      line2: mapped.street2 || undefined,
      city: mapped.city,
      postalCode: mapped.zip,
      country,
      phone: mapped.phone || undefined,
    },
    business: mapped.business,
  }
}

async function getPartnerAccountByPartnerId(
  ctx: OdooCallContext,
  partnerId: number,
): Promise<OdooCustomerAccount | null> {
  const rows = await readPartnerAccountRows(ctx, [partnerId])
  const contact = rows[0]
  if (!contact) return null
  return accountFromContactRow(ctx, contact)
}

async function getPartnerAccountByEmail(
  ctx: OdooCallContext,
  email: string,
): Promise<OdooCustomerAccount | null> {
  const domain: unknown[] = [['email', '=', email.toLowerCase().trim()]]
  const rows = await odooExecuteKw<PartnerRow[]>(
    ctx,
    'res.partner',
    'search_read',
    [domain],
    { fields: ['id', 'is_company'], limit: 10 },
  )
  const picked = pickPartnerRowByEmail(rows)
  if (!picked) return null
  return getPartnerAccountByPartnerId(ctx, picked.id)
}

async function countryCodeForPartner(
  ctx: OdooCallContext,
  countryId: PartnerProfileRow['country_id'] | undefined,
) {
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
  const account = await getPartnerAccountByEmail(ctx, email)
  return account?.profile ?? null
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
    const rows = await odooExecuteKw<Array<{ is_company?: boolean }>>(
      ctx,
      'res.partner',
      'read',
      [[partnerId]],
      { fields: ['is_company'] },
    )
    if (!odooBool(rows[0]?.is_company)) {
      const name = [input.firstName, input.lastName].filter(Boolean).join(' ').trim()
      if (name) vals.name = name
    }
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

function deliveryPartnerVals(profile: OdooCustomerProfile, countryId: number | null) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'Destinatario'
  return {
    name,
    phone: profile.phone ?? '',
    street: formatStreetLine(profile),
    street2: profile.line2 ?? '',
    city: profile.city,
    zip: profile.postalCode,
    ...(countryId ? { country_id: countryId } : {}),
  }
}

async function companyPartnerId(ctx: OdooCallContext, partnerId: number): Promise<number> {
  const rows = await odooExecuteKw<PartnerProfileRow[]>(
    ctx,
    'res.partner',
    'read',
    [[partnerId]],
    { fields: ['id', 'commercial_partner_id'] },
  )
  return odooM2oId(rows[0]?.commercial_partner_id) ?? partnerId
}

async function createDeliveryPartner(
  ctx: OdooCallContext,
  parentPartnerId: number,
  profile: OdooCustomerProfile,
): Promise<OdooCustomerResult> {
  const companyId = await companyPartnerId(ctx, parentPartnerId)
  const countryId = profile.country ? await countryIdForCode(ctx, profile.country) : null
  const vals = {
    ...deliveryPartnerVals(profile, countryId),
    type: 'delivery',
    parent_id: companyId,
  }
  const created = await odooExecuteKw<unknown>(ctx, 'res.partner', 'create', [vals], {})
  return { odooPartnerId: normalizeOdooCreateId(created) }
}

async function toShippingDestination(
  ctx: OdooCallContext,
  row: PartnerProfileRow,
  kind: OdooShippingDestination['kind'],
): Promise<OdooShippingDestination> {
  const country = await countryCodeForPartner(ctx, row.country_id)
  const profile = odooPartnerToShippingProfile(row, country)
  return {
    odooPartnerId: row.id,
    kind,
    label: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : `${profile.firstName} ${profile.lastName}`.trim(),
    profile,
  }
}

async function listShippingDestinations(
  ctx: OdooCallContext,
  parentPartnerId: number,
): Promise<OdooShippingDestination[]> {
  const seedRows = await odooExecuteKw<PartnerProfileRow[]>(
    ctx,
    'res.partner',
    'read',
    [[parentPartnerId]],
    { fields: [...PARTNER_ADDRESS_FIELDS] },
  )
  const seed = seedRows[0]
  const companyId = seed ? odooM2oId(seed.commercial_partner_id) ?? seed.id : parentPartnerId

  const [parentRows, childRows] = await Promise.all([
    companyId === seed?.id
      ? Promise.resolve(seedRows)
      : odooExecuteKw<PartnerProfileRow[]>(
          ctx,
          'res.partner',
          'read',
          [[companyId]],
          { fields: [...PARTNER_ADDRESS_FIELDS] },
        ),
    odooExecuteKw<PartnerProfileRow[]>(
      ctx,
      'res.partner',
      'search_read',
      [[['parent_id', '=', companyId], ['active', '=', true]]],
      { fields: [...PARTNER_ADDRESS_FIELDS] },
    ),
  ])

  const destinations: OdooShippingDestination[] = []
  const parent = parentRows[0]
  if (parent && odooPartnerStreet(parent)) {
    destinations.push(await toShippingDestination(ctx, parent, 'parent'))
  }

  for (const child of childRows) {
    if (!isOdooChildShippingDestination(child)) continue
    destinations.push(await toShippingDestination(ctx, child, odooShippingDestinationKind(child)))
  }

  return destinations
}

async function updateDeliveryPartner(
  ctx: OdooCallContext,
  partnerId: number,
  profile: OdooCustomerProfile,
): Promise<void> {
  const countryId = profile.country ? await countryIdForCode(ctx, profile.country) : null
  await odooExecuteKw<boolean>(
    ctx,
    'res.partner',
    'write',
    [[partnerId], deliveryPartnerVals(profile, countryId)],
    {},
  )
}

async function archiveDeliveryPartner(ctx: OdooCallContext, partnerId: number): Promise<void> {
  await odooExecuteKw<boolean>(ctx, 'res.partner', 'write', [[partnerId], { active: false }], {})
}

function asShippingProfile(
  address: Partial<OdooCustomerProfile>,
): OdooCustomerProfile {
  return {
    firstName: address.firstName ?? '',
    lastName: address.lastName ?? '',
    line1: address.line1 ?? '',
    streetNumber: address.streetNumber ?? '',
    isSnc: address.isSnc ?? false,
    line2: address.line2,
    city: address.city ?? '',
    postalCode: address.postalCode ?? '',
    country: address.country ?? 'IT',
    phone: address.phone,
  }
}

async function resolveOrderShippingPartner(
  ctx: OdooCallContext,
  parentPartnerId: number,
  input: {
    shippingAddress?: Partial<OdooCustomerProfile> & { id?: string | null }
    dropshipAddress?: Partial<OdooCustomerProfile> | null
  },
): Promise<OdooCustomerResult | null> {
  if (input.dropshipAddress?.line1?.trim()) {
    return createDeliveryPartner(ctx, parentPartnerId, asShippingProfile(input.dropshipAddress))
  }

  const shipping = input.shippingAddress
  if (!shipping?.line1?.trim() && !shipping?.id) return null

  const destinations = await listShippingDestinations(ctx, parentPartnerId)
  const fromId = parseOdooShippingAddressId(shipping?.id)
  if (fromId && destinations.some((destination) => destination.odooPartnerId === fromId)) {
    return { odooPartnerId: fromId }
  }

  const match = shipping
    ? destinations.find((destination) => shippingAddressesMatch(destination.profile, shipping))
    : undefined
  if (match) return { odooPartnerId: match.odooPartnerId }

  const parent = destinations.find((destination) => destination.kind === 'parent')
  if (shipping?.line1?.trim() && parent && !shippingAddressesMatch(parent.profile, shipping)) {
    return createDeliveryPartner(ctx, parentPartnerId, asShippingProfile(shipping))
  }

  return null
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
    getCustomerAccountByEmail: getPartnerAccountByEmail,
    getCustomerAccountByPartnerId: getPartnerAccountByPartnerId,
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
    listShippingDestinations,
    updateDeliveryPartner,
    archiveDeliveryPartner,
    resolveOrderShippingPartner,
    syncProfessionalFlagFromPartner,
  }
}
