import type { UserAddressDTO, UserShippingAddressDTO } from '../../types/dto.js'
import type { OdooCustomerProfile, OdooShippingDestination } from '../../adapters/odoo/odooCustomerAdapter.js'
import {
  isUsableShippingProfile,
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
    province: profile.province,
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
    province: address.province,
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
    dropship: Boolean(destination.dropship),
  }
}

export function mergeShippingAddressList(input: {
  odoo: OdooShippingDestination[]
  local: UserAddressDTO | null
}): UserShippingAddressDTO[] {
  const usableLocal = input.local && isUsableShippingProfile(input.local) ? input.local : null
  const usableOdoo = input.odoo.filter((destination) => isUsableShippingProfile(destination.profile))

  const matchedLocal = usableLocal
    ? usableOdoo.find((destination) => {
        if (usableLocal.id && usableLocal.id === odooShippingAddressId(destination.odooPartnerId)) {
          return true
        }
        return shippingAddressesMatch(destination.profile, usableLocal)
      })
    : undefined

  const addresses = usableOdoo.map((destination) =>
    destinationToAddressDto(
      destination,
      Boolean(
        matchedLocal && destination.odooPartnerId === matchedLocal.odooPartnerId,
      ),
    ),
  )

  if (usableLocal && !matchedLocal) {
    addresses.unshift({
      ...usableLocal,
      id: usableLocal.id || LOCAL_SHIPPING_ADDRESS_ID,
      label: usableLocal.label || `${usableLocal.firstName} ${usableLocal.lastName}`.trim() || usableLocal.city,
      source: 'local',
      isDefault: addresses.every((address) => !address.isDefault),
      canEdit: true,
      canDelete: false,
      dropship: false,
    })
  }

  if (addresses.length > 0 && addresses.every((address) => !address.isDefault)) {
    const preferred =
      addresses.find((address) => address.source === 'odoo_delivery' && !address.dropship) ??
      addresses.find((address) => !address.dropship) ??
      addresses[0]
    if (preferred) preferred.isDefault = true
  }

  return addresses
}
