/**
 * Arricchisce catalogo Hub da dump completo: gallery, attributi varianti, descrizioni.
 */
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MediaKind, PrismaClient } from '../generated/hub-client/index.js'
import { requireHubDatabaseUrl } from './load-hub-env.js'
import { loadPostMetaFromDump, resolveGalleryUrls, attachmentUrl } from './parse-wp-postmeta.js'
import { parseYoastProductsSql, readSqlFile } from './parse-woo-sql.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const dumpPath = resolve(__dirname, '../../import/cvtg56_wp687_1780322176.sql')
const yoastPath = resolve(__dirname, '../../import/wpidl_yoast_indexable.sql')

function humanizeToken(s: string): string {
  return s
    .replace(/^pa_/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

async function main() {
  requireHubDatabaseUrl()

  if (!existsSync(dumpPath)) {
    console.error('Dump non trovato:', dumpPath)
    process.exit(1)
  }

  const prisma = new PrismaClient()
  console.log('Caricamento postmeta da dump (può richiedere ~1 min)...')
  const maps = await loadPostMetaFromDump(dumpPath)

  const seoRows = existsSync(yoastPath) ? parseYoastProductsSql(readSqlFile(yoastPath)) : []
  const seoByPostId = new Map(seoRows.map((r) => [r.postId, r]))

  console.log('Pulizia media e attributi varianti...')
  await prisma.productVariantAttribute.deleteMany()
  await prisma.productMedia.deleteMany()

  const products = await prisma.product.findMany({
    select: { id: true, wooPostId: true, slug: true, sku: true, ogImageUrl: true },
  })
  const variants = await prisma.productVariant.findMany({
    select: { id: true, wooPostId: true, productId: true, slug: true, sku: true },
  })

  let mediaCount = 0
  let attrCount = 0

  for (const p of products) {
    const seo = seoByPostId.get(p.wooPostId)
    const urls = resolveGalleryUrls(p.wooPostId, maps)
    if (!urls.length && p.ogImageUrl) urls.push(p.ogImageUrl)

    const mediaRows = urls.map((url, i) => ({
      productId: p.id,
      url,
      kind: i === 0 ? MediaKind.COVER : MediaKind.GALLERY,
      sortOrder: i,
      wooAttachmentId: null as number | null,
    }))
    if (mediaRows.length) {
      await prisma.productMedia.createMany({ data: mediaRows })
      mediaCount += mediaRows.length
      const cover = urls[0]
      if (cover && cover !== p.ogImageUrl) {
        await prisma.product.update({
          where: { id: p.id },
          data: { ogImageUrl: cover },
        })
      }
    }

    const shortDesc = seo?.yoastMetadesc?.slice(0, 300) ?? null
    await prisma.product.update({
      where: { id: p.id },
      data: {
        shortDescription: shortDesc,
        longDescription: seo?.yoastMetadesc ?? null,
      },
    })
  }

  for (const v of variants) {
    const attrs = maps.variantAttributeByPost.get(v.wooPostId) ?? {}
    let order = 0
    for (const [name, value] of Object.entries(attrs)) {
      await prisma.productVariantAttribute.create({
        data: {
          variantId: v.id,
          name: humanizeToken(name),
          value: humanizeToken(value),
          sortOrder: order++,
        },
      })
      attrCount++
    }

    const thumbId = maps.thumbnailIdByPost.get(v.wooPostId)
    if (thumbId) {
      const url = attachmentUrl(thumbId, maps.attachedFileByAttachment, maps.attachmentGuidByPost)
      if (url) {
        await prisma.productMedia.create({
          data: {
            productId: v.productId,
            variantId: v.id,
            url,
            kind: MediaKind.VARIANT,
            sortOrder: 0,
            wooAttachmentId: thumbId,
          },
        })
        mediaCount++
      }
    }

  }

  console.log('Enrichment completato:', {
    products: products.length,
    variants: variants.length,
    mediaCreated: mediaCount,
    attributesCreated: attrCount,
    thumbsInDump: maps.thumbnailIdByPost.size,
    galleriesInDump: maps.galleryIdsByPost.size,
  })

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
