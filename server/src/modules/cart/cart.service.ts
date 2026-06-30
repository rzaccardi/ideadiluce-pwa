import { prisma } from '../../lib/prisma.js'
import type { Cart, CartItem } from '@prisma/client'
import { AppError } from '../../types/errors.js'
import type { Request } from 'express'
import type { HubLocale } from '../../lib/hub-locale.js'
import { resolveCatalogProduct, resolveCatalogProductEnriched } from '../catalog/catalogResolver.service.js'
import { formatOdooTemplateRef, formatOdooVariantRef, parseOdooTemplateId, parseOdooVariantId } from '../catalog/odooRef.js'
import { fetchArflyProductList, isArflyConfigured } from '../../adapters/arfly/arflyClient.js'
import { mapArflyListItem } from '../../adapters/arfly/arflyMapper.js'
import { env } from '../../config/env.js'
import { cartRepository } from './cart.repository.js'
import { mapCartToDTO } from './cart.mappers.js'
import { resolveCartLineAvailabilityStatus } from './cart-line-availability.js'
import { shippingService } from '../shipping/shipping.service.js'
import {
  bumpCartReservation,
  expireCartIfNeeded,
  isCartReservationEnabled,
} from './cart.reservation.js'
import { syncCartContactEmail } from './cart-contact.service.js'
import { checkCartStock } from '../../adapters/odoo/odooInventoryAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { repriceCartFromOdoo } from '../catalog/odooPricing.service.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import {
  applyCheckoutPriceSnapshot,
  findActiveCheckoutPriceFreeze,
  parseCheckoutPriceSnapshot,
} from './cart-price-freeze.service.js'
import { buildCartAvailabilityLookup } from '../catalog/catalog-stock.enrich.js'
import { resolveVariantAvailability, variantAvailabilityToCartLine } from '../catalog/availability.service.js'
import { taxService } from '../tax/tax.service.js'
import { normalizeCountryCode } from '../tax/tax.constants.js'
import type { CartStockCheckDTO, ProductCardDTO, ProductDetailDTO, CartLineAvailabilityDTO, CartDTO } from '../../types/dto.js'
import type { PricingContext } from '../pricing/pricelist.service.js'
import { enrichCartLineProduct } from '../catalog/catalog-stock.enrich.js'
import { unitPriceCentsFromOdoo } from '../catalog/odooPricing.service.js'
import { subtotalCentsFromCartItems } from './cartTotals.js'
import type { CartAddProductHint } from './cart.validators.js'

function storedProductRef(product: ProductDetailDTO): string {
  if (product.odooTemplateId != null) {
    return formatOdooTemplateRef(product.odooTemplateId)
  }
  return product.slug
}

type CartCatalogEntry = {
  priceCents: number
  slug: string
  name: string
  imageUrl: string | null
}

async function resolveProductMapForCartLines(
  ctx: OdooCallContext,
  items: { productRef: string }[],
  locale: HubLocale = 'IT',
): Promise<Map<string, ProductDetailDTO | null>> {
  const uniqueRefs = [...new Set(items.map((item) => item.productRef))]
  const resolved = await Promise.all(
    uniqueRefs.map((productRef) => resolveCatalogProduct(ctx, productRef, locale)),
  )
  return new Map(uniqueRefs.map((productRef, index) => [productRef, resolved[index] ?? null]))
}

function catalogMapFromProducts(
  productByRef: Map<string, ProductDetailDTO | null>,
  seed: Map<string, CartCatalogEntry> = new Map(),
): Map<string, CartCatalogEntry> {
  const map = new Map(seed)
  for (const [productRef, product] of productByRef) {
    if (!product || map.has(productRef)) continue
    map.set(productRef, {
      priceCents: product.priceCents,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
    })
  }
  return map
}

async function catalogMapForCart(
  items: { productRef: string }[],
  correlationId: string,
  seed: Map<string, CartCatalogEntry> = new Map(),
): Promise<Map<string, CartCatalogEntry>> {
  const uniqueRefs = [...new Set(items.map((item) => item.productRef))].filter((ref) => !seed.has(ref))
  if (uniqueRefs.length === 0) return new Map(seed)
  const productByRef = await resolveProductMapForCartLines(
    { correlationId },
    items.filter((item) => uniqueRefs.includes(item.productRef)),
  )
  return catalogMapFromProducts(productByRef, seed)
}

async function catalogAndAvailabilityForCart(
  req: Request,
  items: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
  catalogSeed: Map<string, CartCatalogEntry>,
): Promise<{
  catalog: Map<string, CartCatalogEntry>
  availability: Map<string, CartLineAvailabilityDTO & { purchasable: boolean }>
}> {
  const ctx: OdooCallContext = { correlationId: req.correlationId, req }
  const productByRef = await resolveProductMapForCartLines(ctx, items)
  const catalog = catalogMapFromProducts(productByRef, catalogSeed)
  const availability = await buildCartAvailabilityLookup(
    ctx,
    items,
    async () => null,
    productByRef,
  )
  return { catalog, availability }
}

function priceMapFromCatalog(catalog: Map<string, CartCatalogEntry>): Map<string, number> {
  return new Map([...catalog.entries()].map(([ref, entry]) => [ref, entry.priceCents]))
}

function displayMapFromCatalog(
  catalog: Map<string, CartCatalogEntry>,
): Map<string, { slug: string; name: string; imageUrl: string | null }> {
  return new Map(
    [...catalog.entries()].map(([ref, entry]) => [
      ref,
      { slug: entry.slug, name: entry.name, imageUrl: entry.imageUrl },
    ]),
  )
}

async function arflyRecommendationCards(limit: number): Promise<ProductCardDTO[]> {
  if (!isArflyConfigured()) return []
  const list = await fetchArflyProductList({ locale: 'IT', page: 1, perPage: limit })
  return list.items.map((item) => mapArflyListItem(item, 'IT'))
}

function assertSession(req: Request) {
  const s = req.sessionRecord
  if (!s) {
    throw new AppError(
      'NO_SESSION',
      'Session missing',
      'Sessione non disponibile.',
      500,
      false,
    )
  }
  return s
}

async function resolveOrCreateCart(req: Request) {
  const session = assertSession(req)
  let cart =
    (session.userId
      ? await cartRepository.findActiveByUser(session.userId)
      : null) ?? (await cartRepository.findActiveBySession(session.id))

  if (!cart) {
    cart = await cartRepository.create({
      currencyCode: 'EUR',
      status: 'ACTIVE',
      session: { connect: { id: session.id } },
      ...(session.userId ? { user: { connect: { id: session.userId } } } : {}),
    })
  } else if (session.userId && !cart.userId) {
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { user: { connect: { id: session.userId } } },
      include: { items: true },
    })
    await syncCartContactEmail(cart.id)
  } else if (session.userId) {
    await syncCartContactEmail(cart.id)
  }
  return cart
}

type CartMutationLineContext = {
  productRef: string
  variantRef: string | null
  availability: CartLineAvailabilityDTO & { purchasable: boolean }
  catalog: CartCatalogEntry
}

type DtoFromCartOptions = {
  reprice?: boolean
  /** Dopo add/patch/remove: salta reprice Odoo e lookup stock su tutte le righe. */
  fastMutation?: boolean | CartMutationLineContext
}

const OPTIMISTIC_LINE_AVAILABILITY: CartLineAvailabilityDTO & { purchasable: boolean } = {
  state: 'available',
  stockQty: null,
  effectiveLeadDays: null,
  warning: null,
  purchasable: true,
}

function buildMutationAvailabilityLookup(
  items: Array<{ productRef: string; variantRef: string | null }>,
  mutation?: { key: string; availability: CartLineAvailabilityDTO & { purchasable: boolean } },
): Map<string, CartLineAvailabilityDTO & { purchasable: boolean }> {
  const lookup = new Map<string, CartLineAvailabilityDTO & { purchasable: boolean }>()
  for (const line of items) {
    const key = `${line.productRef}:${line.variantRef ?? ''}`
    lookup.set(
      key,
      mutation?.key === key ? mutation.availability : OPTIMISTIC_LINE_AVAILABILITY,
    )
  }
  return lookup
}

async function persistCartTotalsEstimate(
  cartId: string,
  items: Array<{ quantity: number; clientUnitPriceEstimate: number | null }>,
  pricing: PricingContext,
  shipCountry: string,
  shippingCents: number | null,
) {
  const subtotal = subtotalCentsFromCartItems(items)
  if (subtotal == null) return
  const taxBreakdown = await taxService.estimateForCart(subtotal, shipCountry, {
    customerSegment: pricing.segment,
    isProfessional: pricing.segment === 'PROFESSIONAL',
  })
  const shipping = shippingCents ?? 0
  await cartRepository.updateTotals(cartId, {
    estimatedSubtotal: subtotal,
    estimatedTax: taxBreakdown.taxCents,
    estimatedShipping: shipping,
    estimatedTotal: subtotal + taxBreakdown.taxCents + shipping,
    lastPricedAt: new Date(),
  })
}

async function availabilityMapForCart(
  req: Request,
  items: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
  productByRef?: Map<string, ProductDetailDTO | null>,
) {
  return buildCartAvailabilityLookup(
    { correlationId: req.correlationId, req },
    items,
    (productRef) => resolveCatalogProduct({ correlationId: req.correlationId, req }, productRef),
    productByRef,
  )
}

async function syncCartPricing(
  req: Request,
  cartId: string,
  pricing?: PricingContext,
): Promise<Set<string>> {
  const changedIds = new Set<string>()
  const beforeCart = await cartRepository.getWithItems(cartId)
  const beforePrices = new Map(
    beforeCart?.items.map((line) => [line.id, line.clientUnitPriceEstimate]) ?? [],
  )

  const freeze = await findActiveCheckoutPriceFreeze(cartId)
  if (freeze) {
    const snapshot = parseCheckoutPriceSnapshot(freeze.priceSnapshotJson)
    if (snapshot) {
      await applyCheckoutPriceSnapshot(cartId, snapshot)
      return changedIds
    }
  }
  const resolvedPricing = pricing ?? (await resolvePricingContext(req))
  await repriceCartFromOdoo(req, cartId, resolvedPricing)

  const afterCart = await cartRepository.getWithItems(cartId)
  for (const line of afterCart?.items ?? []) {
    if (beforePrices.get(line.id) !== line.clientUnitPriceEstimate) {
      changedIds.add(line.id)
    }
  }
  return changedIds
}

const CART_REPRICE_TTL_MS = 30 * 60 * 1000

/** Evita reprice Odoo se i prezzi in DB sono recenti e completi. */
export function canUseCachedCartPricing(cart: Cart & { items: CartItem[] }): boolean {
  if (cart.items.length === 0) return true
  if (!cart.lastPricedAt) return false
  if (Date.now() - cart.lastPricedAt.getTime() > CART_REPRICE_TTL_MS) return false
  if (!cart.items.every((line) => line.clientUnitPriceEstimate != null)) return false

  const oldestLineMs = Math.min(...cart.items.map((line) => line.updatedAt.getTime()))
  if (Date.now() - oldestLineMs > CART_REPRICE_TTL_MS) return false

  return true
}

async function dtoFromCartId(
  req: Request,
  cartId: string,
  options?: DtoFromCartOptions,
): Promise<{ dto: Awaited<ReturnType<typeof mapCartToDTO>>; priceChangedIds: Set<string> }> {
  let priceChangedIds = new Set<string>()
  let full = await cartRepository.getWithItems(cartId)
  if (!full) {
    throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
  }
  const pricing = await resolvePricingContext(req)
  let { cart: afterExpiry, expired } = await expireCartIfNeeded(full)
  full = afterExpiry
  if (
    isCartReservationEnabled() &&
    full.items.length > 0 &&
    !full.reservationExpiresAt
  ) {
    await bumpCartReservation(full.id, true)
    const refreshed = await cartRepository.getWithItems(cartId)
    if (refreshed) full = refreshed
  }

  const catalogSeed = new Map<string, CartCatalogEntry>()
  const mutationContext =
    options?.fastMutation && typeof options.fastMutation === 'object'
      ? options.fastMutation
      : null
  if (mutationContext) {
    catalogSeed.set(mutationContext.productRef, mutationContext.catalog)
  }

  const shipCountry = normalizeCountryCode(
    typeof req.query.country === 'string' ? req.query.country : 'IT',
  )

  const shouldReprice =
    options?.reprice === true &&
    !options?.fastMutation &&
    full.items.length > 0 &&
    !canUseCachedCartPricing(full)

  const unifiedCatalogPromise = options?.fastMutation
    ? null
    : catalogAndAvailabilityForCart(req, full.items, catalogSeed)

  const catalogLookupPromise = options?.fastMutation
    ? catalogMapForCart(full.items, req.correlationId, catalogSeed)
    : unifiedCatalogPromise!.then((r) => r.catalog)
  const availabilityLookupPromise = options?.fastMutation
    ? Promise.resolve(
        buildMutationAvailabilityLookup(
          full.items,
          mutationContext
            ? {
                key: `${mutationContext.productRef}:${mutationContext.variantRef ?? ''}`,
                availability: mutationContext.availability,
              }
            : undefined,
        ),
      )
    : unifiedCatalogPromise!.then((r) => r.availability)
  const repricePromise = shouldReprice
    ? syncCartPricing(req, full.id, pricing)
    : Promise.resolve(new Set<string>())

  const [catalogLookup, availabilityLookup, repriceChangedIds] = await Promise.all([
    catalogLookupPromise,
    availabilityLookupPromise,
    repricePromise,
  ])
  priceChangedIds = repriceChangedIds

  if (shouldReprice) {
    const repriced = await cartRepository.getWithItems(cartId)
    if (repriced) full = repriced
  }

  const priceLookup = priceMapFromCatalog(catalogLookup)
  const displayLookup = displayMapFromCatalog(catalogLookup)
  let purchasableSubtotal = 0
  for (const line of full.items) {
    const key = `${line.productRef}:${line.variantRef ?? ''}`
    const avail = availabilityLookup.get(key)
    if (!avail?.purchasable) continue
    const unit = line.clientUnitPriceEstimate ?? priceLookup.get(line.productRef) ?? null
    if (unit != null) purchasableSubtotal += unit * line.quantity
  }
  const freeShippingHintPromise =
    full.items.length > 0
      ? shippingService.resolveHintForCart(purchasableSubtotal)
      : Promise.resolve(null)
  const taxBreakdownPromise =
    full.items.length === 0
      ? Promise.resolve(null)
      : taxService.estimateForCart(purchasableSubtotal, shipCountry, {
          customerSegment: pricing.segment,
          isProfessional: pricing.segment === 'PROFESSIONAL',
        })

  if (options?.fastMutation) {
    await persistCartTotalsEstimate(
      full.id,
      full.items,
      pricing,
      shipCountry,
      full.estimatedShipping,
    )
    const refreshed = await cartRepository.getWithItems(cartId)
    if (refreshed) full = refreshed
  }

  const [freeShippingHint, taxBreakdown] = await Promise.all([
    freeShippingHintPromise,
    taxBreakdownPromise,
  ])

  const dto = mapCartToDTO(
    full,
    priceLookup,
    displayLookup,
    expired,
    freeShippingHint,
    availabilityLookup,
    priceChangedIds,
    taxBreakdown,
  )
  return { dto, priceChangedIds }
}

async function buildFastMutationCartDto(
  req: Request,
  cartId: string,
  pricing: PricingContext,
  mutation: CartMutationLineContext,
): Promise<CartDTO> {
  let full = await cartRepository.getWithItems(cartId)
  if (!full) {
    throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
  }

  const catalogLookup = new Map<string, CartCatalogEntry>([
    [mutation.productRef, mutation.catalog],
  ])
  const missingRefs = [
    ...new Set(
      full.items
        .map((line) => line.productRef)
        .filter((ref) => !catalogLookup.has(ref)),
    ),
  ]
  if (missingRefs.length > 0) {
    const extra = await catalogMapForCart(
      full.items.filter((line) => missingRefs.includes(line.productRef)),
      req.correlationId,
    )
    for (const [ref, entry] of extra) catalogLookup.set(ref, entry)
  }

  const availabilityLookup = buildMutationAvailabilityLookup(full.items, {
    key: `${mutation.productRef}:${mutation.variantRef ?? ''}`,
    availability: mutation.availability,
  })
  const priceLookup = priceMapFromCatalog(catalogLookup)
  const displayLookup = displayMapFromCatalog(catalogLookup)

  let purchasableSubtotal = 0
  for (const line of full.items) {
    const key = `${line.productRef}:${line.variantRef ?? ''}`
    const avail = availabilityLookup.get(key)
    if (!avail?.purchasable) continue
    const unit = line.clientUnitPriceEstimate ?? priceLookup.get(line.productRef) ?? null
    if (unit != null) purchasableSubtotal += unit * line.quantity
  }

  const shipCountry = normalizeCountryCode(
    typeof req.query.country === 'string' ? req.query.country : 'IT',
  )

  await persistCartTotalsEstimate(
    full.id,
    full.items,
    pricing,
    shipCountry,
    full.estimatedShipping,
  )
  const refreshed = await cartRepository.getWithItems(cartId)
  if (refreshed) full = refreshed

  const [freeShippingHint, taxBreakdown] = await Promise.all([
    full.items.length > 0
      ? shippingService.resolveHintForCart(purchasableSubtotal)
      : Promise.resolve(null),
    full.items.length === 0
      ? Promise.resolve(null)
      : taxService.estimateForCart(purchasableSubtotal, shipCountry, {
          customerSegment: pricing.segment,
          isProfessional: pricing.segment === 'PROFESSIONAL',
        }),
  ])

  return mapCartToDTO(
    full,
    priceLookup,
    displayLookup,
    false,
    freeShippingHint,
    availabilityLookup,
    new Set(),
    taxBreakdown,
  )
}

async function syncReservationAfterItemsChange(cartId: string) {
  const full = await cartRepository.getWithItems(cartId)
  await bumpCartReservation(cartId, (full?.items.length ?? 0) > 0)
}

function resolveVariantRef(product: ProductDetailDTO, variantRef: string | null | undefined) {
  if (product.variants.length === 0) return variantRef ?? null
  const selectedRef = variantRef ?? product.variants[0]?.ref ?? null
  if (selectedRef && !product.variants.some((variant) => variant.ref === selectedRef)) {
    throw new AppError(
      'VARIANT_NOT_FOUND',
      'Unknown product variant',
      'Variante prodotto non disponibile.',
      400,
      false,
    )
  }
  return selectedRef
}

function selectedVariant(product: ProductDetailDTO, variantRef: string | null) {
  if (!variantRef) return product.variants[0]
  return product.variants.find((v) => v.ref === variantRef) ?? product.variants[0]
}

function lineUnitPriceCents(product: ProductDetailDTO, variantRef: string | null): number {
  const variant = selectedVariant(product, variantRef)
  if (variant?.priceCents != null && variant.priceCents > 0) return variant.priceCents
  return product.priceCents
}

function availabilityFromProduct(
  product: ProductDetailDTO,
  variantRef: string | null,
  quantity: number,
): CartLineAvailabilityDTO & { purchasable: boolean } {
  const variant = selectedVariant(product, variantRef)
  const availabilityData = variant?.availability ?? product.availability
  if (!availabilityData) return OPTIMISTIC_LINE_AVAILABILITY

  const resolved = resolveVariantAvailability(
    {
      stockQty: availabilityData.qtyAvailable,
      restockDate: availabilityData.restockDate,
      leadTimeDays: availabilityData.customerLeadTimeDays,
      saleOk: !availabilityData.isUnrecoverable,
      orderable: availabilityData.isOrderable,
    },
    quantity,
  )
  return variantAvailabilityToCartLine(resolved)
}

/** Prodotto minimo da ref Odoo + hint client: evita round-trip Arfly su add-to-cart. */
function productDetailFromOdooHint(
  productRef: string,
  variantRef: string | null | undefined,
  hint?: CartAddProductHint | null,
): ProductDetailDTO | null {
  const odooTemplateId = hint?.odooTemplateId ?? parseOdooTemplateId(productRef)
  if (odooTemplateId == null) return null

  const odooVariantId = hint?.odooVariantId ?? parseOdooVariantId(variantRef ?? null)
  const slug = hint?.slug ?? productRef
  const name = hint?.name ?? slug
  const imageUrl = hint?.imageUrl ?? null
  const priceCents = hint?.unitPriceCents ?? 0

  const variants =
    odooVariantId != null
      ? [
          {
            ref: formatOdooVariantRef(odooVariantId),
            label: name,
            imageUrl,
            attributes: [],
            odooVariantId,
            priceCents: hint?.unitPriceCents,
          },
        ]
      : []

  return {
    slug,
    locale: 'IT',
    name,
    shortDescription: null,
    priceCents,
    priceDisplayMode: 'ex_vat',
    currency: 'EUR',
    imageUrl,
    categorySlug: null,
    inStock: true,
    longDescription: null,
    sku: null,
    images: imageUrl ? [imageUrl] : [],
    odooTemplateId,
    variants,
    seo: {
      metaTitle: null,
      metaDescription: null,
      canonical: null,
      noindex: false,
    },
    alternates: [],
  }
}

/** Stock + prezzo Odoo solo per la variante aggiunta (non tutte le varianti del prodotto). */
async function resolveProductForCartLine(
  ctx: OdooCallContext,
  productRef: string,
  variantRef: string | null | undefined,
  quantity: number,
  pricing: PricingContext,
  productHint?: CartAddProductHint | null,
) {
  const product =
    productDetailFromOdooHint(productRef, variantRef, productHint) ??
    (await resolveCatalogProduct(ctx, productRef, 'IT'))
  if (!product) return null

  const resolvedVariantRef = resolveVariantRef(product, variantRef)
  const storedRef = storedProductRef(product)
  const [withStock, unitFromOdoo] = await Promise.all([
    enrichCartLineProduct(ctx, product, resolvedVariantRef, quantity),
    unitPriceCentsFromOdoo(ctx, storedRef, resolvedVariantRef, pricing),
  ])
  const unitPriceCents = unitFromOdoo ?? lineUnitPriceCents(withStock, resolvedVariantRef)

  return {
    product: withStock,
    productRef: storedRef,
    variantRef: resolvedVariantRef,
    unitPriceCents,
  }
}

function catalogEntryFromProduct(
  product: ProductDetailDTO,
  unitPriceCents: number,
): CartCatalogEntry {
  return {
    priceCents: unitPriceCents,
    slug: product.slug,
    name: product.name,
    imageUrl: product.imageUrl,
  }
}

function catalogLineInStock(product: ProductDetailDTO, variantRef: string | null): boolean {
  const variant = selectedVariant(product, variantRef)
  return variant?.inStock ?? product.inStock
}

function stockUserMessage(productName: string, available: number, requested: number): string {
  if (available <= 0) {
    return `Fuori stock: ${productName} non è disponibile al momento.`
  }
  return `Disponibili solo ${available} pezzi per ${productName} (ne hai richiesti ${requested}).`
}

async function assertLineStock(
  req: Request,
  product: ProductDetailDTO,
  variantRef: string | null,
  quantity: number,
) {
  if (env.CART_SKIP_STOCK_CHECK) return

  const variant = selectedVariant(product, variantRef)
  const availabilityData = variant?.availability ?? product.availability

  if (availabilityData) {
    const resolved = resolveVariantAvailability(
      {
        stockQty: availabilityData.qtyAvailable,
        restockDate: availabilityData.restockDate,
        leadTimeDays: availabilityData.customerLeadTimeDays,
        saleOk: !availabilityData.isUnrecoverable,
        orderable: availabilityData.isOrderable,
      },
      quantity,
    )
    if (resolved.canAddToCart) return
    throw new AppError(
      'STOCK_UNAVAILABLE',
      'Product not purchasable',
      resolved.warning ?? `Fuori stock: ${product.name} non è disponibile al momento.`,
      409,
      false,
    )
  }

  const usesOdoo = env.ODOO_ENABLED && isOdooConfigured()

  if (!usesOdoo) {
    if (!catalogLineInStock(product, variantRef)) {
      const outOfStock = variant?.stockQty === 0
      throw new AppError(
        'STOCK_UNAVAILABLE',
        'Product not purchasable',
        outOfStock
          ? `Fuori stock: ${product.name} non è disponibile al momento.`
          : `${product.name} non è disponibile.`,
        409,
        false,
      )
    }
    return
  }

  const productRef = storedProductRef(product)
  const ctx: OdooCallContext = { correlationId: req.correlationId, req }
  const stock = await checkCartStock(ctx, [{ productRef, variantRef, quantity }])
  if (stock.ok) return

  const line = stock.insufficient[0]
  if (!line) return
  throw new AppError(
    'STOCK_UNAVAILABLE',
    'Insufficient stock',
    stockUserMessage(product.name, line.available, line.requested),
    409,
    false,
    { insufficient: stock.insufficient },
  )
}

export const cartService = {
  async get(req: Request) {
    const cart = await resolveOrCreateCart(req)
    const reprice = req.query.reprice === '1' || req.query.reprice === 'true'
    const { dto } = await dtoFromCartId(req, cart.id, { reprice })
    return dto
  },

  async addItem(
    req: Request,
    input: {
      productRef: string
      variantRef?: string | null
      quantity: number
      productHint?: CartAddProductHint
    },
  ) {
    const pricing = await resolvePricingContext(req)
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const line = await resolveProductForCartLine(
      ctx,
      input.productRef,
      input.variantRef,
      input.quantity,
      pricing,
      input.productHint,
    )
    if (!line) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Unknown product', 'Prodotto non disponibile.', 404, false)
    }
    const cart = await resolveOrCreateCart(req)
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productRef: line.productRef, variantRef: line.variantRef },
    })
    const nextQuantity = (existing?.quantity ?? 0) + input.quantity
    await assertLineStock(req, line.product, line.variantRef, nextQuantity)
    if (existing) {
      await cartRepository.updateItem(existing.id, {
        quantity: nextQuantity,
        clientUnitPriceEstimate: line.unitPriceCents,
      })
    } else {
      await cartRepository.addItem({
        cart: { connect: { id: cart.id } },
        productRef: line.productRef,
        variantRef: line.variantRef,
        quantity: input.quantity,
        clientUnitPriceEstimate: line.unitPriceCents,
      })
    }
    await syncReservationAfterItemsChange(cart.id)
    const availability = availabilityFromProduct(line.product, line.variantRef, nextQuantity)
    return buildFastMutationCartDto(req, cart.id, pricing, {
      productRef: line.productRef,
      variantRef: line.variantRef,
      availability,
      catalog: catalogEntryFromProduct(line.product, line.unitPriceCents),
    })
  },

  async patchItem(req: Request, itemId: string, quantity: number) {
    const pricing = await resolvePricingContext(req)
    const cart = await resolveOrCreateCart(req)
    const item = await cartRepository.findItem(cart.id, itemId)
    if (!item) {
      throw new AppError('LINE_NOT_FOUND', 'Line not found', 'Riga non trovata.', 404, false)
    }
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const line = await resolveProductForCartLine(
      ctx,
      item.productRef,
      item.variantRef,
      quantity,
      pricing,
    )
    if (line) {
      await assertLineStock(req, line.product, line.variantRef, quantity)
      await cartRepository.updateItem(itemId, {
        quantity,
        clientUnitPriceEstimate: line.unitPriceCents,
      })
    } else {
      await cartRepository.updateItem(itemId, { quantity })
    }
    await syncReservationAfterItemsChange(cart.id)
    if (line) {
      return buildFastMutationCartDto(req, cart.id, pricing, {
        productRef: line.productRef,
        variantRef: line.variantRef,
        availability: availabilityFromProduct(line.product, line.variantRef, quantity),
        catalog: catalogEntryFromProduct(line.product, line.unitPriceCents),
      })
    }
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: false, fastMutation: true })
    return dto
  },

  async removeItem(req: Request, itemId: string) {
    const cart = await resolveOrCreateCart(req)
    const item = await cartRepository.findItem(cart.id, itemId)
    if (!item) {
      throw new AppError('LINE_NOT_FOUND', 'Line not found', 'Riga non trovata.', 404, false)
    }
    await cartRepository.deleteItem(itemId)
    await syncReservationAfterItemsChange(cart.id)
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: false, fastMutation: true })
    return dto
  },

  async clear(req: Request) {
    const cart = await resolveOrCreateCart(req)
    await cartRepository.deleteItems(cart.id)
    await cartRepository.updateTotals(cart.id, {
      estimatedSubtotal: null,
      estimatedTax: null,
      estimatedShipping: null,
      estimatedTotal: null,
      lastPricedAt: null,
    })
    await bumpCartReservation(cart.id, false)
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: false })
    return dto
  },

  async recommendations(req: Request) {
    const cart = await resolveOrCreateCart(req)
    const full = await cartRepository.getWithItems(cart.id)
    if (!full || full.items.length === 0) return []
    return arflyRecommendationCards(8)
  },

  async recommendationsForSlugs(_req: Request, _productSlugs: string[]) {
    return arflyRecommendationCards(8)
  },

  async reorderLines(
    req: Request,
    lines: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
  ) {
    const cart = await resolveOrCreateCart(req)
    let added = 0
    const skipped: Array<{ productRef: string; reason: string }> = []

    for (const line of lines) {
      try {
        const product = await resolveCatalogProduct(req, line.productRef)
        if (!product) {
          skipped.push({ productRef: line.productRef, reason: 'Prodotto non disponibile' })
          continue
        }
        const variantRef = resolveVariantRef(product, line.variantRef)
        const productRef = storedProductRef(product)
        const existing = await prisma.cartItem.findFirst({
          where: { cartId: cart.id, productRef, variantRef },
        })
        const nextQuantity = (existing?.quantity ?? 0) + line.quantity
        await assertLineStock(req, product, variantRef, nextQuantity)
        if (existing) {
          await cartRepository.updateItem(existing.id, { quantity: nextQuantity })
        } else {
          await cartRepository.addItem({
            cart: { connect: { id: cart.id } },
            productRef,
            variantRef,
            quantity: line.quantity,
            clientUnitPriceEstimate: product.priceCents,
          })
        }
        added += 1
      } catch (e) {
        skipped.push({
          productRef: line.productRef,
          reason: e instanceof AppError ? e.userMessage : 'Non aggiunto al carrello',
        })
      }
    }

    await syncReservationAfterItemsChange(cart.id)
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: true })
    return { added, skipped, cart: dto }
  },

  async reprice(req: Request) {
    const cart = await resolveOrCreateCart(req)
    if (await findActiveCheckoutPriceFreeze(cart.id)) {
      const { dto } = await dtoFromCartId(req, cart.id, { reprice: false })
      return dto
    }
    const priceChangedIds = await syncCartPricing(req, cart.id)
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: false })
    if (priceChangedIds.size === 0) return dto
    return {
      ...dto,
      items: dto.items.map((item) =>
        priceChangedIds.has(item.id) ? { ...item, priceChanged: true } : item,
      ),
    }
  },

  async syncFromClient(
    req: Request,
    input: {
      items: Array<{ productRef: string; variantRef?: string | null; quantity: number }>
      expiresAt?: string | null
    },
  ) {
    const cart = await resolveOrCreateCart(req)
    if (input.expiresAt && new Date(input.expiresAt) < new Date()) {
      const { dto } = await dtoFromCartId(req, cart.id, { reprice: false })
      return dto
    }

    for (const line of input.items) {
      try {
        const ctx: OdooCallContext = { correlationId: req.correlationId, req }
        const product = await resolveCatalogProductEnriched(ctx, line.productRef, 'IT', line.quantity)
        if (!product) continue
        const variantRef = resolveVariantRef(product, line.variantRef)
        const productRef = storedProductRef(product)
        const unitPriceCents = lineUnitPriceCents(product, variantRef)
        const existing = await prisma.cartItem.findFirst({
          where: { cartId: cart.id, productRef, variantRef },
        })
        if (existing) {
          const nextQty = Math.max(existing.quantity, line.quantity)
          await cartRepository.updateItem(existing.id, {
            quantity: nextQty,
            clientUnitPriceEstimate: unitPriceCents,
          })
        } else {
          await cartRepository.addItem({
            cart: { connect: { id: cart.id } },
            productRef,
            variantRef,
            quantity: line.quantity,
            clientUnitPriceEstimate: unitPriceCents,
          })
        }
      } catch {
        // Ignora righe non sincronizzabili
      }
    }

    await syncReservationAfterItemsChange(cart.id)
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: false })
    return dto
  },

  async checkStock(req: Request): Promise<CartStockCheckDTO> {
    const cart = await resolveOrCreateCart(req)
    const full = await cartRepository.getWithItems(cart.id)
    if (!full || full.items.length === 0) {
      return { ok: true, insufficient: [] }
    }

    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const stock = await checkCartStock(
      ctx,
      full.items.map((i) => ({
        productRef: i.productRef,
        variantRef: i.variantRef,
        quantity: i.quantity,
      })),
    )

    if (stock.ok) {
      return { ok: true, insufficient: [] }
    }

    const productByRef = await resolveProductMapForCartLines(ctx, full.items)
    const catalog = catalogMapFromProducts(productByRef)
    const display = displayMapFromCatalog(catalog)
    const availabilityLookup = await availabilityMapForCart(req, full.items, productByRef)
    return {
      ok: false,
      insufficient: stock.insufficient.map((line) => {
        const info = display.get(line.productRef)
        const cartLine = full.items.find((i) => i.productRef === line.productRef)
        const availKey = `${line.productRef}:${cartLine?.variantRef ?? ''}`
        const avail = availabilityLookup.get(availKey)
        const { availabilityStatus, blockReason } = resolveCartLineAvailabilityStatus({
          purchasable: avail?.purchasable ?? false,
          productResolved: info != null,
          unitCents: cartLine?.clientUnitPriceEstimate ?? null,
          state: avail?.state ?? 'out_of_stock',
          warning: avail?.warning ?? null,
        })
        return {
          productRef: line.productRef,
          productSlug: info?.slug ?? null,
          productName: info?.name ?? null,
          requested: line.requested,
          available: line.available,
          availabilityStatus,
          ...(blockReason ? { blockReason } : {}),
        }
      }),
    }
  },
}
