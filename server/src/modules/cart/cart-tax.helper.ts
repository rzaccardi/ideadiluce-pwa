import type { CustomerSegment } from '@prisma/client'
import { taxService } from '../tax/tax.service.js'
import { normalizeCountryCode } from '../tax/tax.constants.js'

export async function computeCartTaxCents(
  netCents: number,
  shippingCountry: string,
  options?: {
    customerSegment?: CustomerSegment | null
    isProfessional?: boolean | null
    billingCountry?: string | null
    vatValid?: boolean | null
    isEstimate?: boolean
  },
): Promise<{ taxCents: number; taxRatePct: number }> {
  const breakdown =
    options?.isEstimate === false
      ? await taxService.calculateForCheckout({
          netCents,
          shippingCountry: normalizeCountryCode(shippingCountry),
          billingCountry: options?.billingCountry,
          customerSegment: options?.customerSegment ?? 'RETAIL',
          isProfessional: options?.isProfessional ?? false,
          vatValid: options?.vatValid ?? null,
        })
      : await taxService.estimateForCart(netCents, shippingCountry, {
          customerSegment: options?.customerSegment,
          isProfessional: options?.isProfessional,
        })
  return { taxCents: breakdown.taxCents, taxRatePct: breakdown.taxRatePct }
}

export async function cartTotalsWithTax(
  subtotal: number,
  shippingCents: number,
  shippingCountry: string,
  options?: Parameters<typeof computeCartTaxCents>[2],
): Promise<{ tax: number; total: number }> {
  const { taxCents } = await computeCartTaxCents(subtotal, shippingCountry, options)
  return { tax: taxCents, total: subtotal + taxCents + shippingCents }
}
