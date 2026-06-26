import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import type {
  ArflyBrandListResponse,
  ArflyCategoryListResponse,
  ArflyProductDetailResponse,
  ArflyProductListResponse,
} from './arfly.types.js'
import { toArflyLang } from './arflyLocale.js'
import type { HubLocale } from '../../lib/hub-locale.js'

export class ArflyClientError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message)
    this.name = 'ArflyClientError'
  }
}

function arflyApiKey(): string {
  return env.ARFLY_API_KEY?.trim() || env.ODOO_API_KEY?.trim() || ''
}

export function isArflyConfigured(): boolean {
  return Boolean(
    env.ARFLY_CATALOG_ENABLED &&
      env.ARFLY_API_BASE_URL?.trim() &&
      arflyApiKey() &&
      env.ARFLY_WEBSITE_ID > 0,
  )
}

function baseUrl(): string {
  const raw = env.ARFLY_API_BASE_URL?.trim()
  if (!raw) throw new ArflyClientError('ARFLY_API_BASE_URL assente', 500)
  return raw.replace(/\/$/, '')
}

function websiteParams(locale: HubLocale): Record<string, string> {
  return {
    website: String(env.ARFLY_WEBSITE_ID),
    lang: toArflyLang(locale),
  }
}

async function arflyFetch<T>(path: string, searchParams: Record<string, string>): Promise<T> {
  const key = arflyApiKey()
  if (!key) throw new ArflyClientError('ARFLY_API_KEY (o ODOO_API_KEY) assente', 500)

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
      signal: AbortSignal.timeout(env.ARFLY_TIMEOUT_MS),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new ArflyClientError(`Rete Arfly: ${msg}`, 502)
  }

  const text = await res.text()
  if (!res.ok) {
    throw new ArflyClientError(
      `HTTP ${res.status} da Arfly ${path}: ${text.slice(0, 300)}`,
      res.status >= 400 && res.status < 600 ? res.status : 502,
    )
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ArflyClientError(`Risposta Arfly non JSON su ${path}`, 502)
  }
}

function emptyCategoryList(locale: HubLocale): ArflyCategoryListResponse {
  return {
    website: { id: env.ARFLY_WEBSITE_ID, name: '' },
    lang: toArflyLang(locale),
    items: [],
  }
}

function emptyBrandList(locale: HubLocale): ArflyBrandListResponse {
  return {
    website: { id: env.ARFLY_WEBSITE_ID, name: '' },
    lang: toArflyLang(locale),
    items: [],
  }
}

export function toArflyError(e: ArflyClientError, correlationId: string): AppError {
  const retriable = e.httpStatus >= 500 || e.httpStatus === 408 || e.httpStatus === 429
  return new AppError(
    'ARFLY_UPSTREAM_ERROR',
    e.message,
    'Catalogo temporaneamente non disponibile. Riprova tra poco.',
    e.httpStatus >= 400 && e.httpStatus < 600 ? e.httpStatus : 502,
    retriable,
    { correlationId },
  )
}

export async function fetchArflyProductList(options: {
  locale: HubLocale
  page: number
  perPage: number
  q?: string
  category?: string
  brand?: string
  partnerId?: number
  pricelistId?: number
}): Promise<ArflyProductListResponse> {
  const params: Record<string, string> = {
    ...websiteParams(options.locale),
    page: String(options.page),
    per_page: String(options.perPage),
  }
  if (options.q?.trim()) params.q = options.q.trim()
  if (options.category?.trim()) params.category = options.category.trim()
  if (options.brand?.trim()) params.brand = options.brand.trim()
  if (options.partnerId != null && options.partnerId > 0) {
    params.partner_id = String(options.partnerId)
  }
  if (options.pricelistId != null && options.pricelistId > 0) {
    params.pricelist_id = String(options.pricelistId)
  }

  return arflyFetch<ArflyProductListResponse>('/api/v2/products', params)
}

export async function fetchArflyProductDetail(
  productId: number,
  locale: HubLocale,
  options?: { partnerId?: number; pricelistId?: number },
): Promise<ArflyProductDetailResponse> {
  const params: Record<string, string> = { ...websiteParams(locale) }
  if (options?.partnerId != null && options.partnerId > 0) {
    params.partner_id = String(options.partnerId)
  }
  if (options?.pricelistId != null && options.pricelistId > 0) {
    params.pricelist_id = String(options.pricelistId)
  }
  return arflyFetch<ArflyProductDetailResponse>(`/api/v2/product/${productId}`, params)
}

export async function fetchArflyCategories(locale: HubLocale): Promise<ArflyCategoryListResponse> {
  try {
    return await arflyFetch<ArflyCategoryListResponse>('/api/v2/categories', websiteParams(locale))
  } catch (e) {
    if (e instanceof ArflyClientError && (e.httpStatus === 404 || e.httpStatus === 501)) {
      return emptyCategoryList(locale)
    }
    throw e
  }
}

export async function fetchArflyBrands(locale: HubLocale): Promise<ArflyBrandListResponse> {
  try {
    return await arflyFetch<ArflyBrandListResponse>('/api/v2/brands', websiteParams(locale))
  } catch (e) {
    if (e instanceof ArflyClientError && (e.httpStatus === 404 || e.httpStatus === 501)) {
      return emptyBrandList(locale)
    }
    throw e
  }
}

/** Endpoint dedicato Odoo; ritorna null se non disponibile (fallback slug→id lato BFF). */
export async function fetchArflyProductBySlug(
  slug: string,
  locale: HubLocale,
  options?: { partnerId?: number; pricelistId?: number },
): Promise<ArflyProductDetailResponse | null> {
  const params: Record<string, string> = {
    ...websiteParams(locale),
    slug: slug.trim(),
  }
  if (options?.partnerId != null && options.partnerId > 0) {
    params.partner_id = String(options.partnerId)
  }
  if (options?.pricelistId != null && options.pricelistId > 0) {
    params.pricelist_id = String(options.pricelistId)
  }

  try {
    return await arflyFetch<ArflyProductDetailResponse>('/api/v2/product/by-slug', params)
  } catch (e) {
    if (e instanceof ArflyClientError && (e.httpStatus === 404 || e.httpStatus === 501)) {
      return null
    }
    throw e
  }
}
