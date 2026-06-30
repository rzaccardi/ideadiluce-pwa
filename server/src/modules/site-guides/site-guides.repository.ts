import { prisma } from '../../lib/prisma.js'

export const siteGuideRepository = {
  listAll() {
    return prisma.siteGuide.findMany({ orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] })
  },

  listPaginated(page: number, pageSize: number) {
    const skip = Math.max(0, (page - 1) * pageSize)
    return prisma.siteGuide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
      skip,
      take: pageSize,
    })
  },

  count() {
    return prisma.siteGuide.count()
  },

  findBySlug(slug: string) {
    return prisma.siteGuide.findUnique({ where: { slug } })
  },

  upsert(data: {
    slug: string
    category: string
    readingMeta: string
    sortOrder: number
    indexed: boolean
    featured: boolean
    published: boolean
  }) {
    return prisma.siteGuide.upsert({
      where: { slug: data.slug },
      create: data,
      update: {
        category: data.category,
        readingMeta: data.readingMeta,
        sortOrder: data.sortOrder,
        indexed: data.indexed,
        featured: data.featured,
        published: data.published,
      },
    })
  },

  update(slug: string, data: Partial<{
    category: string
    readingMeta: string
    sortOrder: number
    indexed: boolean
    featured: boolean
    published: boolean
  }>) {
    return prisma.siteGuide.update({ where: { slug }, data })
  },
}
