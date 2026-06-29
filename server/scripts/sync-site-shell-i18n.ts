import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

import { DEFAULT_SHELL_IT, SITE_PAGE_KEYS } from '../src/modules/site/site-content.defaults.js'
import { siteRepository } from '../src/modules/site/site.repository.js'
import { siteService, seedSitePages } from '../src/modules/site/site.service.js'

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function translatePageWithRetry(pageKey: string, attempts = 6) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await siteService.translateAdminPageToLocales(pageKey, undefined, 'IT', {
        onlyMissingLocales: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const isRateLimit = message.includes('429') || message.includes('Too Many Requests')
      if (!isRateLimit || attempt === attempts) throw error
      const delayMs = attempt * 15_000
      console.log(`\n    rate limit, attendo ${delayMs / 1000}s…`)
      await sleep(delayMs)
    }
  }
  throw new Error(`Traduzione fallita per ${pageKey}`)
}

async function main() {
  console.log('→ Seed / patch contenuti sito…')
  await seedSitePages()

  console.log('→ Allineamento shell IT ai default aggiornati…')
  await siteRepository.upsert('shell', 'IT', structuredClone(DEFAULT_SHELL_IT), true)

  const pageKeys = [...SITE_PAGE_KEYS]
  console.log(`→ Traduzione DeepL di ${pageKeys.length} pagine in EN, ES, FR, DE…`)

  for (const pageKey of pageKeys) {
    process.stdout.write(`  · ${pageKey}… `)
    const result = await translatePageWithRetry(pageKey)
    const locales = result.locales.filter((row) => !row.skipped).map((row) => row.locale)
    console.log(locales.join(', ') || 'nessuna')
    await sleep(2_000)
  }

  console.log('✓ Shell e pagine sito tradotte.')
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
