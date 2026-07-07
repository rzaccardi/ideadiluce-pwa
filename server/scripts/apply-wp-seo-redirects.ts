/**
 * Promuove record WpSeoMigrationRecord → SeoRedirect (bulk apply post-export WordPress).
 *
 * Uso:
 *   npx tsx server/scripts/apply-wp-seo-redirects.ts
 *   npx tsx server/scripts/apply-wp-seo-redirects.ts --run-id=<cuid> --dry-run
 *   npx tsx server/scripts/apply-wp-seo-redirects.ts --record-type=product
 */
import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

import { prisma } from '../src/lib/prisma.js'
import { upsertSeoRedirect } from '../src/modules/seo/seo-redirect.service.js'
import { buildTechnicalProductRedirectUrl } from '../src/config/site-tenants.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const runId = args.find((a) => a.startsWith('--run-id='))?.slice('--run-id='.length)
const recordType = args.find((a) => a.startsWith('--record-type='))?.slice('--record-type='.length) ?? 'product'
const technicalOnly = args.includes('--technical-only')

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash
}

function pathFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  try {
    const pathname = url.startsWith('http') ? new URL(url).pathname : url
    return normalizePath(pathname)
  } catch {
    return null
  }
}

function isTechnicalProduct(record: { payload: unknown; notes?: string | null }): boolean {
  const payload = record.payload as Record<string, unknown> | null
  const categories = String(
    payload?.woocommerce_categories ?? payload?.categories ?? record.notes ?? '',
  ).toLowerCase()
  return /tecnica|lampadine|driver|alimentator|ricambi|portalampade/.test(categories)
}

function resolveTargetPath(record: {
  slug: string | null
  nextjsTargetUrl: string | null
  currentUrl: string | null
  payload: unknown
  notes?: string | null
}): string | null {
  if (record.nextjsTargetUrl?.trim()) {
    const target = record.nextjsTargetUrl.trim()
    if (/^https?:\/\//i.test(target)) return target
    return normalizePath(target)
  }

  if (!record.slug?.trim()) return null

  if (technicalOnly || isTechnicalProduct(record)) {
    const crossDomain = buildTechnicalProductRedirectUrl(record.slug)
    if (crossDomain) return crossDomain
  }

  return `/prodotto/${record.slug.trim()}`
}

async function main() {
  const records = await prisma.wpSeoMigrationRecord.findMany({
    where: {
      ...(runId ? { runId } : {}),
      ...(recordType ? { recordType } : {}),
    },
    orderBy: { createdAt: 'asc' },
  })

  let applied = 0
  let skipped = 0

  for (const record of records) {
    const fromPath = pathFromUrl(record.currentUrl)
    const toPath = resolveTargetPath(record)

    if (!fromPath || !toPath || fromPath === toPath) {
      skipped += 1
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] 301 ${fromPath} → ${toPath}`)
      applied += 1
      continue
    }

    await upsertSeoRedirect({
      fromPath,
      toPath,
      statusCode: 301,
      reason: `wp-seo-migration:${record.runId}:${record.slug ?? record.id}`,
    })
    console.log(`301 ${fromPath} → ${toPath}`)
    applied += 1
  }

  console.log(`\nRecord processati: ${records.length}`)
  console.log(`Redirect ${dryRun ? 'simulati' : 'applicati'}: ${applied}`)
  console.log(`Saltati: ${skipped}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
