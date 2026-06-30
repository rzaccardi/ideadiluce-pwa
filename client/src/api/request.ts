import type { ApiFailureBody } from '@/types/api'
import { ApiRequestError } from '@/types/api'
import { privateApiFetchInit } from '@/lib/api-cache-policy'
import { getIntegrationsToken, getPublicApiUrl, isDev } from '@/lib/env'

type JsonBody = Record<string, unknown> | unknown[] | null

export type ApiTransport = {
  get<T>(path: string, init?: Pick<RequestInit, 'signal'>): Promise<T>
  post<T>(path: string, body?: JsonBody): Promise<T>
  postForm<T>(path: string, body: FormData): Promise<T>
  patch<T>(path: string, body?: JsonBody): Promise<T>
  delete<T>(path: string): Promise<T>
}

function networkErrorMessage(): string {
  const apiOrigin = getPublicApiUrl()
  return `Impossibile raggiungere il backend (${apiOrigin}). Verifica che il server API sia avviato (npm run dev:server) e che NEXT_PUBLIC_API_URL sia corretto.`
}

function buildHeaders(init?: RequestInit, body?: JsonBody | FormData): Headers {
  const headers = new Headers(init?.headers)
  const hasBody = body !== undefined && body !== null
  if (hasBody && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const integrationToken = getIntegrationsToken()
  if (integrationToken && !headers.has('X-Integrations-Token')) {
    headers.set('X-Integrations-Token', integrationToken)
  }
  return headers
}

function headerCorrelationId(res: Response): string | undefined {
  return res.headers.get('x-correlation-id')?.trim() || undefined
}

async function parseResponse<T>(res: Response): Promise<T> {
  const fallbackCorr = headerCorrelationId(res)
  const json: unknown = await res.json().catch(() => null)

  if (json && typeof json === 'object' && 'error' in json) {
    const e = (json as ApiFailureBody).error
    throw new ApiRequestError(
      e.code,
      e.message,
      res.status,
      e.details,
      e.userMessage,
      e.retriable,
      e.correlationId ?? fallbackCorr,
    )
  }

  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data
  }

  throw new ApiRequestError(
    'INVALID_RESPONSE',
    'Risposta API non valida o non JSON',
    res.status,
    undefined,
    'Il server ha restituito una risposta inattesa. Controlla i log del backend.',
    false,
    fallbackCorr,
  )
}

export async function apiRequest<T>(
  base: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${base}${path}`, {
      ...privateApiFetchInit(path),
      ...init,
      headers: buildHeaders(init, init.body as JsonBody | undefined),
      credentials: 'include',
    })
  } catch {
    throw new ApiRequestError(
      'NETWORK_ERROR',
      'Fetch failed',
      0,
      undefined,
      networkErrorMessage(),
      false,
      undefined,
    )
  }
  return parseResponse<T>(res)
}

export function createApiClient(base: string): ApiTransport {
  return {
    get<T>(path: string, init?: Pick<RequestInit, 'signal'>) {
      return apiRequest<T>(base, path, { method: 'GET', ...init })
    },
    post<T>(path: string, body?: JsonBody) {
      return apiRequest<T>(base, path, {
        method: 'POST',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    },
    postForm<T>(path: string, body: FormData) {
      return apiRequest<T>(base, path, { method: 'POST', body })
    },
    patch<T>(path: string, body?: JsonBody) {
      return apiRequest<T>(base, path, {
        method: 'PATCH',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    },
    delete<T>(path: string) {
      return apiRequest<T>(base, path, { method: 'DELETE' })
    },
  }
}

export function getSitemapUrl(): string {
  if (isDev()) return '/sitemap.xml'
  return `${getPublicApiUrl().replace(/\/$/, '')}/sitemap.xml`
}
