import { writeIntegrationLog } from '../../lib/integration-log.js'

export const VIES_URL =
  'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number'

const VIES_TIMEOUT_MS = 12_000
const RETRY_DELAY_MS = 500

export type ViesStatus = 'valid' | 'invalid' | 'service_unavailable'

export type ViesCheckResult = {
  status: ViesStatus
  valid: boolean | null
  name?: string | null
  address?: string | null
  requestDate?: string | null
}

type ViesApiPayload = {
  valid?: boolean
  userError?: string
  name?: string | null
  address?: string | null
  requestDate?: string | null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429
}

async function callViesOnce(
  countryCode: string,
  vatNumber: string,
  correlationId?: string,
): Promise<ViesCheckResult> {
  const startedAt = new Date()
  try {
    const res = await fetch(VIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ countryCode, vatNumber }),
      signal: AbortSignal.timeout(VIES_TIMEOUT_MS),
    })
    const finishedAt = new Date()
    const payload = (await res.json()) as ViesApiPayload

    await writeIntegrationLog({
      service: 'vat',
      operation: 'vies_check',
      correlationId: correlationId ?? `${countryCode}-${vatNumber}`,
      success: res.ok && payload.valid === true,
      statusCode: res.status,
      requestRedacted: { countryCode, vatNumber: '***' },
      responseRedacted: payload,
      startedAt,
      finishedAt,
    })

    if (!res.ok) {
      if (isRetryableStatus(res.status)) {
        return { status: 'service_unavailable', valid: null }
      }
      return { status: 'invalid', valid: false }
    }

    if (payload.valid === true) {
      return {
        status: 'valid',
        valid: true,
        name: payload.name ?? null,
        address: payload.address ?? null,
        requestDate: payload.requestDate ?? null,
      }
    }

    return { status: 'invalid', valid: false, requestDate: payload.requestDate ?? null }
  } catch (e) {
    const finishedAt = new Date()
    await writeIntegrationLog({
      service: 'vat',
      operation: 'vies_check',
      correlationId: correlationId ?? `${countryCode}-${vatNumber}`,
      success: false,
      requestRedacted: { countryCode, vatNumber: '***' },
      responseRedacted: { error: String(e) },
      startedAt,
      finishedAt,
    })
    return { status: 'service_unavailable', valid: null }
  }
}

export async function checkVies(
  countryCode: string,
  vatNumber: string,
  correlationId?: string,
): Promise<ViesCheckResult> {
  const first = await callViesOnce(countryCode, vatNumber, correlationId)
  if (first.status !== 'service_unavailable') return first

  await sleep(RETRY_DELAY_MS)
  return callViesOnce(countryCode, vatNumber, correlationId)
}
