import { AppError } from '../../types/errors.js'
import { deeplConfig } from '../../lib/deepl/deepl.config.js'
import {
  normalizeSiteLocale,
  SITE_LOCALES,
  SITE_PAGE_LABELS,
  type SiteLocale,
} from './site.constants.js'
import { countTranslatableStrings, translateSiteContentTree } from './site-content-i18n.js'
import { mergeSiteContentWithDefaults } from './site-content.merge.js'
import { assertSitePageContent } from './site-content.validate.js'
import {
  defaultSiteContent,
  DEFAULT_AMBIENTI_IT,
  DEFAULT_HOME_IT,
  DEFAULT_SHELL_IT,
  SITE_PAGE_KEYS,
} from './site-content.defaults.js'
import { DEFAULT_PROFESSIONISTI_IT } from './site-professionisti.defaults.js'
import { siteRepository } from './site.repository.js'
import type {
  EditorialPageContent,
  HomePageContent,
  ProfessionistiPageContent,
  SitePageKey,
  SiteShellContent,
} from './site.types.js'

function assertPageKey(pageKey: string): SitePageKey {
  if (!SITE_PAGE_KEYS.includes(pageKey as SitePageKey)) {
    throw new AppError('SITE_PAGE_NOT_FOUND', 'Unknown site page', 'Pagina sito non trovata.', 404, false)
  }
  return pageKey as SitePageKey
}

function prepareContent(pageKey: SitePageKey, content: unknown) {
  assertSitePageContent(pageKey, content)
  return mergeSiteContentWithDefaults(pageKey, content)
}

function toAdminPageDto(
  pageKey: SitePageKey,
  locale: SiteLocale,
  row: {
    published: boolean
    content: unknown
    updatedAt: Date
  } | null,
) {
  const merged = mergeSiteContentWithDefaults(pageKey, row?.content ?? defaultSiteContent(pageKey))
  return {
    pageKey,
    locale,
    published: row?.published ?? true,
    content: merged,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
    hasCustomContent: Boolean(row),
  }
}

function assertDeepLReady() {
  if (!deeplConfig.enabled || !deeplConfig.apiKey) {
    throw new AppError(
      'DEEPL_NOT_CONFIGURED',
      'DeepL not configured',
      'DeepL non configurato — imposta DEEPL_ENABLED e DEEPL_API_KEY sul server.',
      503,
      false,
    )
  }
}

async function getAdminItSourceContent(pageKey: SitePageKey) {
  const row = await siteRepository.findByKeyLocale(pageKey, 'IT')
  return prepareContent(pageKey, row?.content ?? defaultSiteContent(pageKey))
}

function catalogLocaleStatus(
  _pageKey: SitePageKey,
  locale: SiteLocale,
  row: { published: boolean; updatedAt: Date } | undefined,
) {
  if (locale === 'IT') {
    return {
      exists: Boolean(row),
      published: row?.published ?? false,
      updatedAt: row?.updatedAt.toISOString() ?? null,
      status: row ? ('saved' as const) : ('default' as const),
    }
  }

  return {
    exists: Boolean(row),
    published: row?.published ?? false,
    updatedAt: row?.updatedAt.toISOString() ?? null,
    status: row ? ('saved' as const) : ('missing' as const),
  }
}
async function notifyStorefrontCmsRevalidation() {
  const baseUrl = process.env.STOREFRONT_URL ?? process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!baseUrl || !secret) return
  try {
    await fetch(
      `${baseUrl.replace(/\/$/, '')}/api/revalidate-site?secret=${encodeURIComponent(secret)}`,
      { method: 'POST' },
    )
  } catch {
    // Best-effort: la cache scade comunque entro il TTL configurato lato Next.
  }
}

export const siteService = {
  getI18nStatus() {
    return {
      locales: [...SITE_LOCALES],
      sourceLocale: 'IT' as const,
      deepl: {
        enabled: deeplConfig.enabled,
        configured: Boolean(deeplConfig.apiKey),
        ready: deeplConfig.enabled && Boolean(deeplConfig.apiKey),
        apiUrl: deeplConfig.apiUrl,
      },
    }
  },

  async getPublicPage(pageKey: string, locale: string) {
    const key = assertPageKey(pageKey)
    const loc = normalizeSiteLocale(locale)
    const row = await siteRepository.findByKeyLocale(key, loc)
    if (row?.published) {
      return {
        pageKey: key,
        locale: loc,
        content: mergeSiteContentWithDefaults(key, row.content),
        updatedAt: row.updatedAt.toISOString(),
      }
    }

    const fallback = await siteRepository.findByKeyLocale(key, 'IT')
    if (fallback?.published) {
      return {
        pageKey: key,
        locale: 'IT',
        content: mergeSiteContentWithDefaults(key, fallback.content),
        updatedAt: fallback.updatedAt.toISOString(),
      }
    }

    return {
      pageKey: key,
      locale: loc,
      content: defaultSiteContent(key),
      updatedAt: null,
    }
  },

  async listAdminPages() {
    const rows = await siteRepository.listAll()
    return rows.map((row) => ({
      id: row.id,
      pageKey: row.pageKey,
      locale: row.locale,
      published: row.published,
      updatedAt: row.updatedAt.toISOString(),
    }))
  },

  async listAdminCatalog() {
    const rows = await siteRepository.listAll()
    const byPage = new Map<string, Map<string, (typeof rows)[number]>>()

    for (const row of rows) {
      const locales = byPage.get(row.pageKey) ?? new Map()
      locales.set(row.locale, row)
      byPage.set(row.pageKey, locales)
    }

    const targetLocales = SITE_LOCALES.filter((locale) => locale !== 'IT')
    const pages = SITE_PAGE_KEYS.filter((pageKey) => !pageKey.startsWith('guide-') || pageKey === 'guide').map((pageKey) => {
      const localeRows = byPage.get(pageKey)
      const localeMap = Object.fromEntries(
        SITE_LOCALES.map((locale) => {
          const row = localeRows?.get(locale)
          return [locale, catalogLocaleStatus(pageKey, locale, row)]
        }),
      )
      const missingLocales = targetLocales.filter((locale) => localeMap[locale]?.status === 'missing')
      return {
        pageKey,
        label: SITE_PAGE_LABELS[pageKey],
        missingLocales,
        missingCount: missingLocales.length,
        locales: localeMap,
      }
    })

    const missingTranslations = pages.reduce((sum, page) => sum + page.missingCount, 0)
    const byLocale = Object.fromEntries(
      targetLocales.map((locale) => [
        locale,
        pages.filter((page) => page.missingLocales.includes(locale)).length,
      ]),
    )

    return {
      locales: [...SITE_LOCALES],
      targetLocales,
      summary: {
        totalPages: pages.length,
        missingTranslations,
        completePages: pages.filter((page) => page.missingCount === 0).length,
        byLocale,
      },
      pages,
    }
  },

  async getAdminPage(pageKey: string, locale: string) {
    const key = assertPageKey(pageKey)
    const loc = normalizeSiteLocale(locale)
    const row = await siteRepository.findByKeyLocale(key, loc)
    return toAdminPageDto(key, loc, row)
  },

  async saveAdminPage(pageKey: string, locale: string, content: unknown, published: boolean) {
    const key = assertPageKey(pageKey)
    const loc = normalizeSiteLocale(locale)
    const normalized = prepareContent(key, content)
    const row = await siteRepository.upsert(key, loc, normalized, published)
    void notifyStorefrontCmsRevalidation()
    return {
      ...toAdminPageDto(key, loc, row),
      translatableStringCount: countTranslatableStrings(normalized),
    }
  },

  async translateAdminPageToLocales(
    pageKey: string,
    content: unknown | undefined,
    sourceLocale = 'IT',
    options?: { onlyMissingLocales?: boolean },
  ) {
    const key = assertPageKey(pageKey)
    const source = normalizeSiteLocale(sourceLocale)
    if (source !== 'IT') {
      throw new AppError(
        'SITE_TRANSLATE_SOURCE',
        'Only IT source supported',
        'La traduzione automatica parte solo dalla versione italiana.',
        400,
        false,
      )
    }
    assertDeepLReady()

    const normalized =
      content !== undefined ? prepareContent(key, content) : await getAdminItSourceContent(key)
    const translatableStringCount = countTranslatableStrings(normalized)
    const targetLocales = SITE_LOCALES.filter((loc) => loc !== source)
    const saved: Array<{
      locale: string
      updatedAt: string
      published: boolean
      translatableStringCount: number
      skipped?: boolean
    }> = []

    for (const targetLocale of targetLocales) {
      const existing = await siteRepository.findByKeyLocale(key, targetLocale)
      if (options?.onlyMissingLocales && existing) {
        saved.push({
          locale: targetLocale,
          published: existing.published,
          updatedAt: existing.updatedAt.toISOString(),
          translatableStringCount: countTranslatableStrings(
            prepareContent(key, existing.content),
          ),
          skipped: true,
        })
        continue
      }

      const translated = await translateSiteContentTree(normalized, targetLocale, source)
      const prepared = prepareContent(key, translated)
      const published = existing?.published ?? true
      const row = await siteRepository.upsert(key, targetLocale, prepared, published)
      saved.push({
        locale: row.locale,
        published: row.published,
        updatedAt: row.updatedAt.toISOString(),
        translatableStringCount: countTranslatableStrings(prepared),
      })
    }

    return {
      pageKey: key,
      sourceLocale: source,
      translatableStringCount,
      onlyMissingLocales: options?.onlyMissingLocales ?? false,
      targetLocales: saved.filter((row) => !row.skipped).map((row) => row.locale),
      skippedLocales: saved.filter((row) => row.skipped).map((row) => row.locale),
      locales: saved,
    }
  },

  async translateAllMissingPages(pageKeys?: string[], targetLocales?: string[]) {
    assertDeepLReady()

    const keys = (pageKeys?.length ? pageKeys : [...SITE_PAGE_KEYS]).map((pageKey) =>
      assertPageKey(pageKey),
    )
    const targets = (targetLocales?.length ? targetLocales : SITE_LOCALES.filter((loc) => loc !== 'IT'))
      .map((locale) => normalizeSiteLocale(locale))
      .filter((locale) => locale !== 'IT')

    const results: Array<{ pageKey: SitePageKey; locale: SiteLocale; status: 'created' | 'skipped' }> = []

    for (const pageKey of keys) {
      const itContent = await getAdminItSourceContent(pageKey)
      for (const targetLocale of targets) {
        const existing = await siteRepository.findByKeyLocale(pageKey, targetLocale)
        if (existing) {
          results.push({ pageKey, locale: targetLocale, status: 'skipped' })
          continue
        }

        const translated = await translateSiteContentTree(itContent, targetLocale, 'IT')
        const prepared = prepareContent(pageKey, translated)
        await siteRepository.upsert(pageKey, targetLocale, prepared, true)
        results.push({ pageKey, locale: targetLocale, status: 'created' })
      }
    }

    const created = results.filter((row) => row.status === 'created')
    const skipped = results.filter((row) => row.status === 'skipped')

    return {
      pageKeys: keys,
      targetLocales: targets,
      translatedCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    }
  },

  async saveAdminPageAndTranslate(pageKey: string, content: unknown, published: boolean) {
    const savedIt = await this.saveAdminPage(pageKey, 'IT', content, published)
    const translated = await this.translateAdminPageToLocales(pageKey, content, 'IT')
    return {
      ...savedIt,
      translated,
    }
  },
}

export async function seedSitePages() {
  for (const pageKey of SITE_PAGE_KEYS) {
    const existing = await siteRepository.findByKeyLocale(pageKey, 'IT')
    if (existing) continue
    await siteRepository.upsert(pageKey, 'IT', defaultSiteContent(pageKey), true)
  }

  await patchShellAttaccoMenu()
  await patchShellNavCategoryLinks()
  await patchShellMegaMenuColumns()
  await patchShellNavEditorialLinks()
  await patchShellItSource()
  await patchHomeHeroCategoryLinks()
  await patchAmbientiPageLinks()
  await patchLegacyCatalogPaths()
  await patchProfessionistiPageContent()

  const { siteGuideService } = await import('../site-guides/site-guides.service.js')
  await siteGuideService.seedSiteGuides()
  const { seedLegacyEditorialGuides } = await import('../site-guides/seed-legacy-editorial-guides.js')
  await seedLegacyEditorialGuides()
  const { seedLegacyWordpressSeoRedirects } = await import('./seed-legacy-wordpress-seo.js')
  await seedLegacyWordpressSeoRedirects()
}

/** Hero home: catalogo generico → landing categoria prodotto. */
async function patchHomeHeroCategoryLinks() {
  for (const locale of SITE_LOCALES) {
    const row = await siteRepository.findByKeyLocale('home', locale)
    if (!row?.published) continue

    const content = row.content as HomePageContent
    const designHref = content.hero?.design?.ctaHref
    const technicalHref = content.hero?.technical?.ctaHref
    const nextDesign = DEFAULT_HOME_IT.hero.design.ctaHref
    const nextTechnical = DEFAULT_HOME_IT.hero.technical.ctaHref

    if (designHref === nextDesign && technicalHref === nextTechnical) continue

    const legacyDesign = designHref === '/catalog?world=design' || designHref === '/catalog'
    const legacyTechnical = technicalHref === '/catalog?world=technical' || technicalHref === '/catalog'
    if (!legacyDesign && !legacyTechnical) continue

    if (legacyDesign) content.hero.design.ctaHref = nextDesign
    if (legacyTechnical) content.hero.technical.ctaHref = nextTechnical
    await siteRepository.upsert('home', locale, content, row.published)
  }
}

/** Allinea il contenuto IT della shell ai default aggiornati (nav, mega-menu, footer). */
async function patchShellItSource() {
  const row = await siteRepository.findByKeyLocale('shell', 'IT')
  if (!row?.published) return

  const fresh = structuredClone(DEFAULT_SHELL_IT)
  const currentJson = JSON.stringify(row.content)
  const freshJson = JSON.stringify(fresh)
  if (currentJson === freshJson) return

  await siteRepository.upsert('shell', 'IT', fresh, row.published)
}

/** Mega-menu e href dropdown → landing categoria prodotto. */
async function patchShellNavCategoryLinks() {
  const dropdownIds = ['arredo', 'tecnico', 'attacco'] as const

  for (const locale of SITE_LOCALES) {
    const row = await siteRepository.findByKeyLocale('shell', locale)
    if (!row?.published) continue

    const content = row.content as SiteShellContent
    let changed = false

    for (const id of dropdownIds) {
      const item = content.nav.items.find((navItem) => navItem.kind === 'dropdown' && navItem.id === id)
      const fresh = DEFAULT_SHELL_IT.nav.items.find((navItem) => navItem.kind === 'dropdown' && navItem.id === id)
      if (item?.kind !== 'dropdown' || fresh?.kind !== 'dropdown') continue

      if (fresh.href && item.href !== fresh.href) {
        item.href = fresh.href
        changed = true
      }

      const panelJson = JSON.stringify(item.panel)
      const needsPanelRefresh =
        (id === 'arredo' && !panelJson.includes('/categoria-prodotto/illuminazione-arredo')) ||
        (id === 'tecnico' && !panelJson.includes('/categoria-prodotto/illuminazione-tecnica')) ||
        (id === 'attacco' &&
          panelJson.includes('Catalogo tecnico') &&
          panelJson.includes('/catalog?world=technical'))

      if (needsPanelRefresh) {
        if (locale === 'IT') {
          item.panel = fresh.panel
          changed = true
        } else {
          for (const freshColumn of fresh.panel.columns) {
            const currentColumn = item.panel.columns.find((col) => col.title === freshColumn.title)
            if (!currentColumn) continue
            for (const freshLink of freshColumn.links) {
              const currentLink = currentColumn.links.find((link) => link.label === freshLink.label)
              if (currentLink && currentLink.href !== freshLink.href) {
                currentLink.href = freshLink.href
                changed = true
              }
            }
          }
        }
      }
    }

    if (changed) {
      await siteRepository.upsert('shell', locale, content, row.published)
    }
  }
}

/** Riduce i mega-menu Arredo/Tecnico a 4 colonne (layout header). */
async function patchShellMegaMenuColumns() {
  const menuIds = ['arredo', 'tecnico'] as const

  for (const locale of SITE_LOCALES) {
    const row = await siteRepository.findByKeyLocale('shell', locale)
    if (!row?.published) continue

    const content = row.content as SiteShellContent
    let changed = false

    for (const id of menuIds) {
      const item = content.nav.items.find((navItem) => navItem.kind === 'dropdown' && navItem.id === id)
      const fresh = DEFAULT_SHELL_IT.nav.items.find((navItem) => navItem.kind === 'dropdown' && navItem.id === id)
      if (item?.kind !== 'dropdown' || fresh?.kind !== 'dropdown') continue

      const staleTitles = ['SCOPRI']
      const beforeCount = item.panel.columns.length
      item.panel.columns = item.panel.columns.filter((col) => !staleTitles.includes(col.title))
      if (item.panel.columns.length !== beforeCount) {
        changed = true
      }

      if (locale === 'IT') {
        const freshJson = JSON.stringify(fresh.panel)
        const currentJson = JSON.stringify(item.panel)
        const needsPanelRefresh =
          currentJson !== freshJson &&
          (id === 'arredo'
            ? !currentJson.includes('q=sospensione') || !currentJson.includes('IN EVIDENZA')
            : !currentJson.includes('GUIDE TECNICHE') || !currentJson.includes('q=striscia+led'))

        if (needsPanelRefresh) {
          item.panel = structuredClone(fresh.panel)
          changed = true
        }
        continue
      }

      for (let columnIndex = 0; columnIndex < fresh.panel.columns.length; columnIndex += 1) {
        const freshColumn = fresh.panel.columns[columnIndex]
        const currentColumn = item.panel.columns[columnIndex]
        if (!freshColumn || !currentColumn) continue

        for (let linkIndex = 0; linkIndex < freshColumn.links.length; linkIndex += 1) {
          const freshLink = freshColumn.links[linkIndex]
          const currentLink = currentColumn.links[linkIndex]
          if (!freshLink || !currentLink) continue
          if (currentLink.href !== freshLink.href) {
            currentLink.href = freshLink.href
            changed = true
          }
        }
      }
    }

    if (changed) {
      await siteRepository.upsert('shell', locale, content, row.published)
    }
  }
}

/** Aggiorna mega-menu attacco se vuoto (installazioni precedenti alla patch). */
async function patchShellAttaccoMenu() {
  const row = await siteRepository.findByKeyLocale('shell', 'IT')
  if (!row?.published) return
  const content = row.content as SiteShellContent
  const attacco = content.nav.items.find((item) => item.kind === 'dropdown' && item.id === 'attacco')
  if (attacco?.kind !== 'dropdown' || attacco.panel.columns.length > 0) return
  const fresh = DEFAULT_SHELL_IT.nav.items.find((item) => item.kind === 'dropdown' && item.id === 'attacco')
  if (fresh?.kind !== 'dropdown') return
  attacco.panel = fresh.panel
  await siteRepository.upsert('shell', 'IT', content, row.published)
}

/** Link top-level nav (Ambienti, Brand, Guide) e footer utilità. */
async function patchShellNavEditorialLinks() {
  const linkIds = ['ambienti', 'brand', 'guide'] as const

  for (const locale of SITE_LOCALES) {
    const row = await siteRepository.findByKeyLocale('shell', locale)
    if (!row?.published) continue

    const content = row.content as SiteShellContent
    let changed = false

    for (const id of linkIds) {
      const item = content.nav.items.find((navItem) => navItem.kind === 'link' && navItem.id === id)
      const fresh = DEFAULT_SHELL_IT.nav.items.find((navItem) => navItem.kind === 'link' && navItem.id === id)
      if (item?.kind !== 'link' || fresh?.kind !== 'link') continue
      if (item.href !== fresh.href || item.label !== fresh.label) {
        item.href = fresh.href
        item.label = fresh.label
        changed = true
      }
    }

    const utilityFresh = DEFAULT_SHELL_IT.utilityBar.links
    const utilityLinks = content.utilityBar.links
    for (let i = 0; i < utilityFresh.length; i += 1) {
      const next = utilityFresh[i]
      const current = utilityLinks[i]
      if (!current || current.href !== next.href || current.label !== next.label) {
        utilityLinks[i] = { ...next }
        changed = true
      }
    }

    const utilitaCol = content.footer.columns.find((col) => col.title === 'Utilità')
    const utilitaFresh = DEFAULT_SHELL_IT.footer.columns.find((col) => col.title === 'Utilità')
    if (utilitaCol && utilitaFresh) {
      const freshJson = JSON.stringify(utilitaFresh.links)
      const currentJson = JSON.stringify(utilitaCol.links)
      if (freshJson !== currentJson) {
        utilitaCol.links = utilitaFresh.links.map((link) => ({ ...link }))
        changed = true
      }
    }

    const panelJson = JSON.stringify(content.nav.items)
    if (
      panelJson.includes('"PER ATTACCO"') &&
      panelJson.includes('"/attacco"') &&
      !panelJson.includes('"/attacco/e27"')
    ) {
      for (const id of ['tecnico'] as const) {
        const item = content.nav.items.find((navItem) => navItem.kind === 'dropdown' && navItem.id === id)
        const fresh = DEFAULT_SHELL_IT.nav.items.find((navItem) => navItem.kind === 'dropdown' && navItem.id === id)
        if (item?.kind === 'dropdown' && fresh?.kind === 'dropdown') {
          item.panel = fresh.panel
          changed = true
        }
      }
    }

    if (changed) {
      await siteRepository.upsert('shell', locale, content, row.published)
    }
  }
}

function isProfessionistiPageContent(content: unknown): content is ProfessionistiPageContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'registration' in content &&
    'quickReorder' in content &&
    'features' in content
  )
}

/** Migra contenuto legacy (blocks) → ProfessionistiPageContent completo. */
async function patchProfessionistiPageContent() {
  for (const locale of SITE_LOCALES) {
    const row = await siteRepository.findByKeyLocale('professionisti', locale)
    if (!row?.published) continue
    if (isProfessionistiPageContent(row.content)) continue

    await siteRepository.upsert(
      'professionisti',
      locale,
      DEFAULT_PROFESSIONISTI_IT,
      row.published,
    )
  }
}

/** Migra href legacy (/catalog, /catalogo) → /negozio in tutti i contenuti CMS pubblicati. */
function migrateCatalogPathsInTree(value: unknown): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    if (value.includes('/api/v1/catalog')) {
      return { value, changed: false }
    }
    if (!value.includes('/catalog') && !value.includes('/catalogo')) {
      return { value, changed: false }
    }
    const next = value
      .replaceAll('/catalog?', '/negozio?')
      .replaceAll('/catalogo?', '/negozio?')
      .replace(/\/catalog(?!o)(?=$|[?#'"`])/g, '/negozio')
      .replace(/\/catalogo(?=$|[?#'"`])/g, '/negozio')
    return { value: next, changed: next !== value }
  }
  if (Array.isArray(value)) {
    let changed = false
    const next = value.map((item) => {
      const migrated = migrateCatalogPathsInTree(item)
      if (migrated.changed) changed = true
      return migrated.value
    })
    return { value: next, changed }
  }
  if (value && typeof value === 'object') {
    let changed = false
    const next: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const migrated = migrateCatalogPathsInTree(item)
      if (migrated.changed) changed = true
      next[key] = migrated.value
    }
    return { value: next, changed }
  }
  return { value, changed: false }
}

async function patchLegacyCatalogPaths() {
  for (const pageKey of SITE_PAGE_KEYS) {
    for (const locale of SITE_LOCALES) {
      const row = await siteRepository.findByKeyLocale(pageKey, locale)
      if (!row?.published) continue
      const json = JSON.stringify(row.content)
      if (!/\/catalog(?!o)/.test(json)) continue
      const migrated = migrateCatalogPathsInTree(row.content)
      if (!migrated.changed) continue
      await siteRepository.upsert(pageKey, locale, migrated.value, row.published)
    }
  }
}

/** Tile ambienti CMS → route /ambienti/[room]. */
async function patchAmbientiPageLinks() {
  for (const locale of SITE_LOCALES) {
    const row = await siteRepository.findByKeyLocale('ambienti', locale)
    if (!row?.published) continue

    const content = row.content as EditorialPageContent
    const panelJson = JSON.stringify(content.items ?? [])
    if (!panelJson.includes('/catalog?world=design&category=')) continue

    content.items = DEFAULT_AMBIENTI_IT.items.map((item) => ({ ...item }))
    await siteRepository.upsert('ambienti', locale, content, row.published)
  }
}
