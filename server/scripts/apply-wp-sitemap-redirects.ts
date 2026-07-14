/**
 * Applica redirect SEO da sitemap WordPress indicizzata (docs/seo/wordpress-sitemap-urls.json).
 *
 * Uso:
 *   npx tsx server/scripts/apply-wp-sitemap-redirects.ts
 *   npx tsx server/scripts/apply-wp-sitemap-redirects.ts --dry-run
 *   npx tsx server/scripts/apply-wp-sitemap-redirects.ts --type=product_category
 */
import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { upsertSeoRedirect } from '../src/modules/seo/seo-redirect.service.js'
import { refreshSeoCaches } from '../src/modules/seo/seo-cache.service.js'
import {
  classifyWpUrl,
  listWpIndexedRedirects,
  type WpUrlType,
} from '../src/modules/seo/wp-url-mapping.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const typeFilter = args.find((a) => a.startsWith('--type='))?.slice('--type='.length) as WpUrlType | undefined
const jsonArg = args.find((a) => a.startsWith('--json='))?.slice('--json='.length)

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const jsonPath = jsonArg ?? join(root, 'docs/seo/wordpress-sitemap-urls.json')

function loadPaths(): string[] {
  const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
    urls: Array<{ path: string; type?: string }>
  }
  return data.urls
    .filter((u) => !typeFilter || u.type === typeFilter || classifyWpUrl(u.path) === typeFilter)
    .map((u) => u.path)
}

async function main() {
  const paths = loadPaths()
  const redirects = listWpIndexedRedirects(paths)

  console.log(`Sorgente: ${jsonPath}`)
  console.log(`Path analizzati: ${paths.length}`)
  console.log(`Redirect da applicare: ${redirects.length}`)
  if (typeFilter) console.log(`Filtro tipo: ${typeFilter}`)
  if (dryRun) console.log('(dry-run — nessuna scrittura DB)\n')

  let applied = 0
  for (const redirect of redirects) {
    if (!redirect.toPath) continue
    console.log(`${redirect.fromPath} → ${redirect.toPath}`)
    if (!dryRun) {
      await upsertSeoRedirect({
        fromPath: redirect.fromPath,
        toPath: redirect.toPath,
        statusCode: redirect.statusCode,
        reason: redirect.reason,
      })
    }
    applied += 1
  }

  if (!dryRun && applied > 0) {
    await refreshSeoCaches({ skipPwaRevalidate: true })
  }

  console.log(`\nCompletato: ${applied} redirect${dryRun ? ' (simulati)' : ''}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
