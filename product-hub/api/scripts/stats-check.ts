import { PrismaClient } from '../generated/hub-client/index.js'

const p = new PrismaClient()
const total = await p.product.count({ where: { status: 'PUBLISHED' } })
const withOg = await p.product.count({
  where: { status: 'PUBLISHED', ogImageUrl: { not: null } },
})
const variants = await p.productVariant.count()
const productsWithVariants = await p.product.count({
  where: { variants: { some: {} } },
})
const maxVariants = await p.product.findFirst({
  orderBy: { variants: { _count: 'desc' } },
  select: { slug: true, _count: { select: { variants: true } } },
})
const sampleWith = await p.product.findMany({
  take: 3,
  where: { ogImageUrl: { not: null } },
  select: { slug: true, ogImageUrl: true, _count: { select: { variants: true } } },
})
await p.$disconnect()
console.log(
  JSON.stringify(
    { total, withOg, withoutOg: total - withOg, variants, productsWithVariants, maxVariants, sampleWith },
    null,
    2,
  ),
)
