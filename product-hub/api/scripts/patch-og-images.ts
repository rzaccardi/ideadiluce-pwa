/**
 * Aggiorna ogImageUrl senza re-import completo (fix indice colonna open_graph_image).
 */
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../generated/hub-client/index.js'
import { requireHubDatabaseUrl } from './load-hub-env.js'
import { parseYoastProductsSql, readSqlFile } from './parse-woo-sql.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

requireHubDatabaseUrl()

const yoastPath = resolve(__dirname, '../../import/wpidl_yoast_indexable.sql')
const seoRows = parseYoastProductsSql(readSqlFile(yoastPath))
const prisma = new PrismaClient()

let updated = 0
for (const row of seoRows) {
  if (!row.ogImage) continue
  const r = await prisma.product.updateMany({
    where: { wooPostId: row.postId },
    data: { ogImageUrl: row.ogImage },
  })
  updated += r.count
}

console.log({ seoWithImage: seoRows.filter((r) => r.ogImage).length, productsUpdated: updated })
await prisma.$disconnect()
