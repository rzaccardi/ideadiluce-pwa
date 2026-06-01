import type { ApiFailureBody } from '@/types/api'
import { ApiRequestError } from '@/types/api'

/** Base URL API interna (mai Odoo). */
export const API_BASE =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000'

type JsonBody = Record<string, unknown> | unknown[] | null

function buildHeaders(init?: RequestInit, body?: JsonBody): Headers {
  const headers = new Headers(init?.headers)
  const hasBody = body !== undefined && body !== null
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const integrationToken = import.meta.env.VITE_INTEGRATIONS_TOKEN as string | undefined
  if (integrationToken?.trim() && !headers.has('X-Integrations-Token')) {
    headers.set('X-Integrations-Token', integrationToken.trim())
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

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
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
      `Impossibile raggiungere il backend (${API_BASE}). Verifica che il server sia avviato e che VITE_API_URL sia corretto.`,
      false,
      undefined,
    )
  }
  return parseResponse<T>(res)
}

export const apiClient = {
  get<T>(path: string) {
    return apiRequest<T>(path, { method: 'GET' })
  },

  post<T>(path: string, body?: JsonBody) {
    return apiRequest<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(path: string, body?: JsonBody) {
    return apiRequest<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(path: string) {
    return apiRequest<T>(path, { method: 'DELETE' })
  },
}
