import type { OrderDTO, OrderDetailDTO, OrderReturnRequestDTO, OrderReturnRequestResultDTO } from '../../types/dto.js'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { AppError } from '../../types/errors.js'
import {
  isOdooApiV2Configured,
  OdooApiV2Error,
  toOdooApiV2AppError,
} from '../../adapters/odoo-api/odooApiClient.js'
import { odooApiCreateReturnRequest, odooApiGetOrder } from '../../adapters/odoo-api/odooApi.resources.js'
import { resolveOdooPartnerId } from '../../lib/satellite-lookup.js'
import { customerNotificationCopy } from './order-return-request.mail.js'

function toDto(row: { id: string; createdAt: Date; status: string }): OrderReturnRequestDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
  }
}

export const orderReturnRequestService = {
  async attachToOrders(userId: string, orders: OrderDTO[]): Promise<OrderDTO[]> {
    if (orders.length === 0) return orders
    const odooPartnerId = await resolveOdooPartnerId(userId)
    const rows = await prisma.orderReturnRequest.findMany({
      where: { odooPartnerId, orderId: { in: orders.map((order) => order.id) } },
      select: { id: true, orderId: true, createdAt: true, status: true },
    })
    const byOrderId = new Map(rows.map((row) => [row.orderId, toDto(row)]))
    return orders.map((order) => ({
      ...order,
      returnRequest: byOrderId.get(order.id) ?? null,
    }))
  },

  async submit(input: {
    userId: string
    order: OrderDetailDTO
    notes?: string
    locale?: string
  }): Promise<OrderReturnRequestResultDTO> {
    const user = await prisma.customerSatellite.findUnique({
      where: { id: input.userId },
      select: { email: true, firstName: true, lastName: true, odooPartnerId: true },
    })
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'User not found', 'Sessione non valida.', 401, false)
    }

    const existing = await prisma.orderReturnRequest.findUnique({
      where: {
        odooPartnerId_orderId: { odooPartnerId: user.odooPartnerId, orderId: input.order.id },
      },
    })
    if (existing) {
      return { ...toDto(existing), alreadyRequested: true }
    }

    if (!input.order.returnWindow.eligible) {
      throw new AppError(
        'RETURN_WINDOW_EXPIRED',
        'Return window expired',
        'Il termine di 14 giorni dalla consegna è scaduto: non è più possibile avviare il reso da quest’ordine.',
        409,
        false,
      )
    }

    if (!input.order.odooSaleOrderId) {
      throw new AppError(
        'RETURN_ORDER_NOT_SYNCED',
        'Order not synced to Odoo',
        'Ordine non ancora sincronizzato: riprova tra poco.',
        409,
        true,
      )
    }

    if (!isOdooApiV2Configured()) {
      throw new AppError(
        'ODOO_API_UNAVAILABLE',
        'Odoo API v2 not configured',
        'Servizio resi temporaneamente non disponibile. Riprova tra poco.',
        503,
        true,
      )
    }

    const correlationId = `return-request-${input.order.id}`
    let returnLines: Array<{ line_id?: number; product_id?: number; qty: number }>
    try {
      const apiOrder = await odooApiGetOrder(input.order.odooSaleOrderId, correlationId)
      returnLines = (apiOrder.lines ?? [])
        .filter((line) => !line.is_delivery && (line.qty ?? 0) > 0 && (line.id != null || line.product_id != null))
        .map((line) => ({
          ...(line.id != null ? { line_id: line.id } : {}),
          ...(line.product_id != null ? { product_id: line.product_id } : {}),
          qty: line.qty ?? 0,
        }))
    } catch (err) {
      if (err instanceof OdooApiV2Error) throw toOdooApiV2AppError(err, correlationId)
      throw err
    }

    if (returnLines.length === 0) {
      throw new AppError(
        'RETURN_NO_LINES',
        'No returnable lines',
        'Non ci sono articoli restituibili su questo ordine.',
        422,
        false,
      )
    }

    const locale = parseHubLocale(input.locale)
    const notes = input.notes?.trim() || null

    try {
      await odooApiCreateReturnRequest(
        input.order.odooSaleOrderId,
        {
          customer_id: user.odooPartnerId,
          lines: returnLines,
          note: notes,
        },
        correlationId,
      )
    } catch (err) {
      if (err instanceof OdooApiV2Error) {
        if (err.httpStatus === 409 || err.httpStatus === 422) {
          throw new AppError(
            err.httpStatus === 409 ? 'RETURN_NOT_ALLOWED' : 'RETURN_INVALID_LINES',
            err.message,
            err.message || 'Non è possibile avviare il reso su questo ordine.',
            err.httpStatus,
            false,
            { correlationId, body: err.body },
          )
        }
        throw toOdooApiV2AppError(err, correlationId)
      }
      throw err
    }

    let row
    try {
      row = await prisma.orderReturnRequest.create({
        data: {
          odooPartnerId: user.odooPartnerId,
          orderId: input.order.id,
          pwaOrderId: input.order.pwaOrderId,
          odooSaleOrderId: input.order.odooSaleOrderId,
          email: user.email,
          locale,
          notes,
        },
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existingAfterConflict = await prisma.orderReturnRequest.findUnique({
          where: {
            odooPartnerId_orderId: {
              odooPartnerId: user.odooPartnerId,
              orderId: input.order.id,
            },
          },
        })
        if (existingAfterConflict) {
          return { ...toDto(existingAfterConflict), alreadyRequested: true }
        }
      }
      throw err
    }

    logger.info('orders.return_request', {
      id: row.id,
      orderId: input.order.id,
      odooSaleOrderId: input.order.odooSaleOrderId,
      odooPartnerId: user.odooPartnerId,
      email: user.email,
      via: 'odoo_api_v2',
    })

    const notification = customerNotificationCopy(locale)
    await prisma.userNotification.create({
      data: {
        odooPartnerId: user.odooPartnerId,
        type: 'return_requested',
        title: notification.title,
        body: notification.body,
        payloadJson: { orderId: input.order.id, returnRequestId: row.id },
      },
    })

    return { ...toDto(row), alreadyRequested: false }
  },
}
