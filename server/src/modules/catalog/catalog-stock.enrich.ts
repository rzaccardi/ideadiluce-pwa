import {
  fetchFirstVariantIdsForTemplates,
  fetchVariantStockByIds,
  type VariantStockSnapshot,
} from '../../adapters/odoo/odooInventoryAdapter.js'
import { deriveInStockFromAvailability } from '../../adapters/arfly/arflyParsers.js'
import { env } from '../../config/env.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type {
  CartLineAvailabilityDTO,
  ProductAvailabilityDataDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ProductVariantDTO,
} from '../../types/dto.js'
import { parseOdooVariantId } from './odooRef.js'
import {
  mergeAvailabilityData,
  resolveVariantAvailability,
  snapshotToAvailabilityData,
  variantAvailabilityToCartLine,
} from './availability.service.js'

export type ProductCardStockHint = ProductCardDTO & {
  odooTemplateId?: number | null
}

function defaultStockSnapshot(): VariantStockSnapshot {
  return {
    variantId: 0,
    stockQty: null,
    leadTimeDays: null,
    restockDate: null,
    saleOk: true,
    orderable: true,
  }
}

function shouldEnrichFromOdoo(): boolean {
  return env.ODOO_ENABLED && isOdooConfigured()
}

function resolveVariantId(variant: ProductVariantDTO): number | null {
  if (variant.odooVariantId != null && variant.odooVariantId > 0) {
    return variant.odooVariantId
  }
  return parseOdooVariantId(variant.ref)
}

function pickLineVariant(
  product: ProductDetailDTO,
  variantRef: string | null,
): ProductVariantDTO | undefined {
  return (
    product.variants.find((variant) => variant.ref === variantRef) ??
    product.variants.find((variant) => String(variant.odooVariantId) === variantRef) ??
    product.variants[0]
  )
}

function resolveLineVariantTarget(
  product: ProductDetailDTO,
  variantRef: string | null,
): { variantId: number | null; templateId: number | null } {
  const variant = pickLineVariant(product, variantRef)
  const fromVariant = variant ? resolveVariantId(variant) : null
  if (fromVariant != null) return { variantId: fromVariant, templateId: null }

  const parsedVariant = parseOdooVariantId(variantRef)
  if (parsedVariant != null) return { variantId: parsedVariant, templateId: null }

  if (product.odooTemplateId != null && product.variants.length === 0) {
    return { variantId: null, templateId: product.odooTemplateId }
  }

  return { variantId: null, templateId: null }
}

function availabilityForCartLine(
  product: ProductDetailDTO,
  line: { variantRef: string | null; quantity: number },
  stockMap: Map<number, VariantStockSnapshot>,
  variantByTemplate: Map<number, number>,
): CartLineAvailabilityDTO & { purchasable: boolean } {
  const variant = pickLineVariant(product, line.variantRef)
  const { variantId, templateId } = resolveLineVariantTarget(product, line.variantRef)
  const resolvedVariantId =
    variantId ?? (templateId != null ? (variantByTemplate.get(templateId) ?? null) : null)

  let availabilityData = variant?.availability ?? product.availability
  if (shouldEnrichFromOdoo() && resolvedVariantId != null) {
    const snapshot = stockMap.get(resolvedVariantId) ?? defaultStockSnapshot()
    availabilityData = mergeAvailabilityData(
      availabilityData,
      snapshotToAvailabilityData(snapshot, line.quantity),
    )
  }

  if (!availabilityData) {
    return {
      state: 'available',
      stockQty: variant?.stockQty ?? null,
      effectiveLeadDays: null,
      warning: null,
      purchasable: true,
    }
  }

  const resolved = resolveVariantAvailability(
    {
      stockQty: availabilityData.qtyAvailable,
      restockDate: availabilityData.restockDate,
      leadTimeDays: availabilityData.customerLeadTimeDays,
      saleOk: !availabilityData.isUnrecoverable,
      orderable: availabilityData.isOrderable,
    },
    line.quantity,
  )
  return variantAvailabilityToCartLine(resolved)
}

function applyAvailabilityToVariant(
  variant: ProductVariantDTO,
  snapshot: VariantStockSnapshot,
  requestedQty = 1,
): ProductVariantDTO {
  const odooAvailability = snapshotToAvailabilityData(snapshot, requestedQty)
  const availability = mergeAvailabilityData(variant.availability, odooAvailability)
  return {
    ...variant,
    stockQty: availability.qtyAvailable,
    availability,
    inStock: deriveInStockFromAvailability(availability),
  }
}

function productInStockFromVariants(variants: ProductVariantDTO[]): boolean {
  if (variants.length === 0) return true
  return variants.some((v) => v.inStock !== false)
}

function primaryAvailability(
  variants: ProductVariantDTO[],
  fallback?: ProductAvailabilityDataDTO,
): ProductAvailabilityDataDTO | undefined {
  const fromVariant =
    variants.find((v) => v.availability && deriveInStockFromAvailability(v.availability))?.availability ??
    variants[0]?.availability
  return fromVariant ?? fallback
}

export async function enrichProductDetailWithStock(
  ctx: OdooCallContext,
  product: ProductDetailDTO,
  requestedQty = 1,
): Promise<ProductDetailDTO> {
  if (!shouldEnrichFromOdoo()) {
    return {
      ...product,
      inStock: deriveInStockFromAvailability(product.availability) && product.inStock !== false,
    }
  }

  if (product.variants.length === 0) {
    const templateIds = product.odooTemplateId != null ? [product.odooTemplateId] : []
    const variantByTemplate = await fetchFirstVariantIdsForTemplates(ctx, templateIds)
    const variantId = product.odooTemplateId != null ? variantByTemplate.get(product.odooTemplateId) : null
    const stockMap = variantId != null ? await fetchVariantStockByIds(ctx, [variantId]) : new Map()
    const snapshot =
      variantId != null ? (stockMap.get(variantId) ?? defaultStockSnapshot()) : defaultStockSnapshot()
    const availability = mergeAvailabilityData(
      product.availability,
      snapshotToAvailabilityData(snapshot, requestedQty),
    )
    return {
      ...product,
      availability,
      inStock: deriveInStockFromAvailability(availability),
    }
  }

  const variantIds = product.variants
    .map(resolveVariantId)
    .filter((id): id is number => id != null)
  const stockMap = await fetchVariantStockByIds(ctx, variantIds)

  const variants = product.variants.map((variant) => {
    const variantId = resolveVariantId(variant)
    const snapshot =
      variantId != null ? (stockMap.get(variantId) ?? defaultStockSnapshot()) : defaultStockSnapshot()
    return applyAvailabilityToVariant(variant, snapshot, requestedQty)
  })

  const availability = primaryAvailability(variants, product.availability)

  return {
    ...product,
    variants,
    availability,
    inStock: productInStockFromVariants(variants),
  }
}

export async function enrichProductCardsWithStock(
  ctx: OdooCallContext,
  items: ProductCardStockHint[],
): Promise<ProductCardDTO[]> {
  if (!shouldEnrichFromOdoo()) {
    return items.map(({ odooTemplateId: _omit, ...item }) => ({
      ...item,
      inStock: deriveInStockFromAvailability(item.availability) && item.inStock !== false,
    }))
  }

  const templateIds = items
    .map((item) => item.odooTemplateId)
    .filter((id): id is number => id != null && id > 0)

  if (templateIds.length === 0) {
    return items.map(({ odooTemplateId: _omit, ...item }) => ({
      ...item,
      inStock: deriveInStockFromAvailability(item.availability) && item.inStock !== false,
    }))
  }

  const variantByTemplate = await fetchFirstVariantIdsForTemplates(ctx, templateIds)
  const variantIds = [...variantByTemplate.values()]
  const stockByVariant = await fetchVariantStockByIds(ctx, variantIds)

  return items.map(({ odooTemplateId, ...item }) => {
    if (odooTemplateId == null) {
      return { ...item, inStock: deriveInStockFromAvailability(item.availability) && item.inStock !== false }
    }
    const variantId = variantByTemplate.get(odooTemplateId)
    const snapshot =
      variantId != null
        ? (stockByVariant.get(variantId) ?? defaultStockSnapshot())
        : defaultStockSnapshot()
    const availability = mergeAvailabilityData(
      item.availability,
      snapshotToAvailabilityData(snapshot, 1),
    )
    return {
      ...item,
      sku: item.sku ?? snapshot.defaultCode ?? null,
      availability,
      inStock: deriveInStockFromAvailability(availability),
    }
  })
}

export async function buildCartAvailabilityLookup(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
  productResolver: (productRef: string) => Promise<ProductDetailDTO | null>,
): Promise<Map<string, CartLineAvailabilityDTO & { purchasable: boolean }>> {
  const lookup = new Map<string, CartLineAvailabilityDTO & { purchasable: boolean }>()

  const uniqueRefs = [...new Set(lines.map((line) => line.productRef))]
  const resolvedProducts = await Promise.all(uniqueRefs.map((ref) => productResolver(ref)))
  const productByRef = new Map(
    uniqueRefs.map((ref, index) => [ref, resolvedProducts[index] ?? null]),
  )

  const lineKeys = lines.map((line) => ({
    line,
    key: `${line.productRef}:${line.variantRef ?? ''}`,
  }))

  const uniqueLineKeys = lineKeys.filter(
    ({ key }, index, arr) => arr.findIndex((x) => x.key === key) === index,
  )

  const templateIdsForLookup = new Set<number>()
  const variantIdsToFetch = new Set<number>()

  for (const { line } of uniqueLineKeys) {
    const product = productByRef.get(line.productRef)
    if (!product) continue
    const { variantId, templateId } = resolveLineVariantTarget(product, line.variantRef)
    if (variantId != null) variantIdsToFetch.add(variantId)
    else if (templateId != null) templateIdsForLookup.add(templateId)
  }

  const variantByTemplate =
    shouldEnrichFromOdoo() && templateIdsForLookup.size > 0
      ? await fetchFirstVariantIdsForTemplates(ctx, [...templateIdsForLookup])
      : new Map<number, number>()

  for (const variantId of variantByTemplate.values()) {
    variantIdsToFetch.add(variantId)
  }

  const stockMap =
    shouldEnrichFromOdoo() && variantIdsToFetch.size > 0
      ? await fetchVariantStockByIds(ctx, [...variantIdsToFetch])
      : new Map<number, VariantStockSnapshot>()

  for (const { line, key } of uniqueLineKeys) {
    if (lookup.has(key)) continue

    const product = productByRef.get(line.productRef)
    if (!product) {
      lookup.set(key, {
        state: 'out_of_stock',
        stockQty: null,
        effectiveLeadDays: null,
        warning: 'Prodotto non più disponibile.',
        purchasable: false,
      })
      continue
    }

    lookup.set(key, availabilityForCartLine(product, line, stockMap, variantByTemplate))
  }

  return lookup
}

/** Stock Odoo solo per la variante della riga (add/patch carrello), non tutte le varianti. */
export async function enrichCartLineProduct(
  ctx: OdooCallContext,
  product: ProductDetailDTO,
  variantRef: string | null,
  quantity: number,
): Promise<ProductDetailDTO> {
  if (!shouldEnrichFromOdoo()) {
    return {
      ...product,
      inStock: deriveInStockFromAvailability(product.availability) && product.inStock !== false,
    }
  }

  const { variantId, templateId } = resolveLineVariantTarget(product, variantRef)
  const variantByTemplate =
    templateId != null
      ? await fetchFirstVariantIdsForTemplates(ctx, [templateId])
      : new Map<number, number>()
  const resolvedVariantId =
    variantId ?? (templateId != null ? (variantByTemplate.get(templateId) ?? null) : null)

  if (resolvedVariantId == null) return product

  const stockMap = await fetchVariantStockByIds(ctx, [resolvedVariantId])
  const snapshot = stockMap.get(resolvedVariantId) ?? defaultStockSnapshot()
  const targetVariant = pickLineVariant(product, variantRef)

  if (targetVariant) {
    const variants = product.variants.map((variant) =>
      variant.ref === targetVariant.ref ||
      String(variant.odooVariantId) === String(targetVariant.odooVariantId)
        ? applyAvailabilityToVariant(variant, snapshot, quantity)
        : variant,
    )
    const availability = primaryAvailability(variants, product.availability)
    return {
      ...product,
      variants,
      availability,
      inStock: productInStockFromVariants(variants),
    }
  }

  const availability = mergeAvailabilityData(
    product.availability,
    snapshotToAvailabilityData(snapshot, quantity),
  )
  return {
    ...product,
    availability,
    inStock: deriveInStockFromAvailability(availability),
  }
}

/** Verifica acquistabilità righe (Arfly + Odoo arricchiti). Consente qty > stock se ordinabile. */
export async function assertCartLinesPurchasable(
  ctx: OdooCallContext,
  lines: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
): Promise<void> {
  if (lines.length === 0) return

  const { resolveCatalogProductEnriched } = await import('./catalogResolver.service.js')
  const { AppError } = await import('../../types/errors.js')

  const lookup = await buildCartAvailabilityLookup(ctx, lines, (productRef) => {
    const line = lines.find((l) => l.productRef === productRef)
    return resolveCatalogProductEnriched(ctx, productRef, 'IT', line?.quantity ?? 1)
  })

  for (const line of lines) {
    const key = `${line.productRef}:${line.variantRef ?? ''}`
    const avail = lookup.get(key)
    if (!avail?.purchasable) {
      throw new AppError(
        'STOCK_UNAVAILABLE',
        'Product not purchasable',
        avail?.warning ?? 'Uno o più prodotti non sono più disponibili. Aggiorna il carrello.',
        409,
        false,
      )
    }
  }
}
