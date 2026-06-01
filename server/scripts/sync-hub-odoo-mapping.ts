/**
 * Mappa SKU Hub → ID Odoo (product.template / product.product).
 * Uso: npm run hub:sync-odoo (dalla root)
 *
 * Se più varianti Woo condividono lo stesso SKU, una sola riceve odooVariantId
 * (vincolo unique); le altre restano senza mapping e vengono elencate nel report.
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ExternalSystem, hubPrisma } from '@ideadiluce/hub-api'
import { env } from '../src/config/env.js'
import { isOdooConfigured, odooExecuteKw } from '../src/adapters/odoo/odooClient.js'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
config({ path: path.join(repoRoot, '.env') })

type OdooVariantRow = {
  id: number
  default_code: string | false
  product_tmpl_id: [number, string] | number
}

type OdooTemplateRow = {
  id: number
  default_code: string | false
}

type SkippedMapping = {
  kind: 'variant' | 'product'
  sku: string
  hubId: string
  odooId: number
  reason: string
}

function normalizeSku(sku: string | null | undefined): string[] {
  if (!sku?.trim()) return []
  return sku
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function templateIdFromOdooVariant(odoo: OdooVariantRow): number {
  return Array.isArray(odoo.product_tmpl_id)
    ? odoo.product_tmpl_id[0]
    : Number(odoo.product_tmpl_id)
}

async function main() {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    console.error('Odoo non configurato (ODOO_ENABLED + credenziali).')
    process.exit(1)
  }

  const ctx = { correlationId: 'hub-sync-odoo' }
  const skipped: SkippedMapping[] = []

  const variants = await hubPrisma.productVariant.findMany({
    select: { id: true, sku: true, productId: true, odooVariantId: true },
  })
  const products = await hubPrisma.product.findMany({
    select: { id: true, sku: true, odooTemplateId: true },
  })

  const skuToVariantIds = new Map<string, string[]>()
  for (const v of variants) {
    for (const sku of normalizeSku(v.sku)) {
      const list = skuToVariantIds.get(sku) ?? []
      list.push(v.id)
      skuToVariantIds.set(sku, list)
    }
  }

  const skuToProductIds = new Map<string, string[]>()
  for (const p of products) {
    for (const sku of normalizeSku(p.sku)) {
      const list = skuToProductIds.get(sku) ?? []
      list.push(p.id)
      skuToProductIds.set(sku, list)
    }
  }

  const allSkus = [...new Set([...skuToVariantIds.keys(), ...skuToProductIds.keys()])]
  console.log('SKU unici da mappare:', allSkus.length)

  const variantBySku = new Map<string, OdooVariantRow>()
  const templateBySku = new Map<string, OdooTemplateRow>()

  for (const batch of chunk(allSkus, 80)) {
    const vRows = await odooExecuteKw<OdooVariantRow[]>(
      ctx,
      'product.product',
      'search_read',
      [[['default_code', 'in', batch]]],
      { fields: ['default_code', 'product_tmpl_id'], limit: batch.length },
    )
    for (const row of vRows) {
      const code = typeof row.default_code === 'string' ? row.default_code.trim() : ''
      if (code) variantBySku.set(code, row)
    }

    const tRows = await odooExecuteKw<OdooTemplateRow[]>(
      ctx,
      'product.template',
      'search_read',
      [[['default_code', 'in', batch]]],
      { fields: ['default_code'], limit: batch.length },
    )
    for (const row of tRows) {
      const code = typeof row.default_code === 'string' ? row.default_code.trim() : ''
      if (code) templateBySku.set(code, row)
    }
  }

  const odooVariantClaimed = new Map<number, string>()
  const odooTemplateClaimed = new Map<number, string>()

  for (const row of variants) {
    if (row.odooVariantId != null) {
      odooVariantClaimed.set(row.odooVariantId, row.id)
    }
  }
  for (const row of products) {
    if (row.odooTemplateId != null) {
      odooTemplateClaimed.set(row.odooTemplateId, row.id)
    }
  }

  let variantsMapped = 0
  let productsMapped = 0

  for (const [sku, hubVariantIds] of skuToVariantIds) {
    const odoo = variantBySku.get(sku)
    if (!odoo) continue
    const templateId = templateIdFromOdooVariant(odoo)

    for (const hubVariantId of hubVariantIds) {
      const existingOwner = odooVariantClaimed.get(odoo.id)
      if (existingOwner && existingOwner !== hubVariantId) {
        skipped.push({
          kind: 'variant',
          sku,
          hubId: hubVariantId,
          odooId: odoo.id,
          reason: `odooVariantId già assegnato a variante Hub ${existingOwner}`,
        })
        continue
      }

      const current = variants.find((v) => v.id === hubVariantId)
      if (current?.odooVariantId === odoo.id) {
        odooVariantClaimed.set(odoo.id, hubVariantId)
        continue
      }

      const hubVariant = await hubPrisma.productVariant.update({
        where: { id: hubVariantId },
        data: { odooVariantId: odoo.id },
        select: { id: true, productId: true },
      })
      odooVariantClaimed.set(odoo.id, hubVariantId)

      const productOwner = odooTemplateClaimed.get(templateId)
      if (!productOwner || productOwner === hubVariant.productId) {
        await hubPrisma.product.update({
          where: { id: hubVariant.productId },
          data: { odooTemplateId: templateId },
        })
        odooTemplateClaimed.set(templateId, hubVariant.productId)
      }

      await hubPrisma.externalProductRef.upsert({
        where: {
          system_externalId: { system: ExternalSystem.ODOO_VARIANT, externalId: String(odoo.id) },
        },
        create: {
          system: ExternalSystem.ODOO_VARIANT,
          externalId: String(odoo.id),
          variantId: hubVariantId,
          productId: hubVariant.productId,
        },
        update: { variantId: hubVariantId, productId: hubVariant.productId },
      })
      variantsMapped++
    }
  }

  for (const [sku, hubProductIds] of skuToProductIds) {
    const odooT = templateBySku.get(sku)
    if (!odooT) continue
    for (const hubProductId of hubProductIds) {
      const existingOwner = odooTemplateClaimed.get(odooT.id)
      if (existingOwner && existingOwner !== hubProductId) {
        skipped.push({
          kind: 'product',
          sku,
          hubId: hubProductId,
          odooId: odooT.id,
          reason: `odooTemplateId già assegnato a prodotto Hub ${existingOwner}`,
        })
        continue
      }

      const already = await hubPrisma.product.findUnique({
        where: { id: hubProductId },
        select: { odooTemplateId: true },
      })
      if (already?.odooTemplateId === odooT.id) continue

      await hubPrisma.product.update({
        where: { id: hubProductId },
        data: { odooTemplateId: odooT.id },
      })
      odooTemplateClaimed.set(odooT.id, hubProductId)

      await hubPrisma.externalProductRef.upsert({
        where: {
          system_externalId: { system: ExternalSystem.ODOO_TEMPLATE, externalId: String(odooT.id) },
        },
        create: {
          system: ExternalSystem.ODOO_TEMPLATE,
          externalId: String(odooT.id),
          productId: hubProductId,
        },
        update: { productId: hubProductId },
      })
      productsMapped++
    }
  }

  console.log('Sync Odoo completato:', {
    variantsMapped,
    productsMapped,
    odooVariantsFound: variantBySku.size,
    odooTemplatesFound: templateBySku.size,
    skippedDuplicates: skipped.length,
  })

  if (skipped.length) {
    console.log('\nMapping saltati (SKU duplicati o ID Odoo già usato):')
    for (const row of skipped.slice(0, 30)) {
      console.log(`  [${row.kind}] sku=${row.sku} hub=${row.hubId} odoo=${row.odooId} — ${row.reason}`)
    }
    if (skipped.length > 30) {
      console.log(`  … altri ${skipped.length - 30}`)
    }
  }

  await hubPrisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
