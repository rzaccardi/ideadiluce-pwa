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
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { toOdooCatalogLang } from '../../adapters/odoo-catalog/odooCatalogLocale.js'
import { mapOdooCatalogListItem } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
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
  nextDetailBatch,
  readSyncHistory,
  readSyncMeta,
  remainingDetailIds,
  upsertHistoryLocale,
  writeSyncMeta,
  type CatalogIndexSyncHistoryEntry,
  type CatalogIndexSyncProgressDTO,
} from './odoo-catalog-index-checkpoint.js'

export type OdooCatalogIndexEntry = ProductCardDTO & {
  odooTemplateId: number
  searchText: string
  categorySlugs: string[]
  brandSlug: string | null
  /** Specs tipizzate dal dettaglio v2 — fonte filtri attacco/Kelvin. */
  specs?: OdooCatalogSpec[]
}

export type BrandListItemDTO = {
  slug: string
  name: string
  productCount?: number
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
const MAX_PAGES = 20
export const CATALOG_INDEX_LIST_PER_PAGE = 100
/** Dettagli per pagina di lavoro: checkpoint dopo ogni batch. */
export const CATALOG_INDEX_DETAIL_BATCH_SIZE = 20
/** Max chiamate dettaglio in volo (mai l'intero catalogo). */
export const CATALOG_INDEX_DETAIL_CONCURRENCY = 2
/** Pausa tra pagine lista e tra batch dettagli, per non saturare Odoo. */
export const CATALOG_INDEX_PAGE_DELAY_MS = 300
const DISK_CACHE_DIR = catalogIndexCacheDir()

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
      const existing = brands.get(brandSlug)
      if (existing) {
        existing.productCount = (existing.productCount ?? 0) + 1
      } else {
        brands.set(brandSlug, {
          slug: brandSlug,
          name: entry.brand.name,
          productCount: 1,
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

async function fetchListPage(locale: HubLocale, page: number) {
  try {
    return await fetchOdooCatalogProductList({
      locale,
      page,
      perPage: CATALOG_INDEX_LIST_PER_PAGE,
    })
  } catch (err) {
    logger.warn('catalog_index.list_page_retry', { locale, page, err: String(err) })
    await sleep(CATALOG_INDEX_PAGE_DELAY_MS * 2)
    return fetchOdooCatalogProductList({
      locale,
      page,
      perPage: CATALOG_INDEX_LIST_PER_PAGE,
    })
  }
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
): Promise<void> {
  while (meta.phase === 'list') {
    if (meta.nextListPage > MAX_PAGES) {
      meta.phase = 'details'
      await writeSyncMeta(meta)
      break
    }
    const list = await fetchListPage(locale, meta.nextListPage)
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
    })
    if (meta.phase === 'list') await sleep(CATALOG_INDEX_PAGE_DELAY_MS)
  }
}

async function pullDetailsResumable(
  locale: HubLocale,
  meta: ReturnType<typeof createSyncMeta>,
): Promise<void> {
  const entries = await loadSyncEntries(locale)
  const detailsById = await loadSyncDetails(locale)
  const have = new Set(Object.keys(detailsById).map((id) => Number(id)))
  const ids = entries.map((e) => e.odooTemplateId).filter((id) => id > 0)
  meta.entryCount = entries.length
  meta.detailCount = have.size

  while (meta.phase === 'details') {
    const remaining = remainingDetailIds(ids, meta.nextDetailIndex, have)
    if (!remaining.length) {
      meta.phase = 'promote'
      await writeSyncMeta(meta)
      break
    }
    const batch = nextDetailBatch(remaining, CATALOG_INDEX_DETAIL_BATCH_SIZE)
    const pulled: OdooCatalogProductDetail[] = []
    const failed: number[] = []
    await mapPool(batch, CATALOG_INDEX_DETAIL_CONCURRENCY, async (id) => {
      try {
        const res = await fetchOdooCatalogProductDetail(id, locale)
        pulled.push(res.product)
        have.add(id)
      } catch {
        failed.push(id)
      }
    })
    await appendSyncDetails(locale, pulled)
    meta.detailCount = have.size
    meta.failedDetailIds = [...new Set([...meta.failedDetailIds, ...failed])]
    const lastId = batch[batch.length - 1]
    const lastPos = lastId == null ? meta.nextDetailIndex : ids.lastIndexOf(lastId)
    meta.nextDetailIndex = lastPos + 1
    await writeSyncMeta(meta)
    logger.info('catalog_index.details_batch', {
      locale,
      ok: pulled.length,
      failed: failed.length,
      have: have.size,
      total: ids.length,
      nextDetailIndex: meta.nextDetailIndex,
    })
    if (meta.phase === 'details') await sleep(CATALOG_INDEX_PAGE_DELAY_MS)
  }

  if (meta.failedDetailIds.length) {
    const retry = [...meta.failedDetailIds]
    meta.failedDetailIds = []
    for (const id of retry) {
      if (have.has(id)) continue
      try {
        const res = await fetchOdooCatalogProductDetail(id, locale)
        await appendSyncDetails(locale, [res.product])
        have.add(id)
      } catch {
        meta.failedDetailIds.push(id)
      }
      await sleep(CATALOG_INDEX_PAGE_DELAY_MS)
    }
    meta.detailCount = have.size
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
  return bucket
}

async function buildBucket(locale: HubLocale): Promise<IndexBucket> {
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
    })
  } else {
    if (meta) await clearSyncCheckpoint(locale)
    meta = createSyncMeta(locale)
    await writeSyncMeta(meta)
    logger.info('catalog_index.sync_start', { locale })
  }

  if (meta.phase === 'list') await pullListPagesResumable(locale, meta)
  if (meta.phase === 'details') await pullDetailsResumable(locale, meta)
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
    return buildBucket(locale)
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
    if (!options?.force && !resumable && !live.stale && live.count > 0) {
      history = upsertHistoryLocale(history, {
        locale,
        status: 'skipped',
        count: live.count,
        details: live.details,
      })
      await appendSyncHistory(history)
      continue
    }

    history = upsertHistoryLocale(history, { locale, status: 'running', resumed: resumable })
    await appendSyncHistory(history)
    try {
      const result = await syncOdooCatalogIndex(locale)
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
    ({ searchText: _s, categorySlugs: _c, brandSlug: _b, specs: _specs, ...card }) => card,
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
  if (bucket.brands.length) return bucket.brands
  return deriveTaxonomyFromEntries(bucket.entries).brands
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
