import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

import { SITE_PAGE_KEYS } from '../src/modules/site/site-content.defaults.js'
import { siteService } from '../src/modules/site/site.service.js'

const START_FROM = process.argv[2] ?? 'contatti'

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function translatePageWithRetry(pageKey: string, attempts = 8) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await siteService.translateAdminPageToLocales(pageKey, undefined, 'IT', {
        onlyMissingLocales: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const isRateLimit = message.includes('429')
      if (!isRateLimit || attempt === attempts) throw error
      const delayMs = attempt * 20_000
      console.log(`\n    rate limit, attendo ${delayMs / 1000}s…`)
      await sleep(delayMs)
    }
  }
  throw new Error(`Traduzione fallita per ${pageKey}`)
}

async function main() {
  const startIndex = SITE_PAGE_KEYS.indexOf(START_FROM as (typeof SITE_PAGE_KEYS)[number])
  const pageKeys = startIndex >= 0 ? SITE_PAGE_KEYS.slice(startIndex) : [...SITE_PAGE_KEYS]

  for (const pageKey of pageKeys) {
    process.stdout.write(`  · ${pageKey}… `)
    const result = await translatePageWithRetry(pageKey)
    const locales = result.locales.filter((row) => !row.skipped).map((row) => row.locale)
    console.log(locales.join(', ') || 'nessuna')
    await sleep(3_000)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    const { prisma } = await import('../src/lib/prisma.js')
    await prisma.$disconnect()
  })
