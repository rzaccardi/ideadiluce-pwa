import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { authStore, setAuthUser } from './auth.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore imprevisto'
}

export async function fetchMe() {
  authStore.isLoading = true
  authStore.error = null
  try {
    const { user } = await api.auth.me()
    setAuthUser(user)
  } catch (e) {
    if (e instanceof ApiRequestError && e.code === 'UNAUTHORIZED') {
      setAuthUser(null)
    } else {
      authStore.error = errMessage(e)
      setAuthUser(null)
    }
  } finally {
    authStore.isLoading = false
  }
}

export async function login(email: string, password: string) {
  authStore.isLoading = true
  authStore.error = null
  try {
    const { user } = await api.auth.login({ email, password })
    setAuthUser(user)
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
  extra?: { firstName?: string; lastName?: string; phone?: string },
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
    })
    setAuthUser(user)
  } catch (e) {
    authStore.error = errMessage(e)
    throw e
  } finally {
    authStore.isLoading = false
  }
}

export async function logout() {
  authStore.isLoading = true
  authStore.error = null
  try {
    await api.auth.logout()
    setAuthUser(null)
  } finally {
    authStore.isLoading = false
  }
}
