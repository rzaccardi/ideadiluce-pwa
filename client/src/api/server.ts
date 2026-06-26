import { cookies } from 'next/headers'
import { getServerApiUrl } from '@/lib/env'

async function serverFetch(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const base = getServerApiUrl().replace(/\/$/, '')

  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: 'no-store',
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
