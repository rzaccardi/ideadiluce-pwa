import type { Cart, CartItem } from '@prisma/client'
import type {
  CartDTO,
  CartItemDTO,
  CartLineAvailabilityDTO,
  FreeShippingHintDTO,
  ProductDetailDTO,
  TaxBreakdownDTO,
} from '../../types/dto.js'
import { buildCartReservationMeta } from './cart.reservation.js'
import { resolveCartEstimateTotals } from './cartTotals.js'
import { resolveCartDeliveryLeadDays } from '../catalog/availability.service.js'
import { resolveCartLineAvailabilityStatus } from './cart-line-availability.js'
import { parseCartLineVariantMeta } from './cart-line-variant-meta.js'

function unitForLine(line: CartItem, catalogUnitCents: number | null): number | null {
  if (line.clientUnitPriceEstimate != null) return line.clientUnitPriceEstimate
  return catalogUnitCents
}

const defaultAvailability: CartLineAvailabilityDTO = {
  state: 'available',
  stockQty: null,
  effectiveLeadDays: null,
  warning: null,
}

function resolveLineVariantDisplay(
  line: CartItem,
  display: { slug: string; name: string; imageUrl: string | null } | undefined,
  product: ProductDetailDTO | null | undefined,
) {
  const meta = parseCartLineVariantMeta(line.metadataJson)
  const variant =
    line.variantRef && product?.variants?.length
      ? (product.variants.find((v) => v.ref === line.variantRef) ??
        product.variants.find((v) => String(v.odooVariantId) === line.variantRef))
      : product?.variants?.[0]

  const attributes =
    meta?.attributes?.length
      ? meta.attributes
      : (variant?.attributes ?? []).filter((a) => a.name?.trim() && a.value?.trim())

  const variantLabel =
    meta?.variantLabel ??
    variant?.label ??
    (attributes.length ? attributes.map((a) => a.value).join(' · ') : null)

  const imageUrl = meta?.imageUrl ?? variant?.imageUrl ?? display?.imageUrl ?? null

  return {
    imageUrl,
    variantLabel: variantLabel?.trim() || null,
    variantAttributes: attributes.length
      ? attributes.map((a) => ({ name: a.name, value: a.value }))
      : undefined,
  }
}

export function mapCartToDTO(
  cart: Cart & { items: CartItem[] },
  priceLookup: Map<string, number>,
  displayLookup: Map<string, { slug: string; name: string; imageUrl: string | null }> = new Map(),
  reservationExpired = false,
  freeShippingHint: FreeShippingHintDTO | null = null,
  availabilityLookup: Map<string, CartLineAvailabilityDTO & { purchasable: boolean }> = new Map(),
  priceChangedIds: Set<string> = new Set(),
  taxBreakdown: TaxBreakdownDTO | null = null,
  productByRef: Map<string, ProductDetailDTO | null> = new Map(),
): CartDTO {
  const warnings: string[] = []

  const items: CartItemDTO[] = cart.items.map((line) => {
    const cat = priceLookup.get(line.productRef) ?? null
    const unit = unitForLine(line, cat)
    const display = displayLookup.get(line.productRef)
    const productResolved = display != null || productByRef.has(line.productRef)
    const availKey = `${line.productRef}:${line.variantRef ?? ''}`
    const missingAvailability = !availabilityLookup.has(availKey)
    const avail = availabilityLookup.get(availKey) ?? {
      ...defaultAvailability,
      state: 'out_of_stock' as const,
      warning: 'Disponibilità non verificata.',
      purchasable: false,
    }
    if (missingAvailability) {
      const name = display?.name ?? line.productRef
      warnings.push(
        `${name}: disponibilità non verificata — riga non acquistabile fino a verifica stock.`,
      )
    }
    const { availabilityStatus, blockReason } = resolveCartLineAvailabilityStatus({
      purchasable: avail.purchasable,
      productResolved,
      unitCents: unit,
      state: avail.state,
      warning: avail.warning,
    })
    const purchasable = availabilityStatus !== 'blocked'
    const lineTotal = purchasable && unit != null ? unit * line.quantity : null

    if (avail.warning) {
      const name = display?.name ?? line.productRef
      warnings.push(`${name}: ${avail.warning}`)
    }

    const variantDisplay = resolveLineVariantDisplay(
      line,
      display,
      productByRef.get(line.productRef),
    )

    return {
      id: line.id,
      productRef: line.productRef,
      variantRef: line.variantRef,
      quantity: line.quantity,
      clientUnitPriceEstimateCents: line.clientUnitPriceEstimate,
      lineTotalEstimateCents: lineTotal,
      productSlug: display?.slug ?? line.productRef,
      productName: display?.name ?? line.productRef,
      imageUrl: variantDisplay.imageUrl,
      variantLabel: variantDisplay.variantLabel,
      ...(variantDisplay.variantAttributes
        ? { variantAttributes: variantDisplay.variantAttributes }
        : {}),
      purchasable,
      availabilityStatus,
      ...(blockReason ? { blockReason } : {}),
      ...(priceChangedIds.has(line.id) ? { priceChanged: true } : {}),
      availability: {
        state: avail.state,
        stockQty: avail.stockQty,
        effectiveLeadDays: avail.effectiveLeadDays,
        warning: avail.warning,
      },
    }
  })

  const purchasableItems = items.filter((i) => i.availabilityStatus !== 'blocked')
  const withTotals = purchasableItems.filter((i) => i.lineTotalEstimateCents != null)
  const subtotalFromLines =
    withTotals.length === purchasableItems.length && purchasableItems.length > 0
      ? withTotals.reduce((s, i) => s + (i.lineTotalEstimateCents as number), 0)
      : purchasableItems.length === 0
        ? 0
        : null

  const totals = resolveCartEstimateTotals(
    cart,
    subtotalFromLines,
    taxBreakdown?.taxCents ?? null,
  )
  const deliveryLeadDays = resolveCartDeliveryLeadDays(
    items.map((i) => ({
      purchasable: i.availabilityStatus !== 'blocked',
      effectiveLeadDays: i.availability.effectiveLeadDays,
    })),
  )

  return {
    id: cart.id,
    currencyCode: cart.currencyCode,
    status: cart.status,
    items,
    ...totals,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    purchasableItemCount: purchasableItems.reduce((n, i) => n + i.quantity, 0),
    warnings,
    deliveryLeadDays,
    deliveryEstimateDays: deliveryLeadDays,
    repricedAt: cart.lastPricedAt?.toISOString() ?? null,
    reservation: buildCartReservationMeta(cart, reservationExpired),
    freeShippingHint,
    taxBreakdown,
    taxEstimateNote: taxBreakdown?.isEstimate
      ? 'Tasse e spedizione ricalcolate al checkout'
      : null,
  }
}
