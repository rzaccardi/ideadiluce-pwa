import {
  fetchTopPurchasedSearchHints,
  odooSearchHintsAvailable,
  type OdooSearchHintCandidate,
} from '../../adapters/odoo/odooTopPurchasedSearchHints.js'
import { toAppError, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { logger } from '../../lib/logger.js'
import { AppError } from '../../types/errors.js'
import { SITE_LOCALES, type SiteLocale } from '../site/site.constants.js'
import { mergeSiteContentWithDefaults } from '../site/site-content.merge.js'
import { defaultSiteContent } from '../site/site-content.defaults.js'
import { siteRepository } from '../site/site.repository.js'
import { siteService } from '../site/site.service.js'
import type { HomePageContent } from '../site/site.types.js'
import {
  isSearchHintsAutoSyncEnabled,
  searchHintsOdooStaleMs,
} from './search-hints-odoo.config.js'
import {
  isSearchHintsOdooStale,
  parseSearchHintsOdooSyncedAt,
} from './search-hints-odoo.stale.js'

export type SearchHintsOdooPreviewDTO = {
  odooConfigured: boolean
  autoSyncEnabled: boolean
  staleHours: number
  lookbackDays: number
  limit: number
  currentHints: string[]
  lastOdooSyncedAt: string | null
  isStale: boolean
  suggestions: OdooSearchHintCandidate[]
}

export type SearchHintsOdooApplyDTO = {
  lookbackDays: number
  limit: number
  hints: string[]
  suggestions: OdooSearchHintCandidate[]
  updatedLocales: SiteLocale[]
  updatedAt: string
}

function asHomeContent(content: unknown): HomePageContent {
  const merged = mergeSiteContentWithDefaults('home', content ?? defaultSiteContent('home')) as HomePageContent
  const hints = Array.isArray(merged.search?.hints) ? merged.search.hints : []
  return {
    ...merged,
    search: {
      ...merged.search,
      hints,
    },
  }
}

async function getHomeContent(locale: SiteLocale): Promise<HomePageContent> {
  try {
    const row = await siteRepository.findByKeyLocale('home', locale)
    return asHomeContent(row?.content)
  } catch (error) {
    logger.warn('search_hints_odoo.home_content_fallback', {
      locale,
      err: error instanceof Error ? error.message : String(error),
    })
    return asHomeContent(null)
  }
}

async function getHomeItContent(): Promise<HomePageContent> {
  return getHomeContent('IT')
}

function wrapOdooError(e: unknown, correlationId: string): never {
  if (e instanceof AppError) throw e
  throw toAppError(e, correlationId)
}

export const searchHintsAdminService = {
  odooConfigured(): boolean {
    return odooSearchHintsAvailable()
  },

  async isOdooSyncStale(): Promise<boolean> {
    const home = await getHomeItContent()
    return isSearchHintsOdooStale(home)
  },

  async previewFromOdoo(
    ctx: OdooCallContext,
    input: { lookbackDays: number; limit: number },
  ): Promise<SearchHintsOdooPreviewDTO> {
    if (!odooSearchHintsAvailable()) {
      throw new AppError(
        'ODOO_NOT_CONFIGURED',
        'Odoo not configured',
        'Configura Odoo (ODOO_ENABLED e credenziali) per importare i prodotti più acquistati.',
        400,
        false,
      )
    }

    const home = await getHomeItContent()
    let suggestions: OdooSearchHintCandidate[]
    try {
      suggestions = await fetchTopPurchasedSearchHints(ctx, input)
    } catch (e) {
      wrapOdooError(e, ctx.correlationId)
    }
    const lastSyncedAt = parseSearchHintsOdooSyncedAt(home)

    return {
      odooConfigured: true,
      autoSyncEnabled: isSearchHintsAutoSyncEnabled(),
      staleHours: Math.round(searchHintsOdooStaleMs() / 3_600_000),
      lookbackDays: input.lookbackDays,
      limit: input.limit,
      currentHints: home.search.hints,
      lastOdooSyncedAt: lastSyncedAt?.toISOString() ?? null,
      isStale: isSearchHintsOdooStale(home),
      suggestions,
    }
  },

  async applyFromOdoo(
    ctx: OdooCallContext,
    input: { lookbackDays: number; limit: number },
  ): Promise<SearchHintsOdooApplyDTO> {
    const preview = await this.previewFromOdoo(ctx, input)
    const hints = preview.suggestions.map((item) => item.query)

    if (hints.length === 0) {
      throw new AppError(
        'SEARCH_HINTS_EMPTY',
        'No Odoo search hints',
        'Nessun prodotto venduto trovato nel periodo selezionato.',
        400,
        false,
      )
    }

    const home = await getHomeItContent()
    const syncedAt = new Date().toISOString()
    const nextContent: HomePageContent = {
      ...home,
      search: {
        ...home.search,
        hints,
        hintsOdooSyncedAt: syncedAt,
      },
    }

    const updatedLocales: SiteLocale[] = []
    let latestUpdatedAt = syncedAt

    for (const locale of SITE_LOCALES) {
      const localeHome = locale === 'IT' ? home : await getHomeContent(locale)
      const localeContent: HomePageContent = {
        ...localeHome,
        search: {
          ...localeHome.search,
          hints,
          hintsOdooSyncedAt: syncedAt,
        },
      }
      const row = await siteRepository.findByKeyLocale('home', locale)
      const saved = await siteService.saveAdminPage(
        'home',
        locale,
        locale === 'IT' ? nextContent : localeContent,
        row?.published ?? true,
      )
      updatedLocales.push(locale)
      if (saved.updatedAt) latestUpdatedAt = saved.updatedAt
    }

    return {
      lookbackDays: input.lookbackDays,
      limit: input.limit,
      hints,
      suggestions: preview.suggestions,
      updatedLocales,
      updatedAt: latestUpdatedAt,
    }
  },
}
