import type { Request } from 'express'
import {
  fetchOdooCatalogProductDetail,
  fetchOdooCatalogProductList,
  isOdooCatalogConfigured,
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { mapOdooCatalogProductDetail } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import type { OdooCatalogVariant } from '../../adapters/odoo-catalog/odooCatalog.types.js'
import { findOdooVariantByCode } from '../../adapters/odoo/odooProductCodeLookup.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { formatOdooTemplateRef, formatOdooVariantRef, parseOdooTemplateId } from './odooRef.js'
import { matchOdooCatalogVariant } from './catalog-code-match.js'
import type { ParsedCodeLine } from './catalog-code-parser.js'
import type {
  ResolveCodesResultDTO,
  ResolvedCodeLineDTO,
  UnresolvedCodeLineDTO,
} from '../../types/dto.js'

type OdooCatalogPricing = {
  partnerId?: number
  pricelistId?: number
}

function variantLabel(variant: OdooCatalogVariant): string {
  const attrs = variant.attributes?.map((a) => a.value).filter(Boolean).join(' · ')
  return attrs || variant.ced || variant.manufacturer_code || String(variant.id)
}

async function resolveViaOdooCatalog(
  _ctx: OdooCallContext,
  code: string,
  locale: HubLocale,
  _pricing: OdooCatalogPricing,
): Promise<Omit<ResolvedCodeLineDTO, 'code' | 'quantity'> | null> {
  if (!isOdooCatalogConfigured()) return null

  const templateId = parseOdooTemplateId(code)
  if (templateId != null) {
    try {
      const detail = await fetchOdooCatalogProductDetail(templateId, locale)
      const matched = matchOdooCatalogVariant(detail.product.variants ?? [], code)
      const variant = matched?.variant ?? detail.product.variants?.[0]
      if (!variant) return null
      const product = mapOdooCatalogProductDetail(detail.product, locale)
      return {
        productRef: formatOdooTemplateRef(product.odooTemplateId ?? templateId),
        variantRef: formatOdooVariantRef(variant.id),
        productName: product.name,
        variantLabel: variantLabel(variant),
        imageUrl: product.imageUrl,
        matchType: matched?.matchType ?? 'odooCatalog_template_id',
      }
    } catch {
      // fallback ricerca sotto
    }
  }

  // Ricerca codice: scan lista contratto + dettaglio by id (niente ?q= sull'upstream).
  let page = 1
  while (page <= 10) {
    const list = await fetchOdooCatalogProductList({
      locale,
      page,
      perPage: 100,
    })

    for (const item of list.items) {
      let detail
      try {
        detail = await fetchOdooCatalogProductDetail(item.id, locale)
      } catch {
        continue
      }

      const matched = matchOdooCatalogVariant(detail.product.variants ?? [], code)
      if (!matched) continue

      const product = mapOdooCatalogProductDetail(detail.product, locale)
      return {
        productRef: formatOdooTemplateRef(product.odooTemplateId ?? item.id),
        variantRef: formatOdooVariantRef(matched.variant.id),
        productName: product.name,
        variantLabel: variantLabel(matched.variant),
        imageUrl: product.imageUrl,
        matchType: matched.matchType,
      }
    }

    if (page >= list.total_pages) break
    page += 1
  }

  return null
}

async function resolveSingleCode(
  ctx: OdooCallContext,
  code: string,
  quantity: number,
  locale: HubLocale,
  pricing: OdooCatalogPricing,
): Promise<ResolvedCodeLineDTO | UnresolvedCodeLineDTO> {
  const odooMatch = await findOdooVariantByCode(ctx, code)
  if (odooMatch) {
    let productName = code
    let variantLabel: string | null = odooMatch.defaultCode ?? odooMatch.barcode
    let imageUrl: string | null = null

    if (isOdooCatalogConfigured()) {
      try {
        const detail = await fetchOdooCatalogProductDetail(odooMatch.templateId, locale)
        const product = mapOdooCatalogProductDetail(detail.product, locale)
        productName = product.name
        imageUrl = product.imageUrl
        const variant = product.variants.find((v) => v.odooVariantId === odooMatch.variantId)
        if (variant) variantLabel = variant.label
      } catch {
        // mantieni dati Odoo minimi
      }
    }

    return {
      code,
      quantity,
      productRef: formatOdooTemplateRef(odooMatch.templateId),
      variantRef: formatOdooVariantRef(odooMatch.variantId),
      productName,
      variantLabel,
      imageUrl,
      matchType: odooMatch.matchField === 'barcode' ? 'odoo_barcode' : 'odoo_sku',
    }
  }

  const odooCatalogMatch = await resolveViaOdooCatalog(ctx, code, locale, pricing)
  if (odooCatalogMatch) {
    return { code, quantity, ...odooCatalogMatch }
  }

  return {
    code,
    quantity,
    reason: 'Codice non riconosciuto nel catalogo.',
  }
}

export async function resolveProductCodes(
  req: Request,
  lines: ParsedCodeLine[],
  localeInput?: string,
): Promise<ResolveCodesResultDTO> {
  const ctx: OdooCallContext = { correlationId: req.correlationId, req }
  const locale = parseHubLocale(localeInput)
  const pricingCtx = await resolvePricingContext(req)
  const pricing: OdooCatalogPricing = {
    partnerId: pricingCtx.partnerId ?? undefined,
    pricelistId: pricingCtx.pricelistId ?? undefined,
  }

  const matched: ResolvedCodeLineDTO[] = []
  const unmatched: UnresolvedCodeLineDTO[] = []

  for (const line of lines) {
    const result = await resolveSingleCode(ctx, line.code, line.quantity, locale, pricing)
    if ('reason' in result) {
      unmatched.push(result)
    } else {
      matched.push(result)
    }
  }

  return { matched, unmatched }
}
