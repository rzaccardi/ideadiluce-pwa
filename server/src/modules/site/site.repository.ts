import { prisma } from '../../lib/prisma.js'
import type { SitePageKey } from './site.types.js'

export const siteRepository = {
  findByKeyLocale(pageKey: SitePageKey, locale: string) {
    return prisma.sitePage.findUnique({
      where: { pageKey_locale: { pageKey, locale } },
    })
  },

  listAll() {
    return prisma.sitePage.findMany({ orderBy: [{ pageKey: 'asc' }, { locale: 'asc' }] })
  },

  listByPageKey(pageKey: SitePageKey) {
    return prisma.sitePage.findMany({
      where: { pageKey },
      orderBy: { locale: 'asc' },
    })
  },

  upsert(pageKey: SitePageKey, locale: string, content: unknown, published = true) {
    return prisma.sitePage.upsert({
      where: { pageKey_locale: { pageKey, locale } },
      create: { pageKey, locale, content: content as object, published },
      update: { content: content as object, published },
    })
  },
}
