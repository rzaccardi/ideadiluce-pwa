/**
 * Smoke read-only: hydrate anagrafica B2B da partner Odoo già esistenti.
 *
 * Uso:
 *   cd server && npx tsx scripts/odoo-business-hydrate-smoke.ts
 *   EMAIL=cliente@esempio.it npx tsx scripts/odoo-business-hydrate-smoke.ts
 *   PARTNER_IDS=123,456 npx tsx scripts/odoo-business-hydrate-smoke.ts
 *
 * Non scrive su Odoo né su Postgres (dry-run). Con APPLY=1 aggiorna solo
 * i campi PWA vuoti via hydrateUserBusinessFromOdoo (force).
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../src/lib/prisma.js'
import { env } from '../src/config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../src/adapters/odoo/odooClient.js'
import { createOdooCustomerAdapter } from '../src/adapters/odoo/odooCustomerAdapter.js'
import { buildUserBusinessPatch } from '../src/adapters/odoo/odooCustomerAccount.js'
import { hydrateUserBusinessFromOdoo } from '../src/modules/users/users-odoo-business-hydrate.js'
import { odooM2oId } from '../src/adapters/odoo/odooCustomerAccount.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

const ctx: OdooCallContext = { correlationId: 'odoo-business-hydrate-smoke' }
const adapter = createOdooCustomerAdapter()
const APPLY = process.env.APPLY === '1'
const LIMIT = Number(process.env.LIMIT ?? 8)

type PartnerSample = {
  id: number
  name: string
  email: string | false
  is_company: boolean
  parent_id: [number, string] | false
  commercial_partner_id: [number, string] | false
  vat: string | false
  property_product_pricelist?: [number, string] | false
}

function maskEmail(email: string | false | null | undefined): string | null {
  const v = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (!v || !v.includes('@')) return v || null
  const [local, domain] = v.split('@')
  if (!local || !domain) return v
  const keep = local.slice(0, 2)
  return `${keep}***@${domain}`
}

function maskVat(vat: string | null | undefined): string | null {
  const v = vat?.trim() ?? ''
  if (v.length <= 6) return v || null
  return `${v.slice(0, 4)}***${v.slice(-2)}`
}

async function searchSamples(): Promise<PartnerSample[]> {
  const extraIds = (process.env.PARTNER_IDS ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)

  const email = process.env.EMAIL?.trim().toLowerCase()

  if (email) {
    return odooExecuteKw<PartnerSample[]>(
      ctx,
      'res.partner',
      'search_read',
      [[['email', 'ilike', email]]],
      {
        fields: [
          'id',
          'name',
          'email',
          'is_company',
          'parent_id',
          'commercial_partner_id',
          'vat',
          'property_product_pricelist',
        ],
        limit: 20,
      },
    )
  }

  if (extraIds.length > 0) {
    return odooExecuteKw<PartnerSample[]>(
      ctx,
      'res.partner',
      'read',
      [extraIds],
      {
        fields: [
          'id',
          'name',
          'email',
          'is_company',
          'parent_id',
          'commercial_partner_id',
          'vat',
          'property_product_pricelist',
        ],
      },
    )
  }

  const [children, companies] = await Promise.all([
    odooExecuteKw<PartnerSample[]>(
      ctx,
      'res.partner',
      'search_read',
      [[
        ['parent_id', '!=', false],
        ['email', '!=', false],
        ['active', '=', true],
      ]],
      {
        fields: [
          'id',
          'name',
          'email',
          'is_company',
          'parent_id',
          'commercial_partner_id',
          'vat',
          'property_product_pricelist',
        ],
        limit: LIMIT,
        order: 'id desc',
      },
    ),
    odooExecuteKw<PartnerSample[]>(
      ctx,
      'res.partner',
      'search_read',
      [[
        ['is_company', '=', true],
        ['vat', '!=', false],
        ['email', '!=', false],
        ['active', '=', true],
      ]],
      {
        fields: [
          'id',
          'name',
          'email',
          'is_company',
          'parent_id',
          'commercial_partner_id',
          'vat',
          'property_product_pricelist',
        ],
        limit: LIMIT,
        order: 'id desc',
      },
    ),
  ])

  const byId = new Map<number, PartnerSample>()
  for (const row of [...children, ...companies]) byId.set(row.id, row)
  return [...byId.values()]
}

async function inspectPartner(row: PartnerSample) {
  const account = await adapter.getCustomerAccountByPartnerId(ctx, row.id)
  const commercialId = odooM2oId(row.commercial_partner_id) ?? row.id
  const wouldRemap = commercialId > 0 && commercialId !== row.id
  const destinations = account
    ? await adapter.listShippingDestinations(ctx, account.commercialPartnerId)
    : []

  const emptyUser = {
    firstName: null,
    lastName: null,
    phone: null,
    companyName: null,
    vatNumber: null,
    fiscalCode: null,
    pec: null,
    sdiCode: null,
  }
  const patch = account ? buildUserBusinessPatch(emptyUser, account) : null
  const pricelist = Array.isArray(row.property_product_pricelist)
    ? { id: row.property_product_pricelist[0], name: row.property_product_pricelist[1] }
    : null

  const prefillReady = {
    companyName: Boolean(patch?.companyName || account?.business.companyName),
    vatNumber: Boolean(patch?.vatNumber || account?.business.vatNumber),
    fiscalCode: Boolean(patch?.fiscalCode || account?.business.fiscalCode),
    pec: Boolean(patch?.pec || account?.business.pec),
    sdiCode: Boolean(patch?.sdiCode || account?.business.sdiCode),
    addressLine: Boolean(account?.profile.line1 && account?.profile.city),
    contactName: Boolean(account && !account.contactIsCompany && (account.profile.firstName || account.profile.lastName)),
  }

  return {
    sampledAs: {
      id: row.id,
      name: row.name,
      email: maskEmail(row.email),
      isCompany: row.is_company,
      parentId: odooM2oId(row.parent_id),
      commercialId,
      wouldRemapMapToCommercial: wouldRemap,
      vat: maskVat(typeof row.vat === 'string' ? row.vat : null),
      pricelist,
    },
    accountFound: Boolean(account),
    contactPartnerId: account?.contactPartnerId ?? null,
    commercialPartnerId: account?.commercialPartnerId ?? null,
    contactIsCompany: account?.contactIsCompany ?? null,
    hydratePatchFromEmptyPwa: patch
      ? {
          ...patch,
          vatNumber: maskVat(patch.vatNumber),
          fiscalCode: patch.fiscalCode ? `${String(patch.fiscalCode).slice(0, 4)}***` : patch.fiscalCode,
          pec: patch.pec ? maskEmail(patch.pec) : patch.pec,
        }
      : null,
    destinations: destinations.map((d) => ({
      odooPartnerId: d.odooPartnerId,
      kind: d.kind,
      label: d.label,
      city: d.profile.city,
      deletable: d.kind !== 'parent',
    })),
    prefillReady,
    personalizedPricingWouldBeTrue: Boolean(account),
  }
}

async function inspectMappedPwaUsers() {
  try {
    if (process.env.SKIP_PWA === '1') return { skipped: true }

    const maps = await prisma.odooCustomerMap.findMany({
      where: { userId: { not: null } },
      take: 20,
      orderBy: { lastSyncAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            customerSegment: true,
            isProfessional: true,
            companyName: true,
            vatNumber: true,
            fiscalCode: true,
            pec: true,
            sdiCode: true,
            odooPricelistId: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    const results = []
    for (const map of maps) {
      if (!map.user) continue
      const pwaUser = map.user
      const account = await adapter.getCustomerAccountByPartnerId(ctx, map.odooPartnerId)
      const commercialId = account?.commercialPartnerId ?? null
      const wouldRemap = Boolean(commercialId && commercialId !== map.odooPartnerId)
      const patch = account ? buildUserBusinessPatch(pwaUser, account) : null

      let applied: { updated: boolean } | null = null
      if (APPLY && account) {
        const full = await prisma.user.findUnique({ where: { id: pwaUser.id } })
        if (full) {
          const after = await hydrateUserBusinessFromOdoo(full, ctx, { account, force: true })
          applied = {
            updated:
              after.companyName !== full.companyName ||
              after.vatNumber !== full.vatNumber ||
              after.fiscalCode !== full.fiscalCode ||
              after.pec !== full.pec ||
              after.sdiCode !== full.sdiCode,
          }
        }
      }

      results.push({
        userId: pwaUser.id,
        email: maskEmail(pwaUser.email),
        segment: pwaUser.customerSegment,
        isProfessional: pwaUser.isProfessional,
        mappedPartnerId: map.odooPartnerId,
        commercialPartnerId: commercialId,
        wouldRemapToCommercial: wouldRemap,
        partnerFound: Boolean(account),
        pwaHasCompany: Boolean(pwaUser.companyName?.trim()),
        pwaHasVat: Boolean(pwaUser.vatNumber?.trim()),
        hydrateWouldFill: patch ? Object.keys(patch) : [],
        personalizedPricing: true,
        applied,
      })
    }
    return results
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

async function main() {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    console.log(JSON.stringify({ ok: false, error: 'Odoo non configurato' }, null, 2))
    process.exit(1)
  }

  const samples = await searchSamples()
  const partnerReports = []
  for (const row of samples) {
    partnerReports.push(await inspectPartner(row))
  }

  const pwaMaps = await inspectMappedPwaUsers()

  const remapCases = partnerReports.filter((r) => r.sampledAs.wouldRemapMapToCommercial)
  const missing = partnerReports.filter((r) => !r.accountFound)
  const withChildren = partnerReports.filter((r) => r.destinations.some((d) => d.kind !== 'parent'))
  const withPricelist = partnerReports.filter((r) => r.sampledAs.pricelist)

  console.log(
    JSON.stringify(
      {
        ok: true,
        apply: APPLY,
        summary: {
          sampledPartners: partnerReports.length,
          remapChildToCommercial: remapCases.length,
          partnerNotFound: missing.length,
          withExtraDestinations: withChildren.length,
          withPricelist: withPricelist.length,
        },
        partners: partnerReports,
        pwaMappedUsers: pwaMaps,
        howToRetestSpecific: [
          'EMAIL=cliente@esempio.it npx tsx scripts/odoo-business-hydrate-smoke.ts',
          'PARTNER_IDS=123,456 npx tsx scripts/odoo-business-hydrate-smoke.ts',
          'APPLY=1 npx tsx scripts/odoo-business-hydrate-smoke.ts  # solo PWA, campi vuoti',
        ],
      },
      null,
      2,
    ),
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined)
  })
