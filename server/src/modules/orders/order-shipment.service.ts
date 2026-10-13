import type {
  OrderDeliveryDTO,
  OrderDTO,
  OrderDetailDTO,
  OrderShipmentDTO,
  OrderShipmentStatusDTO,
} from '../../types/dto.js'
import { prisma } from '../../lib/prisma.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { isOdooApiV2Configured } from '../../adapters/odoo-api/odooApiClient.js'
import { odooApiListOrderShipments } from '../../adapters/odoo-api/odooApi.resources.js'
import { odooUtcDateTimeToIso } from '../../adapters/odoo-api/odooApi.mapping.js'
import type { OdooApiDeliveryStatus, OdooApiShipment } from '../../adapters/odoo-api/odooApi.types.js'
import { odooSalesService } from '../odoo/odoo-sales.service.js'
import { logger } from '../../lib/logger.js'
import { trackFedexNumber } from '../../adapters/shipping/fedexClient.js'
import { trackDhlNumber } from '../../adapters/shipping/dhlClient.js'
import {
  carrierTrackingUrl,
  detectCarrier,
  parseDhlTrackPayload,
  parseFedexTrackPayload,
  type CarrierKind,
} from '../../adapters/shipping/carrier-track.parsers.js'
import { listOutgoingPickings, primaryOutgoingPicking } from './odoo-order-pickings.js'
import { computeReturnWindow, OPEN_RETURN_WINDOW } from './order-return-window.js'
import { orderTransactionalMail } from './order-transactional-mail.service.js'

function refreshDelayMs(status: OrderShipmentStatusDTO): number {
  if (status === 'delivered') return 12 * 60 * 60_000
  if (status === 'out_for_delivery' || status === 'in_transit') return 15 * 60_000
  if (status === 'exception') return 10 * 60_000
  return 30 * 60_000
}

function isShipmentDto(value: unknown): value is OrderShipmentDTO {
  if (!value || typeof value !== 'object') return false
  return 'status' in value && 'updatedAt' in value
}

function deliveryFromShipment(shipment: OrderShipmentDTO | null): OrderDeliveryDTO | null {
  if (!shipment) return null
  if (shipment.status === 'delivered') {
    return { status: 'delivered', deliveredAt: shipment.deliveredAt }
  }
  if (shipment.status === 'exception') {
    return { status: 'exception', deliveredAt: null }
  }
  if (shipment.status === 'in_transit' || shipment.status === 'out_for_delivery') {
    return { status: 'in_transit', deliveredAt: null }
  }
  if (shipment.status === 'shipped' || shipment.status === 'preparing') {
    return { status: 'pending', deliveredAt: null }
  }
  return null
}

function withReturnWindow<T extends OrderDTO>(order: T, shipment: OrderShipmentDTO | null): T {
  return {
    ...order,
    shipment,
    delivery: deliveryFromShipment(shipment) ?? order.delivery ?? null,
    returnWindow: computeReturnWindow(shipment?.deliveredAt ?? null),
  }
}

function pickingToShipment(input: {
  carrier: CarrierKind | null
  carrierLabel: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  shippedAt: string | null
  status: OrderShipmentStatusDTO
  deliveredAt?: string | null
}): OrderShipmentDTO {
  return {
    carrier: input.carrier,
    carrierLabel: input.carrierLabel,
    trackingNumber: input.trackingNumber,
    trackingUrl: input.trackingUrl ?? carrierTrackingUrl(input.carrier, input.trackingNumber),
    status: input.status,
    shippedAt: input.shippedAt,
    estimatedDeliveryAt: null,
    deliveredAt: input.deliveredAt ?? null,
    lastLocation: null,
    events: [],
    updatedAt: new Date().toISOString(),
  }
}

function mapOdooDeliveryStatus(
  deliveryStatus: OdooApiDeliveryStatus | undefined,
  warehouseState: string,
  hasTracking: boolean,
): { status: OrderShipmentStatusDTO; fromOdoo: boolean } {
  const key = (deliveryStatus ?? '').toLowerCase()
  if (key === 'delivered') return { status: 'delivered', fromOdoo: true }
  if (key === 'exception') return { status: 'exception', fromOdoo: true }
  if (key === 'in_transit') return { status: 'in_transit', fromOdoo: true }
  if (key === 'pending') {
    return { status: hasTracking ? 'shipped' : 'preparing', fromOdoo: true }
  }
  const state = warehouseState.toLowerCase()
  if (state === 'done' || state === 'delivered') {
    return { status: 'shipped', fromOdoo: false }
  }
  if (state === 'cancel' || state === 'exception') {
    return { status: 'exception', fromOdoo: false }
  }
  return { status: 'preparing', fromOdoo: false }
}

async function pwaCarrierHint(pwaOrderId: string | null): Promise<string | null> {
  if (!pwaOrderId) return null
  const row = await prisma.pwaOrder.findUnique({
    where: { id: pwaOrderId },
    select: {
      checkoutSession: { select: { shippingMethodRef: true } },
      cart: { select: { shippingSelection: { select: { carrierCode: true, label: true } } } },
    },
  })
  return (
    row?.cart?.shippingSelection?.carrierCode ??
    row?.cart?.shippingSelection?.label ??
    row?.checkoutSession?.shippingMethodRef ??
    null
  )
}

async function fetchCarrierTrack(
  carrier: CarrierKind | null,
  trackingNumber: string,
  correlationId: string,
) {
  if (carrier === 'fedex') {
    const payload = await trackFedexNumber(trackingNumber, correlationId)
    return payload ? parseFedexTrackPayload(payload, trackingNumber) : null
  }
  if (carrier === 'dhl') {
    const payload = await trackDhlNumber(trackingNumber, correlationId)
    return payload ? parseDhlTrackPayload(payload, trackingNumber) : null
  }
  return null
}

function apiShipmentToDto(
  shipment: OdooApiShipment,
  pwaHint: string | null,
): OrderShipmentDTO & { deliveryStatusFromOdoo: boolean } {
  const trackingNumber = shipment.tracking_number?.trim() || shipment.tracking_ref?.trim() || null
  const carrier = detectCarrier({
    carrierName: shipment.carrier_name ?? shipment.carrier,
    carrierCode: pwaHint,
    trackingNumber,
  })
  const mapped = mapOdooDeliveryStatus(
    shipment.delivery_status,
    shipment.state ?? '',
    Boolean(trackingNumber),
  )
  const deliveredAt =
    mapped.status === 'delivered' ? odooUtcDateTimeToIso(shipment.delivered_at) : null
  return {
    ...pickingToShipment({
      carrier,
      carrierLabel:
        shipment.carrier_name ??
        shipment.carrier ??
        (carrier === 'fedex' ? 'FedEx' : carrier === 'dhl' ? 'DHL' : null),
      trackingNumber,
      trackingUrl: shipment.tracking_url ?? null,
      shippedAt: shipment.date_done ?? shipment.scheduled_date ?? null,
      status: mapped.status,
      deliveredAt,
    }),
    deliveryStatusFromOdoo: mapped.fromOdoo,
  }
}

async function refreshSnapshot(
  order: OrderDTO,
  correlationId: string,
): Promise<OrderShipmentDTO | null> {
  const ctx: OdooCallContext = { correlationId: `${correlationId}:shipment` }
  const pwaHint = await pwaCarrierHint(order.pwaOrderId)

  let shipment: OrderShipmentDTO | null = null
  let deliveryStatusFromOdoo = false

  if (isOdooApiV2Configured() && order.odooSaleOrderId) {
    try {
      const shipments = await odooApiListOrderShipments(order.odooSaleOrderId, ctx.correlationId)
      const primary = shipments[0]
      if (primary) {
        const mapped = apiShipmentToDto(primary, pwaHint)
        deliveryStatusFromOdoo = mapped.deliveryStatusFromOdoo
        const { deliveryStatusFromOdoo: _flag, ...dto } = mapped
        shipment = dto
      }
    } catch (err) {
      logger.warn('orders.shipment.odoo_api_failed', {
        odooSaleOrderId: order.odooSaleOrderId,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (!shipment && isOdooConfigured()) {
    let saleName: string | null = null
    try {
      const so = await odooSalesService.getOrderById(ctx, order.odooSaleOrderId)
      saleName = so?.name ?? null
    } catch (err) {
      logger.warn('orders.shipment.odoo_order_failed', {
        odooSaleOrderId: order.odooSaleOrderId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    let picking = null
    try {
      const pickings = await listOutgoingPickings(ctx, {
        saleOrderId: order.odooSaleOrderId,
        saleOrderName: saleName,
      })
      picking = primaryOutgoingPicking(pickings)
    } catch (err) {
      logger.warn('orders.shipment.odoo_picking_failed', {
        odooSaleOrderId: order.odooSaleOrderId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    const trackingNumber = picking?.trackingRef?.trim() || null
    const carrier = detectCarrier({
      carrierName: picking?.carrierName,
      carrierCode: pwaHint,
      trackingNumber,
    })
    const shippedAt =
      picking?.state === 'done' ? picking.dateDone : picking?.scheduledDate ?? null
    const baseStatus: OrderShipmentStatusDTO =
      picking?.state === 'done' ? 'shipped' : picking ? 'preparing' : 'preparing'

    shipment = pickingToShipment({
      carrier,
      carrierLabel: picking?.carrierName ?? (carrier === 'fedex' ? 'FedEx' : carrier === 'dhl' ? 'DHL' : null),
      trackingNumber,
      trackingUrl: picking?.trackingUrl ?? null,
      shippedAt,
      status: trackingNumber && picking?.state === 'done' ? 'in_transit' : baseStatus,
    })
  }

  if (!shipment) return null

  const trackingNumber = shipment.trackingNumber
  const carrier = shipment.carrier
  if (trackingNumber && (carrier === 'fedex' || carrier === 'dhl')) {
    try {
      const live = await fetchCarrierTrack(carrier, trackingNumber, ctx.correlationId)
      if (live) {
        shipment = {
          ...shipment,
          carrier: live.carrier,
          trackingNumber: live.trackingNumber,
          trackingUrl: shipment.trackingUrl ?? carrierTrackingUrl(live.carrier, live.trackingNumber),
          // Odoo delivery_status / delivered_at hanno priorità sul parser corriere.
          status: deliveryStatusFromOdoo ? shipment.status : live.status,
          shippedAt: live.shippedAt ?? shipment.shippedAt,
          estimatedDeliveryAt: live.estimatedDeliveryAt,
          deliveredAt: deliveryStatusFromOdoo
            ? shipment.deliveredAt
            : (live.deliveredAt ?? shipment.deliveredAt),
          lastLocation: live.lastLocation,
          events: live.events,
          updatedAt: new Date().toISOString(),
        }
      }
    } catch (err) {
      logger.warn('orders.shipment.carrier_track_failed', {
        carrier,
        trackingNumber,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const now = new Date()
  await prisma.orderShipmentSnapshot.upsert({
    where: { odooSaleOrderId: order.odooSaleOrderId },
    create: {
      odooSaleOrderId: order.odooSaleOrderId,
      pwaOrderId: order.pwaOrderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      deliveredAt: shipment.deliveredAt ? new Date(shipment.deliveredAt) : null,
      payloadJson: shipment,
      fetchedAt: now,
      nextRefreshAt: new Date(now.getTime() + refreshDelayMs(shipment.status)),
    },
    update: {
      pwaOrderId: order.pwaOrderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      deliveredAt: shipment.deliveredAt ? new Date(shipment.deliveredAt) : null,
      payloadJson: shipment,
      fetchedAt: now,
      nextRefreshAt: new Date(now.getTime() + refreshDelayMs(shipment.status)),
    },
  })

  const shippedStatuses: OrderShipmentStatusDTO[] = [
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
  ]
  if (
    order.pwaOrderId &&
    shippedStatuses.includes(shipment.status) &&
    (shipment.trackingNumber || shipment.trackingUrl)
  ) {
    const pwaOrder = await prisma.pwaOrder.findUnique({ where: { id: order.pwaOrderId } })
    if (pwaOrder) {
      await orderTransactionalMail.sendShipmentNotice(
        pwaOrder,
        {
          carrierLabel: shipment.carrierLabel,
          trackingNumber: shipment.trackingNumber,
          trackingUrl: shipment.trackingUrl,
        },
        correlationId,
      )
    }
  }

  return shipment
}

export const orderShipmentService = {
  async attachCached(orders: OrderDTO[]): Promise<OrderDTO[]> {
    if (orders.length === 0) return orders
    const rows = await prisma.orderShipmentSnapshot.findMany({
      where: { odooSaleOrderId: { in: orders.map((order) => order.odooSaleOrderId) } },
    })
    const byOdooId = new Map(
      rows.map((row) => [row.odooSaleOrderId, isShipmentDto(row.payloadJson) ? row.payloadJson : null]),
    )
    return orders.map((order) => withReturnWindow(order, byOdooId.get(order.odooSaleOrderId) ?? null))
  },

  async attachLive(order: OrderDetailDTO, correlationId: string): Promise<OrderDetailDTO> {
    const cached = await prisma.orderShipmentSnapshot.findUnique({
      where: { odooSaleOrderId: order.odooSaleOrderId },
    })
    const cachedDto = cached && isShipmentDto(cached.payloadJson) ? cached.payloadJson : null
    const stale = !cached || cached.nextRefreshAt.getTime() <= Date.now()

    if (!stale && cachedDto) {
      return withReturnWindow(order, cachedDto)
    }

    try {
      const live = await refreshSnapshot(order, correlationId)
      return withReturnWindow(order, live)
    } catch (err) {
      logger.warn('orders.shipment.refresh_failed', {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      })
      return withReturnWindow(order, cachedDto)
    }
  },
}

export { OPEN_RETURN_WINDOW }
