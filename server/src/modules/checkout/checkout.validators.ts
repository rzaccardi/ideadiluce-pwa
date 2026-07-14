import { z } from 'zod'
import { checkoutAddressSchema } from './checkout-address.validators.js'
import { validateFiscalCode } from '../tax/fiscal-code.validation.js'
import { validateItalianVatNumber } from '../tax/italian-vat.validation.js'
import { normalizeCountryCode } from '../tax/tax.constants.js'

export const businessFieldsSchema = z.object({
  companyName: z.string().trim().min(2).max(200).optional(),
  vatNumber: z.string().trim().min(8).max(20).optional(),
  fiscalCode: z.string().trim().min(11).max(16).optional(),
  pec: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .pipe(z.string().email().optional()),
  sdiCode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.trim() ? v.trim().toUpperCase() : undefined)),
  viesName: z.string().trim().max(500).optional(),
  viesAddress: z.string().trim().max(2000).optional(),
  viesValid: z.boolean().optional(),
  viesRequestDate: z.string().trim().max(64).optional(),
})

export const deliveryRecipientSchema = checkoutAddressSchema

export type CheckoutBusinessFields = z.infer<typeof businessFieldsSchema>

export type CheckoutStartInput = z.infer<typeof checkoutStartBodySchema>

function isBusinessCheckout(data: {
  customerSegment?: 'retail' | 'business'
  isProfessional?: boolean
}) {
  return data.customerSegment === 'business' || data.isProfessional === true
}

function validateCheckoutBilling(
  data: {
    customerSegment?: 'retail' | 'business'
    isProfessional?: boolean
    billingAddress: z.infer<typeof checkoutAddressSchema>
    business?: CheckoutBusinessFields
  },
  ctx: z.RefinementCtx,
) {
  if (!isBusinessCheckout(data)) return

  const business = data.business ?? {}
  if (!business.companyName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['business', 'companyName'],
      message: 'Ragione sociale obbligatoria per ordini business.',
    })
  }
  if (!business.vatNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['business', 'vatNumber'],
      message: 'Partita IVA obbligatoria per ordini business.',
    })
  }

  const country = data.billingAddress.country.toUpperCase()
  if (country === 'IT') {
    const hasPec = Boolean(business.pec?.trim())
    const hasSdi = Boolean(business.sdiCode?.trim())
    if (!hasPec && !hasSdi) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['business', 'pec'],
        message: 'Inserire almeno PEC o codice destinatario SDI.',
      })
    }

    if (business.vatNumber?.trim()) {
      const vat = validateItalianVatNumber(business.vatNumber)
      if (!vat.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['business', 'vatNumber'],
          message: vat.errors[0] ?? 'Partita IVA non valida.',
        })
      }
    }
  }

  if (business.fiscalCode?.trim()) {
    const cf = validateFiscalCode(business.fiscalCode)
    if (!cf.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['business', 'fiscalCode'],
        message: cf.errors[0] ?? 'Codice fiscale non valido.',
      })
    }
  }
}

function validateRetailFiscalCode(
  data: {
    customerSegment?: 'retail' | 'business'
    isProfessional?: boolean
    billingAddress: z.infer<typeof checkoutAddressSchema>
    business?: CheckoutBusinessFields
  },
  ctx: z.RefinementCtx,
) {
  if (isBusinessCheckout(data)) return
  const country = normalizeCountryCode(data.billingAddress.country)
  const fiscalCode = data.business?.fiscalCode?.trim()
  if (country === 'IT' && fiscalCode) {
    const cf = validateFiscalCode(fiscalCode)
    if (!cf.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['business', 'fiscalCode'],
        message: cf.errors[0] ?? 'Codice fiscale non valido.',
      })
    }
  }
}

export const checkoutStartBodySchema = z.object({
  email: z.string().email(),
  customerSegment: z.enum(['retail', 'business']).optional(),
  isProfessional: z.boolean().optional(),
  billingAddress: checkoutAddressSchema,
  shippingAddress: checkoutAddressSchema,
  business: businessFieldsSchema.optional(),
  vatValidated: z.boolean().optional(),
  vatForceAccepted: z.boolean().optional(),
  clientOrderRef: z.string().trim().max(200).optional(),
  orderNotes: z.string().trim().max(2000).optional(),
  deliveryRecipient: deliveryRecipientSchema.optional(),
  dropshipAddress: deliveryRecipientSchema.optional(),
  createAccount: z.boolean().optional(),
  idempotencyKey: z.string().trim().max(128).optional(),
  lockPrices: z.boolean().optional(),
})

export const checkoutStartSchema = checkoutStartBodySchema
  .superRefine(validateCheckoutBilling)
  .superRefine(validateRetailFiscalCode)

export const createCheckoutSessionSchema = z.object({
  email: z.string().email(),
})

export const patchBusinessSchema = z
  .object({
    customerSegment: z.enum(['retail', 'business']).optional(),
    companyName: z.string().trim().min(2).max(200).optional(),
    vatNumber: z.string().trim().min(8).max(20).optional(),
    fiscalCode: z.string().trim().min(11).max(16).optional(),
    pec: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : undefined))
      .pipe(z.string().email().optional()),
    sdiCode: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v?.trim() ? v.trim().toUpperCase() : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.customerSegment !== 'business') return
    if (!data.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Ragione sociale obbligatoria.',
      })
    }
    if (!data.vatNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vatNumber'],
        message: 'Partita IVA obbligatoria.',
      })
    }
    if (!data.pec?.trim() && !data.sdiCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pec'],
        message: 'Inserire almeno PEC o codice destinatario SDI.',
      })
    }
  })
