import { env } from '../../config/env.js'
import { decryptSecret } from '../../lib/secrets.js'
import { prisma } from '../../lib/prisma.js'
import { CarrierProvider } from '@prisma/client'
import type { CartWeightInput, ShippingAddressInput, ShippingQuoteLine } from './types.js'
import { logger } from '../../lib/logger.js'

function apiBase(): string {
  return (
    env.DHL_API_BASE_URL?.replace(/\/$/, '') ??
    (env.DHL_SANDBOX ? 'https://express.api.dhl.com/mydhlapi/test' : 'https://express.api.dhl.com/mydhlapi')
  )
}

async function credentials() {
  const row = await prisma.carrierCredential.findUnique({ where: { provider: CarrierProvider.DHL } })
  const apiKey = decryptSecret(row?.apiKey) ?? env.DHL_API_KEY?.trim()
  const apiSecret = decryptSecret(row?.apiSecret) ?? env.DHL_API_SECRET?.trim()
  const accountNumber = row?.accountId ?? env.DHL_ACCOUNT_NUMBER?.trim()
  if (!apiKey || !apiSecret) return null
  return { apiKey, apiSecret, accountNumber }
}

function basicAuth(key: string, secret: string): string {
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`
}

export async function fetchDhlRates(
  address: ShippingAddressInput,
  weight: CartWeightInput,
): Promise<ShippingQuoteLine[]> {
  if (!env.DHL_ENABLED) return []

  const creds = await credentials()
  if (!creds) return []

  const planned = new Date()
  planned.setDate(planned.getDate() + 1)
  const plannedShippingDate = planned.toISOString().split('T')[0]

  const payload = {
    customerDetails: {
      shipperDetails: {
        postalCode: env.DHL_SHIPPER_POSTAL_CODE ?? '20100',
        cityName: env.DHL_SHIPPER_CITY ?? 'Milano',
        countryCode: env.DHL_SHIPPER_COUNTRY ?? 'IT',
      },
      receiverDetails: {
        postalCode: address.postalCode,
        cityName: address.city,
        countryCode: address.country.toUpperCase(),
      },
    },
    accounts: creds.accountNumber ? [{ typeCode: 'shipper', number: creds.accountNumber }] : [],
    plannedShippingDateAndTime: `${plannedShippingDate}T10:00:00 GMT+01:00`,
    unitOfMeasurement: 'metric',
    isCustomsDeclarable: address.country.toUpperCase() !== 'IT',
    packages: [
      {
        weight: Math.max(0.1, weight.totalWeightKg),
        dimensions: {
          length: 20,
          width: 15,
          height: 10,
        },
      },
    ],
  }

  const res = await fetch(`${apiBase()}/rates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuth(creds.apiKey, creds.apiSecret),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    logger.warn('dhl.rates_failed', { status: res.status, err: errText.slice(0, 200) })
    return []
  }

  const data = (await res.json()) as {
    products?: Array<{
      productName?: string
      productCode?: string
      totalPrice?: Array<{ price?: number; priceCurrency?: string }>
      deliveryCapabilities?: { totalTransitDays?: number }
    }>
  }

  const lines: ShippingQuoteLine[] = []
  for (const product of data.products ?? []) {
    const priceRow = product.totalPrice?.find((p) => p.priceCurrency === 'EUR') ?? product.totalPrice?.[0]
    if (!priceRow?.price || !product.productCode) continue
    lines.push({
      methodRef: `live_dhl:${product.productCode}`,
      carrierCode: 'dhl',
      serviceCode: product.productCode,
      label: product.productName ?? `DHL ${product.productCode}`,
      amountCents: Math.round(Number(priceRow.price) * 100),
      currencyCode: priceRow.priceCurrency ?? 'EUR',
      etaDays: product.deliveryCapabilities?.totalTransitDays ?? null,
      source: 'dhl',
    })
  }
  return lines
}
