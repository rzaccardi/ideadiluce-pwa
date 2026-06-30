import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type { Request } from 'express'
import { resolveCatalogProduct, resolveCatalogProductEnriched } from '../catalog/catalogResolver.service.js'
import { formatOdooTemplateRef } from '../catalog/odooRef.js'
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
import { resolveVariantAvailability } from '../catalog/availability.service.js'
import { taxService } from '../tax/tax.service.js'
import { normalizeCountryCode } from '../tax/tax.constants.js'
import type { CartStockCheckDTO, ProductCardDTO, ProductDetailDTO } from '../../types/dto.js'

function storedProductRef(product: ProductDetailDTO): string {
  if (product.odooTemplateId != null) {
    return formatOdooTemplateRef(product.odooTemplateId)
  }
  return product.slug
}

async function priceMapForCart(
  items: { productRef: string }[],
  correlationId: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  for (const { productRef } of items) {
    const p = await resolveCatalogProduct({ correlationId }, productRef)
    if (p) map.set(productRef, p.priceCents)
  }
  return map
}

async function displayMapForCart(
  items: { productRef: string }[],
  correlationId: string,
): Promise<Map<string, { slug: string; name: string; imageUrl: string | null }>> {
  const map = new Map<string, { slug: string; name: string; imageUrl: string | null }>()
  for (const { productRef } of items) {
    const p = await resolveCatalogProduct({ correlationId }, productRef)
    if (p) {
      map.set(productRef, { slug: p.slug, name: p.name, imageUrl: p.imageUrl })
    }
  }
  return map
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

async function availabilityMapForCart(
  req: Request,
  items: Array<{ productRef: string; variantRef: string | null; quantity: number }>,
) {
  return buildCartAvailabilityLookup(
    { correlationId: req.correlationId, req },
    items,
    (productRef) => resolveCatalogProduct({ correlationId: req.correlationId, req }, productRef),
  )
}

async function syncCartPricing(req: Request, cartId: string): Promise<Set<string>> {
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
  const pricing = await resolvePricingContext(req)
  await repriceCartFromOdoo(req, cartId, pricing)

  const afterCart = await cartRepository.getWithItems(cartId)
  for (const line of afterCart?.items ?? []) {
    if (beforePrices.get(line.id) !== line.clientUnitPriceEstimate) {
      changedIds.add(line.id)
    }
  }
  return changedIds
}

async function dtoFromCartId(
  req: Request,
  cartId: string,
  options?: { reprice?: boolean },
): Promise<{ dto: Awaited<ReturnType<typeof mapCartToDTO>>; priceChangedIds: Set<string> }> {
  let priceChangedIds = new Set<string>()
  let full = await cartRepository.getWithItems(cartId)
  if (!full) {
    throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
  }
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

  if (options?.reprice === true && full.items.length > 0) {
    priceChangedIds = await syncCartPricing(req, full.id)
    const repriced = await cartRepository.getWithItems(cartId)
    if (repriced) full = repriced
  }

  const [priceLookup, displayLookup, availabilityLookup] = await Promise.all([
    priceMapForCart(full.items, req.correlationId),
    displayMapForCart(full.items, req.correlationId),
    availabilityMapForCart(req, full.items),
  ])
  let purchasableSubtotal = 0
  for (const line of full.items) {
    const key = `${line.productRef}:${line.variantRef ?? ''}`
    const avail = availabilityLookup.get(key)
    if (!avail?.purchasable) continue
    const unit = line.clientUnitPriceEstimate ?? priceLookup.get(line.productRef) ?? null
    if (unit != null) purchasableSubtotal += unit * line.quantity
  }
  const freeShippingHint =
    full.items.length > 0 ? await shippingService.resolveHintForCart(purchasableSubtotal) : null

  const pricing = await resolvePricingContext(req)
  const shipCountry = normalizeCountryCode(
    typeof req.query.country === 'string' ? req.query.country : 'IT',
  )
  const taxBreakdown =
    full.items.length === 0
      ? null
      : await taxService.estimateForCart(purchasableSubtotal, shipCountry, {
          customerSegment: pricing.segment,
          isProfessional: pricing.segment === 'PROFESSIONAL',
        })

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
    input: { productRef: string; variantRef?: string | null; quantity: number },
  ) {
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const product = await resolveCatalogProductEnriched(ctx, input.productRef, 'IT', input.quantity)
    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Unknown product', 'Prodotto non disponibile.', 404, false)
    }
    const cart = await resolveOrCreateCart(req)
    const variantRef = resolveVariantRef(product, input.variantRef)
    const productRef = storedProductRef(product)
    const unitPriceCents = lineUnitPriceCents(product, variantRef)
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productRef, variantRef },
    })
    const nextQuantity = (existing?.quantity ?? 0) + input.quantity
    await assertLineStock(req, product, variantRef, nextQuantity)
    if (existing) {
      await cartRepository.updateItem(existing.id, {
        quantity: nextQuantity,
        clientUnitPriceEstimate: unitPriceCents,
      })
    } else {
      await cartRepository.addItem({
        cart: { connect: { id: cart.id } },
        productRef,
        variantRef,
        quantity: input.quantity,
        clientUnitPriceEstimate: unitPriceCents,
      })
    }
    await syncReservationAfterItemsChange(cart.id)
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: true })
    return dto
  },

  async patchItem(req: Request, itemId: string, quantity: number) {
    const cart = await resolveOrCreateCart(req)
    const item = await cartRepository.findItem(cart.id, itemId)
    if (!item) {
      throw new AppError('LINE_NOT_FOUND', 'Line not found', 'Riga non trovata.', 404, false)
    }
    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const product = await resolveCatalogProductEnriched(ctx, item.productRef, 'IT', quantity)
    if (product) {
      await assertLineStock(req, product, item.variantRef, quantity)
    }
    await cartRepository.updateItem(itemId, { quantity })
    await syncReservationAfterItemsChange(cart.id)
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: true })
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
    const { dto } = await dtoFromCartId(req, cart.id, { reprice: true })
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

    const display = await displayMapForCart(full.items, req.correlationId)
    const availabilityLookup = await availabilityMapForCart(req, full.items)
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
