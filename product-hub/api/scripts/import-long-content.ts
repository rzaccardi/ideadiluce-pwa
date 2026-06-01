/**
 * Importa post_content / post_excerpt dal dump completo Woo.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../generated/hub-client/index.js'
import { normalizeWooContent, normalizeWooExcerpt } from '../src/normalize-woo-content.js'
import { requireHubDatabaseUrl } from './load-hub-env.js'
import { loadPostContentFromDump } from './parse-wp-posts-content.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const importDir = resolve(__dirname, '../../import')

function resolveContentDump(): string {
  const candidates = readdirSync(importDir)
    .filter((f) => f.endsWith('.sql') && f.includes('wpidl_posts') && !f.includes('yoast'))
    .map((f) => resolve(importDir, f))
    .filter((p) => {
      try {
        const head = readFileSync(p, 'utf8').slice(0, 4000)
        return head.includes('post_content')
      } catch {
        return false
      }
    })

  const preferredOrder = (a: string, b: string) => {
    const score = (p: string) => {
      if (p.includes('wpidl_posts (2)')) return 0
      if (p.includes('wpidl_posts_full')) return 1
      if (p.includes('wpidl_posts (1)')) return 2
      if (p.endsWith('wpidl_posts.sql')) return 4
      return 3
    }
    return score(a) - score(b)
  }

  candidates.sort(preferredOrder)
  if (candidates[0]) return candidates[0]

  throw new Error(
    `Nessun dump con post_content in ${importDir}. Esporta wpidl_posts con colonne ID, post_name, post_excerpt, post_content.`,
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
    select: { id: true, wooPostId: true, slug: true },
  })
  const variants = await prisma.productVariant.findMany({
    select: { id: true, wooPostId: true, slug: true, productId: true },
  })

  let productsUpdated = 0
  for (const p of products) {
    const row = byId.get(p.wooPostId) ?? bySlug.get(p.slug)
    if (!row) continue
    const long = normalizeWooContent(row.content)
    const short =
      normalizeWooExcerpt(row.excerpt, 300) ??
      (long ? normalizeWooExcerpt(long, 300) : null)
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
        data: { longDescription: normalizeWooContent(row.content) },
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

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
