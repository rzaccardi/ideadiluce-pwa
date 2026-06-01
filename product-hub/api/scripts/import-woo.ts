/**
 * Import dump WooCommerce/Yoast da product-hub/import/*.sql
 * Uso: npm run import:woo --workspace=@ideadiluce/hub-api
 */
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient, ProductStatus } from '../generated/hub-client/index.js'
import { requireHubDatabaseUrl } from './load-hub-env.js'
import {
  parsePostsSql,
  parseYoastCategoriesSql,
  parseYoastProductTermsSql,
  parseYoastProductsSql,
  permalinkToPath,
  readSqlFile,
  resolveYoastTitle,
} from './parse-woo-sql.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const importDir = resolve(__dirname, '../../import')

function pickFile(...names: string[]): string {
  for (const n of names) {
    const p = join(importDir, n)
    if (existsSync(p)) return p
  }
  throw new Error(`File non trovato in ${importDir}: ${names.join(' | ')}`)
}

async function main() {
  requireHubDatabaseUrl()

  const prisma = new PrismaClient()

  const postsPath = pickFile('wpidl_posts.sql')
  const yoastPath = pickFile('wpidl_yoast_indexable.sql')
  const catsPath = pickFile('wpidl_yoast_indexable (1).sql', 'wpidl_yoast_indexable-terms.sql')
  const termsPath = pickFile('wpidl_yoast_indexable (2).sql', 'wpidl_yoast_indexable-product-terms.sql')

  console.log('Lettura dump SQL...')
  const posts = parsePostsSql(readSqlFile(postsPath))
  const seoRows = parseYoastProductsSql(readSqlFile(yoastPath))
  const categories = parseYoastCategoriesSql(readSqlFile(catsPath))
  const productTerms = parseYoastProductTermsSql(readSqlFile(termsPath))

  const seoByPostId = new Map(seoRows.map((r) => [r.postId, r]))
  const parentProducts = posts.filter((p) => p.postType === 'product' && p.postStatus === 'publish')
  const variations = posts.filter((p) => p.postType === 'product_variation' && p.postStatus === 'publish')

  const run = await prisma.wooImportRun.create({ data: { status: 'running' } })

  try {
    console.log('Pulizia catalogo Hub (reimport)...')
    await prisma.productCategory.deleteMany()
    await prisma.productSEOTranslation.deleteMany()
    await prisma.productSEO.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.externalProductRef.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.brand.deleteMany()

    const AMBIENTI_TERM_ID = 316
    const termIdToCategoryId = new Map<number, string>()
    const termIdToBrandId = new Map<number, string>()

    console.log(`Import ${categories.length} categorie...`)
    const catByTerm = new Map(categories.map((c) => [c.termId, c]))
    const sortedCats = [...categories].sort((a, b) => a.parentTermId - b.parentTermId)

    for (const c of sortedCats) {
      const parentId =
        c.parentTermId > 0 ? (termIdToCategoryId.get(c.parentTermId) ?? null) : null
      const isRoom =
        c.termId === AMBIENTI_TERM_ID ||
        c.parentTermId === AMBIENTI_TERM_ID ||
        (catByTerm.get(c.parentTermId)?.parentTermId === AMBIENTI_TERM_ID)

      const row = await prisma.category.create({
        data: {
          wooTermId: c.termId,
          slug: c.slug,
          name: c.name,
          parentId,
          isRoom,
        },
      })
      termIdToCategoryId.set(c.termId, row.id)
    }

    const brandTerms = new Map<string, { termId: number; slug: string; name: string }>()
    for (const t of productTerms) {
      if (t.taxonomy !== 'pwb-brand') continue
      brandTerms.set(String(t.termId), { termId: t.termId, slug: t.slug, name: t.name })
    }
    console.log(`Import ${brandTerms.size} brand...`)
    for (const b of brandTerms.values()) {
      const row = await prisma.brand.create({
        data: {
          wooTermId: b.termId,
          code: b.slug,
          slug: b.slug,
          name: b.name,
        },
      })
      termIdToBrandId.set(b.termId, row.id)
    }

    const productIdByWoo = new Map<number, string>()
    let productCount = 0

    console.log(`Import ${parentProducts.length} prodotti...`)
    for (const p of parentProducts) {
      const seo = seoByPostId.get(p.id)
      const path = permalinkToPath(seo?.permalink ?? null)
      const brandLink = productTerms.find((t) => t.postId === p.id && t.taxonomy === 'pwb-brand')

      const product = await prisma.product.create({
        data: {
          wooPostId: p.id,
          slug: p.slug,
          sku: p.sku,
          status: ProductStatus.PUBLISHED,
          legacyPermalink: path,
          ogImageUrl: seo?.ogImage ?? null,
          brandId: brandLink ? (termIdToBrandId.get(brandLink.termId) ?? null) : null,
          publishedAt: new Date(),
          externalRefs: {
            create: {
              system: 'WOOCOMMERCE',
              externalId: String(p.id),
            },
          },
        },
      })
      productIdByWoo.set(p.id, product.id)
      productCount++

      const title = resolveYoastTitle(seo?.yoastTitle ?? null, p.slug.replace(/-/g, ' '))
      const seoRecord = await prisma.productSEO.create({
        data: { productId: product.id },
      })
      await prisma.productSEOTranslation.create({
        data: {
          productSEOId: seoRecord.id,
          locale: 'IT',
          metaTitle: title,
          metaDescription: seo?.yoastMetadesc ?? null,
          focusKeyword: seo?.focusKeyword ?? null,
          canonical: seo?.canonical ?? path,
          noindex: seo?.noindex ?? false,
        },
      })

      if (path) {
        const toPath = `/prodotto/${p.slug}/`
        if (path !== toPath) {
          await prisma.urlRedirect.upsert({
            where: { fromPath: path },
            create: { fromPath: path, toPath, source: 'woo_import' },
            update: { toPath },
          })
        }
      }

      const catLinks = productTerms.filter(
        (t) => t.postId === p.id && t.taxonomy === 'product_cat',
      )
      for (const cl of catLinks) {
        const categoryId = termIdToCategoryId.get(cl.termId)
        if (!categoryId) continue
        await prisma.productCategory.create({
          data: { productId: product.id, categoryId },
        })
      }
    }

    console.log(`Import ${variations.length} varianti...`)
    for (const v of variations) {
      const productId = productIdByWoo.get(v.postParent)
      if (!productId) continue
      await prisma.productVariant.create({
        data: {
          productId,
          wooPostId: v.id,
          slug: v.slug,
          sku: v.sku,
        },
      })
      await prisma.externalProductRef.create({
        data: {
          system: 'WOOCOMMERCE_VARIATION',
          externalId: String(v.id),
          productId,
          metadataJson: { parentWooId: v.postParent },
        },
      })
    }

    const stats = {
      categories: categories.length,
      brands: brandTerms.size,
      products: productCount,
      variations: variations.filter((v) => productIdByWoo.has(v.postParent)).length,
      seoRows: seoRows.length,
      productTermLinks: productTerms.length,
    }

    await prisma.wooImportRun.update({
      where: { id: run.id },
      data: { status: 'success', finishedAt: new Date(), statsJson: stats },
    })

    console.log('Import completato:', stats)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await prisma.wooImportRun.update({
      where: { id: run.id },
      data: { status: 'failed', finishedAt: new Date(), errorLog: msg },
    })
    console.error('Import fallito:', msg)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
