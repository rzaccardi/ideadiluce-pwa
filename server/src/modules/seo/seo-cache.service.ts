import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { logger } from '../../lib/logger.js'
import { AppError } from '../../types/errors.js'
import { buildLlmsTxt } from './llms.service.js'
import { buildMerchantFeedXml } from './merchant-feed.service.js'
import { listNavCatalogLandingPaths } from './nav-landing-paths.js'
import { buildProductSitemapXml } from './sitemap.service.js'

type CacheEntry = {
  body: string
  builtAt: string
  itemCount: number | null
}

type CacheKey = 'sitemap' | 'merchantFeed' | 'llms'

const DISK_CACHE_DIR = path.join(process.cwd(), '.cache', 'seo')

const cache = {
  sitemap: null as CacheEntry | null,
  merchantFeed: null as CacheEntry | null,
  llms: null as CacheEntry | null,
}

function diskCachePath(key: CacheKey) {
  return path.join(DISK_CACHE_DIR, `${key}.json`)
}

async function persistDiskCache(key: CacheKey, entry: CacheEntry) {
  try {
    await mkdir(DISK_CACHE_DIR, { recursive: true })
    await writeFile(diskCachePath(key), JSON.stringify(entry), 'utf8')
  } catch (err) {
    logger.warn('seo.disk_cache_write_failed', { key, err: String(err) })
  }
}

async function persistNavLandingPaths(builtAt: string) {
  try {
    await mkdir(DISK_CACHE_DIR, { recursive: true })
    const paths = listNavCatalogLandingPaths()
    await writeFile(
      path.join(DISK_CACHE_DIR, 'nav-landings.json'),
      JSON.stringify({ builtAt, paths }),
      'utf8',
    )
  } catch (err) {
    logger.warn('seo.disk_cache_write_failed', { key: 'nav-landings', err: String(err) })
  }
}

async function readDiskCache(key: CacheKey): Promise<CacheEntry | null> {
  try {
    const raw = await readFile(diskCachePath(key), 'utf8')
    const parsed = JSON.parse(raw) as CacheEntry
    if (typeof parsed.body !== 'string' || typeof parsed.builtAt !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

/** Ripristina cache SEO da disco per evitare rebuild O(n) al cold start. */
export async function hydrateSeoCacheFromDisk() {
  const keys: CacheKey[] = ['sitemap', 'merchantFeed', 'llms']
  await Promise.all(
    keys.map(async (key) => {
      const entry = await readDiskCache(key)
      if (entry) cache[key] = entry
    }),
  )
}

let refreshRunning = false

function countSitemapUrls(xml: string): number {
  return (xml.match(/<url>/g) ?? []).length
}

function countMerchantItems(xml: string): number {
  return (xml.match(/<item>/g) ?? []).length
}

function storefrontBaseUrl(): string | null {
  const baseUrl = process.env.STOREFRONT_URL ?? process.env.NEXT_PUBLIC_SITE_URL
  if (!baseUrl) return null
  return baseUrl.replace(/\/$/, '')
}

async function notifyStorefrontRevalidation() {
  const baseUrl = storefrontBaseUrl()
  const secret = process.env.REVALIDATE_SECRET
  if (!baseUrl || !secret) return
  try {
    await fetch(
      `${baseUrl}/api/revalidate-site?secret=${encodeURIComponent(secret)}`,
      { method: 'POST' },
    )
  } catch {
    // best-effort
  }
}

const WARMUP_CONCURRENCY = 3

/** Preriscalda ISR storefront sulle landing da menu/megamenu (categorie, attacchi, ambienti). */
async function warmupStorefrontLandingPages() {
  const origin = storefrontBaseUrl()
  if (!origin) return

  const paths = listNavCatalogLandingPaths()
  const startedAt = Date.now()
  let next = 0
  let ok = 0

  async function worker() {
    while (next < paths.length) {
      const path = paths[next++]
      if (!path) continue
      try {
        const res = await fetch(`${origin}${path}`, {
          headers: { 'user-agent': 'ideadiluce-seo-warmup' },
          redirect: 'follow',
        })
        if (res.ok) ok += 1
      } catch {
        // best-effort: non blocca il refresh SEO
      }
    }
  }

  await Promise.all(Array.from({ length: WARMUP_CONCURRENCY }, () => worker()))
  logger.info('seo.landing_warmup', {
    total: paths.length,
    ok,
    ms: Date.now() - startedAt,
  })
}

const building: Record<CacheKey, boolean> = {
  sitemap: false,
  merchantFeed: false,
  llms: false,
}

const buildPromises: Partial<Record<CacheKey, Promise<CacheEntry>>> = {}

function seoCacheNotReady(key: CacheKey): never {
  throw new AppError(
    'SEO_CACHE_NOT_READY',
    `SEO cache "${key}" non disponibile`,
    'Risorsa SEO in preparazione. Riprova tra poco.',
    503,
    true,
    { key },
  )
}

/** Un solo build per chiave alla volta (request path + scheduler condividono il lock). */
function runSeoCacheBuild(key: CacheKey, build: () => Promise<CacheEntry>): Promise<CacheEntry> {
  const inflight = buildPromises[key]
  if (inflight) return inflight

  building[key] = true
  const promise = build()
    .catch((err) => {
      logger.warn('seo.cache_build_failed', { key, err: String(err) })
      throw err
    })
    .finally(() => {
      building[key] = false
      delete buildPromises[key]
    })
  buildPromises[key] = promise
  return promise
}

function ensureSeoCacheBuild(key: CacheKey, build: () => Promise<CacheEntry>) {
  if (cache[key]) return
  void runSeoCacheBuild(key, build).catch(() => undefined)
}

/**
 * Serve la cache se pronta. Su miss: kick-off build in background e 503 subito
 * (niente attesa fino a 120s che saturava i worker e loggava Unhandled error).
 */
async function waitForSeoCacheEntry(
  key: CacheKey,
  build: () => Promise<CacheEntry>,
): Promise<CacheEntry> {
  if (cache[key]) return cache[key]!

  ensureSeoCacheBuild(key, build)

  // Breve attesa: copre il caso in cui il build (es. da peek cache) finisce in pochi ms.
  for (let attempt = 0; attempt < 6; attempt++) {
    const entry = cache[key]
    if (entry) return entry
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  if (cache[key]) return cache[key]!
  seoCacheNotReady(key)
}

export async function refreshSeoCaches(options?: { skipPwaRevalidate?: boolean }) {
  if (refreshRunning) {
    return { skipped: true as const, reason: 'refresh_in_progress' }
  }
  refreshRunning = true
  const startedAt = Date.now()
  try {
    const [sitemapEntry, merchantEntry] = await Promise.all([
      runSeoCacheBuild('sitemap', buildAndStoreSitemap),
      runSeoCacheBuild('merchantFeed', buildAndStoreMerchantFeed),
      runSeoCacheBuild('llms', buildAndStoreLlms),
    ])
    const builtAt = sitemapEntry.builtAt
    void persistNavLandingPaths(builtAt)

    if (!options?.skipPwaRevalidate) {
      await notifyStorefrontRevalidation()
      void warmupStorefrontLandingPages()
    }

    logger.info('seo.cache_refreshed', {
      ms: Date.now() - startedAt,
      sitemapUrls: sitemapEntry.itemCount,
      merchantItems: merchantEntry.itemCount,
      navLandingPaths: listNavCatalogLandingPaths().length,
    })

    return {
      skipped: false as const,
      builtAt,
      sitemapUrls: sitemapEntry.itemCount,
      merchantItems: merchantEntry.itemCount,
    }
  } finally {
    refreshRunning = false
  }
}

async function buildAndStoreSitemap(): Promise<CacheEntry> {
  const body = await buildProductSitemapXml()
  const builtAt = new Date().toISOString()
  cache.sitemap = { body, builtAt, itemCount: countSitemapUrls(body) }
  void persistDiskCache('sitemap', cache.sitemap)
  return cache.sitemap
}

async function buildAndStoreMerchantFeed(): Promise<CacheEntry> {
  const body = await buildMerchantFeedXml()
  const builtAt = new Date().toISOString()
  cache.merchantFeed = { body, builtAt, itemCount: countMerchantItems(body) }
  void persistDiskCache('merchantFeed', cache.merchantFeed)
  return cache.merchantFeed
}

/** Rigenera solo il feed Merchant (dopo salvataggio impostazioni BO). */
export async function refreshMerchantFeed(): Promise<CacheEntry> {
  return runSeoCacheBuild('merchantFeed', buildAndStoreMerchantFeed)
}

async function buildAndStoreLlms(): Promise<CacheEntry> {
  const body = await buildLlmsTxt()
  const builtAt = new Date().toISOString()
  cache.llms = { body, builtAt, itemCount: null }
  void persistDiskCache('llms', cache.llms)
  return cache.llms
}

type CachedSeoAsset = { body: string; builtAt: string }

export async function getCachedSitemapXml(): Promise<CachedSeoAsset> {
  const entry = await waitForSeoCacheEntry('sitemap', buildAndStoreSitemap)
  return { body: entry.body, builtAt: entry.builtAt }
}

export async function getCachedMerchantFeedXml(): Promise<CachedSeoAsset> {
  const entry = await waitForSeoCacheEntry('merchantFeed', buildAndStoreMerchantFeed)
  return { body: entry.body, builtAt: entry.builtAt }
}

export async function getCachedLlmsTxt(): Promise<CachedSeoAsset> {
  const entry = await waitForSeoCacheEntry('llms', buildAndStoreLlms)
  return { body: entry.body, builtAt: entry.builtAt }
}

export function getSeoCacheStatus() {
  return {
    sitemap: cache.sitemap
      ? { builtAt: cache.sitemap.builtAt, urlCount: cache.sitemap.itemCount }
      : null,
    merchantFeed: cache.merchantFeed
      ? { builtAt: cache.merchantFeed.builtAt, itemCount: cache.merchantFeed.itemCount }
      : null,
    llms: cache.llms ? { builtAt: cache.llms.builtAt } : null,
    refreshRunning,
  }
}
