import { z } from 'zod'
import { AppError } from '../../types/errors.js'
import { mergeSiteContentWithDefaults } from '../site/site-content.merge.js'
import { defaultSiteContent } from '../site/site-content.defaults.js'
import { siteRepository } from '../site/site.repository.js'
import { siteService } from '../site/site.service.js'
import { SITE_LOCALES, normalizeSiteLocale, type SiteLocale } from '../site/site.constants.js'
import type { ContentPageContent } from '../site/site.types.js'
import {
  DEFAULT_SITE_GUIDES,
  guidePageKey,
  type GuideCategory,
} from './site-guides.constants.js'
import { siteGuideRepository } from './site-guides.repository.js'

function assertGuideSlug(slug: string) {
  const row = DEFAULT_SITE_GUIDES.find((guide) => guide.slug === slug)
  if (!row) {
    throw new AppError('SITE_GUIDE_NOT_FOUND', 'Guide not found', 'Guida non trovata.', 404, false)
  }
  return row
}

function localeStatus(locale: SiteLocale, row: { published: boolean; updatedAt: Date } | undefined) {
  if (locale === 'IT') {
    return {
      status: row ? ('saved' as const) : ('default' as const),
      published: row?.published ?? false,
      updatedAt: row?.updatedAt.toISOString() ?? null,
    }
  }
  return {
    status: row ? ('saved' as const) : ('missing' as const),
    published: row?.published ?? false,
    updatedAt: row?.updatedAt.toISOString() ?? null,
  }
}

function readTitle(content: unknown) {
  if (content && typeof content === 'object' && 'title' in content) {
    const title = (content as ContentPageContent).title
    return typeof title === 'string' && title.trim() ? title : null
  }
  return null
}

async function readGuideTitle(slug: string, locale: SiteLocale) {
  const pageKey = guidePageKey(slug)
  const row = await siteRepository.findByKeyLocale(pageKey, locale)
  const merged = mergeSiteContentWithDefaults(pageKey, row?.content ?? defaultSiteContent(pageKey))
  return readTitle(merged) ?? readTitle(defaultSiteContent(pageKey))
}

async function isGuideVisibleForLocale(guidePublished: boolean, slug: string, locale: SiteLocale) {
  if (!guidePublished) return false
  const pageKey = guidePageKey(slug)
  const row = await siteRepository.findByKeyLocale(pageKey, locale)
  if (row?.published) return true
  if (locale !== 'IT') {
    const it = await siteRepository.findByKeyLocale(pageKey, 'IT')
    if (it?.published) return true
  }
  return !row && locale === 'IT'
}

export const siteGuideService = {
  async seedSiteGuides() {
    for (const guide of DEFAULT_SITE_GUIDES) {
      await siteGuideRepository.upsert({
        slug: guide.slug,
        category: guide.category,
        readingMeta: guide.readingMeta,
        sortOrder: guide.sortOrder,
        indexed: guide.indexed,
        featured: guide.featured,
        published: true,
      })
    }
  },

  async listAdminGuides() {
    const guides = await siteGuideRepository.listAll()
    const targetLocales = SITE_LOCALES.filter((locale) => locale !== 'IT')

    return Promise.all(
      guides.map(async (guide) => {
        const pageKey = guidePageKey(guide.slug)
        const localeRows = await siteRepository.listByPageKey(pageKey)
        const byLocale = new Map(localeRows.map((row) => [row.locale, row]))
        const locales = Object.fromEntries(
          SITE_LOCALES.map((locale) => [locale, localeStatus(locale, byLocale.get(locale))]),
        )
        const missingLocales = targetLocales.filter((locale) => locales[locale]?.status === 'missing')
        const title = (await readGuideTitle(guide.slug, 'IT')) ?? guide.slug

        return {
          slug: guide.slug,
          pageKey,
          title,
          category: guide.category,
          readingMeta: guide.readingMeta,
          sortOrder: guide.sortOrder,
          indexed: guide.indexed,
          featured: guide.featured,
          published: guide.published,
          missingLocales,
          missingCount: missingLocales.length,
          locales,
          updatedAt: guide.updatedAt.toISOString(),
        }
      }),
    )
  },

  async getAdminGuide(slug: string) {
    assertGuideSlug(slug)
    const guide = await siteGuideRepository.findBySlug(slug)
    if (!guide) {
      throw new AppError('SITE_GUIDE_NOT_FOUND', 'Guide not found', 'Guida non trovata.', 404, false)
    }

    const pageKey = guidePageKey(slug)
    const localeRows = await siteRepository.listByPageKey(pageKey)
    const byLocale = new Map(localeRows.map((row) => [row.locale, row]))
    const locales = await Promise.all(
      SITE_LOCALES.map(async (locale) => {
        const row = byLocale.get(locale)
        const content = mergeSiteContentWithDefaults(
          pageKey,
          row?.content ?? defaultSiteContent(pageKey),
        )
        return {
          locale,
          published: row?.published ?? true,
          updatedAt: row?.updatedAt.toISOString() ?? null,
          hasCustomContent: Boolean(row),
          title: readTitle(content),
          content,
        }
      }),
    )

    return {
      slug: guide.slug,
      pageKey,
      category: guide.category,
      readingMeta: guide.readingMeta,
      sortOrder: guide.sortOrder,
      indexed: guide.indexed,
      featured: guide.featured,
      published: guide.published,
      locales,
      updatedAt: guide.updatedAt.toISOString(),
    }
  },

  async updateAdminGuide(
    slug: string,
    data: {
      category?: string
      readingMeta?: string
      sortOrder?: number
      indexed?: boolean
      featured?: boolean
      published?: boolean
    },
  ) {
    assertGuideSlug(slug)
    const guide = await siteGuideRepository.findBySlug(slug)
    if (!guide) {
      throw new AppError('SITE_GUIDE_NOT_FOUND', 'Guide not found', 'Guida non trovata.', 404, false)
    }
    return siteGuideRepository.update(slug, data)
  },

  async listPublicGuides(localeInput: string, options?: { featuredOnly?: boolean }) {
    const locale = normalizeSiteLocale(localeInput)
    const guides = await siteGuideRepository.listAll()
    const items = []

    for (const guide of guides) {
      if (options?.featuredOnly && !guide.featured) continue
      if (!options?.featuredOnly && !guide.indexed) continue
      if (!(await isGuideVisibleForLocale(guide.published, guide.slug, locale))) continue

      const pageKey = guidePageKey(guide.slug)
      const page = await siteService.getPublicPage(pageKey, locale)
      const content = page.content as ContentPageContent
      const title = content.title?.trim()
      if (!title) continue

      items.push({
        slug: guide.slug,
        category: guide.category,
        meta: guide.readingMeta,
        title,
        href: `/guide/${guide.slug}`,
        featured: guide.featured,
        sortOrder: guide.sortOrder,
      })
    }

    return items
  },
}

export const guidePatchSchema = z.object({
  category: z.enum(['BASE', 'ATTACCHI', 'TECNICO', 'ACQUISTO', 'AMBIENTE', 'GLOSSARIO']).optional(),
  readingMeta: z.string().trim().max(40).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  indexed: z.boolean().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
})

export const guideSlugParamSchema = z.object({
  slug: z.string().min(1).max(120),
})

export type GuideCategoryValue = GuideCategory
