import { cookies } from 'next/headers'
import { getServerApiUrl } from '@/lib/env'
import { isPrivateApiPath, serverApiFetchInit } from '@/lib/api-cache-policy'

async function serverFetch(path: string, init: RequestInit = {}) {
  const base = getServerApiUrl().replace(/\/$/, '')
  const cacheInit = serverApiFetchInit(path)

  // Cookie solo sulle API private: evita di forzare dynamic rendering e round-trip inutili.
  let cookieHeader = ''
  if (isPrivateApiPath(path)) {
    const cookieStore = await cookies()
    cookieHeader = cookieStore.toString()
  }

  return fetch(`${base}${path}`, {
    ...init,
    ...cacheInit,
    headers: {
      ...(init.headers ?? {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  })
}

async function parseServerApiJson<T>(res: Response, path: string): Promise<T> {
  const json: unknown = await res.json().catch(() => null)
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data
  }
  throw new Error(`Server API error: ${path}`)
}

export const serverApiClient = {
  async get<T>(path: string): Promise<T> {
    const res = await serverFetch(path, { method: 'GET' })
    return parseServerApiJson<T>(res, path)
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await serverFetch(path, {
      method: 'POST',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return parseServerApiJson<T>(res, path)
  },
}
