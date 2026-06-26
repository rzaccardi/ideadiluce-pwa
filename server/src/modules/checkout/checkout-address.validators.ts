import { z } from 'zod'

const ISO2 = /^[A-Z]{2}$/
const IT_POSTAL = /^\d{5}$/
const EU_POSTAL = /^[A-Z0-9][A-Z0-9\s-]{1,11}[A-Z0-9]$/i
const E164 = /^\+[1-9]\d{6,14}$/
const IT_MOBILE = /^(?:\+39|0039)?[\s.-]?3\d{2}[\s.-]?\d{6,7}$/
const IT_LANDLINE = /^(?:\+39|0039)?[\s.-]?0\d{1,4}[\s.-]?\d{5,8}$/

export function formatStreetLine(address: {
  line1: string
  streetNumber?: string
  isSnc?: boolean
}): string {
  const street = address.line1.trim()
  if (address.isSnc) return street
  const num = address.streetNumber?.trim()
  return num ? `${street} ${num}`.trim() : street
}

function isPostalCodeValid(country: string, postalCode: string): boolean {
  const code = postalCode.trim()
  if (country === 'IT') return IT_POSTAL.test(code)
  return EU_POSTAL.test(code)
}

function isPhoneValid(phone: string): boolean {
  const normalized = phone.replace(/\s/g, '')
  return E164.test(normalized) || IT_MOBILE.test(phone) || IT_LANDLINE.test(phone)
}

export const checkoutAddressSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    line1: z.string().trim().min(3),
    streetNumber: z.string().trim(),
    isSnc: z.boolean().optional().default(false),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(2),
    postalCode: z.string().trim().min(1),
    country: z
      .string()
      .trim()
      .length(2)
      .transform((c) => c.toUpperCase())
      .refine((c) => ISO2.test(c), { message: 'Invalid country code' }),
    phone: z.string().trim().optional(),
    courierNotes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isSnc && !data.streetNumber.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['streetNumber'],
        message: 'Street number or SNC required',
      })
    }
    if (!isPostalCodeValid(data.country, data.postalCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['postalCode'],
        message: 'Invalid postal code',
      })
    }
    if (data.phone?.trim() && !isPhoneValid(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Invalid phone number',
      })
    }
  })

export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>

export function isCheckoutAddressValid(address: unknown): address is CheckoutAddressInput {
  return checkoutAddressSchema.safeParse(address).success
}

export function normalizeCheckoutAddress(
  address: Partial<CheckoutAddressInput> & Pick<CheckoutAddressInput, 'line1' | 'city' | 'postalCode' | 'country'>,
): CheckoutAddressInput {
  return {
    firstName: address.firstName?.trim() || '',
    lastName: address.lastName?.trim() || '',
    line1: address.line1,
    streetNumber: address.streetNumber?.trim() || '',
    isSnc: address.isSnc ?? false,
    line2: address.line2,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
    courierNotes: address.courierNotes,
  }
}
