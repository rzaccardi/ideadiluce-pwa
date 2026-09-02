import type {
  OrderDTO,
  OrderDetailDTO,
  OrderShipmentDTO,
  OrderShipmentStatusDTO,
} from '../../types/dto.js'
import { prisma } from '../../lib/prisma.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
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

function withReturnWindow<T extends OrderDTO>(order: T, shipment: OrderShipmentDTO | null): T {
  return {
    ...order,
    shipment,
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
}): OrderShipmentDTO {
  return {
    carrier: input.carrier,
    carrierLabel: input.carrierLabel,
    trackingNumber: input.trackingNumber,
    trackingUrl: input.trackingUrl ?? carrierTrackingUrl(input.carrier, input.trackingNumber),
    status: input.status,
    shippedAt: input.shippedAt,
    estimatedDeliveryAt: null,
    deliveredAt: null,
    lastLocation: null,
    events: [],
    updatedAt: new Date().toISOString(),
  }
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

async function refreshSnapshot(
  order: OrderDTO,
  correlationId: string,
): Promise<OrderShipmentDTO | null> {
  const ctx: OdooCallContext = { correlationId: `${correlationId}:shipment` }
  const pwaHint = await pwaCarrierHint(order.pwaOrderId)

  let saleName: string | null = null
  if (isOdooConfigured()) {
    try {
      const so = await odooSalesService.getOrderById(ctx, order.odooSaleOrderId)
      saleName = so?.name ?? null
    } catch (err) {
      logger.warn('orders.shipment.odoo_order_failed', {
        odooSaleOrderId: order.odooSaleOrderId,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  let picking = null
  if (isOdooConfigured()) {
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

  let shipment = pickingToShipment({
    carrier,
    carrierLabel: picking?.carrierName ?? (carrier === 'fedex' ? 'FedEx' : carrier === 'dhl' ? 'DHL' : null),
    trackingNumber,
    trackingUrl: picking?.trackingUrl ?? null,
    shippedAt,
    status: trackingNumber && picking?.state === 'done' ? 'in_transit' : baseStatus,
  })

  if (trackingNumber && (carrier === 'fedex' || carrier === 'dhl')) {
    try {
      const live = await fetchCarrierTrack(carrier, trackingNumber, ctx.correlationId)
      if (live) {
        shipment = {
          ...shipment,
          carrier: live.carrier,
          trackingNumber: live.trackingNumber,
          trackingUrl: shipment.trackingUrl ?? carrierTrackingUrl(live.carrier, live.trackingNumber),
          status: live.status,
          shippedAt: live.shippedAt ?? shipment.shippedAt,
          estimatedDeliveryAt: live.estimatedDeliveryAt,
          deliveredAt: live.deliveredAt,
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
