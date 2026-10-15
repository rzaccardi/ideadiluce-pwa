import {
  deleteSpacesObjectByUrl,
  isSpacesConfigured,
  uploadBrandLogo,
} from '../../adapters/spaces/spaces.storage.js'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import { invalidateCatalogBrandAssetsCache } from '../catalog/catalog-brand-assets.service.js'
import { catalogStorefrontService } from '../catalog/catalog-storefront.service.js'
import type { BrandListItemDTO } from '../catalog/odoo-catalog-index.service.js'
import {
  isStaticBrandLogoUrl,
  normalizeBrandSlug,
  resolveStaticBrandLogoSrc,
  resolveStaticBrandStem,
  STATIC_BRAND_LOGO_STEMS,
  staticBrandLogoPath,
} from './static-brand-logos.js'

export type BrandLogoVariant = 'light' | 'dark'

export type AdminBrandRow = {
  slug: string
  name: string
  productCount: number
  worlds: BrandListItemDTO['worlds']
  logoLightUrl: string | null
  logoDarkUrl: string | null
  /** Origine del logo light mostrato. */
  logoLightSource: 'managed' | 'static' | null
  hasLogos: boolean
  updatedAt: string | null
}

function publicLogoUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const base = env.PUBLIC_SITE_URL.replace(/\/$/, '')
  return `${base}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

async function requireOdooBrand(slug: string) {
  const odoo = (await catalogStorefrontService.listBrands('IT')).find(
    (b) => normalizeBrandSlug(b.slug) === slug,
  )
  if (!odoo) {
    throw new AppError(
      'BRAND_NOT_IN_ODOO',
      'Brand not present in Odoo catalog',
      'Il marchio non è presente nel catalogo Odoo: non si possono creare brand dal proxy.',
      404,
    )
  }
  return odoo
}

function overlayForSlug(
  bySlug: Map<
    string,
    { slug: string; logoLightUrl: string | null; logoDarkUrl: string | null; updatedAt: Date }
  >,
  slug: string,
) {
  const direct = bySlug.get(slug)
  if (direct) return direct
  const stem = resolveStaticBrandStem(slug)
  return stem ? bySlug.get(stem) ?? null : null
}

export const brandsAdminService = {
  /** Solo brand provenienti da Odoo, arricchiti con loghi BO o statici `/brands`. */
  async list(): Promise<AdminBrandRow[]> {
    const [odooBrands, overlays] = await Promise.all([
      catalogStorefrontService.listBrands('IT'),
      prisma.catalogBrand.findMany({
        select: {
          slug: true,
          logoLightUrl: true,
          logoDarkUrl: true,
          updatedAt: true,
        },
      }),
    ])
    const bySlug = new Map(overlays.map((o) => [o.slug, o]))

    const rows: AdminBrandRow[] = odooBrands.map((brand) => {
      const slug = normalizeBrandSlug(brand.slug)
      const overlay = overlayForSlug(bySlug, slug)
      const staticSrc = resolveStaticBrandLogoSrc(slug)
      const managedLight = overlay?.logoLightUrl ?? null
      const managedDark = overlay?.logoDarkUrl ?? null
      const lightIsStatic = !managedLight && Boolean(staticSrc)
      const lightUrl = managedLight
        ? publicLogoUrl(managedLight)
        : staticSrc
          ? publicLogoUrl(staticSrc)
          : null
      const darkUrl = managedDark ? publicLogoUrl(managedDark) : null

      return {
        slug,
        name: brand.name,
        productCount: brand.productCount ?? 0,
        worlds: brand.worlds,
        logoLightUrl: lightUrl,
        logoDarkUrl: darkUrl,
        logoLightSource: managedLight
          ? isStaticBrandLogoUrl(managedLight)
            ? 'static'
            : 'managed'
          : lightIsStatic
            ? 'static'
            : null,
        hasLogos: Boolean(lightUrl || darkUrl),
        updatedAt: overlay?.updatedAt.toISOString() ?? null,
      }
    })

    rows.sort((a, b) => a.name.localeCompare(b.name, 'it'))
    return rows
  },

  /**
   * Upsert in DB dei loghi light già presenti in `client/public/brands`.
   * Non crea brand: aggiorna solo slug che esistono in Odoo (o stem noti).
   */
  async seedStaticLogos(): Promise<{ upserted: number; stems: string[] }> {
    const odooBrands = await catalogStorefrontService.listBrands('IT')
    const odooBySlug = new Map(
      odooBrands.map((b) => [normalizeBrandSlug(b.slug), b] as const),
    )

    let upserted = 0
    const stems: string[] = []

    for (const stem of STATIC_BRAND_LOGO_STEMS) {
      const path = staticBrandLogoPath(stem)
      // Preferisci lo slug Odoo esatto se presente, altrimenti lo stem file.
      const odoo =
        odooBySlug.get(stem) ??
        [...odooBySlug.values()].find((b) => resolveStaticBrandStem(b.slug) === stem)

      const slug = odoo ? normalizeBrandSlug(odoo.slug) : stem
      const existing = await prisma.catalogBrand.findUnique({ where: { slug } })
      // Non sovrascrivere un logo già caricato su Spaces / CDN.
      if (existing?.logoLightUrl && !isStaticBrandLogoUrl(existing.logoLightUrl)) {
        continue
      }

      await prisma.catalogBrand.upsert({
        where: { slug },
        create: {
          slug,
          displayName: odoo?.name ?? stem,
          manual: !odoo,
          logoLightUrl: path,
        },
        update: {
          logoLightUrl: path,
          manual: !odoo,
        },
      })
      upserted += 1
      stems.push(stem)
    }

    invalidateCatalogBrandAssetsCache()
    return { upserted, stems }
  },

  async uploadLogo(
    slugRaw: string,
    variant: BrandLogoVariant,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<AdminBrandRow> {
    if (!isSpacesConfigured()) {
      throw new AppError(
        'SPACES_NOT_CONFIGURED',
        'Spaces not configured',
        'Upload non disponibile: Spaces non configurato.',
        503,
      )
    }

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    if (!allowed.has(file.mimetype)) {
      throw new AppError(
        'INVALID_FILE',
        'Unsupported image type',
        'Carica un’immagine JPG, PNG, WebP o GIF.',
        400,
      )
    }

    const slug = normalizeBrandSlug(slugRaw)
    if (!slug) {
      throw new AppError('INVALID_SLUG', 'Invalid brand slug', 'Slug marchio non valido.', 400)
    }

    const odoo = await requireOdooBrand(slug)

    let uploaded: { url: string }
    try {
      uploaded = await uploadBrandLogo(slug, variant, file)
    } catch (e) {
      if (e instanceof Error && e.message === 'UNSUPPORTED_IMAGE_TYPE') {
        throw new AppError(
          'INVALID_FILE',
          'Unsupported image type',
          'Carica un’immagine JPG, PNG, WebP o GIF.',
          400,
        )
      }
      throw e
    }

    const existing = await prisma.catalogBrand.findUnique({ where: { slug } })
    const previousUrl =
      variant === 'light' ? existing?.logoLightUrl : existing?.logoDarkUrl

    const logoField =
      variant === 'light' ? { logoLightUrl: uploaded.url } : { logoDarkUrl: uploaded.url }

    await prisma.catalogBrand.upsert({
      where: { slug },
      create: {
        slug,
        displayName: odoo.name,
        manual: false,
        ...logoField,
      },
      update: logoField,
    })
    invalidateCatalogBrandAssetsCache()

    if (
      previousUrl &&
      previousUrl !== uploaded.url &&
      !isStaticBrandLogoUrl(previousUrl)
    ) {
      try {
        await deleteSpacesObjectByUrl(previousUrl)
      } catch {
        /* best-effort */
      }
    }

    const rows = await this.list()
    const row = rows.find((r) => r.slug === slug)
    if (!row) {
      throw new AppError('BRAND_NOT_FOUND', 'Brand not found', 'Marchio non trovato.', 404)
    }
    return row
  },

  async deleteLogo(slugRaw: string, variant: BrandLogoVariant): Promise<AdminBrandRow> {
    const slug = normalizeBrandSlug(slugRaw)
    await requireOdooBrand(slug)

    const existing = await prisma.catalogBrand.findUnique({ where: { slug } })
    if (!existing) {
      // Solo statico: non c’è nulla da cancellare in DB.
      const rows = await this.list()
      const row = rows.find((r) => r.slug === slug)
      if (!row) {
        throw new AppError('BRAND_NOT_FOUND', 'Brand not found', 'Marchio non trovato.', 404)
      }
      return row
    }

    const previousUrl = variant === 'light' ? existing.logoLightUrl : existing.logoDarkUrl
    const logoField =
      variant === 'light'
        ? { logoLightUrl: null as string | null }
        : { logoDarkUrl: null as string | null }

    const nextLight = variant === 'light' ? null : existing.logoLightUrl
    const nextDark = variant === 'dark' ? null : existing.logoDarkUrl

    if (!nextLight && !nextDark) {
      await prisma.catalogBrand.delete({ where: { slug } })
    } else {
      await prisma.catalogBrand.update({
        where: { slug },
        data: logoField,
      })
    }
    invalidateCatalogBrandAssetsCache()

    if (previousUrl && !isStaticBrandLogoUrl(previousUrl)) {
      try {
        await deleteSpacesObjectByUrl(previousUrl)
      } catch {
        /* best-effort */
      }
    }

    const rows = await this.list()
    const row = rows.find((r) => r.slug === slug)
    if (!row) {
      throw new AppError('BRAND_NOT_FOUND', 'Brand not found', 'Marchio non trovato.', 404)
    }
    return row
  },

  /** Rimuove solo i loghi BO in DB; il brand Odoo e gli asset statici restano. */
  async clearLogos(slugRaw: string): Promise<AdminBrandRow> {
    const slug = normalizeBrandSlug(slugRaw)
    await requireOdooBrand(slug)

    const existing = await prisma.catalogBrand.findUnique({ where: { slug } })
    if (existing) {
      await prisma.catalogBrand.delete({ where: { slug } })
      invalidateCatalogBrandAssetsCache()

      for (const url of [existing.logoLightUrl, existing.logoDarkUrl]) {
        if (!url || isStaticBrandLogoUrl(url)) continue
        try {
          await deleteSpacesObjectByUrl(url)
        } catch {
          /* best-effort */
        }
      }
    }

    const rows = await this.list()
    const row = rows.find((r) => r.slug === slug)
    if (!row) {
      throw new AppError('BRAND_NOT_FOUND', 'Brand not found', 'Marchio non trovato.', 404)
    }
    return row
  },
}
