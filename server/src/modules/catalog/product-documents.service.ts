import type { Request } from 'express'
import { prisma } from '../../lib/prisma.js'
import { writeStructuredIntegrationLog } from '../../lib/integration-log-context.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { AppError } from '../../types/errors.js'
import type { ProductDocumentDTO } from '../../types/dto.js'
import { formatOdooTemplateRef } from './odooRef.js'
import { resolveCatalogProduct } from './catalogResolver.service.js'

function collectDocuments(
  product: NonNullable<Awaited<ReturnType<typeof resolveCatalogProduct>>>,
  variantRef?: string | null,
): ProductDocumentDTO[] {
  const byId = new Map<string, ProductDocumentDTO>()
  for (const doc of product.documents ?? []) {
    if (doc.url) byId.set(doc.id, doc)
  }
  const variant = variantRef
    ? product.variants.find((v) => v.ref === variantRef)
    : product.variants[0]
  for (const doc of variant?.documents ?? []) {
    if (doc.url) byId.set(doc.id, doc)
  }
  return [...byId.values()]
}

export const productDocumentsService = {
  async resolveDownloadUrl(
    req: Request,
    slug: string,
    documentId: string,
    options?: { variantRef?: string | null; sourcePage?: string | null },
  ): Promise<string> {
    const product = await resolveCatalogProduct(req, slug)
    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Not found', 'Prodotto non trovato.', 404, false)
    }

    const doc = collectDocuments(product, options?.variantRef).find((d) => d.id === documentId)
    if (!doc?.url) {
      throw new AppError(
        'DOCUMENT_NOT_FOUND',
        'Document not found',
        'Documento non trovato.',
        404,
        false,
      )
    }

    const locale = parseHubLocale(
      typeof req.query.locale === 'string' ? req.query.locale : product.locale,
    )
    const productRef =
      product.odooTemplateId != null ? formatOdooTemplateRef(product.odooTemplateId) : product.slug

    const variantRef = options?.variantRef?.trim() || null

    await prisma.productDocumentDownload.create({
      data: {
        productSlug: product.slug,
        productRef,
        variantRef,
        documentId,
        documentName: doc.name,
        userId: req.sessionRecord?.userId ?? null,
        sessionId: req.sessionRecord?.id ?? null,
        locale,
        sourcePage: options?.sourcePage?.trim() || `pdp:${product.slug}`,
        userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
        success: true,
      },
    })

    await writeStructuredIntegrationLog({
      service: 'catalog',
      operation: 'document_download',
      correlationId: req.correlationId,
      success: true,
      userId: req.sessionRecord?.userId ?? null,
      extra: {
        productSlug: product.slug,
        productRef,
        variantRef,
        documentId,
        documentName: doc.name,
        documentType: doc.type,
        locale,
        sourcePage: options?.sourcePage?.trim() || `pdp:${product.slug}`,
      },
    })

    return doc.url
  },
}
