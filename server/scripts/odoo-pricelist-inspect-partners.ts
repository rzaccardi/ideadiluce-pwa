/**
 * Ispeziona (e opzionalmente assegna) listini ai partner test.
 * Uso:
 *   cd server && npx tsx scripts/odoo-pricelist-inspect-partners.ts
 *   APPLY=1 npx tsx scripts/odoo-pricelist-inspect-partners.ts
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { odooExecuteKw } from '../src/adapters/odoo/odooClient.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

const ctx = { correlationId: 'odoo-pricelist-inspect-partners' }
const b2bId = Number(process.env.ODOO_TEST_B2B_PARTNER_ID ?? 99002)
const proId = Number(process.env.ODOO_TEST_PRO_PARTNER_ID ?? 99003)
const APPLY = process.env.APPLY === '1'
const B2B_LIST = Number(process.env.ODOO_PRICELIST_B2B_ID ?? 15)
const PRO_LIST = Number(process.env.ODOO_PRICELIST_PROFESSIONAL_ID ?? 14)

async function readPartner(id: number) {
  const rows = await odooExecuteKw<
    Array<{
      id: number
      name?: string
      email?: string | false
      property_product_pricelist?: [number, string] | false
    }>
  >(ctx, 'res.partner', 'read', [[id]], {
    fields: ['id', 'name', 'email', 'property_product_pricelist'],
  })
  const row = rows[0]
  if (!row) return { id, missing: true }
  const pl = row.property_product_pricelist
  return {
    id: row.id,
    name: row.name ?? null,
    email: typeof row.email === 'string' ? row.email : null,
    pricelistId: Array.isArray(pl) ? pl[0] : null,
    pricelistName: Array.isArray(pl) ? pl[1] : null,
  }
}

function looksLikeTestPartner(partner: Awaited<ReturnType<typeof readPartner>>) {
  if ('missing' in partner && partner.missing) return false
  const blob = `${partner.name ?? ''} ${partner.email ?? ''}`.toLowerCase()
  return /test|ideadiluce\.local|b2b-test|pro-test|fixture|pwa/i.test(blob)
}

async function main() {
  const [b2b, pro] = await Promise.all([readPartner(b2bId), readPartner(proId)])
  const report: Record<string, unknown> = { apply: APPLY, before: { b2b, pro } }

  if (APPLY) {
    const writes: Array<{ partnerId: number; pricelistId: number; skipped?: string }> = []
    for (const spec of [
      { partner: b2b, pricelistId: B2B_LIST },
      { partner: pro, pricelistId: PRO_LIST },
    ]) {
      if ('missing' in spec.partner && spec.partner.missing) {
        writes.push({ partnerId: spec.partner.id, pricelistId: spec.pricelistId, skipped: 'partner assente' })
        continue
      }
      if (!looksLikeTestPartner(spec.partner)) {
        writes.push({
          partnerId: spec.partner.id,
          pricelistId: spec.pricelistId,
          skipped: `non sembra un partner test (${spec.partner.name ?? 'no name'})`,
        })
        continue
      }
      await odooExecuteKw(ctx, 'res.partner', 'write', [
        [spec.partner.id],
        { property_product_pricelist: spec.pricelistId },
      ])
      writes.push({ partnerId: spec.partner.id, pricelistId: spec.pricelistId })
    }
    report.writes = writes
    report.after = {
      b2b: await readPartner(b2bId),
      pro: await readPartner(proId),
    }
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
