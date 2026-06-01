import { proxy } from 'valtio'
import type { UserDTO } from '@/types/dto'

export const authStore = proxy({
  me: null as UserDTO | null,
  isAuthenticated: false,
  isLoading: false,
  error: null as string | null,
})

export function setAuthUser(user: UserDTO | null) {
  authStore.me = user
  authStore.isAuthenticated = user != null
}
