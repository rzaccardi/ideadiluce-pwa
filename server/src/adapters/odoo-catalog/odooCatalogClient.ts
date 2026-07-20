/**
 * Client HTTP verso il contratto definitivo API Prodotti Odoo → PWA (v2).
 * Chiamate catalogo:
 *   GET /api/v2/products?website=&lang=&page=&per_page=
 *   GET /api/v2/product/<id>?website=&lang=
 *   GET /api/v2/products/search?... (listing filtrato)
 *   GET /api/v2/filters?... (facet aggregate)
 * Auth: Authorization Bearer. Docs pubblici: /product-docs/<ced>/<tipo>/current (senza auth).
 */
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import type {
  OdooCatalogFiltersResponse,
  OdooCatalogProductDetailResponse,
  OdooCatalogProductListResponse,
  OdooCatalogProductSearchResponse,
} from './odooCatalog.types.js'
import {
  toOdooCatalogQueryParams,
  type OdooCatalogFilterParams,
  type OdooCatalogSearchParams,
} from './odooCatalogSearchParams.js'
import { toOdooCatalogLang } from './odooCatalogLocale.js'
import type { HubLocale } from '../../lib/hub-locale.js'

export class OdooCatalogClientError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message)
    this.name = 'OdooCatalogClientError'
  }
}

function odooCatalogApiKey(): string {
  return env.ODOO_CATALOG_API_KEY?.trim() || env.ODOO_API_KEY?.trim() || ''
}

export function isOdooCatalogConfigured(): boolean {
  return Boolean(
    env.ODOO_CATALOG_ENABLED &&
      env.ODOO_CATALOG_BASE_URL?.trim() &&
      odooCatalogApiKey() &&
      env.ODOO_WEBSITE_ID > 0,
  )
}

function baseUrl(): string {
  const raw = env.ODOO_CATALOG_BASE_URL?.trim()
  if (!raw) throw new OdooCatalogClientError('ODOO_CATALOG_BASE_URL assente', 500)
  return raw.replace(/\/$/, '')
}

/** Parametri obbligatori/ammessi dal contratto su ogni chiamata. */
function contractParams(locale: HubLocale): Record<string, string> {
  return {
    website: String(env.ODOO_WEBSITE_ID),
    lang: toOdooCatalogLang(locale),
  }
}

async function odooCatalogFetch<T>(path: string, searchParams: Record<string, string>): Promise<T> {
  const key = odooCatalogApiKey()
  if (!key) throw new OdooCatalogClientError('ODOO_CATALOG_API_KEY (o ODOO_API_KEY) assente', 500)

  const url = new URL(`${baseUrl()}${path}`)
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v)
  }

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(env.ODOO_CATALOG_TIMEOUT_MS),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new OdooCatalogClientError(`Rete OdooCatalog: ${msg}`, 502)
  }

  const text = await res.text()
  if (!res.ok) {
    throw new OdooCatalogClientError(
      `HTTP ${res.status} da OdooCatalog ${path}: ${text.slice(0, 300)}`,
      res.status >= 400 && res.status < 600 ? res.status : 502,
    )
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new OdooCatalogClientError(`Risposta OdooCatalog non JSON su ${path}`, 502)
  }
}

export function toOdooCatalogError(e: OdooCatalogClientError, correlationId: string): AppError {
  const retriable = e.httpStatus >= 500 || e.httpStatus === 408 || e.httpStatus === 429
  const userMessage =
    e.httpStatus === 404
      ? 'Prodotto non più disponibile.'
      : e.httpStatus === 401
        ? 'Autenticazione catalogo non valida.'
        : e.httpStatus === 400
          ? 'Richiesta catalogo non valida.'
          : 'Catalogo temporaneamente non disponibile. Riprova tra poco.'
  return new AppError(
    e.httpStatus === 404
      ? 'ODOO_CATALOG_NOT_FOUND'
      : e.httpStatus === 401
        ? 'ODOO_CATALOG_UNAUTHORIZED'
        : 'ODOO_CATALOG_UPSTREAM_ERROR',
    e.message,
    userMessage,
    e.httpStatus >= 400 && e.httpStatus < 600 ? e.httpStatus : 502,
    retriable,
    { correlationId },
  )
}

/** GET /api/v2/products — solo website, lang, page, per_page (max 100). */
export async function fetchOdooCatalogProductList(options: {
  locale: HubLocale
  page: number
  perPage: number
}): Promise<OdooCatalogProductListResponse> {
  const perPage = Math.min(100, Math.max(1, options.perPage))
  return odooCatalogFetch<OdooCatalogProductListResponse>('/api/v2/products', {
    ...contractParams(options.locale),
    page: String(Math.max(1, options.page)),
    per_page: String(perPage),
  })
}

/** GET /api/v2/product/<id> — solo website, lang. */
export async function fetchOdooCatalogProductDetail(
  productId: number,
  locale: HubLocale,
): Promise<OdooCatalogProductDetailResponse> {
  return odooCatalogFetch<OdooCatalogProductDetailResponse>(`/api/v2/product/${productId}`, {
    ...contractParams(locale),
  })
}

/** GET /api/v2/products/search — listing filtrato live (negozio / facet refinement). */
export async function fetchOdooCatalogProductSearch(options: {
  locale: HubLocale
} & OdooCatalogSearchParams): Promise<OdooCatalogProductSearchResponse> {
  const { locale, ...filters } = options
  return odooCatalogFetch<OdooCatalogProductSearchResponse>('/api/v2/products/search', {
    ...contractParams(locale),
    ...toOdooCatalogQueryParams(filters, { includePagination: true }),
  })
}

/** GET /api/v2/filters — facet aggregate sul set già filtrato. */
export async function fetchOdooCatalogFilters(options: {
  locale: HubLocale
} & OdooCatalogFilterParams): Promise<OdooCatalogFiltersResponse> {
  const { locale, ...filters } = options
  return odooCatalogFetch<OdooCatalogFiltersResponse>('/api/v2/filters', {
    ...contractParams(locale),
    ...toOdooCatalogQueryParams(filters, { includePagination: false }),
  })
}
