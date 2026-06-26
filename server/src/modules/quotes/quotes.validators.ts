import { z } from 'zod'
import { testCheckoutAddressSchema } from '../integrations/integrations.validators.js'

export const quoteRequestBodySchema = z.object({
  notes: z.string().trim().max(2000).optional(),
  billingAddress: testCheckoutAddressSchema.optional(),
  shippingAddress: testCheckoutAddressSchema.optional(),
})

export const quoteIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const odooQuoteParamsSchema = z.object({
  odooSaleOrderId: z.coerce.number().int().positive(),
})

export type QuoteRequestBody = z.infer<typeof quoteRequestBodySchema>

export function parseQuoteId(id: string): { kind: 'pwa'; id: string } | { kind: 'odoo'; odooSaleOrderId: number } {
  const odooMatch = /^odoo-(\d+)$/.exec(id)
  if (odooMatch) {
    return { kind: 'odoo', odooSaleOrderId: Number(odooMatch[1]) }
  }
  return { kind: 'pwa', id }
}

export {
  isOdooQuotePayable,
  isQuoteValidityExpired,
  quotePayabilityErrorCode,
  quotePayabilityUserMessage,
  resolveOdooQuotePayability,
  type QuotePayableReason,
  type QuotePayability,
} from './quote-payability.js'
