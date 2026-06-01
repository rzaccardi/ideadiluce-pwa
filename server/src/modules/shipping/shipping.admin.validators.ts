import { z } from 'zod'
import { addressSchema } from './shipping.validators.js'

export const zoneCreateSchema = z.object({
  name: z.string().min(1),
  countries: z.array(z.string().length(2)).min(1),
  postcodes: z.array(z.string()).optional(),
  priority: z.number().int().optional(),
  enabled: z.boolean().optional(),
})

export const zoneUpdateSchema = zoneCreateSchema.partial()

export const methodCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FLAT_RATE', 'FREE_SHIPPING', 'LIVE_DHL', 'LIVE_FEDEX']),
  enabled: z.boolean().optional(),
  flatAmountCents: z.number().int().nonnegative().nullable().optional(),
  minOrderCents: z.number().int().nonnegative().nullable().optional(),
  freeAboveCents: z.number().int().nonnegative().nullable().optional(),
  surchargePct: z.number().optional(),
  priority: z.number().int().optional(),
})

export const methodUpdateSchema = methodCreateSchema.partial()

export const credentialUpsertSchema = z.object({
  provider: z.enum(['DHL', 'FEDEX']),
  enabled: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  accountId: z.string().nullable().optional(),
  apiKey: z.string().nullable().optional(),
  apiSecret: z.string().nullable().optional(),
})

export const simulateSchema = z.object({
  shippingAddress: addressSchema,
})
