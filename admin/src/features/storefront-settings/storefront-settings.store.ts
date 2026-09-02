import { proxy } from 'valtio'

export type StorefrontSettings = {
  soundsEnabled: boolean
  legacySiteNoticeEnabled: boolean
  legacySiteUrl: string
}

export const storefrontSettingsStore = proxy({
  settings: null as StorefrontSettings | null,
  isLoading: false,
  isSaving: false,
  error: null as string | null,
})
