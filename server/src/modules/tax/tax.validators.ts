import { z } from 'zod'
import { CustomerSegment } from '@prisma/client'

export const taxEstimateQuerySchema = z.object({
  country: z.string().trim().min(2).max(2).optional(),
  netCents: z.coerce.number().int().min(0).optional(),
})

export const taxCalculateSchema = z.object({
  netCents: z.coerce.number().int().min(0),
  billingCountry: z.string().trim().min(2).max(2),
  shippingCountry: z.string().trim().min(2).max(2),
  customerSegment: z.enum(['retail', 'business', 'professional']).optional(),
  isProfessional: z.boolean().optional(),
  vatNumber: z.string().trim().optional(),
  vatValidated: z.boolean().optional(),
  vatForceAccepted: z.boolean().optional(),
})

export const vatValidateSchema = z.object({
  vatNumber: z.string().trim().min(4).max(20),
  countryCode: z.string().trim().min(2).max(2).optional(),
})

export const taxValidateSchema = z.object({
  countryCode: z.string().trim().min(2).max(2).default('IT'),
  fiscalCode: z.string().trim().max(16).optional(),
  vatNumber: z.string().trim().max(20).optional(),
  personType: z.enum(['private', 'company']),
})

export const taxRuleCreateSchema = z.object({
  priority: z.coerce.number().int(),
  customerSegment: z.nativeEnum(CustomerSegment).nullable().optional(),
  isProfessional: z.boolean().nullable().optional(),
  billingCountry: z.string().trim().max(16).nullable().optional(),
  shippingCountry: z.string().trim().min(1).max(16),
  vatValid: z.boolean().nullable().optional(),
  taxRatePct: z.coerce.number().min(0).max(100),
  taxLabel: z.string().trim().min(1).max(120),
  disclaimerKey: z.string().trim().max(64).nullable().optional(),
  odooFiscalPositionId: z.coerce.number().int().nullable().optional(),
  enabled: z.boolean().optional(),
})

export const taxRuleUpdateSchema = taxRuleCreateSchema.partial()

export function segmentFromDto(
  value?: 'retail' | 'business' | 'professional' | null,
): CustomerSegment | null {
  if (!value) return null
  if (value === 'retail') return 'RETAIL'
  if (value === 'business') return 'BUSINESS'
  return 'PROFESSIONAL'
}
