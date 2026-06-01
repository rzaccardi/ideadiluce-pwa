import { odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { normalizeOdooCreateId } from './odooId.js'
import type {
  FindOrCreateCustomerInput,
  OdooCustomerAdapter,
  OdooCustomerProfile,
  OdooCustomerResult,
} from './odooCustomerAdapter.js'

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
    line2: typeof partner.street2 === 'string' ? partner.street2 : undefined,
    city: typeof partner.city === 'string' ? partner.city : '',
    postalCode: typeof partner.zip === 'string' ? partner.zip : '',
    country,
    phone: typeof partner.phone === 'string' ? partner.phone : undefined,
  }
}

async function createPartner(ctx: OdooCallContext, input: FindOrCreateCustomerInput): Promise<OdooCustomerResult> {
  const name =
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || input.email
  const vals = {
    name,
    email: input.email.toLowerCase().trim(),
    phone: input.phone ?? '',
    customer_rank: 1,
  }
  const created = await odooExecuteKw<unknown>(ctx, 'res.partner', 'create', [vals], {})
  const id = normalizeOdooCreateId(created)
  return { odooPartnerId: id }
}

export function createLiveOdooCustomerAdapter(): OdooCustomerAdapter {
  return {
    findCustomerByEmail: findPartnerByEmail,
    getCustomerProfileByEmail: getPartnerProfileByEmail,
    createCustomer: createPartner,
    async findOrCreateCustomer(ctx, input) {
      const existing = await findPartnerByEmail(ctx, input.email)
      if (existing) return existing
      return createPartner(ctx, input)
    },
  }
}
