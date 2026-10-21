/**
 * Indice catalogo locale da API v2 (`/api/v2/products` + `/api/v2/product/{id}`).
 * Cache 12h su disco + memoria; refresh alle 03:00 e 15:00 Europe/Rome.
 * Sync paginato con checkpoint su disco: in caso di blocco riprende da pagina/dettaglio.
 * Serve typeahead (global search), lista, categorie/brand e **dettaglio PDP** senza chiamate live.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  fetchOdooCatalogProductDetail,
  fetchOdooCatalogProductList,
  isOdooCatalogConfigured,
  OdooCatalogClientError,
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { toOdooCatalogLang } from '../../adapters/odoo-catalog/odooCatalogLocale.js'
import {
  mapOdooCatalogListItem,
  resolveOdooCatalogCardImageUrls,
} from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import type {
  OdooCatalogProductDetail,
  OdooCatalogProductDetailResponse,
  OdooCatalogSpec,
  OdooCatalogWebsiteRef,
} from '../../adapters/odoo-catalog/odooCatalog.types.js'
import { env } from '../../config/env.js'
import { HUB_LOCALES, type HubLocale } from '../../lib/hub-locale.js'
import { logger } from '../../lib/logger.js'
import { buildTechnicalCardSpecTagsFromSpecs } from '../../lib/technical-card-spec-tags.js'
import type { CategoryDTO, ProductCardDTO, ProductListDTO } from '../../types/dto.js'
import {
  hasActiveSpecFilters,
  productMatchesSpecFilter,
  sanitizeAttaccoParam,
  sanitizeColorTempParam,
  type CatalogSpecFilters,
} from './catalog-spec-filter.js'
import {
  inferCatalogWorldsFromCategorySlugs,
  mergeCatalogBrandWorlds,
  type CatalogBrandWorld,
} from './odoo-catalog-slug.js'
import {
  appendSyncDetails,
  appendSyncEntries,
  appendSyncHistory,
  catalogIndexCacheDir,
  clearSyncCheckpoint,
  createSyncMeta,
  isCheckpointResumable,
  listResumableCheckpoints,
  loadSyncDetails,
  loadSyncEntries,
  markRunningHistoryInterrupted,
  missingDetailIds,
  nextDetailBatch,
  readSyncHistory,
  readSyncMeta,
  upsertHistoryLocale,
  writeSyncMeta,
  type CatalogIndexSyncHistoryEntry,
  type CatalogIndexSyncProgressDTO,
} from './odoo-catalog-index-checkpoint.js'
import {
  CatalogIndexThrottle,
  clampInt,
  computeBackoffMs,
} from './odoo-catalog-index-throttle.js'

export type OdooCatalogIndexEntry = ProductCardDTO & {
  odooTemplateId: number
  searchText: string
  categorySlugs: string[]
  brandSlug: string | null
  /** Specs tipizzate dal dettaglio v2: fonte filtri attacco/Kelvin. */
  specs?: OdooCatalogSpec[]
}

export type BrandListItemDTO = {
  slug: string
  name: string
  productCount?: number
  /** Aree in cui il brand ha prodotti (da categorie Odoo). */
  worlds?: CatalogBrandWorld[]
  /** Logo light (gestito dal BO / Spaces). */
  logoLightUrl?: string | null
  /** Logo dark (gestito dal BO / Spaces). */
  logoDarkUrl?: string | null
}

type IndexBucket = {
  syncedAt: number
  entries: OdooCatalogIndexEntry[]
  categories: CategoryDTO[]
  brands: BrandListItemDTO[]
  /** Dettagli grezzi API v2 per PDP. */
  detailsById: Record<string, OdooCatalogProductDetail>
  slugToId: Record<string, number>
}

type DiskIndexPayload = {
  syncedAt: number
  entries: OdooCatalogIndexEntry[]
  categories: CategoryDTO[]
  brands: BrandListItemDTO[]
  slugToId: Record<string, number>
}

type DiskDetailsPayload = {
  syncedAt: number
  detailsById: Record<string, OdooCatalogProductDetail>
}

/** Soft TTL: metadati "stale"; la cache resta servita fino al prossimo refresh schedulato. */
export const CATALOG_INDEX_TTL_MS = 12 * 60 * 60 * 1000
/** Ore Europe/Rome in cui lo scheduler riallinea l'indice da Odoo (ogni 12h). */
export const CATALOG_INDEX_REFRESH_HOURS_ROME = [3, 15] as const
export const CATALOG_INDEX_REFRESH_TZ = 'Europe/Rome'
/** Safety cap pagine lista (total_pages Odoo resta la fonte di verità sotto questo tetto). */
const MAX_LIST_PAGES = 500
export const CATALOG_INDEX_LIST_PER_PAGE = clampInt(env.CATALOG_INDEX_LIST_PER_PAGE, 1, 100)
/** Dettagli per pagina di lavoro: checkpoint dopo ogni batch. */
export const CATALOG_INDEX_DETAIL_BATCH_SIZE = clampInt(env.CATALOG_INDEX_DETAIL_BATCH_SIZE, 1, 50)
/** Max chiamate dettaglio in volo (default 1; auto-throttle può restare a 1 dopo 429). */
export const CATALOG_INDEX_DETAIL_CONCURRENCY = clampInt(env.CATALOG_INDEX_DETAIL_CONCURRENCY, 1, 8)
/** Pausa base tra pagine lista e tra batch dettagli (auto-throttle può aumentarla). */
export const CATALOG_INDEX_PAGE_DELAY_MS = clampInt(env.CATALOG_INDEX_PAGE_DELAY_MS, 0, 60_000)
const CATALOG_INDEX_MAX_DELAY_MS = clampInt(env.CATALOG_INDEX_MAX_DELAY_MS, 1_000, 120_000)
const CATALOG_INDEX_MAX_DETAIL_ATTEMPTS = clampInt(env.CATALOG_INDEX_MAX_DETAIL_ATTEMPTS, 1, 12)
const DISK_CACHE_DIR = catalogIndexCacheDir()

function createIndexThrottle(): CatalogIndexThrottle {
  return new CatalogIndexThrottle({
    initialConcurrency: CATALOG_INDEX_DETAIL_CONCURRENCY,
    minConcurrency: 1,
    maxConcurrency: CATALOG_INDEX_DETAIL_CONCURRENCY,
    initialDelayMs: CATALOG_INDEX_PAGE_DELAY_MS,
    minDelayMs: Math.min(CATALOG_INDEX_PAGE_DELAY_MS, 250),
    maxDelayMs: CATALOG_INDEX_MAX_DELAY_MS,
  })
}

function isRateLimitedError(err: unknown): err is OdooCatalogClientError {
  return err instanceof OdooCatalogClientError && err.httpStatus === 429
}

function isRetriableCatalogError(err: unknown): boolean {
  if (!(err instanceof OdooCatalogClientError)) return true
  return err.httpStatus === 429 || err.httpStatus === 408 || err.httpStatus >= 500
}

function isPermanentCatalogMiss(err: unknown): boolean {
  return err instanceof OdooCatalogClientError && (err.httpStatus === 404 || err.httpStatus === 400)
}

const indexByLocale = new Map<HubLocale, IndexBucket>()
const inflight = new Map<HubLocale, Promise<IndexBucket>>()
let hydratePromise: Promise<void> | null = null

function diskIndexPath(locale: HubLocale): string {
  return path.join(DISK_CACHE_DIR, `index-${locale}.json`)
}

function diskDetailsPath(locale: HubLocale): string {
  return path.join(DISK_CACHE_DIR, `details-${locale}.json`)
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveProductSpecs(detail: OdooCatalogProductDetail | undefined): OdooCatalogSpec[] {
  if (!detail) return []
  if (detail.specs?.length) return detail.specs
  const fromVariant = detail.variants?.find((v) => v.specs?.length)?.specs
  return fromVariant ?? []
}

function buildSearchText(item: {
  title: string
  slug: string
  short_description?: string
  ced?: string | null
  manufacturer_code?: string | null
  sku?: string | null
  brand?: { name?: string } | null
  categories?: Array<{ name?: string; slug?: string }> | null
}): string {
  const categoryBits = (item.categories ?? [])
    .flatMap((c) => [c.name ?? '', c.slug ?? ''])
    .join(' ')
  return normalizeSearch(
    [
      item.title,
      item.slug,
      item.short_description ?? '',
      item.ced ?? '',
      item.manufacturer_code ?? '',
      item.sku ?? '',
      item.brand?.name ?? '',
      categoryBits,
    ].join(' '),
  )
}

function websiteRef(): OdooCatalogWebsiteRef {
  return { id: env.ODOO_WEBSITE_ID, name: 'PWA' }
}

function toDetailResponse(locale: HubLocale, product: OdooCatalogProductDetail): OdooCatalogProductDetailResponse {
  return {
    website: websiteRef(),
    lang: toOdooCatalogLang(locale),
    product,
  }
}

async function persistBucket(locale: HubLocale, bucket: IndexBucket): Promise<void> {
  try {
    await mkdir(DISK_CACHE_DIR, { recursive: true })
    const indexPayload: DiskIndexPayload = {
      syncedAt: bucket.syncedAt,
      entries: bucket.entries,
      categories: bucket.categories,
      brands: bucket.brands,
      slugToId: bucket.slugToId,
    }
    const detailsPayload: DiskDetailsPayload = {
      syncedAt: bucket.syncedAt,
      detailsById: bucket.detailsById,
    }
    await Promise.all([
      writeFile(diskIndexPath(locale), JSON.stringify(indexPayload), 'utf8'),
      writeFile(diskDetailsPath(locale), JSON.stringify(detailsPayload), 'utf8'),
    ])
  } catch (err) {
    logger.warn('catalog_index.disk_write_failed', { locale, err: String(err) })
  }
}

async function readDiskBucket(locale: HubLocale): Promise<IndexBucket | null> {
  try {
    const [indexRaw, detailsRaw] = await Promise.all([
      readFile(diskIndexPath(locale), 'utf8'),
      readFile(diskDetailsPath(locale), 'utf8').catch(() => null),
    ])
    const parsed = JSON.parse(indexRaw) as DiskIndexPayload
    if (!Array.isArray(parsed.entries) || typeof parsed.syncedAt !== 'number') return null

    let detailsById: Record<string, OdooCatalogProductDetail> = {}
    if (detailsRaw) {
      try {
        const details = JSON.parse(detailsRaw) as DiskDetailsPayload
        if (details?.detailsById && typeof details.detailsById === 'object') {
          detailsById = details.detailsById
        }
      } catch {
        /* details assenti/corrotti */
      }
    }

    const slugToId =
      parsed.slugToId && typeof parsed.slugToId === 'object'
        ? parsed.slugToId
        : Object.fromEntries(
            parsed.entries
              .filter((e) => e.slug && e.odooTemplateId)
              .map((e) => [e.slug, e.odooTemplateId]),
          )

    return {
      syncedAt: parsed.syncedAt,
      entries: parsed.entries,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      brands: Array.isArray(parsed.brands) ? parsed.brands : [],
      detailsById,
      slugToId,
    }
  } catch {
    return null
  }
}

function deriveTaxonomyFromEntries(entries: OdooCatalogIndexEntry[]): {
  categories: CategoryDTO[]
  brands: BrandListItemDTO[]
} {
  const categories = new Map<string, CategoryDTO>()
  const brands = new Map<string, BrandListItemDTO>()

  for (const entry of entries) {
    for (const slug of entry.categorySlugs) {
      if (!slug || categories.has(slug)) continue
      categories.set(slug, {
        id: slug,
        slug,
        name: slug,
        parentId: null,
      })
    }
    if (entry.categorySlug && !categories.has(entry.categorySlug)) {
      categories.set(entry.categorySlug, {
        id: entry.categorySlug,
        slug: entry.categorySlug,
        name: entry.categorySlug,
        parentId: null,
      })
    }
    const brandSlug = entry.brandSlug ?? entry.brand?.slug
    if (brandSlug && entry.brand?.name) {
      const entryWorlds = inferCatalogWorldsFromCategorySlugs([
        entry.categorySlug,
        ...entry.categorySlugs,
      ])
      const existing = brands.get(brandSlug)
      if (existing) {
        existing.productCount = (existing.productCount ?? 0) + 1
        existing.worlds = mergeCatalogBrandWorlds(existing.worlds, entryWorlds)
      } else {
        brands.set(brandSlug, {
          slug: brandSlug,
          name: entry.brand.name,
          productCount: 1,
          worlds: entryWorlds,
        })
      }
    }
  }

  return {
    categories: [...categories.values()].sort((a, b) => a.name.localeCompare(b.name, 'it')),
    brands: [...brands.values()].sort((a, b) => a.name.localeCompare(b.name, 'it')),
  }
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mapListItem(raw: Parameters<typeof mapOdooCatalogListItem>[0], locale: HubLocale): OdooCatalogIndexEntry {
  const card = mapOdooCatalogListItem(raw, locale)
  const categorySlugs = [
    ...new Set(
      [
        ...(raw.categories ?? []).map((c) => c.slug).filter((s): s is string => Boolean(s)),
        raw.category_slug ?? undefined,
        card.categorySlug ?? undefined,
      ].filter((s): s is string => Boolean(s)),
    ),
  ]
  return {
    ...card,
    odooTemplateId: raw.id,
    searchText: buildSearchText(raw),
    categorySlugs,
    brandSlug: raw.brand?.slug ?? card.brand?.slug ?? null,
  }
}

async function fetchListPage(
  locale: HubLocale,
  page: number,
  throttle: CatalogIndexThrottle,
) {
  let lastErr: unknown
  for (let attempt = 1; attempt <= CATALOG_INDEX_MAX_DETAIL_ATTEMPTS; attempt += 1) {
    try {
      const list = await fetchOdooCatalogProductList({
        locale,
        page,
        perPage: CATALOG_INDEX_LIST_PER_PAGE,
      })
      throttle.onSuccess()
      return list
    } catch (err) {
      lastErr = err
      if (!isRetriableCatalogError(err) || attempt >= CATALOG_INDEX_MAX_DETAIL_ATTEMPTS) break
      const waitMs = isRateLimitedError(err)
        ? throttle.onRateLimit(err.retryAfterMs)
        : computeBackoffMs({
            attempt,
            baseDelayMs: throttle.onTransientError(),
            maxDelayMs: CATALOG_INDEX_MAX_DELAY_MS,
            retryAfterMs: err instanceof OdooCatalogClientError ? err.retryAfterMs : null,
          })
      logger.warn('catalog_index.list_page_retry', {
        locale,
        page,
        attempt,
        waitMs,
        err: String(err),
        ...throttle.snapshot(),
      })
      await sleep(waitMs)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

async function fetchDetailWithRetry(
  id: number,
  locale: HubLocale,
  throttle: CatalogIndexThrottle,
): Promise<OdooCatalogProductDetail | 'permanent_miss'> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= CATALOG_INDEX_MAX_DETAIL_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetchOdooCatalogProductDetail(id, locale)
      throttle.onSuccess()
      return res.product
    } catch (err) {
      lastErr = err
      if (isPermanentCatalogMiss(err)) return 'permanent_miss'
      if (!isRetriableCatalogError(err) || attempt >= CATALOG_INDEX_MAX_DETAIL_ATTEMPTS) break
      const waitMs = isRateLimitedError(err)
        ? throttle.onRateLimit(err.retryAfterMs)
        : computeBackoffMs({
            attempt,
            baseDelayMs: throttle.onTransientError(),
            maxDelayMs: CATALOG_INDEX_MAX_DELAY_MS,
            retryAfterMs: err instanceof OdooCatalogClientError ? err.retryAfterMs : null,
          })
      logger.warn('catalog_index.detail_retry', {
        locale,
        id,
        attempt,
        waitMs,
        err: String(err),
        ...throttle.snapshot(),
      })
      await sleep(waitMs)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i])
    }
  }
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run())
  await Promise.all(runners)
  return results
}

function finalizeBucket(
  entries: OdooCatalogIndexEntry[],
  detailsById: Record<string, OdooCatalogProductDetail>,
): IndexBucket {
  const slugToId: Record<string, number> = {}
  for (const entry of entries) {
    if (entry.slug && entry.odooTemplateId && slugToId[entry.slug] == null) {
      slugToId[entry.slug] = entry.odooTemplateId
    }
  }
  for (const [id, product] of Object.entries(detailsById)) {
    if (product.slug) slugToId[product.slug] = Number(id)
  }

  for (const entry of entries) {
    const detail = detailsById[String(entry.odooTemplateId)]
    if (!detail) continue
    const specs = resolveProductSpecs(detail)
    if (specs.length) entry.specs = specs
    const tags = buildTechnicalCardSpecTagsFromSpecs(specs)
    if (tags.length) entry.specTags = tags
    const categorySlugs = [
      ...new Set(
        [
          ...entry.categorySlugs,
          ...(detail.categories ?? []).map((c) => c.slug).filter((s): s is string => Boolean(s)),
          detail.category_slug ?? undefined,
        ].filter((s): s is string => Boolean(s)),
      ),
    ]
    entry.categorySlugs = categorySlugs
    if (!entry.categorySlug && categorySlugs[0]) entry.categorySlug = categorySlugs[0]
    if (detail.brand?.slug) {
      entry.brandSlug = detail.brand.slug
      entry.brand = { slug: detail.brand.slug, name: detail.brand.name ?? detail.brand.slug }
    }
    entry.searchText = normalizeSearch(
      [
        entry.searchText,
        tags.join(' '),
        ...specs.flatMap((s) => [s.key, s.label, s.display, String(s.value ?? '')]),
        entry.ced ?? '',
        entry.manufacturerCode ?? '',
      ].join(' '),
    )
    const pair = resolveOdooCatalogCardImageUrls(detail)
    if (pair.imageUrl) entry.imageUrl = pair.imageUrl
    entry.hoverImageUrl = pair.hoverImageUrl
    entry.accesaImageUrl = pair.accesaImageUrl
  }

  const derivedFromDetails = deriveTaxonomyFromEntries(entries)
  for (const product of Object.values(detailsById)) {
    for (const c of product.categories ?? []) {
      if (!c.slug) continue
      const existing = derivedFromDetails.categories.find((x) => x.slug === c.slug)
      if (existing && c.name) existing.name = c.name
      else if (!existing) {
        derivedFromDetails.categories.push({
          id: String(c.id ?? c.slug),
          slug: c.slug,
          name: c.name ?? c.slug,
          parentId: c.parent_id != null ? String(c.parent_id) : null,
        })
      }
    }
    if (product.brand?.slug && product.brand.name) {
      const existing = derivedFromDetails.brands.find((x) => x.slug === product.brand!.slug)
      if (existing) {
        existing.name = product.brand.name
        existing.productCount = (existing.productCount ?? 0) + 1
      } else {
        derivedFromDetails.brands.push({
          slug: product.brand.slug,
          name: product.brand.name,
          productCount: 1,
        })
      }
    }
  }
  derivedFromDetails.categories.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  derivedFromDetails.brands.sort((a, b) => a.name.localeCompare(b.name, 'it'))

  return {
    syncedAt: Date.now(),
    entries,
    categories: derivedFromDetails.categories,
    brands: derivedFromDetails.brands,
    detailsById,
    slugToId,
  }
}

async function pullListPagesResumable(
  locale: HubLocale,
  meta: ReturnType<typeof createSyncMeta>,
  throttle: CatalogIndexThrottle,
): Promise<void> {
  while (meta.phase === 'list') {
    if (meta.nextListPage > MAX_LIST_PAGES) {
      logger.warn('catalog_index.list_page_cap', {
        locale,
        nextListPage: meta.nextListPage,
        maxPages: MAX_LIST_PAGES,
        entryCount: meta.entryCount,
      })
      meta.phase = 'details'
      await writeSyncMeta(meta)
      break
    }
    const list = await fetchListPage(locale, meta.nextListPage, throttle)
    const mapped = list.items.map((raw) => mapListItem(raw, locale))
    await appendSyncEntries(locale, mapped)
    meta.listTotalPages = list.total_pages
    meta.entryCount += mapped.length
    const page = meta.nextListPage
    meta.nextListPage = page + 1
    if (page >= list.total_pages) meta.phase = 'details'
    await writeSyncMeta(meta)
    logger.info('catalog_index.list_page', {
      locale,
      page,
      items: mapped.length,
      totalPages: list.total_pages,
      entryCount: meta.entryCount,
      ...throttle.snapshot(),
    })
    if (meta.phase === 'list') await sleep(throttle.currentDelayMs())
  }
}

async function pullDetailsResumable(
  locale: HubLocale,
  meta: ReturnType<typeof createSyncMeta>,
  throttle: CatalogIndexThrottle,
): Promise<void> {
  const entries = await loadSyncEntries(locale)
  const detailsById = await loadSyncDetails(locale)
  const have = new Set(Object.keys(detailsById).map((id) => Number(id)))
  /** Solo 404/400: i failedDetailIds del checkpoint restano retriabili (tipicamente 429). */
  const permanentMiss = new Set<number>()
  const ids = entries.map((e) => e.odooTemplateId).filter((id) => id > 0)
  meta.entryCount = entries.length
  meta.detailCount = have.size
  /** Evita loop infiniti se Odoo continua a rate-limitare: dopo N passate complete sui gap, promote. */
  let emptyProgressRounds = 0
  const maxEmptyProgressRounds = 3

  while (meta.phase === 'details') {
    const remaining = missingDetailIds(ids, have).filter((id) => !permanentMiss.has(id))
    if (!remaining.length) {
      meta.phase = 'promote'
      meta.failedDetailIds = [...permanentMiss]
      await writeSyncMeta(meta)
      break
    }
    const batch = nextDetailBatch(remaining, CATALOG_INDEX_DETAIL_BATCH_SIZE)
    const pulled: OdooCatalogProductDetail[] = []
    const failedRetriable: number[] = []
    const beforeHave = have.size
    await mapPool(batch, throttle.currentConcurrency(), async (id) => {
      try {
        const product = await fetchDetailWithRetry(id, locale, throttle)
        if (product === 'permanent_miss') {
          permanentMiss.add(id)
          return
        }
        pulled.push(product)
        have.add(id)
        permanentMiss.delete(id)
      } catch {
        failedRetriable.push(id)
      }
    })
    if (pulled.length) await appendSyncDetails(locale, pulled)
    meta.detailCount = have.size
    meta.failedDetailIds = [...new Set([...failedRetriable, ...permanentMiss])]
    meta.nextDetailIndex = ids.length - missingDetailIds(ids, have).length
    await writeSyncMeta(meta)
    logger.info('catalog_index.details_batch', {
      locale,
      ok: pulled.length,
      failed: failedRetriable.length,
      permanentMiss: permanentMiss.size,
      have: have.size,
      total: ids.length,
      remaining: remaining.length - pulled.length,
      nextDetailIndex: meta.nextDetailIndex,
      ...throttle.snapshot(),
    })

    if (have.size === beforeHave && failedRetriable.length) {
      emptyProgressRounds += 1
      const coolDown = throttle.onRateLimit(null)
      logger.warn('catalog_index.details_stalled', {
        locale,
        emptyProgressRounds,
        coolDown,
        remaining: missingDetailIds(ids, have).filter((id) => !permanentMiss.has(id)).length,
      })
      if (emptyProgressRounds >= maxEmptyProgressRounds) {
        // Promote ciò che abbiamo: i gap restano in failedDetailIds e verranno ripresi
        // al prossimo sync (checkpoint non cancellato se lasciamo phase? → promote clears).
        // Scriviamo i gap in failedDetailIds prima del promote; un sync successivo con force
        // ricostruisce. Per ripresa immediata: non promote se troppi gap? Preferiamo
        // promuovere la cache parziale e lasciare i miss in failedDetailIds nel meta history.
        meta.failedDetailIds = missingDetailIds(ids, have)
        meta.phase = 'promote'
        await writeSyncMeta(meta)
        break
      }
      await sleep(coolDown)
      continue
    }
    emptyProgressRounds = 0
    if (meta.phase === 'details') await sleep(throttle.currentDelayMs())
  }

  // Passata sequenziale finale sui gap retriabili (concurrency 1, delay alto).
  const gapRetry = missingDetailIds(ids, have).filter((id) => !permanentMiss.has(id))
  if (gapRetry.length) {
    throttle.onRateLimit(null)
    for (const id of gapRetry) {
      try {
        const product = await fetchDetailWithRetry(id, locale, throttle)
        if (product === 'permanent_miss') {
          permanentMiss.add(id)
          continue
        }
        await appendSyncDetails(locale, [product])
        have.add(id)
      } catch {
        /* resta in failed */
      }
      await sleep(throttle.currentDelayMs())
    }
    meta.detailCount = have.size
    meta.failedDetailIds = [...new Set([...missingDetailIds(ids, have), ...permanentMiss])]
    await writeSyncMeta(meta)
  }
}

async function promoteCheckpoint(locale: HubLocale): Promise<IndexBucket> {
  const entries = await loadSyncEntries(locale)
  const detailsById = await loadSyncDetails(locale)
  const bucket = finalizeBucket(entries, detailsById)
  indexByLocale.set(locale, bucket)
  await persistBucket(locale, bucket)
  await clearSyncCheckpoint(locale)
  logger.info('catalog_index.promoted', {
    locale,
    count: bucket.entries.length,
    details: Object.keys(bucket.detailsById).length,
  })
  // Merchant feed / sitemap leggono solo la cache indice: dopo promote vanno rigenerati.
  if (locale === 'IT') {
    void import('../seo/seo-cache.service.js')
      .then(({ refreshSeoCaches }) => refreshSeoCaches({ skipPwaRevalidate: true }))
      .catch((err) => logger.warn('seo.cache_refresh_after_promote_failed', { err: String(err) }))
  }
  return bucket
}

async function seedGapFillFromExisting(
  locale: HubLocale,
  bucket: IndexBucket,
): Promise<ReturnType<typeof createSyncMeta>> {
  await clearSyncCheckpoint(locale)
  const meta = createSyncMeta(locale)
  meta.phase = 'details'
  meta.entryCount = bucket.entries.length
  meta.detailCount = Object.keys(bucket.detailsById).length
  meta.nextDetailIndex = meta.detailCount
  meta.listTotalPages = 0
  await appendSyncEntries(locale, bucket.entries)
  await appendSyncDetails(locale, Object.values(bucket.detailsById))
  await writeSyncMeta(meta)
  logger.info('catalog_index.gap_fill_start', {
    locale,
    entries: meta.entryCount,
    details: meta.detailCount,
    missing: meta.entryCount - meta.detailCount,
  })
  return meta
}

async function buildBucket(
  locale: HubLocale,
  options?: { preferGapFill?: boolean },
): Promise<IndexBucket> {
  const throttle = createIndexThrottle()
  let meta = await readSyncMeta(locale)
  if (isCheckpointResumable(meta)) {
    meta.resumedFrom = meta.resumedFrom ?? meta.startedAt
    logger.info('catalog_index.resume', {
      locale,
      phase: meta.phase,
      nextListPage: meta.nextListPage,
      nextDetailIndex: meta.nextDetailIndex,
      entryCount: meta.entryCount,
      detailCount: meta.detailCount,
      ...throttle.snapshot(),
    })
  } else {
    if (meta) await clearSyncCheckpoint(locale)
    const existing = indexByLocale.get(locale) ?? (await readDiskBucket(locale))
    const existingDetails = existing ? Object.keys(existing.detailsById).length : 0
    const canGapFill =
      Boolean(options?.preferGapFill) &&
      Boolean(existing?.entries.length) &&
      existingDetails < (existing?.entries.length ?? 0)
    if (canGapFill && existing) {
      meta = await seedGapFillFromExisting(locale, existing)
    } else {
      meta = createSyncMeta(locale)
      await writeSyncMeta(meta)
      logger.info('catalog_index.sync_start', {
        locale,
        listPerPage: CATALOG_INDEX_LIST_PER_PAGE,
        detailBatchSize: CATALOG_INDEX_DETAIL_BATCH_SIZE,
        ...throttle.snapshot(),
      })
    }
  }

  if (meta.phase === 'list') await pullListPagesResumable(locale, meta, throttle)
  if (meta.phase === 'details') await pullDetailsResumable(locale, meta, throttle)
  return promoteCheckpoint(locale)
}

/** Ripristina indici da disco (cold start senza chiamate OdooCatalog). */
export async function hydrateOdooCatalogIndexFromDisk(): Promise<void> {
  if (hydratePromise) return hydratePromise
  hydratePromise = (async () => {
    await Promise.all(
      HUB_LOCALES.map(async (locale) => {
        if (indexByLocale.has(locale)) return
        const disk = await readDiskBucket(locale)
        if (disk?.entries.length) {
          indexByLocale.set(locale, disk)
          logger.info('catalog_index.hydrated', {
            locale,
            count: disk.entries.length,
            details: Object.keys(disk.detailsById).length,
            syncedAt: new Date(disk.syncedAt).toISOString(),
          })
        }
      }),
    )
  })()
  return hydratePromise
}

/** Sync forzato (cron 03:00/15:00 / admin): lista + dettagli v2. */
export async function syncOdooCatalogIndex(
  locale: HubLocale,
  options?: { preferGapFill?: boolean },
): Promise<{ count: number; details: number; syncedAt: string }> {
  if (!isOdooCatalogConfigured()) {
    return { count: 0, details: 0, syncedAt: new Date().toISOString() }
  }

  const pending = inflight.get(locale)
  if (pending) {
    const bucket = await pending
    return {
      count: bucket.entries.length,
      details: Object.keys(bucket.detailsById).length,
      syncedAt: new Date(bucket.syncedAt).toISOString(),
    }
  }

  const job = (async () => {
    return buildBucket(locale, options)
  })().finally(() => {
    inflight.delete(locale)
  })

  inflight.set(locale, job)
  const bucket = await job
  return {
    count: bucket.entries.length,
    details: Object.keys(bucket.detailsById).length,
    syncedAt: new Date(bucket.syncedAt).toISOString(),
  }
}

/** Sync tutte le lingue PWA (job 03:00/15:00 e admin). Riprende i checkpoint incompleti. */
export async function syncAllOdooCatalogIndexes(options?: {
  force?: boolean
  reason?: string
}): Promise<{
  locales: Array<{ locale: HubLocale; count: number; details: number; syncedAt: string }>
}> {
  await markRunningHistoryInterrupted()
  const reason = options?.reason ?? 'sync'
  let history: CatalogIndexSyncHistoryEntry = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'running',
    reason,
    locales: HUB_LOCALES.map((locale) => ({ locale, status: 'pending' })),
  }
  await appendSyncHistory(history)

  const locales: Array<{ locale: HubLocale; count: number; details: number; syncedAt: string }> = []
  for (const locale of HUB_LOCALES) {
    const checkpoint = await readSyncMeta(locale)
    const resumable = isCheckpointResumable(checkpoint)
    const live = getOdooCatalogIndexMeta(locale)
    const incomplete = live.count > 0 && live.details < live.count
    if (!options?.force && !resumable && !live.stale && live.count > 0 && !incomplete) {
      history = upsertHistoryLocale(history, {
        locale,
        status: 'skipped',
        count: live.count,
        details: live.details,
      })
      await appendSyncHistory(history)
      continue
    }

    history = upsertHistoryLocale(history, {
      locale,
      status: 'running',
      resumed: resumable || incomplete,
    })
    await appendSyncHistory(history)
    try {
      const result = await syncOdooCatalogIndex(locale, {
        // Gap-fill solo se incompleto e non force: un force admin ricostruisce lista+dettagli.
        preferGapFill: incomplete && !options?.force,
      })
      locales.push({ locale, ...result })
      history = upsertHistoryLocale(history, {
        locale,
        status: 'completed',
        count: result.count,
        details: result.details,
        resumed: resumable,
      })
      await appendSyncHistory(history)
    } catch (err) {
      logger.warn('catalog_index.sync_locale_failed', { locale, err: String(err) })
      history = upsertHistoryLocale(history, {
        locale,
        status: 'failed',
        error: String(err).slice(0, 500),
        resumed: resumable,
      })
      await appendSyncHistory(history)
    }
  }

  const anyFailed = history.locales.some((row) => row.status === 'failed')
  const anyOk = history.locales.some((row) => row.status === 'completed')
  history.status = anyFailed && !anyOk ? 'failed' : 'completed'
  history.finishedAt = new Date().toISOString()
  await appendSyncHistory(history)
  return { locales }
}

export async function getCatalogIndexSyncProgress(): Promise<CatalogIndexSyncProgressDTO[]> {
  return listResumableCheckpoints(HUB_LOCALES)
}

export async function getCatalogIndexSyncHistory() {
  return readSyncHistory()
}

export async function queryOdooCatalogIndex(options: {
  locale: HubLocale
  q?: string
  page: number
  pageSize: number
  categorySlug?: string
  brandSlug?: string
  attacco?: string
  colorTemp?: string
  world?: string
  tipologia?: string
  ambiente?: string
  stile?: string
}): Promise<ProductListDTO> {
  // Solo cache in-memory / disco: nessuna chiamata live Odoo in ricerca/filtri.
  await hydrateOdooCatalogIndexFromDisk()
  const bucket = indexByLocale.get(options.locale)

  if (!bucket?.entries.length) {
    return {
      items: [],
      page: 1,
      pageSize: options.pageSize,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  }

  const tokens = normalizeSearch(options.q ?? '')
    .split(' ')
    .filter(Boolean)

  const specFilters: CatalogSpecFilters = {
    attacco: sanitizeAttaccoParam(options.attacco),
    colorTemp: sanitizeColorTempParam(options.colorTemp),
  }

  let filtered = bucket.entries
  if (options.categorySlug?.trim()) {
    const cat = options.categorySlug.trim()
    filtered = filtered.filter(
      (e) => e.categorySlug === cat || e.categorySlugs.includes(cat),
    )
  }
  if (options.brandSlug?.trim()) {
    const brand = options.brandSlug.trim()
    filtered = filtered.filter((e) => e.brandSlug === brand || e.brand?.slug === brand)
  }
  if (options.world === 'design') {
    filtered = filtered.filter((e) =>
      /arredo|design|decorativ/i.test([e.categorySlug, ...e.categorySlugs].join(' ')),
    )
  }
  if (options.world === 'technical') {
    filtered = filtered.filter((e) =>
      /tecnica|tecnici|ricambi|lampadine|componenti|driver|alimentator/i.test(
        [e.categorySlug, ...e.categorySlugs].join(' '),
      ),
    )
  }
  for (const extra of [options.tipologia, options.ambiente, options.stile]) {
    const token = extra?.trim().toLowerCase()
    if (token) {
      filtered = filtered.filter((e) => e.searchText.includes(token) || e.categorySlugs.includes(token))
    }
  }
  if (tokens.length) {
    filtered = filtered.filter((e) => tokens.every((t) => e.searchText.includes(t)))
  }
  if (hasActiveSpecFilters(specFilters)) {
    filtered = filtered.filter((e) => {
      const specs =
        e.specs?.length ? e.specs : resolveProductSpecs(bucket.detailsById[String(e.odooTemplateId)])
      return productMatchesSpecFilter({ ...e, specs }, specFilters)
    })
  }

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / options.pageSize) || 1)
  const page = Math.min(Math.max(1, options.page), totalPages)
  const start = (page - 1) * options.pageSize
  const items = filtered.slice(start, start + options.pageSize).map(
    ({ searchText: _s, categorySlugs: _c, brandSlug: _b, specs: _specs, ...card }) => {
      const detail = bucket.detailsById[String(card.odooTemplateId)]
      if (!detail) return card
      const pair = resolveOdooCatalogCardImageUrls(detail)
      return {
        ...card,
        imageUrl: pair.imageUrl ?? card.imageUrl,
        hoverImageUrl: pair.hoverImageUrl,
        accesaImageUrl: pair.accesaImageUrl,
      }
    },
  )

  return {
    items,
    page,
    pageSize: options.pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/** @deprecated Usare `queryOdooCatalogIndex`. */
export async function searchOdooCatalogIndex(options: {
  locale: HubLocale
  q: string
  page: number
  pageSize: number
  categorySlug?: string
  brandSlug?: string
}): Promise<ProductListDTO> {
  return queryOdooCatalogIndex(options)
}

export async function getCachedCategories(locale: HubLocale): Promise<CategoryDTO[] | null> {
  await hydrateOdooCatalogIndexFromDisk()
  const bucket = indexByLocale.get(locale)
  if (!bucket?.categories.length && !bucket?.entries.length) return null
  if (bucket.categories.length) return bucket.categories
  return deriveTaxonomyFromEntries(bucket.entries).categories
}

export async function getCachedBrands(locale: HubLocale): Promise<BrandListItemDTO[] | null> {
  await hydrateOdooCatalogIndexFromDisk()
  const bucket = indexByLocale.get(locale)
  if (!bucket?.brands.length && !bucket?.entries.length) return null
  const derived = bucket.entries.length ? deriveTaxonomyFromEntries(bucket.entries) : null
  if (bucket.brands.length) {
    if (!derived) return bucket.brands
    const worldsBySlug = new Map(derived.brands.map((brand) => [brand.slug, brand.worlds]))
    return bucket.brands.map((brand) => ({
      ...brand,
      worlds: brand.worlds?.length ? brand.worlds : worldsBySlug.get(brand.slug) ?? [],
    }))
  }
  return derived?.brands ?? []
}

/** Lettura cache locale senza fetch live (per arricchire le card listing). */
export async function peekCachedProductDetails(
  locale: HubLocale,
): Promise<{
  detailsById: Readonly<Record<string, OdooCatalogProductDetail>>
  slugToId: Readonly<Record<string, number>>
}> {
  await hydrateOdooCatalogIndexFromDisk()
  const bucket = indexByLocale.get(locale)
  return {
    detailsById: bucket?.detailsById ?? {},
    slugToId: bucket?.slugToId ?? {},
  }
}

/**
 * Dettaglio prodotto dalla cache locale (API v2).
 * Se assente: fetch live `/api/v2/product/{id}`, poi memorizza (lazy fill).
 */
export async function getCachedProductDetailById(
  locale: HubLocale,
  productId: number,
): Promise<OdooCatalogProductDetailResponse | null> {
  await hydrateOdooCatalogIndexFromDisk()
  const bucket = indexByLocale.get(locale)
  const cached = bucket?.detailsById[String(productId)]
  if (cached) return toDetailResponse(locale, cached)

  if (!isOdooCatalogConfigured()) return null

  try {
    const live = await fetchOdooCatalogProductDetail(productId, locale)
    await rememberProductDetail(locale, live.product)
    return live
  } catch {
    return null
  }
}

export async function getCachedProductDetailBySlug(
  locale: HubLocale,
  slug: string,
): Promise<OdooCatalogProductDetailResponse | null> {
  await hydrateOdooCatalogIndexFromDisk()
  const normalized = slug.trim()
  if (!normalized) return null

  const bucket = indexByLocale.get(locale)
  const id = bucket?.slugToId[normalized]
  if (id != null) {
    const byId = await getCachedProductDetailById(locale, id)
    if (byId) return byId
  }

  // Fallback: cerca nello slug delle entry lista
  const entry = bucket?.entries.find((e) => e.slug === normalized)
  if (entry?.odooTemplateId) {
    return getCachedProductDetailById(locale, entry.odooTemplateId)
  }

  return null
}

/** Memorizza un dettaglio (lazy fill dopo miss o sync parziale). */
export async function rememberProductDetail(
  locale: HubLocale,
  product: OdooCatalogProductDetail,
): Promise<void> {
  await hydrateOdooCatalogIndexFromDisk()
  let bucket = indexByLocale.get(locale)
  if (!bucket) {
    bucket = {
      syncedAt: Date.now(),
      entries: [],
      categories: [],
      brands: [],
      detailsById: {},
      slugToId: {},
    }
    indexByLocale.set(locale, bucket)
  }
  bucket.detailsById[String(product.id)] = product
  if (product.slug) bucket.slugToId[product.slug] = product.id
  // Persistenza best-effort (non blocca la response)
  void persistBucket(locale, bucket)
}

export async function listCachedCatalogProductSlugs(locale: HubLocale): Promise<string[]> {
  await hydrateOdooCatalogIndexFromDisk()
  const bucket = indexByLocale.get(locale)
  if (!bucket) return []
  return bucket.entries.map((entry) => entry.slug).filter((slug): slug is string => Boolean(slug?.trim()))
}

export function getOdooCatalogIndexMeta(locale: HubLocale): {
  count: number
  details: number
  syncedAt: string | null
  stale: boolean
  categories: number
  brands: number
} {
  const bucket = indexByLocale.get(locale)
  if (!bucket) {
    return { count: 0, details: 0, syncedAt: null, stale: true, categories: 0, brands: 0 }
  }
  return {
    count: bucket.entries.length,
    details: Object.keys(bucket.detailsById).length,
    syncedAt: new Date(bucket.syncedAt).toISOString(),
    stale: Date.now() - bucket.syncedAt >= CATALOG_INDEX_TTL_MS,
    categories: bucket.categories.length,
    brands: bucket.brands.length,
  }
}
