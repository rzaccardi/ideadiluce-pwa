import type { User } from '@prisma/client'
import type { CustomerSegmentDTO, UserAddressDTO, UserDTO } from '../../types/dto.js'
import { paymentMethodToDTO } from '../payments/payment.types.js'
import { pricingContextLabel } from '../pricing/pricelist.service.js'
import { splitLine1AndStreetNumber } from '../checkout/checkout-address.validators.js'

function segmentToDTO(segment: User['customerSegment']): CustomerSegmentDTO {
  if (segment === 'BUSINESS') return 'business'
  if (segment === 'PROFESSIONAL') return 'professional'
  return 'retail'
}

export function parseShippingAddressJson(json: unknown): UserAddressDTO | null {
  if (!json || typeof json !== 'object') return null
  const address = json as Record<string, unknown>
  if (typeof address.line1 !== 'string' || !address.line1.trim()) return null

  const split = splitLine1AndStreetNumber(
    address.line1,
    typeof address.streetNumber === 'string' ? address.streetNumber : '',
    address.isSnc === true,
  )

  return {
    firstName: typeof address.firstName === 'string' ? address.firstName : '',
    lastName: typeof address.lastName === 'string' ? address.lastName : '',
    line1: split.line1,
    streetNumber: split.streetNumber,
    isSnc: split.isSnc,
    line2: typeof address.line2 === 'string' ? address.line2 : undefined,
    city: typeof address.city === 'string' ? address.city : '',
    postalCode: typeof address.postalCode === 'string' ? address.postalCode : '',
    country: typeof address.country === 'string' ? address.country : 'IT',
    phone: typeof address.phone === 'string' ? address.phone : undefined,
    courierNotes: typeof address.courierNotes === 'string' ? address.courierNotes : undefined,
    id: typeof address.id === 'string' && address.id.trim() ? address.id.trim() : undefined,
    label: typeof address.label === 'string' && address.label.trim() ? address.label.trim() : undefined,
  }
}

export async function toUserDTO(user: User): Promise<UserDTO> {
  const isProfessional = user.isProfessional || user.customerSegment === 'PROFESSIONAL'
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    status: user.status,
    shippingAddress: parseShippingAddressJson(user.shippingAddressJson),
    preferredPaymentMethod: user.preferredPaymentMethod
      ? paymentMethodToDTO(user.preferredPaymentMethod)
      : null,
    customerSegment: segmentToDTO(user.customerSegment),
    pricelistLabel: isProfessional ? '' : pricingContextLabel(user.customerSegment),
    isProfessional,
    companyName: user.companyName,
    vatNumber: user.vatNumber,
    fiscalCode: user.fiscalCode,
    pec: user.pec,
    sdiCode: user.sdiCode,
    vatCountryCode: user.vatCountryCode,
    vatFormatValid: user.vatFormatValid,
    vatChecksumValid: user.vatChecksumValid,
    fiscalCodeValid: user.fiscalCodeValid,
    viesValid: user.viesValid,
    viesName: user.viesName,
    viesAddress: user.viesAddress,
    taxValidationStatus: user.taxValidationStatus,
    taxCheckedAt: user.taxCheckedAt?.toISOString() ?? null,
    // IDs Odoo restano server-side: il listino si deriva dalla sessione, non dallo stato client.
    odooPartnerId: null,
    odooPricelistId: null,
  }
}
