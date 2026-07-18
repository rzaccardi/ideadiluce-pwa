import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import {
  clearAuthSessionMirror,
  hasPersistedAuthSession,
  loadAuthSessionMirror,
  shouldProactivelyRefreshSession,
} from '@/lib/auth-local-storage'
import { ApiRequestError } from '@/types/api'
import { fetchCart, resetCartForAuthChange } from '@/features/cart'
import { fetchWishlist } from '@/features/wishlist'
import type { UserDTO } from '@/types/dto'
import { authStore, setAuthUser } from './auth.store'
import { clearClientSessionState, type ClearClientSessionScope } from './clear-client-session'

export type HydrateSessionStoresScope = 'full' | 'checkout'

function refreshSessionStores() {
  return hydrateSessionStores()
}

async function hydrateSessionStores(scope: HydrateSessionStoresScope = 'full') {
  authStore.isHydrating = true
  resetCartForAuthChange()
  try {
    const tasks: Promise<unknown>[] = [fetchCart({ force: true, reprice: true })]
    if (scope === 'full') {
      // La wishlist alimenta l'header globale; ordini/preventivi/fatture restano lazy
      // nelle rispettive route account per non allungare login e registrazione.
      tasks.push(fetchWishlist({ force: true }))
    }
    await Promise.allSettled(tasks)
  } finally {
    authStore.isHydrating = false
  }
}

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore imprevisto'
}

export type LogoutOptions = {
  /** `checkout` mantiene indirizzi nel draft; `full` azzera anche il checkout in memoria. */
  scope?: ClearClientSessionScope
}

export type LogoutResult = {
  /** API `/auth/logout` completata con successo. */
  remoteOk: boolean
}

async function applyRefreshResult(fallbackUser?: UserDTO) {
  const { user, impersonation, expiresAt } = await api.auth.refresh()
  const resolvedUser = user ?? fallbackUser ?? null
  if (resolvedUser) {
    setAuthUser(resolvedUser, impersonation, expiresAt)
  } else {
    clearAuthSessionMirror()
    setAuthUser(null)
  }
  return resolvedUser
}

async function establishAuthenticatedSession(
  fallbackUser?: UserDTO,
  options?: { hydrateScope?: HydrateSessionStoresScope },
) {
  const user = await applyRefreshResult(fallbackUser)
  if (!user) {
    throw new ApiRequestError(
      'UNAUTHORIZED',
      'Session not established',
      401,
      undefined,
      'Sessione non valida. Effettua di nuovo il login.',
      false,
    )
  }
  await hydrateSessionStores(options?.hydrateScope ?? 'full')
  return user
}

async function loadMe() {
  authStore.isLoading = true
  authStore.error = null

  if (!hasPersistedAuthSession()) {
    setAuthUser(null)
    authStore.isLoading = false
    return
  }

  try {
    await applyRefreshResult()
  } catch (e) {
    if (e instanceof ApiRequestError && e.code === 'UNAUTHORIZED') {
      clearClientSessionState()
    } else {
      authStore.error = errMessage(e)
      const mirror = loadAuthSessionMirror()
      if (mirror) {
        authStore.sessionExpiresAt = mirror.expiresAt
      }
      setAuthUser(null)
    }
  } finally {
    authStore.isLoading = false
  }
}

export function fetchMe() {
  return dedupeAsync('auth:me', loadMe)
}

export async function refreshAuthSession(options?: { force?: boolean }) {
  if (!hasPersistedAuthSession()) return null
  if (!options?.force && !shouldProactivelyRefreshSession(authStore.sessionExpiresAt)) {
    return authStore.me
  }

  try {
    const user = await applyRefreshResult()
    return user
  } catch (e) {
    if (e instanceof ApiRequestError && e.code === 'UNAUTHORIZED') {
      clearClientSessionState()
    }
    throw e
  }
}

let sessionRefreshListenerAttached = false

/** Refresh sessione al ritorno in foreground se la scadenza è vicina. */
export function attachSessionRefreshListener() {
  if (sessionRefreshListenerAttached || typeof document === 'undefined') return
  sessionRefreshListenerAttached = true

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    if (!hasPersistedAuthSession()) return
    void refreshAuthSession().catch(() => {
      /* errori già gestiti in refreshAuthSession */
    })
  })
}

export async function checkoutRegister(input: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  customerSegment?: 'retail' | 'business'
}) {
  authStore.isLoading = true
  authStore.error = null
  try {
    const { user } = await api.auth.checkoutRegister(input)
    await establishAuthenticatedSession(user, { hydrateScope: 'checkout' })
  } catch (e) {
    authStore.error = errMessage(e)
    throw e
  } finally {
    authStore.isLoading = false
  }
}

export async function checkoutLogin(email: string, password: string) {
  authStore.isLoading = true
  authStore.error = null
  try {
    const { user } = await api.auth.checkoutLogin({ email, password })
    await establishAuthenticatedSession(user, { hydrateScope: 'checkout' })
  } catch (e) {
    authStore.error = errMessage(e)
    throw e
  } finally {
    authStore.isLoading = false
  }
}

export async function login(email: string, password: string) {
  authStore.isLoading = true
  authStore.error = null
  try {
    const { user } = await api.auth.login({ email, password })
    await establishAuthenticatedSession(user)
  } catch (e) {
    authStore.error = errMessage(e)
    throw e
  } finally {
    authStore.isLoading = false
  }
}

export async function register(
  email: string,
  password: string,
  extra?: {
    firstName?: string
    lastName?: string
    phone?: string
    customerSegment?: 'retail' | 'business'
  },
) {
  authStore.isLoading = true
  authStore.error = null
  try {
    const { user } = await api.auth.register({
      email,
      password,
      firstName: extra?.firstName,
      lastName: extra?.lastName,
      phone: extra?.phone,
      customerSegment: extra?.customerSegment,
    })
    await establishAuthenticatedSession(user)
  } catch (e) {
    authStore.error = errMessage(e)
    throw e
  } finally {
    authStore.isLoading = false
  }
}

/**
 * Logout completo: invalida sessione server, cookie guest nuovo, pulizia client.
 * Lo stato locale viene sempre azzerato anche se l'API fallisce (rete).
 */
export async function logout(options?: LogoutOptions): Promise<LogoutResult> {
  authStore.isLoading = true
  authStore.error = null
  let remoteOk = false

  try {
    await api.auth.logout()
    remoteOk = true
  } catch (e) {
    authStore.error = errMessage(e)
  } finally {
    clearClientSessionState({ scope: options?.scope })
    resetCartForAuthChange()
    try {
      await refreshSessionStores()
    } catch {
      /* carrello guest opzionale dopo logout */
    }
    authStore.isLoading = false
  }

  return { remoteOk }
}

export async function exchangeImpersonationToken(token: string) {
  authStore.isLoading = true
  authStore.error = null
  try {
    const { user } = await api.auth.impersonateExchange(token)
    await establishAuthenticatedSession(user)
    return { user: authStore.me!, impersonation: authStore.impersonation }
  } catch (e) {
    authStore.error = errMessage(e)
    throw e
  } finally {
    authStore.isLoading = false
  }
}

export async function endImpersonation() {
  authStore.isLoading = true
  authStore.error = null
  try {
    await api.auth.impersonateEnd()
    clearClientSessionState()
    await refreshSessionStores()
  } finally {
    authStore.isLoading = false
  }
}
