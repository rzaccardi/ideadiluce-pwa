/**
 * Importa post_content / post_excerpt dal dump completo Woo.
 */
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../generated/hub-client/index.js'
import { requireHubDatabaseUrl } from './load-hub-env.js'
import { loadPostContentFromDump } from './parse-wp-posts-content.js'

import { readdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const importDir = resolve(__dirname, '../../import')

function resolveContentDump(): string {
  const preferred = [
    'wpidl_posts_full.sql',
    'cvtg56_wp687_1780322176.sql',
  ]
  for (const name of preferred) {
    const p = resolve(importDir, name)
    if (existsSync(p)) return p
  }
  const fallback = readdirSync(importDir).find(
    (f) => f.endsWith('.sql') && f.includes('wpidl_posts') && !f.includes('yoast'),
  )
  if (fallback) return resolve(importDir, fallback)
  throw new Error(
    `Nessun dump post_content in ${importDir}. Vedi product-hub/import/README.md (wpidl_posts_full.sql)`,
  )
}

async function main() {
  requireHubDatabaseUrl()

  const dumpPath = resolveContentDump()
  console.log('Dump:', dumpPath)

  console.log('Parsing post_content dal dump (può richiedere ~1-2 min)...')
  const { byId, bySlug } = await loadPostContentFromDump(dumpPath)
  console.log('Contenuti per ID:', byId.size, '| per slug:', bySlug.size)

  const prisma = new PrismaClient()
  const products = await prisma.product.findMany({
    select: { id: true, wooPostId: true },
  })
  const variants = await prisma.productVariant.findMany({
    select: { id: true, wooPostId: true, productId: true },
  })

  let productsUpdated = 0
  for (const p of products) {
    const row = byId.get(p.wooPostId) ?? bySlug.get(p.slug)
    if (!row) continue
    const short = row.excerpt.trim() || stripHtml(row.content).slice(0, 300) || null
    const long = row.content.trim() || null
    if (!short && !long) continue
    await prisma.product.update({
      where: { id: p.id },
      data: {
        shortDescription: short,
        longDescription: long,
      },
    })
    productsUpdated++
  }

  let variantsUpdated = 0
  for (const v of variants) {
    const row = byId.get(v.wooPostId) ?? bySlug.get(v.slug)
    if (!row?.content.trim()) continue
    const parent = await prisma.product.findUnique({
      where: { id: v.productId },
      select: { longDescription: true },
    })
    if (!parent?.longDescription) {
      await prisma.product.update({
        where: { id: v.productId },
        data: { longDescription: row.content.trim() },
      })
      variantsUpdated++
    }
  }

  console.log('Import contenuti completato:', {
    byId: byId.size,
    bySlug: bySlug.size,
    productsUpdated,
    variantsFilledParent: variantsUpdated,
  })

  await prisma.$disconnect()
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
