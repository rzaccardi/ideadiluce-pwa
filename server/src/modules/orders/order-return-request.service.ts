import type { OrderDTO, OrderDetailDTO, OrderReturnRequestDTO, OrderReturnRequestResultDTO } from '../../types/dto.js'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { publicAppUrl } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { AppError } from '../../types/errors.js'
import { sendPwaMail, PWA_ADMIN_MAIL_TO } from '../../adapters/odoo/odooMailAdapter.js'
import {
  buildAdminReturnRequestEmail,
  buildCustomerReturnRequestEmail,
  customerNotificationCopy,
} from './order-return-request.mail.js'

function toDto(row: { id: string; createdAt: Date; status: string }): OrderReturnRequestDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
  }
}

function customerDisplayName(user: { firstName: string | null; lastName: string | null }): string | null {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || null
}

export const orderReturnRequestService = {
  async attachToOrders(userId: string, orders: OrderDTO[]): Promise<OrderDTO[]> {
    if (orders.length === 0) return orders
    const rows = await prisma.orderReturnRequest.findMany({
      where: { userId, orderId: { in: orders.map((order) => order.id) } },
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
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, firstName: true, lastName: true },
    })
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'User not found', 'Sessione non valida.', 401, false)
    }

    const existing = await prisma.orderReturnRequest.findUnique({
      where: { userId_orderId: { userId: input.userId, orderId: input.order.id } },
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

    const locale = parseHubLocale(input.locale)
    const notes = input.notes?.trim() || null
    const customerName = customerDisplayName(user)

    let row
    try {
      row = await prisma.orderReturnRequest.create({
        data: {
          userId: input.userId,
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
          where: { userId_orderId: { userId: input.userId, orderId: input.order.id } },
        })
        if (existingAfterConflict) {
          return { ...toDto(existingAfterConflict), alreadyRequested: true }
        }
      }
      throw err
    }

    const mailInput = {
      requestId: row.id,
      locale,
      customerName,
      customerEmail: user.email,
      notes,
      order: input.order,
      orderUrl: publicAppUrl(`/account/orders/${input.order.id}`),
    }
    const adminMail = buildAdminReturnRequestEmail(mailInput)
    const customerMail = buildCustomerReturnRequestEmail(mailInput)

    logger.info('orders.return_request', {
      id: row.id,
      orderId: input.order.id,
      userId: input.userId,
      email: user.email,
    })

    try {
      await sendPwaMail(
        { correlationId: `return-request-${row.id}` },
        {
          templateKey: 'return_request_admin',
          emailTo: PWA_ADMIN_MAIL_TO,
          replyTo: user.email,
          vars: {
            order_ref: `#${input.order.odooSaleOrderId}`,
            customer_email: user.email,
            body_text: adminMail.text,
          },
        },
      )
    } catch (err) {
      logger.warn('orders.return_request.admin_mail_failed', {
        id: row.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    try {
      await sendPwaMail(
        { correlationId: `return-request-${row.id}` },
        {
          templateKey: 'return_request_customer',
          emailTo: user.email,
          vars: {
            subject: customerMail.subject,
            body_text: customerMail.text,
          },
        },
      )
    } catch (err) {
      logger.warn('orders.return_request.customer_mail_failed', {
        id: row.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    const notification = customerNotificationCopy(locale)
    await prisma.userNotification.create({
      data: {
        userId: input.userId,
        type: 'return_requested',
        title: notification.title,
        body: notification.body,
        payloadJson: { orderId: input.order.id, returnRequestId: row.id },
      },
    })

    return { ...toDto(row), alreadyRequested: false }
  },
}
