import {
  IDEADILUCE_AUTH_SESSION_KEY,
  LEGACY_STORAGE_KEYS,
} from '@/lib/storage-keys'
import { readWithMigration } from '@/lib/storage-migrate'

/** Lead time prima della scadenza in cui tentare un refresh proattivo. */
export const AUTH_SESSION_REFRESH_LEAD_MS = 7 * 24 * 60 * 60 * 1000

export type AuthSessionMirror = {
  userId: string
  email: string
  expiresAt: string
  savedAt: string
}

const AUTH_SESSION_LEGACY_KEYS = LEGACY_STORAGE_KEYS[IDEADILUCE_AUTH_SESSION_KEY]

export function saveAuthSessionMirror(input: {
  userId: string
  email: string
  expiresAt: string
}): void {
  if (typeof window === 'undefined') return
  const snapshot: AuthSessionMirror = {
    userId: input.userId,
    email: input.email,
    expiresAt: input.expiresAt,
    savedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(IDEADILUCE_AUTH_SESSION_KEY, JSON.stringify(snapshot))
}

export function loadAuthSessionMirror(): AuthSessionMirror | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = readWithMigration(
      window.localStorage,
      IDEADILUCE_AUTH_SESSION_KEY,
      AUTH_SESSION_LEGACY_KEYS,
    )
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSessionMirror
    if (!parsed?.userId || !parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAuthSessionMirror(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(IDEADILUCE_AUTH_SESSION_KEY)
}

export function hasPersistedAuthSession(): boolean {
  return loadAuthSessionMirror() != null
}

export function shouldProactivelyRefreshSession(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true
  const remaining = new Date(expiresAt).getTime() - Date.now()
  return remaining < AUTH_SESSION_REFRESH_LEAD_MS
}
