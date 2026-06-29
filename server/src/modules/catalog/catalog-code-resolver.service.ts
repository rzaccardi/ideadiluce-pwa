import type { Request } from 'express'
import {
  fetchArflyProductDetail,
  fetchArflyProductList,
  isArflyConfigured,
} from '../../adapters/arfly/arflyClient.js'
import { mapArflyProductDetail } from '../../adapters/arfly/arflyMapper.js'
import type { ArflyVariant } from '../../adapters/arfly/arfly.types.js'
import { findOdooVariantByCode } from '../../adapters/odoo/odooProductCodeLookup.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { formatOdooTemplateRef, formatOdooVariantRef, parseOdooTemplateId } from './odooRef.js'
import { matchArflyVariant } from './catalog-code-match.js'
import type { ParsedCodeLine } from './catalog-code-parser.js'
import type {
  ResolveCodesResultDTO,
  ResolvedCodeLineDTO,
  UnresolvedCodeLineDTO,
} from '../../types/dto.js'

type ArflyPricing = {
  partnerId?: number
  pricelistId?: number
}

function variantLabel(variant: ArflyVariant): string {
  const attrs = variant.attributes?.map((a) => a.value).filter(Boolean).join(' · ')
  return attrs || variant.ced || variant.manufacturer_code || String(variant.id)
}

async function resolveViaArfly(
  _ctx: OdooCallContext,
  code: string,
  locale: HubLocale,
  pricing: ArflyPricing,
): Promise<Omit<ResolvedCodeLineDTO, 'code' | 'quantity'> | null> {
  if (!isArflyConfigured()) return null

  const normalized = code.trim()
  const templateId = parseOdooTemplateId(code)
  if (templateId != null) {
    try {
      const detail = await fetchArflyProductDetail(templateId, locale, pricing)
      const matched = matchArflyVariant(detail.product.variants ?? [], code)
      const variant = matched?.variant ?? detail.product.variants?.[0]
      if (!variant) return null
      const product = mapArflyProductDetail(detail.product, locale)
      return {
        productRef: formatOdooTemplateRef(product.odooTemplateId ?? templateId),
        variantRef: formatOdooVariantRef(variant.id),
        productName: product.name,
        variantLabel: variantLabel(variant),
        imageUrl: product.imageUrl,
        matchType: matched?.matchType ?? 'arfly_template_id',
      }
    } catch {
      // fallback ricerca sotto
    }
  }

  const list = await fetchArflyProductList({
    locale,
    page: 1,
    perPage: 15,
    q: normalized,
    partnerId: pricing.partnerId,
    pricelistId: pricing.pricelistId,
  })

  for (const item of list.items) {
    let detail
    try {
      detail = await fetchArflyProductDetail(item.id, locale, pricing)
    } catch {
      continue
    }

    const matched = matchArflyVariant(detail.product.variants ?? [], code)
    if (!matched) continue

    const product = mapArflyProductDetail(detail.product, locale)
    return {
      productRef: formatOdooTemplateRef(product.odooTemplateId ?? item.id),
      variantRef: formatOdooVariantRef(matched.variant.id),
      productName: product.name,
      variantLabel: variantLabel(matched.variant),
      imageUrl: product.imageUrl,
      matchType: matched.matchType,
    }
  }

  return null
}

async function resolveSingleCode(
  ctx: OdooCallContext,
  code: string,
  quantity: number,
  locale: HubLocale,
  pricing: ArflyPricing,
): Promise<ResolvedCodeLineDTO | UnresolvedCodeLineDTO> {
  const odooMatch = await findOdooVariantByCode(ctx, code)
  if (odooMatch) {
    let productName = code
    let variantLabel: string | null = odooMatch.defaultCode ?? odooMatch.barcode
    let imageUrl: string | null = null

    if (isArflyConfigured()) {
      try {
        const detail = await fetchArflyProductDetail(odooMatch.templateId, locale, pricing)
        const product = mapArflyProductDetail(detail.product, locale)
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

  const arflyMatch = await resolveViaArfly(ctx, code, locale, pricing)
  if (arflyMatch) {
    return { code, quantity, ...arflyMatch }
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
  const pricing: ArflyPricing = {
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
