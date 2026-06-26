/**
 * Estrae tabelle «Caratteristiche tecniche» dalle descrizioni HTML e popola ProductTechnicalSpec.
 * Ripulisce longDescription (prodotto + traduzioni IT).
 */
import { PrismaClient } from '../generated/hub-client/index.js'
import { normalizeWooContent } from '../src/normalize-woo-content.js'
import {
  extractTechnicalSpecsFromDescription,
  hasAnyTechnicalSpec,
} from '../src/product-technical-specs.js'
import { technicalSpecsToPrismaData } from '../src/product-technical-specs-db.js'
import { requireHubDatabaseUrl } from './load-hub-env.js'

async function main() {
  requireHubDatabaseUrl()
  const prisma = new PrismaClient()

  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      longDescription: true,
      shortDescription: true,
      technicalSpec: true,
      translations: { select: { locale: true, longDescription: true } },
    },
  })

  let specsCreated = 0
  let specsUpdated = 0
  let descriptionsCleaned = 0

  for (const p of products) {
    const long = normalizeWooContent(p.longDescription)
    if (!long?.trim()) continue

    const existing = p.technicalSpec
      ? {
          specsIntro: p.technicalSpec.specsIntro,
          productCode: p.technicalSpec.productCode,
          lightSource: p.technicalSpec.lightSource,
          lampType: p.technicalSpec.lampType,
          lampHolder: p.technicalSpec.lampHolder,
          power: p.technicalSpec.power,
          lightColor: p.technicalSpec.lightColor,
          colorRenderingIndex: p.technicalSpec.colorRenderingIndex,
          luminousFlux: p.technicalSpec.luminousFlux,
          dimmable: p.technicalSpec.dimmable,
          energyClass: p.technicalSpec.energyClass,
          estimatedLifetime: p.technicalSpec.estimatedLifetime,
          dimensions: p.technicalSpec.dimensions,
          production: p.technicalSpec.production,
          technicalManual: p.technicalSpec.technicalManual,
        }
      : null

    const { specs, descriptionHtml } = extractTechnicalSpecsFromDescription(long, existing)
    const hasSpecs = hasAnyTechnicalSpec(specs)
    const longChanged = descriptionHtml !== long

    if (!hasSpecs && !longChanged) continue

    if (hasSpecs) {
      const data = technicalSpecsToPrismaData(specs)
      if (p.technicalSpec) {
        await prisma.productTechnicalSpec.update({
          where: { productId: p.id },
          data,
        })
        specsUpdated++
      } else {
        await prisma.productTechnicalSpec.create({
          data: { productId: p.id, ...data },
        })
        specsCreated++
      }
    }

    if (longChanged) {
      await prisma.product.update({
        where: { id: p.id },
        data: { longDescription: descriptionHtml },
      })
      descriptionsCleaned++

      const itTrans = p.translations.find((t) => t.locale === 'IT')
      if (itTrans?.longDescription) {
        const itLong = normalizeWooContent(itTrans.longDescription)
        const itResult = extractTechnicalSpecsFromDescription(itLong, specs)
        if (itResult.descriptionHtml !== itLong) {
          await prisma.productTranslation.update({
            where: { productId_locale: { productId: p.id, locale: 'IT' } },
            data: { longDescription: itResult.descriptionHtml },
          })
        }
      }
    }
  }

  console.log('Estrazione caratteristiche tecniche:', {
    products: products.length,
    specsCreated,
    specsUpdated,
    descriptionsCleaned,
  })

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
