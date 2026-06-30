import { adminAuthApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import { adminAuthStore, type AdminUser, type AdminWorkspaceConfig } from './auth.store'

function errMessage(e: unknown) {
  return e instanceof Error ? e.message : 'Errore autenticazione'
}

type MeResponse = {
  user: AdminUser
  workspace: AdminWorkspaceConfig
}

async function loadMe() {
  adminAuthStore.isLoading = true
  adminAuthStore.error = null
  try {
    const me = await adminAuthApi<MeResponse>('/admin/auth/me')
    adminAuthStore.user = me.user
    adminAuthStore.workspace = me.workspace
  } catch {
    adminAuthStore.user = null
    adminAuthStore.workspace = null
  } finally {
    adminAuthStore.isLoading = false
  }
}

export function fetchAdminMe() {
  return dedupeAsync('admin:auth:me', loadMe)
}

export async function adminLogin(email: string, password: string) {
  adminAuthStore.isSubmitting = true
  adminAuthStore.error = null
  try {
    const res = await adminAuthApi<MeResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    adminAuthStore.user = res.user
    adminAuthStore.workspace = res.workspace
  } catch (e) {
    adminAuthStore.error = errMessage(e)
    throw e
  } finally {
    adminAuthStore.isSubmitting = false
  }
}

export async function adminLogout() {
  try {
    await adminAuthApi('/admin/auth/logout', { method: 'POST' })
  } finally {
    adminAuthStore.user = null
    adminAuthStore.workspace = null
  }
}
