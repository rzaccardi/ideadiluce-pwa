import { proxy } from 'valtio'
import type { ImpersonationInfoDTO, UserDTO } from '@/types/dto'
import {
  clearAuthSessionMirror,
  saveAuthSessionMirror,
} from '@/lib/auth-local-storage'

export const authStore = proxy({
  me: null as UserDTO | null,
  impersonation: null as ImpersonationInfoDTO | null,
  isAuthenticated: false,
  isLoading: false,
  error: null as string | null,
  sessionExpiresAt: null as string | null,
})

export function setAuthUser(
  user: UserDTO | null,
  impersonation: ImpersonationInfoDTO | null = null,
  expiresAt?: string | null,
) {
  authStore.me = user
  authStore.impersonation = user ? impersonation : null
  authStore.isAuthenticated = user != null
  authStore.sessionExpiresAt = user ? (expiresAt ?? authStore.sessionExpiresAt) : null

  if (user && authStore.sessionExpiresAt) {
    saveAuthSessionMirror({
      userId: user.id,
      email: user.email,
      expiresAt: authStore.sessionExpiresAt,
    })
  } else if (!user) {
    clearAuthSessionMirror()
  }
}
