import { prisma } from '../../lib/prisma.js'

export const siteGuideRepository = {
  listAll() {
    return prisma.siteGuide.findMany({ orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] })
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
