/**
 * Riapplica normalizeWooContent su descrizioni già importate (senza rileggere il dump).
 */
import { PrismaClient } from '../generated/hub-client/index.js'
import { normalizeWooContent, normalizeWooExcerpt } from '../src/normalize-woo-content.js'
import { requireHubDatabaseUrl } from './load-hub-env.js'

async function main() {
  requireHubDatabaseUrl()
  const prisma = new PrismaClient()

  const products = await prisma.product.findMany({
    select: { id: true, shortDescription: true, longDescription: true },
  })

  let updated = 0
  for (const p of products) {
    const long = normalizeWooContent(p.longDescription)
    const short =
      normalizeWooExcerpt(p.shortDescription, 300) ??
      (long ? normalizeWooExcerpt(long, 300) : null)
    if (long === p.longDescription && short === p.shortDescription) continue
    await prisma.product.update({
      where: { id: p.id },
      data: { longDescription: long, shortDescription: short },
    })
    updated++
  }

  console.log('Normalizzazione completata:', { total: products.length, updated })
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
