import { z } from 'zod'

const orderStatusSchema = z.enum([
  'CART_CREATED',
  'CHECKOUT_STARTED',
  'PAYMENT_STARTED',
  'PAYMENT_PENDING',
  'PAID',
  'PAYMENT_FAILED',
  'ABANDONED',
  'CANCELLED',
  'CONFIRMED',
  'COMPLETED',
])

export const ordersAdminStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
})

const orderJourneyPhaseSchema = z.enum(['cart', 'checkout', 'paid', 'problem'])

export const ordersAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  status: orderStatusSchema.optional(),
  phase: orderJourneyPhaseSchema.optional(),
  paymentStatus: z
    .enum(['NOT_STARTED', 'CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED'])
    .optional(),
  days: z.coerce.number().int().min(0).max(3650).optional(),
  sort: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']).optional(),
  source: z.enum(['all', 'pwa', 'odoo_manual', 'other_ecommerce', 'odoo_historical']).optional(),
})

export const ordersAdminIdParamsSchema = z.object({
  id: z.string().min(1),
})
