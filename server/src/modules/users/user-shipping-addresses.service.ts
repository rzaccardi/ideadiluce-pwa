import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { odooShippingAddressId, parseOdooShippingAddressId } from '../../adapters/odoo/odoo-partner-shipping.js'
import { AppError } from '../../types/errors.js'
import type { UserAddressDTO, UserShippingAddressListDTO } from '../../types/dto.js'
import { parseShippingAddressJson, toUserDTO } from './user.mapper.js'
import {
  addressDtoToProfile,
  LOCAL_SHIPPING_ADDRESS_ID,
  mergeShippingAddressList,
  profileToAddressDto,
} from './user-shipping-addresses.mapper.js'
import { runOdooUserProfileSync } from './users-odoo-sync.helper.js'

const customerAdapter = createOdooCustomerAdapter()

function jsonAddress(address: UserAddressDTO): Prisma.InputJsonValue {
  return address as unknown as Prisma.InputJsonValue
}

async function loadUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
  }
  return user
}

async function commercialPartnerId(
  ctx: OdooCallContext,
  mappedPartnerId: number,
): Promise<number> {
  try {
    const account = await customerAdapter.getCustomerAccountByPartnerId(ctx, mappedPartnerId)
    return account?.commercialPartnerId || mappedPartnerId
  } catch {
    return mappedPartnerId
  }
}

async function persistDefaultAddress(userId: string, address: UserAddressDTO) {
  await prisma.user.update({
    where: { id: userId },
    data: { shippingAddressJson: jsonAddress(address) },
  })
}

export const userShippingAddressesService = {
  async list(userId: string, ctx?: OdooCallContext): Promise<UserShippingAddressListDTO> {
    const user = await loadUser(userId)
    const local = parseShippingAddressJson(user.shippingAddressJson)
    const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
    const odooReady = Boolean(ctx && env.ODOO_ENABLED && isOdooConfigured() && map)
    let odooSyncFailed = false
    let odoo = [] as Awaited<ReturnType<typeof customerAdapter.listShippingDestinations>>

    if (odooReady && ctx && map) {
      try {
        const parentId = await commercialPartnerId(ctx, map.odooPartnerId)
        odoo = await customerAdapter.listShippingDestinations(ctx, parentId)
      } catch {
        odooSyncFailed = true
      }
    }

    return {
      addresses: mergeShippingAddressList({ odoo, local }),
      canCreate: Boolean(map) && Boolean(env.ODOO_ENABLED && isOdooConfigured()),
      odooSyncFailed,
    }
  },

  async create(userId: string, input: UserAddressDTO, ctx?: OdooCallContext) {
    const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
    let address: UserAddressDTO = { ...input }
    let odooSyncFailed = false

    if (ctx && env.ODOO_ENABLED && isOdooConfigured() && map) {
      const parentId = await commercialPartnerId(ctx, map.odooPartnerId)
      odooSyncFailed = await runOdooUserProfileSync(
        ctx,
        { userId, partnerId: parentId, operation: 'shipping_address_sync' },
        async () => {
          const created = await customerAdapter.createDeliveryPartner(
            ctx,
            parentId,
            addressDtoToProfile(input),
          )
          address = {
            ...profileToAddressDto(addressDtoToProfile(input), {
              id: odooShippingAddressId(created.odooPartnerId),
              label: [input.firstName, input.lastName].filter(Boolean).join(' ').trim(),
            }),
            id: odooShippingAddressId(created.odooPartnerId),
            label: [input.firstName, input.lastName].filter(Boolean).join(' ').trim(),
          }
        },
      )
    } else {
      address = { ...input, id: input.id || LOCAL_SHIPPING_ADDRESS_ID }
    }

    await persistDefaultAddress(userId, address)
    const user = await loadUser(userId)
    return {
      list: await this.list(userId, ctx),
      user: await toUserDTO(user),
      odooSyncFailed,
    }
  },

  async update(userId: string, addressId: string, input: UserAddressDTO, ctx?: OdooCallContext) {
    const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
    const odooId = parseOdooShippingAddressId(addressId)
    let address: UserAddressDTO = { ...input, id: addressId, label: input.label }
    let odooSyncFailed = false

    if (odooId && ctx && env.ODOO_ENABLED && isOdooConfigured() && map) {
      const parentId = await commercialPartnerId(ctx, map.odooPartnerId)
      if (odooId === parentId) {
        throw new AppError(
          'SHIPPING_ADDRESS_NOT_EDITABLE',
          'Parent address cannot be edited here',
          'L’indirizzo della sede si modifica dai dati aziendali.',
          400,
          false,
        )
      }
      odooSyncFailed = await runOdooUserProfileSync(
        ctx,
        { userId, partnerId: odooId, operation: 'shipping_address_sync' },
        () => customerAdapter.updateDeliveryPartner(ctx, odooId, addressDtoToProfile(input)),
      )
    }

    const current = parseShippingAddressJson((await loadUser(userId)).shippingAddressJson)
    if (!current || current.id === addressId || addressId === LOCAL_SHIPPING_ADDRESS_ID) {
      await persistDefaultAddress(userId, address)
    }

    const user = await loadUser(userId)
    return {
      list: await this.list(userId, ctx),
      user: await toUserDTO(user),
      odooSyncFailed,
    }
  },

  async remove(userId: string, addressId: string, ctx?: OdooCallContext) {
    const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
    const odooId = parseOdooShippingAddressId(addressId)
    if (!odooId) {
      throw new AppError(
        'SHIPPING_ADDRESS_NOT_DELETABLE',
        'Address cannot be deleted',
        'Questo indirizzo non può essere eliminato.',
        400,
        false,
      )
    }
    if (!ctx || !map || !env.ODOO_ENABLED || !isOdooConfigured()) {
      throw new AppError(
        'ODOO_UNAVAILABLE',
        'Odoo unavailable',
        'Sincronizzazione Odoo non disponibile.',
        503,
        true,
      )
    }

    const parentId = await commercialPartnerId(ctx, map.odooPartnerId)
    if (odooId === parentId) {
      throw new AppError(
        'SHIPPING_ADDRESS_NOT_DELETABLE',
        'Parent address cannot be deleted',
        'L’indirizzo della sede non può essere eliminato.',
        400,
        false,
      )
    }

    const failed = await runOdooUserProfileSync(
      ctx,
      { userId, partnerId: odooId, operation: 'shipping_address_sync' },
      () => customerAdapter.archiveDeliveryPartner(ctx, odooId),
    )
    if (failed) {
      throw new AppError(
        'ODOO_SYNC_FAILED',
        'Could not archive delivery partner',
        'Impossibile eliminare l’indirizzo su Odoo. Riprova più tardi.',
        502,
        true,
      )
    }

    const current = parseShippingAddressJson((await loadUser(userId)).shippingAddressJson)
    if (current?.id === addressId) {
      await prisma.user.update({
        where: { id: userId },
        data: { shippingAddressJson: Prisma.DbNull },
      })
    }

    const user = await loadUser(userId)
    return {
      list: await this.list(userId, ctx),
      user: await toUserDTO(user),
      odooSyncFailed: false,
    }
  },

  async select(userId: string, addressId: string, ctx?: OdooCallContext) {
    const list = await this.list(userId, ctx)
    const selected = list.addresses.find((address) => address.id === addressId)
    if (!selected) {
      throw new AppError(
        'SHIPPING_ADDRESS_NOT_FOUND',
        'Shipping address not found',
        'Indirizzo di spedizione non trovato.',
        404,
        false,
      )
    }
    const { source: _source, isDefault: _isDefault, canEdit: _canEdit, canDelete: _canDelete, ...address } =
      selected
    await persistDefaultAddress(userId, address)
    const user = await loadUser(userId)
    return {
      list: await this.list(userId, ctx),
      user: await toUserDTO(user),
      odooSyncFailed: list.odooSyncFailed,
    }
  },
}
