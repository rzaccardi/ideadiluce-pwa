/**
 * Client HTTP Bearer verso l’API v2 Odoo (`/api/v2/customers`, `/orders`, `/payments`, `/stock`).
 * Ogni chiamata richiede `?website=` = `ODOO_WEBSITE_ID` (il client lo aggiunge se manca).
 */
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import { logger } from '../../lib/logger.js'

export class OdooApiV2Error extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly body: unknown,
  ) {
    super(message)
    this.name = 'OdooApiV2Error'
  }
}

export function odooApiV2Token(): string {
  return env.ODOO_API_TOKEN?.trim() || env.ODOO_CATALOG_API_KEY?.trim() || env.ODOO_API_KEY?.trim() || ''
}

export function odooApiV2BaseUrl(): string {
  const raw =
    env.ODOO_CATALOG_BASE_URL?.trim() ||
    env.ODOO_BASE_URL?.trim() ||
    env.ODOO_URL?.trim() ||
    ''
  return raw.replace(/\/$/, '').replace(/\/odoo$/i, '')
}

/** Token + base URL: il contratto transazionale non richiede più XML-RPC. */
export function isOdooApiV2Configured(): boolean {
  return Boolean(env.ODOO_ENABLED && odooApiV2Token() && odooApiV2BaseUrl())
}

/** `website` obbligatorio su ogni `/api/v2/*` (default PWA = 2). */
export function odooApiWebsiteQuery(): { website: string } {
  const id = Number(env.ODOO_WEBSITE_ID)
  return { website: Number.isFinite(id) && id > 0 ? String(id) : '2' }
}

function timeoutMs(): number {
  return env.ODOO_TIMEOUT_MS || env.ODOO_CATALOG_TIMEOUT_MS || 25_000
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const rec = body as { error?: unknown; message?: unknown }
  if (typeof rec.error === 'string' && rec.error.trim()) return rec.error.trim()
  if (typeof rec.message === 'string' && rec.message.trim()) return rec.message.trim()
  return fallback
}

export type OdooApiV2RequestOptions = {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  accept?: 'json' | 'bytes'
  correlationId?: string
}

export async function odooApiV2Request<T>(path: string, options: OdooApiV2RequestOptions = {}): Promise<{
  status: number
  data: T
}> {
  const token = odooApiV2Token()
  const base = odooApiV2BaseUrl()
  if (!token || !base) {
    throw new OdooApiV2Error('ODOO_API_TOKEN / base URL assenti', 500, null)
  }

  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value === undefined) continue
    url.searchParams.set(key, String(value))
  }
  if (!url.searchParams.has('website')) {
    url.searchParams.set('website', odooApiWebsiteQuery().website)
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: options.accept === 'bytes' ? 'application/pdf, application/json' : 'application/json',
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(url, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(timeoutMs()),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new OdooApiV2Error(`Rete Odoo API v2: ${msg}`, 502, null)
  }

  if (options.accept === 'bytes') {
    if (!res.ok) {
      const text = await res.text()
      let parsed: unknown = text
      try {
        parsed = JSON.parse(text) as unknown
      } catch {
        /* testo grezzo */
      }
      throw new OdooApiV2Error(
        errorMessageFromBody(parsed, `HTTP ${res.status} da Odoo API ${path}`),
        res.status,
        parsed,
      )
    }
    const buf = Buffer.from(await res.arrayBuffer())
    return { status: res.status, data: buf as T }
  }

  const text = await res.text()
  let parsed: unknown = null
  if (text.trim()) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      throw new OdooApiV2Error(`Risposta Odoo API non JSON su ${path}`, 502, text.slice(0, 300))
    }
  }

  if (!res.ok) {
    logger.warn('odoo.api_v2.error', {
      path,
      status: res.status,
      correlationId: options.correlationId,
      error: errorMessageFromBody(parsed, text.slice(0, 200)),
    })
    throw new OdooApiV2Error(
      errorMessageFromBody(parsed, `HTTP ${res.status} da Odoo API ${path}`),
      res.status,
      parsed,
    )
  }

  return { status: res.status, data: parsed as T }
}

export function toOdooApiV2AppError(e: OdooApiV2Error, correlationId: string): AppError {
  const status = e.httpStatus >= 400 && e.httpStatus < 600 ? e.httpStatus : 502
  const retriable = status >= 500 || status === 408 || status === 429
  const code =
    status === 401
      ? 'ODOO_API_UNAUTHORIZED'
      : status === 404
        ? 'ODOO_API_NOT_FOUND'
        : status === 409
          ? 'ODOO_API_CONFLICT'
          : status === 422
            ? 'ODOO_API_VALIDATION'
            : 'ODOO_API_UPSTREAM_ERROR'
  const userMessage =
    status === 401
      ? 'Autenticazione Odoo non valida.'
      : status === 404
        ? 'Risorsa Odoo non trovata.'
        : status === 409
          ? 'Importo o stato ordine non allineati con Odoo.'
          : status === 422
            ? e.message || 'Dati anagrafici non validi.'
            : 'Servizio Odoo temporaneamente non disponibile. Riprova tra poco.'
  return new AppError(code, e.message, userMessage, status, retriable, {
    correlationId,
    body: e.body,
  })
}

export function asApiItems<T>(data: unknown, keys: string[] = ['items', 'orders', 'invoices', 'shipments']): T[] {
  if (Array.isArray(data)) return data as T[]
  if (!data || typeof data !== 'object') return []
  const rec = data as Record<string, unknown>
  for (const key of keys) {
    const value = rec[key]
    if (Array.isArray(value)) return value as T[]
  }
  return []
}
