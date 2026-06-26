import type { Request } from 'express'
import { AppError } from '../../types/errors.js'
import type { ProductAvailabilityDataDTO, ProductDetailDTO, StockRestockRequestDTO } from '../../types/dto.js'
import { sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { resolveCatalogProductEnriched } from '../catalog/catalogResolver.service.js'
import {
  isProductRequestEligible,
  isRestockNotifyEligible,
} from '../catalog/availability.service.js'
import { formatOdooTemplateRef } from '../catalog/odooRef.js'
import type { StockRequestType } from './restock-notify.repository.js'
import { restockNotifyRepository } from './restock-notify.repository.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'

function storedProductRef(slug: string, odooTemplateId: number | null | undefined): string {
  if (odooTemplateId != null) return formatOdooTemplateRef(odooTemplateId)
  return slug
}

function resolveAvailability(
  product: ProductDetailDTO,
  variantRef: string | null,
): ProductAvailabilityDataDTO | undefined {
  const variant = variantRef
    ? product.variants.find((v) => v.ref === variantRef)
    : product.variants[0]
  return variant?.availability ?? product.availability
}

function isRequestAllowed(
  product: ProductDetailDTO,
  variantRef: string | null,
  requestType: StockRequestType,
): boolean {
  const availability = resolveAvailability(product, variantRef)

  if (requestType === 'PRODUCT_REQUEST') {
    return isProductRequestEligible(availability)
  }

  return isRestockNotifyEligible(availability)
}

function toDto(row: {
  id: string
  email: string
  productRef: string
  variantRef: string | null
  quantity: number
  productName: string | null
  requestType: string
  createdAt: Date
}): StockRestockRequestDTO {
  return {
    id: row.id,
    email: row.email,
    productRef: row.productRef,
    variantRef: row.variantRef || null,
    quantity: row.quantity,
    productName: row.productName,
    requestType: row.requestType === 'PRODUCT_REQUEST' ? 'PRODUCT_REQUEST' : 'RESTOCK_NOTIFY',
    createdAt: row.createdAt.toISOString(),
  }
}

export const restockNotifyService = {
  async requestForSlug(
    req: Request,
    slug: string,
    input: {
      email: string
      quantity: number
      variantRef?: string | null
      requestType?: StockRequestType
    },
    localeInput?: string,
  ): Promise<StockRestockRequestDTO> {
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const product = await resolveCatalogProductEnriched(ctx, slug, 'IT', input.quantity)
    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Not found', 'Prodotto non trovato.', 404, false)
    }

    const variantRef = input.variantRef?.trim() || null
    const requestType: StockRequestType = input.requestType ?? 'RESTOCK_NOTIFY'

    if (variantRef && product.variants.length && !product.variants.some((v) => v.ref === variantRef)) {
      throw new AppError(
        'VARIANT_NOT_FOUND',
        'Unknown product variant',
        'Variante prodotto non disponibile.',
        400,
        false,
      )
    }

    if (!isRequestAllowed(product, variantRef, requestType)) {
      const message =
        requestType === 'PRODUCT_REQUEST'
          ? 'Questo prodotto è ancora ordinabile o disponibile: puoi aggiungerlo al carrello.'
          : 'Il prodotto è già disponibile: puoi aggiungerlo al carrello.'
      throw new AppError('PRODUCT_IN_STOCK', 'Product not eligible', message, 409, false)
    }

    const { row, created } = await restockNotifyRepository.upsert({
      email: input.email.trim().toLowerCase(),
      productRef: storedProductRef(product.slug, product.odooTemplateId),
      variantRef: variantRef || null,
      quantity: input.quantity,
      locale: parseHubLocale(localeInput ?? product.locale),
      productName: product.name,
      userId: req.sessionRecord?.userId ?? null,
      requestType,
    })

    if (created) {
      const typeLabel =
        requestType === 'PRODUCT_REQUEST' ? 'Richiesta prodotto (fuori stock)' : 'Avvisami al restock'
      logger.info('restock-notify.request', {
        id: row.id,
        productRef: row.productRef,
        email: row.email,
        requestType,
      })
      try {
        await sendMail({
          to: 'info@ideadiluce.com',
          subject: `[Idea di Luce] ${typeLabel} — ${product.name}`,
          text: [
            `Tipo: ${typeLabel}`,
            `Prodotto: ${product.name}`,
            `Riferimento: ${row.productRef}`,
            variantRef ? `Variante: ${variantRef}` : null,
            `Quantità: ${row.quantity}`,
            `Email cliente: ${row.email}`,
            `Lingua: ${row.locale}`,
            `ID richiesta: ${row.id}`,
            `Pagina: ${product.slug}`,
          ]
            .filter(Boolean)
            .join('\n'),
        })
      } catch (e) {
        logger.warn('restock-notify.admin_mail_failed', {
          id: row.id,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    return toDto(row)
  },
}
