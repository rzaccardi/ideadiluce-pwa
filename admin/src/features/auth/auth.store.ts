import { proxy } from 'valtio'

export type AdminUser = {
  id: string
  email: string
  displayName: string | null
}

export type AdminWorkspaceConfig = {
  odooWebBaseUrl: string | null
  odooProductActionId: number | null
}

export const adminAuthStore = proxy({
  user: null as AdminUser | null,
  workspace: null as AdminWorkspaceConfig | null,
  isLoading: true,
  isSubmitting: false,
  error: null as string | null,
})
