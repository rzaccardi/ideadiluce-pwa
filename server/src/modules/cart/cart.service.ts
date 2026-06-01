import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type { Request } from 'express'
import { env } from '../../config/env.js'
import { catalogRepository } from '../catalog/catalog.repository.js'
import { resolveCatalogProduct } from '../catalog/catalogResolver.service.js'
import { formatOdooTemplateRef, parseOdooTemplateId } from '../catalog/odooRef.js'
import { hubCatalogRepository } from '../hub-catalog/hub-catalog.repository.js'
import { cartRepository } from './cart.repository.js'
import { mapCartToDTO } from './cart.mappers.js'
import { repriceCartFromOdoo } from '../catalog/odooPricing.service.js'
import type { ProductDetailDTO } from '../../types/dto.js'

async function useHubCatalog(): Promise<boolean> {
  if (!env.HUB_CATALOG_ENABLED) return false
  try {
    return await hubCatalogRepository.hasCatalog()
  } catch {
    return false
  }
}

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
): Promise<Map<string, { slug: string; name: string }>> {
  const map = new Map<string, { slug: string; name: string }>()

  if (await useHubCatalog()) {
    const templateIds = items
      .map((i) => parseOdooTemplateId(i.productRef))
      .filter((id): id is number => id != null)
    const byOdoo = await hubCatalogRepository.findSlugsByOdooTemplateIds(templateIds)
    for (const line of items) {
      const tid = parseOdooTemplateId(line.productRef)
      if (tid != null && byOdoo.has(tid)) {
        map.set(line.productRef, byOdoo.get(tid)!)
        continue
      }
      const p = await resolveCatalogProduct({ correlationId }, line.productRef)
      if (p) map.set(line.productRef, { slug: p.slug, name: p.name })
    }
    return map
  }

  for (const { productRef } of items) {
    const p = await catalogRepository.findProductBySlug(correlationId, productRef)
    if (p) map.set(productRef, { slug: p.slug, name: p.name })
  }
  return map
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
  }
  return cart
}

async function dtoFromCartId(req: Request, cartId: string) {
  const full = await cartRepository.getWithItems(cartId)
  if (!full) {
    throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
  }
  const [priceLookup, displayLookup] = await Promise.all([
    priceMapForCart(full.items, req.correlationId),
    displayMapForCart(full.items, req.correlationId),
  ])
  return mapCartToDTO(full, priceLookup, displayLookup)
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

export const cartService = {
  async get(req: Request) {
    const cart = await resolveOrCreateCart(req)
    return dtoFromCartId(req, cart.id)
  },

  async addItem(
    req: Request,
    input: { productRef: string; variantRef?: string | null; quantity: number },
  ) {
    const product = await resolveCatalogProduct(req, input.productRef)
    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Unknown product', 'Prodotto non disponibile.', 404, false)
    }
    const cart = await resolveOrCreateCart(req)
    const variantRef = resolveVariantRef(product, input.variantRef)
    const productRef = storedProductRef(product)
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productRef, variantRef },
    })
    if (existing) {
      await cartRepository.updateItem(existing.id, {
        quantity: existing.quantity + input.quantity,
      })
    } else {
      await cartRepository.addItem({
        cart: { connect: { id: cart.id } },
        productRef,
        variantRef,
        quantity: input.quantity,
        clientUnitPriceEstimate: product.priceCents,
      })
    }
    return dtoFromCartId(req, cart.id)
  },

  async patchItem(req: Request, itemId: string, quantity: number) {
    const cart = await resolveOrCreateCart(req)
    const item = await cartRepository.findItem(cart.id, itemId)
    if (!item) {
      throw new AppError('LINE_NOT_FOUND', 'Line not found', 'Riga non trovata.', 404, false)
    }
    await cartRepository.updateItem(itemId, { quantity })
    return dtoFromCartId(req, cart.id)
  },

  async removeItem(req: Request, itemId: string) {
    const cart = await resolveOrCreateCart(req)
    const item = await cartRepository.findItem(cart.id, itemId)
    if (!item) {
      throw new AppError('LINE_NOT_FOUND', 'Line not found', 'Riga non trovata.', 404, false)
    }
    await cartRepository.deleteItem(itemId)
    return dtoFromCartId(req, cart.id)
  },

  async clear(req: Request) {
    const cart = await resolveOrCreateCart(req)
    await cartRepository.deleteItems(cart.id)
    await cartRepository.updateTotals(cart.id, {
      estimatedSubtotal: 0,
      estimatedTax: 0,
      estimatedShipping: 0,
      estimatedTotal: 0,
      lastPricedAt: new Date(),
    })
    return dtoFromCartId(req, cart.id)
  },

  async recommendations(req: Request) {
    const cart = await resolveOrCreateCart(req)
    const full = await cartRepository.getWithItems(cart.id)
    if (!full || full.items.length === 0) return []

    const display = await displayMapForCart(full.items, req.correlationId)
    const productSlugs = [
      ...new Set(
        full.items.map((line) => display.get(line.productRef)?.slug ?? line.productRef),
      ),
    ]
    return catalogRepository.findRecommendedProducts(req.correlationId, productSlugs, {
      limit: 6,
    })
  },

  async reprice(req: Request) {
    const cart = await resolveOrCreateCart(req)
    await repriceCartFromOdoo(req, cart.id)
    const full = await cartRepository.getWithItems(cart.id)
    if (!full) {
      throw new AppError('CART_NOT_FOUND', 'Cart not found', 'Carrello non trovato.', 404, false)
    }

    let subtotal = 0
    for (const line of full.items) {
      const p = await resolveCatalogProduct(req, line.productRef)
      const unit = p?.priceCents ?? line.clientUnitPriceEstimate
      if (unit != null) {
        await cartRepository.updateItem(line.id, { clientUnitPriceEstimate: unit })
        subtotal += unit * line.quantity
      }
    }

    const tax = Math.round(subtotal * 0.22)
    const cartWithShipping = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { shippingSelection: true },
    })
    const shipping = cartWithShipping?.shippingSelection?.amountCents ?? 0
    const total = subtotal + tax + shipping

    await cartRepository.updateTotals(cart.id, {
      estimatedSubtotal: subtotal,
      estimatedTax: tax,
      estimatedShipping: shipping,
      estimatedTotal: total,
      lastPricedAt: new Date(),
    })

    return dtoFromCartId(req, cart.id)
  },
}
