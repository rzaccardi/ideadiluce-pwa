import { z } from 'zod'
import { AppError } from '../../types/errors.js'
import { mergeSiteContentWithDefaults } from '../site/site-content.merge.js'
import { blankGuideArticleContent, defaultSiteContent } from '../site/site-content.defaults.js'
import { siteRepository } from '../site/site.repository.js'
import { siteService } from '../site/site.service.js'
import { SITE_LOCALES, normalizeSiteLocale, type SiteLocale } from '../site/site.constants.js'
import type { ContentPageContent } from '../site/site.types.js'
import {
  DEFAULT_SITE_GUIDES,
  GUIDE_CATEGORIES,
  GUIDE_SLUG_PATTERN,
  guidePageKey,
  isValidGuideSlug,
  slugifyGuideTitle,
  type GuideCategory,
} from './site-guides.constants.js'
import { siteGuideRepository } from './site-guides.repository.js'
import { refreshSeoCaches } from '../seo/seo-cache.service.js'

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

async function mapGuideToAdminListItem(guide: {
  slug: string
  category: string
  readingMeta: string
  sortOrder: number
  indexed: boolean
  featured: boolean
  published: boolean
  updatedAt: Date
}) {
  const pageKey = guidePageKey(guide.slug)
  const localeRows = await siteRepository.listByPageKey(pageKey)
  const byLocale = new Map(localeRows.map((row) => [row.locale, row]))
  const targetLocales = SITE_LOCALES.filter((locale) => locale !== 'IT')
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

  /** Garantisce che le guide di default esistano in DB (idempotente). */
  async ensureSiteGuidesSeeded() {
    await this.seedSiteGuides()
  },

  async listAdminGuides() {
    await this.ensureSiteGuidesSeeded()
    const guides = await siteGuideRepository.listAll()
    return Promise.all(guides.map((guide) => mapGuideToAdminListItem(guide)))
  },

  async listAdminGuidesPage(page = 1, pageSize = 25) {
    await this.ensureSiteGuidesSeeded()
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 25
    const [guides, total] = await Promise.all([
      siteGuideRepository.listPaginated(safePage, safeSize),
      siteGuideRepository.count(),
    ])
    const items = await Promise.all(guides.map((guide) => mapGuideToAdminListItem(guide)))
    const totalPages = Math.max(1, Math.ceil(total / safeSize))
    return {
      items,
      page: safePage,
      pageSize: safeSize,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    }
  },

  async getAdminGuide(slug: string) {
    await this.ensureSiteGuidesSeeded()
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
    const guide = await siteGuideRepository.findBySlug(slug)
    if (!guide) {
      throw new AppError('SITE_GUIDE_NOT_FOUND', 'Guide not found', 'Guida non trovata.', 404, false)
    }
    const updated = await siteGuideRepository.update(slug, data)
    if (data.indexed !== undefined || data.published !== undefined) {
      void refreshSeoCaches().catch(() => undefined)
    }
    return updated
  },

  async createAdminGuide(input: {
    title: string
    slug?: string
    category: GuideCategory
    readingMeta?: string
  }) {
    const title = input.title.trim()
    if (!title) {
      throw new AppError(
        'SITE_GUIDE_TITLE_REQUIRED',
        'Inserisci il titolo della guida.',
        'Inserisci il titolo della guida.',
        400,
        false,
      )
    }

    const slug = (input.slug?.trim() || slugifyGuideTitle(title)).toLowerCase()
    if (!isValidGuideSlug(slug)) {
      throw new AppError(
        'SITE_GUIDE_SLUG_INVALID',
        'Lo slug può contenere solo lettere minuscole, numeri e trattini.',
        'Lo slug può contenere solo lettere minuscole, numeri e trattini.',
        400,
        false,
      )
    }

    const existing = await siteGuideRepository.findBySlug(slug)
    if (existing) {
      throw new AppError(
        'SITE_GUIDE_SLUG_TAKEN',
        'Esiste già una guida con questo slug.',
        'Esiste già una guida con questo slug.',
        409,
        false,
      )
    }

    const maxOrder = await siteGuideRepository.maxSortOrder()
    await siteGuideRepository.create({
      slug,
      category: input.category,
      readingMeta: input.readingMeta?.trim() ?? '',
      sortOrder: maxOrder + 10,
      indexed: true,
      featured: false,
      published: false,
    })

    const pageKey = guidePageKey(slug)
    await siteRepository.upsert(pageKey, 'IT', blankGuideArticleContent(title), false)
    void refreshSeoCaches().catch(() => undefined)
    return this.getAdminGuide(slug)
  },

  async listPublicGuides(localeInput: string, options?: { featuredOnly?: boolean }) {
    await this.ensureSiteGuidesSeeded()
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

      const imageUrl = content.coverImage?.imageUrl?.trim() || undefined

      items.push({
        slug: guide.slug,
        category: guide.category,
        meta: guide.readingMeta,
        title,
        href: `/guide/${guide.slug}`,
        imageUrl,
        featured: guide.featured,
        sortOrder: guide.sortOrder,
      })
    }

    return items
  },
}

export const guideCreateSchema = z.object({
  title: z.string().trim().min(1, 'Inserisci il titolo della guida.').max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .refine((value) => value === '' || GUIDE_SLUG_PATTERN.test(value), {
      message: 'Lo slug può contenere solo lettere minuscole, numeri e trattini.',
    })
    .optional(),
  category: z.enum(GUIDE_CATEGORIES),
  readingMeta: z.string().trim().max(40).optional(),
})

export const guidePatchSchema = z.object({
  category: z.enum(GUIDE_CATEGORIES).optional(),
  readingMeta: z.string().trim().max(40).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  indexed: z.boolean().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
})

export const guideSlugParamSchema = z.object({
  slug: z.string().min(1).max(120).regex(GUIDE_SLUG_PATTERN),
})

export type GuideCategoryValue = GuideCategory
