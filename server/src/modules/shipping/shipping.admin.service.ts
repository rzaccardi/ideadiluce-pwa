import { CarrierProvider, ShippingMethodType, type Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import { encryptSecret, redactSecret } from '../../lib/secrets.js'
import { env } from '../../config/env.js'
import type { ShippingAddressInput } from '../../adapters/shipping/types.js'
import { shippingService } from './shipping.service.js'
import {
  loadShippingSurchargeRules,
  updateShippingSurchargeRules,
} from './shipping.surcharges.js'
import type { Request } from 'express'
import { getStorePickupLocation } from '../../config/store-location.js'

export const shippingAdminService = {
  async listZones() {
    return prisma.shippingZone.findMany({
      include: { methods: { orderBy: { priority: 'asc' } } },
      orderBy: { priority: 'desc' },
    })
  },

  async createZone(data: {
    name: string
    countries: string[]
    postcodes?: string[]
    priority?: number
    enabled?: boolean
  }) {
    return prisma.shippingZone.create({
      data: {
        name: data.name,
        countries: data.countries.map((c) => c.toUpperCase()),
        postcodes: data.postcodes ?? [],
        priority: data.priority ?? 0,
        enabled: data.enabled ?? true,
      },
      include: { methods: true },
    })
  },

  async updateZone(
    id: string,
    data: Partial<{
      name: string
      countries: string[]
      postcodes: string[]
      priority: number
      enabled: boolean
    }>,
  ) {
    const patch: Prisma.ShippingZoneUpdateInput = { ...data }
    if (data.countries) patch.countries = data.countries.map((c) => c.toUpperCase())
    return prisma.shippingZone.update({ where: { id }, data: patch, include: { methods: true } })
  },

  async deleteZone(id: string) {
    await prisma.shippingZone.delete({ where: { id } })
    return { deleted: true }
  },

  async createMethod(
    zoneId: string,
    data: {
      name: string
      type: ShippingMethodType
      enabled?: boolean
      flatAmountCents?: number | null
      minOrderCents?: number | null
      freeAboveCents?: number | null
      surchargePct?: number
      priority?: number
    },
  ) {
    return prisma.shippingMethod.create({
      data: {
        zoneId,
        name: data.name,
        type: data.type,
        enabled: data.enabled ?? true,
        flatAmountCents: data.flatAmountCents,
        minOrderCents: data.minOrderCents,
        freeAboveCents: data.freeAboveCents,
        surchargePct: data.surchargePct ?? 0,
        priority: data.priority ?? 0,
      },
    })
  },

  async updateMethod(
    id: string,
    data: Partial<{
      name: string
      type: ShippingMethodType
      enabled: boolean
      flatAmountCents: number | null
      minOrderCents: number | null
      freeAboveCents: number | null
      surchargePct: number
      priority: number
    }>,
  ) {
    return prisma.shippingMethod.update({ where: { id }, data })
  },

  async deleteMethod(id: string) {
    await prisma.shippingMethod.delete({ where: { id } })
    return { deleted: true }
  },

  async listCredentials() {
    const rows = await prisma.carrierCredential.findMany()
    return rows.map((c) => ({
      ...c,
      apiKey: redactSecret(c.apiKey),
      apiSecret: redactSecret(c.apiSecret),
      hasKey: Boolean(c.apiKey),
      hasSecret: Boolean(c.apiSecret),
    }))
  },

  async upsertCredential(data: {
    provider: CarrierProvider
    enabled?: boolean
    sandbox?: boolean
    accountId?: string | null
    apiKey?: string | null
    apiSecret?: string | null
  }) {
    const apiKey =
      data.apiKey && data.apiKey !== '***' ? encryptSecret(data.apiKey) : undefined
    const apiSecret =
      data.apiSecret && data.apiSecret !== '***' ? encryptSecret(data.apiSecret) : undefined

    return prisma.carrierCredential.upsert({
      where: { provider: data.provider },
      create: {
        provider: data.provider,
        enabled: data.enabled ?? false,
        sandbox: data.sandbox ?? true,
        accountId: data.accountId ?? null,
        apiKey: apiKey ?? (data.apiKey ? encryptSecret(data.apiKey) : null),
        apiSecret: apiSecret ?? (data.apiSecret ? encryptSecret(data.apiSecret) : null),
      },
      update: {
        enabled: data.enabled,
        sandbox: data.sandbox,
        accountId: data.accountId,
        ...(apiKey !== undefined ? { apiKey } : {}),
        ...(apiSecret !== undefined ? { apiSecret } : {}),
      },
    })
  },

  async simulate(req: Request, shippingAddress: ShippingAddressInput) {
    if (!req.sessionRecord) {
      throw new AppError('NO_SESSION', 'No session', 'Simulazione richiede sessione o endpoint dedicato.', 400, false)
    }
    return shippingService.quotes(req, {
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        streetNumber: shippingAddress.streetNumber ?? '',
        isSnc: shippingAddress.isSnc ?? false,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
        courierNotes: shippingAddress.courierNotes,
      },
    })
  },

  async getSurcharges() {
    return loadShippingSurchargeRules()
  },

  async updateSurcharges(patch: {
    dhlBaseCents?: number
    fedexBaseCents?: number
    dhlLengthCents?: number
    lengthThresholdMeters?: number
  }) {
    return updateShippingSurchargeRules(patch)
  },
}

async function syncCarrierCredentialsFromEnv() {
  for (const provider of [CarrierProvider.DHL, CarrierProvider.FEDEX]) {
    await prisma.carrierCredential.upsert({
      where: { provider },
      create: { provider, enabled: false, sandbox: true },
      update: {},
    })
  }

  if (env.DHL_API_KEY) {
    await shippingAdminService.upsertCredential({
      provider: CarrierProvider.DHL,
      enabled: env.DHL_ENABLED,
      apiKey: env.DHL_API_KEY,
      apiSecret: env.DHL_API_SECRET,
      accountId: env.DHL_ACCOUNT_NUMBER,
      sandbox: env.DHL_SANDBOX,
    })
  }
  if (env.FEDEX_CLIENT_ID) {
    await shippingAdminService.upsertCredential({
      provider: CarrierProvider.FEDEX,
      enabled: env.FEDEX_ENABLED,
      apiKey: env.FEDEX_CLIENT_ID,
      apiSecret: env.FEDEX_CLIENT_SECRET,
      accountId: env.FEDEX_ACCOUNT_NUMBER,
      sandbox: env.FEDEX_API_BASE_URL?.includes('sandbox') ?? true,
    })
  }
}

export async function seedDefaultShippingZones() {
  const pickupLabel = getStorePickupLocation().label
  const existing = await prisma.shippingZone.count()
  if (existing === 0) {
  await prisma.shippingZone.create({
    data: {
      name: 'Italia',
      countries: ['IT'],
      postcodes: [],
      priority: 10,
      methods: {
        create: [
          {
            name: 'Spedizione standard',
            type: ShippingMethodType.FLAT_RATE,
            flatAmountCents: 590,
            priority: 1,
          },
          {
            name: 'Spedizione gratuita',
            type: ShippingMethodType.FREE_SHIPPING,
            freeAboveCents: 20000,
            priority: 2,
          },
          {
            name: pickupLabel,
            type: ShippingMethodType.PICKUP,
            priority: 5,
          },
          {
            name: 'DHL Express (live)',
            type: ShippingMethodType.LIVE_DHL,
            surchargePct: 0,
            priority: 3,
          },
          {
            name: 'FedEx (live)',
            type: ShippingMethodType.LIVE_FEDEX,
            surchargePct: 0,
            priority: 4,
          },
        ],
      },
    },
  })
  }

  await syncCarrierCredentialsFromEnv()
  await ensurePickupMethodAndFreeThreshold()
}

async function ensurePickupMethodAndFreeThreshold() {
  const itZone = await prisma.shippingZone.findFirst({
    where: { countries: { has: 'IT' } },
    include: { methods: true },
  })
  if (!itZone) return

  const pickupLabel = getStorePickupLocation().label
  await prisma.shippingMethod.updateMany({
    where: { zoneId: itZone.id, type: ShippingMethodType.PICKUP },
    data: { name: pickupLabel },
  })

  await prisma.shippingMethod.updateMany({
    where: { zoneId: itZone.id, type: ShippingMethodType.FREE_SHIPPING, freeAboveCents: 15000 },
    data: { freeAboveCents: 20000 },
  })

  const hasPickup = itZone.methods.some((m) => m.type === ShippingMethodType.PICKUP)
  if (!hasPickup) {
    await prisma.shippingMethod.create({
      data: {
        zoneId: itZone.id,
        name: pickupLabel,
        type: ShippingMethodType.PICKUP,
        priority: 5,
      },
    })
  }
}
