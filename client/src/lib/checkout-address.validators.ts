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

const TRAILING_SNC = /[,\s]+s\.?\s*n\.?\s*c\.?\s*$/i
const TRAILING_STREET_NUMBER = /^(.*?)[,\s]+(\d+[a-zA-Z]?(?:\s*\/\s*\d*[a-zA-Z]?)?)\s*$/

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Separa via e civico da stringhe tipo Odoo («Via Roma 69») senza perdere un civico già noto. */
export function splitLine1AndStreetNumber(
  line1: string,
  streetNumber = '',
  isSnc = false,
): { line1: string; streetNumber: string; isSnc: boolean } {
  const street = line1.trim()
  const num = streetNumber.trim()

  if (isSnc) {
    return {
      line1: street.replace(TRAILING_SNC, '').trim() || street,
      streetNumber: '',
      isSnc: true,
    }
  }

  if (num) {
    const dup = new RegExp(`[ ,]+${escapeRegExp(num)}\\s*$`, 'i')
    return {
      line1: street.replace(dup, '').trim() || street,
      streetNumber: num,
      isSnc: false,
    }
  }

  if (TRAILING_SNC.test(street)) {
    return { line1: street.replace(TRAILING_SNC, '').trim(), streetNumber: '', isSnc: true }
  }

  const match = street.match(TRAILING_STREET_NUMBER)
  if (match?.[1]?.trim() && match[2]) {
    return { line1: match[1].trim(), streetNumber: match[2].replace(/\s+/g, ''), isSnc: false }
  }

  return { line1: street, streetNumber: '', isSnc: false }
}

/** Unisce geocode e indirizzo già compilato: non azzera mai un civico/SNC esistente. */
export function mergeResolvedStreetNumber(
  current: { line1: string; streetNumber?: string; isSnc?: boolean },
  resolved: { line1: string; streetNumber?: string },
): { line1: string; streetNumber: string; isSnc: boolean } {
  const resolvedNum = resolved.streetNumber?.trim() ?? ''
  if (resolvedNum) {
    return { line1: resolved.line1.trim(), streetNumber: resolvedNum, isSnc: false }
  }

  const fromResolvedLine = splitLine1AndStreetNumber(resolved.line1)
  if (fromResolvedLine.streetNumber || fromResolvedLine.isSnc) {
    return fromResolvedLine
  }

  const currentNum = current.streetNumber?.trim() ?? ''
  const line1 = resolved.line1.trim() || current.line1.trim()
  if (current.isSnc) {
    return { line1, streetNumber: '', isSnc: true }
  }
  if (currentNum) {
    return { line1, streetNumber: currentNum, isSnc: false }
  }

  const fromCurrent = splitLine1AndStreetNumber(current.line1)
  return {
    line1: resolved.line1.trim() || fromCurrent.line1,
    streetNumber: fromCurrent.streetNumber,
    isSnc: fromCurrent.isSnc,
  }
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
    id: z.string().trim().min(1).max(64).optional(),
    label: z.string().trim().max(120).optional(),
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
