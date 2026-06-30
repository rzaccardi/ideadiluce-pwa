import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

import { refreshSeoCaches } from '../src/modules/seo/seo-cache.service.js'

async function main() {
  const result = await refreshSeoCaches({ skipPwaRevalidate: true })
  console.log(JSON.stringify(result, null, 2))
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
