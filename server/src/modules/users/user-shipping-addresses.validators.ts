import { z } from 'zod'
import { checkoutAddressSchema } from '../checkout/checkout-address.validators.js'

export const shippingAddressIdParamSchema = z.object({
  id: z.string().trim().min(1).max(64),
})

const shippingAddressExtrasSchema = z.object({
  recipient: z.enum(['own', 'third_party']).optional().default('own'),
  /** Email del destinatario dropship (facoltativa). */
  email: z.union([z.string().trim().email(), z.literal('')]).optional(),
})

/** Per `third_party` il nominativo può stare solo in `firstName` (Odoo usa un unico `name`). */
export const upsertShippingAddressSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object') return raw
  const body = raw as Record<string, unknown>
  if (body.recipient !== 'third_party') return raw
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
  if (firstName && !lastName) {
    return { ...body, lastName: '-' }
  }
  return raw
}, checkoutAddressSchema.and(shippingAddressExtrasSchema))
