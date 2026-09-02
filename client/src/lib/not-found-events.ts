import { apiClient } from '@/api/client'

export type TrackNotFoundEventInput = {
  path: string
  queryString?: string | null
  referrer?: string | null
  locale: string
}

const DEBOUNCE_MS = 2500

/** Fire-and-forget: non blocca la UX se il tracking fallisce. */
export function trackNotFoundEvent(input: TrackNotFoundEventInput): void {
  const path = input.path.trim()
  if (!path || path.startsWith('/_next') || path.startsWith('/api')) return

  if (typeof sessionStorage !== 'undefined') {
    try {
      const key = `idl-404:${path}`
      const last = Number(sessionStorage.getItem(key) ?? '0')
      if (last && Date.now() - last < DEBOUNCE_MS) return
      sessionStorage.setItem(key, String(Date.now()))
    } catch {
      /* private mode */
    }
  }

  void apiClient
    .post<{ recorded: boolean }>('/api/v1/not-found/events', {
      path,
      queryString: input.queryString ?? null,
      referrer: input.referrer ?? null,
      locale: input.locale,
    })
    .catch(() => {})
}
