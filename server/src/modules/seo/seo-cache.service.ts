import { logger } from '../../lib/logger.js'
import { buildLlmsTxt } from './llms.service.js'
import { buildMerchantFeedXml } from './merchant-feed.service.js'
import { buildProductSitemapXml } from './sitemap.service.js'

type CacheEntry = {
  body: string
  builtAt: string
  itemCount: number | null
}

const cache = {
  sitemap: null as CacheEntry | null,
  merchantFeed: null as CacheEntry | null,
  llms: null as CacheEntry | null,
}

let refreshRunning = false

function countSitemapUrls(xml: string): number {
  return (xml.match(/<url>/g) ?? []).length
}

function countMerchantItems(xml: string): number {
  return (xml.match(/<item>/g) ?? []).length
}

async function notifyStorefrontRevalidation() {
  const baseUrl = process.env.STOREFRONT_URL ?? process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!baseUrl || !secret) return
  try {
    await fetch(
      `${baseUrl.replace(/\/$/, '')}/api/revalidate-site?secret=${encodeURIComponent(secret)}`,
      { method: 'POST' },
    )
  } catch {
    // best-effort
  }
}

export async function refreshSeoCaches(options?: { skipPwaRevalidate?: boolean }) {
  if (refreshRunning) {
    return { skipped: true as const, reason: 'refresh_in_progress' }
  }
  refreshRunning = true
  const startedAt = Date.now()
  try {
    const [sitemapEntry, merchantEntry] = await Promise.all([
      buildAndStoreSitemap(),
      buildAndStoreMerchantFeed(),
      buildAndStoreLlms(),
    ])
    const builtAt = sitemapEntry.builtAt

    if (!options?.skipPwaRevalidate) {
      await notifyStorefrontRevalidation()
    }

    logger.info('seo.cache_refreshed', {
      ms: Date.now() - startedAt,
      sitemapUrls: sitemapEntry.itemCount,
      merchantItems: merchantEntry.itemCount,
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
  return cache.sitemap
}

async function buildAndStoreMerchantFeed(): Promise<CacheEntry> {
  const body = await buildMerchantFeedXml()
  const builtAt = new Date().toISOString()
  cache.merchantFeed = { body, builtAt, itemCount: countMerchantItems(body) }
  return cache.merchantFeed
}

async function buildAndStoreLlms(): Promise<CacheEntry> {
  const body = await buildLlmsTxt()
  const builtAt = new Date().toISOString()
  cache.llms = { body, builtAt, itemCount: null }
  return cache.llms
}

const building: Record<keyof typeof cache, boolean> = {
  sitemap: false,
  merchantFeed: false,
  llms: false,
}

async function waitForSeoCacheEntry(
  key: keyof typeof cache,
  build: () => Promise<CacheEntry>,
): Promise<CacheEntry> {
  if (cache[key]) return cache[key]!

  if (!building[key]) {
    building[key] = true
    try {
      if (!cache[key]) return await build()
    } catch (err) {
      logger.warn('seo.cache_build_failed', { key, err: String(err) })
      throw err
    } finally {
      building[key] = false
    }
  }

  const maxAttempts = 240
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const entry = cache[key]
    if (entry) return entry
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`SEO cache "${key}" non disponibile`)
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
