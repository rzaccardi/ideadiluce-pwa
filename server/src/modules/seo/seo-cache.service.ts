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
    const [sitemapXml, merchantXml, llmsTxt] = await Promise.all([
      buildProductSitemapXml(),
      buildMerchantFeedXml(),
      buildLlmsTxt(),
    ])
    const builtAt = new Date().toISOString()
    cache.sitemap = { body: sitemapXml, builtAt, itemCount: countSitemapUrls(sitemapXml) }
    cache.merchantFeed = { body: merchantXml, builtAt, itemCount: countMerchantItems(merchantXml) }
    cache.llms = { body: llmsTxt, builtAt, itemCount: null }

    if (!options?.skipPwaRevalidate) {
      await notifyStorefrontRevalidation()
    }

    logger.info('seo.cache_refreshed', {
      ms: Date.now() - startedAt,
      sitemapUrls: cache.sitemap.itemCount,
      merchantItems: cache.merchantFeed.itemCount,
    })

    return {
      skipped: false as const,
      builtAt,
      sitemapUrls: cache.sitemap.itemCount,
      merchantItems: cache.merchantFeed.itemCount,
    }
  } finally {
    refreshRunning = false
  }
}

export async function getCachedSitemapXml(): Promise<string> {
  if (!cache.sitemap) {
    await refreshSeoCaches({ skipPwaRevalidate: true })
  }
  return cache.sitemap!.body
}

export async function getCachedMerchantFeedXml(): Promise<string> {
  if (!cache.merchantFeed) {
    await refreshSeoCaches({ skipPwaRevalidate: true })
  }
  return cache.merchantFeed!.body
}

export async function getCachedLlmsTxt(): Promise<string> {
  if (!cache.llms) {
    const body = await buildLlmsTxt()
    cache.llms = { body, builtAt: new Date().toISOString(), itemCount: null }
  }
  return cache.llms.body
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
