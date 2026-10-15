import { prisma } from '../../lib/prisma.js'
import {
  isStaticBrandLogoUrl,
  resolveStaticBrandLogoSrc,
  resolveStaticBrandStem,
  STATIC_BRAND_LOGO_STEMS,
  staticBrandLogoPath,
} from '../brands-admin/static-brand-logos.js'
import type { BrandListItemDTO } from './odoo-catalog-index.service.js'

export type BrandLogoUrls = {
  lightUrl: string | null
  darkUrl: string | null
}

export type PublicBrandLogosMap = Record<string, BrandLogoUrls>

let cache: {
  at: number
  logos: PublicBrandLogosMap
} | null = null

const CACHE_TTL_MS = 60_000

async function loadAssets() {
  const now = Date.now()
  if (cache && now - cache.at < CACHE_TTL_MS) return cache

  const rows = await prisma.catalogBrand.findMany({
    select: {
      slug: true,
      logoLightUrl: true,
      logoDarkUrl: true,
    },
  })

  const logos: PublicBrandLogosMap = {}
  for (const row of rows) {
    if (row.logoLightUrl || row.logoDarkUrl) {
      logos[row.slug] = {
        lightUrl: row.logoLightUrl,
        darkUrl: row.logoDarkUrl,
      }
    }
  }

  cache = { at: now, logos }
  return cache
}

/** Invalida cache dopo mutate admin. */
export function invalidateCatalogBrandAssetsCache() {
  cache = null
}

function lookupLogo(assets: PublicBrandLogosMap, slug: string): BrandLogoUrls | null {
  const key = slug.trim().toLowerCase()
  const direct = assets[key]
  if (direct) return direct
  const stem = resolveStaticBrandStem(key)
  if (stem && assets[stem]) return assets[stem]
  const staticSrc = resolveStaticBrandLogoSrc(key)
  if (staticSrc) return { lightUrl: staticSrc, darkUrl: null }
  return null
}

export async function getPublicBrandLogosMap(): Promise<PublicBrandLogosMap> {
  const assets = await loadAssets()
  const out: PublicBrandLogosMap = { ...assets.logos }
  for (const stem of STATIC_BRAND_LOGO_STEMS) {
    if (out[stem]?.lightUrl) continue
    out[stem] = {
      lightUrl: out[stem]?.lightUrl ?? staticBrandLogoPath(stem),
      darkUrl: out[stem]?.darkUrl ?? null,
    }
  }
  return out
}

/**
 * Arricchisce i brand Odoo con URL logo (DB e/o statici `/brands`).
 * Tutti i brand Odoo restano in lista anche senza logo.
 */
export async function enrichPublicBrands(brands: BrandListItemDTO[]): Promise<BrandListItemDTO[]> {
  const assets = await loadAssets()
  return brands.map((brand) => {
    const slug = brand.slug.trim().toLowerCase()
    const logos = lookupLogo(assets.logos, slug)
    return {
      ...brand,
      logoLightUrl: logos?.lightUrl ?? null,
      logoDarkUrl: logos?.darkUrl ?? null,
    }
  })
}

export { isStaticBrandLogoUrl }
