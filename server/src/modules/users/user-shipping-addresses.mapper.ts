import type { UserAddressDTO, UserShippingAddressDTO } from '../../types/dto.js'
import type { OdooCustomerProfile, OdooShippingDestination } from '../../adapters/odoo/odooCustomerAdapter.js'
import {
  odooShippingAddressId,
  shippingAddressesMatch,
} from '../../adapters/odoo/odoo-partner-shipping.js'

export const LOCAL_SHIPPING_ADDRESS_ID = 'local:default'

export function profileToAddressDto(
  profile: OdooCustomerProfile,
  extras?: Partial<UserAddressDTO>,
): UserAddressDTO {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    line1: profile.line1,
    streetNumber: profile.streetNumber || undefined,
    isSnc: profile.isSnc || undefined,
    line2: profile.line2,
    city: profile.city,
    postalCode: profile.postalCode,
    country: profile.country,
    phone: profile.phone,
    ...extras,
  }
}

export function addressDtoToProfile(address: UserAddressDTO): OdooCustomerProfile {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    line1: address.line1,
    streetNumber: address.streetNumber ?? '',
    isSnc: address.isSnc ?? false,
    line2: address.line2,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
  }
}

export function destinationToAddressDto(
  destination: OdooShippingDestination,
  isDefault: boolean,
): UserShippingAddressDTO {
  const source =
    destination.kind === 'parent'
      ? ('odoo_parent' as const)
      : destination.kind === 'delivery'
        ? ('odoo_delivery' as const)
        : ('odoo_contact' as const)
  return {
    ...profileToAddressDto(destination.profile, {
      id: odooShippingAddressId(destination.odooPartnerId),
      label: destination.label,
    }),
    id: odooShippingAddressId(destination.odooPartnerId),
    label: destination.label,
    source,
    isDefault,
    canEdit: destination.kind !== 'parent',
    canDelete: destination.kind === 'delivery' || destination.kind === 'contact',
  }
}

export function mergeShippingAddressList(input: {
  odoo: OdooShippingDestination[]
  local: UserAddressDTO | null
}): UserShippingAddressDTO[] {
  const matchedLocal = input.local
    ? input.odoo.find((destination) => {
        if (input.local?.id && input.local.id === odooShippingAddressId(destination.odooPartnerId)) {
          return true
        }
        return shippingAddressesMatch(destination.profile, input.local!)
      })
    : undefined

  const addresses = input.odoo.map((destination) =>
    destinationToAddressDto(
      destination,
      Boolean(
        matchedLocal && destination.odooPartnerId === matchedLocal.odooPartnerId,
      ),
    ),
  )

  if (input.local && !matchedLocal) {
    addresses.unshift({
      ...input.local,
      id: input.local.id || LOCAL_SHIPPING_ADDRESS_ID,
      label: input.local.label || `${input.local.firstName} ${input.local.lastName}`.trim() || input.local.city,
      source: 'local',
      isDefault: addresses.every((address) => !address.isDefault),
      canEdit: true,
      canDelete: false,
    })
  }

  if (addresses.length > 0 && addresses.every((address) => !address.isDefault)) {
    const preferred =
      addresses.find((address) => address.source === 'odoo_delivery') ?? addresses[0]
    if (preferred) preferred.isDefault = true
  }

  return addresses
}
