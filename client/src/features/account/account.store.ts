import { proxy } from 'valtio'

export const accountStore = proxy({
  isSaving: false,
  error: null as string | null,
  message: null as string | null,
  odooSyncWarning: false,
})
