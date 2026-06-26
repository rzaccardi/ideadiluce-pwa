import { env } from '../../config/env.js'
import { decryptSecret } from '../../lib/secrets.js'
import { prisma } from '../../lib/prisma.js'
import { writeStructuredIntegrationLog } from '../../lib/integration-log-context.js'
import { CarrierProvider } from '@prisma/client'
import type { CartWeightInput, ShippingAddressInput, ShippingQuoteLine } from './types.js'
import { logger } from '../../lib/logger.js'

type FedexTokenCache = { token: string; expiresAt: number }
let tokenCache: FedexTokenCache | null = null

function apiBase(): string {
  return (
    env.FEDEX_API_BASE_URL?.replace(/\/$/, '') ??
    (env.FEDEX_ENABLED && env.FEDEX_CLIENT_ID?.includes('l7')
      ? 'https://apis-sandbox.fedex.com'
      : 'https://apis.fedex.com')
  )
}

async function credentials() {
  const row = await prisma.carrierCredential.findUnique({ where: { provider: CarrierProvider.FEDEX } })
  const clientId = decryptSecret(row?.apiKey) ?? env.FEDEX_CLIENT_ID?.trim()
  const clientSecret = decryptSecret(row?.apiSecret) ?? env.FEDEX_CLIENT_SECRET?.trim()
  const accountNumber = row?.accountId ?? env.FEDEX_ACCOUNT_NUMBER?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, accountNumber, sandbox: row?.sandbox ?? true }
}

async function accessToken(): Promise<string | null> {
  const creds = await credentials()
  if (!creds) return null
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  })
  const res = await fetch(`${apiBase()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    logger.warn('fedex.oauth_failed', { status: res.status })
    return null
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return data.access_token
}

const SHIPPER = {
  address: {
    postalCode: env.FEDEX_SHIPPER_POSTAL_CODE ?? '20100',
    countryCode: env.FEDEX_SHIPPER_COUNTRY ?? 'IT',
    city: env.FEDEX_SHIPPER_CITY ?? 'Milano',
  },
}

export async function fetchFedexRates(
  address: ShippingAddressInput,
  weight: CartWeightInput,
  correlationId?: string,
): Promise<ShippingQuoteLine[]> {
  if (!env.FEDEX_ENABLED) return []

  const token = await accessToken()
  const creds = await credentials()
  if (!token || !creds?.accountNumber) return []

  const payload = {
    accountNumber: { value: creds.accountNumber },
    requestedShipment: {
      shipper: { address: SHIPPER.address },
      recipient: {
        address: {
          postalCode: address.postalCode,
          countryCode: address.country.toUpperCase(),
          city: address.city,
        },
      },
      pickupType: 'USE_SCHEDULED_PICKUP',
      rateRequestType: ['ACCOUNT', 'LIST'],
      requestedPackageLineItems: [
        {
          weight: { units: 'KG', value: Math.max(0.1, weight.totalWeightKg) },
        },
      ],
    },
  }

  const res = await fetch(`${apiBase()}/rate/v1/rates/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    logger.warn('fedex.rates_failed', { status: res.status, err: errText.slice(0, 200) })
    if (correlationId) {
      await writeStructuredIntegrationLog({
        service: 'fedex',
        operation: 'rates',
        correlationId,
        success: false,
        statusCode: res.status,
        error: errText.slice(0, 500),
        extra: { country: address.country, postalCode: address.postalCode },
      })
    }
    return []
  }

  const data = (await res.json()) as {
    output?: {
      rateReplyDetails?: Array<{
        serviceType?: string
        serviceName?: string
        ratedShipmentDetails?: Array<{
          totalNetCharge?: number
          shipmentRateDetail?: { totalNetCharge?: number }
        }>
      }>
    }
  }

  const lines: ShippingQuoteLine[] = []
  for (const detail of data.output?.rateReplyDetails ?? []) {
    const charge =
      detail.ratedShipmentDetails?.[0]?.totalNetCharge ??
      detail.ratedShipmentDetails?.[0]?.shipmentRateDetail?.totalNetCharge
    if (charge == null || !detail.serviceType) continue
    const amountCents = Math.round(Number(charge) * 100)
    lines.push({
      methodRef: `live_fedex:${detail.serviceType}`,
      carrierCode: 'fedex',
      serviceCode: detail.serviceType,
      label: detail.serviceName ?? `FedEx ${detail.serviceType}`,
      amountCents,
      currencyCode: 'EUR',
      etaDays: null,
      source: 'fedex',
    })
  }
  if (correlationId && lines.length > 0) {
    await writeStructuredIntegrationLog({
      service: 'fedex',
      operation: 'rates',
      correlationId,
      success: true,
      extra: { quotes: lines.length, country: address.country },
    })
  }
  return lines
}
