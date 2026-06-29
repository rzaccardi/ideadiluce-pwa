import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

import { siteRepository } from '../src/modules/site/site.repository.js'

async function main() {
  for (const locale of ['IT', 'EN', 'DE', 'FR', 'ES'] as const) {
    const row = await siteRepository.findByKeyLocale('shell', locale)
    const content = row?.content as {
      utilityBar?: { messages?: string[] }
      nav?: { items?: Array<{ id?: string; label?: string; panel?: { columns?: Array<{ title?: string; links?: Array<{ label?: string; href?: string }> }> } }> }
    }
    const arredo = content?.nav?.items?.find((item) => item.id === 'arredo')
    console.log(
      JSON.stringify({
        locale,
        utility: content?.utilityBar?.messages?.[0],
        arredoLabel: arredo?.label,
        tipo: arredo?.panel?.columns?.[0]?.title,
        firstLink: arredo?.panel?.columns?.[0]?.links?.[0]?.label,
      }),
    )
  }
}

main().finally(async () => {
  const { prisma } = await import('../src/lib/prisma.js')
  await prisma.$disconnect()
})
