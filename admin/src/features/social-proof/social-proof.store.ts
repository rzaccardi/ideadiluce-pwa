import { proxy } from 'valtio'

export type SocialProofSettings = {
  enabled: boolean
  minQuantity: number
  lookbackDays: number
  maxEvents: number
  odooImportEnabled: boolean
  odooLastSyncAt: string | null
  odooLastSyncCount: number | null
  odooLastSyncError: string | null
  odooConfigured: boolean
  cachedOdooEvents: number
}

export const socialProofStore = proxy({
  settings: null as SocialProofSettings | null,
  isLoading: false,
  isSaving: false,
  isSyncing: false,
  error: null as string | null,
  syncMessage: null as string | null,
})
