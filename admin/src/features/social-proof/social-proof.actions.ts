import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import { socialProofStore, type SocialProofSettings } from './social-proof.store'

function errMessage(e: unknown) {
  return String(e)
}

async function loadSocialProofSettings() {
  socialProofStore.isLoading = true
  socialProofStore.error = null
  try {
    socialProofStore.settings = await adminApi<SocialProofSettings>('/admin/social-proof/settings')
  } catch (e) {
    socialProofStore.error = errMessage(e)
    socialProofStore.settings = null
  } finally {
    socialProofStore.isLoading = false
  }
}

export function fetchSocialProofSettings() {
  return dedupeAsync('admin:social-proof', loadSocialProofSettings)
}

export async function saveSocialProofSettings(patch: Partial<SocialProofSettings>) {
  if (!socialProofStore.settings) return
  socialProofStore.isSaving = true
  socialProofStore.error = null
  try {
    socialProofStore.settings = await adminApi<SocialProofSettings>(
      '/admin/social-proof/settings',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    )
  } catch (e) {
    socialProofStore.error = errMessage(e)
    throw e
  } finally {
    socialProofStore.isSaving = false
  }
}

export async function syncSocialProofOdoo() {
  socialProofStore.isSyncing = true
  socialProofStore.syncMessage = null
  socialProofStore.error = null
  try {
    const result = await adminApi<{
      imported: number
      deletedStale: number
      settings: SocialProofSettings
    }>('/admin/social-proof/sync-odoo', { method: 'POST' })
    socialProofStore.settings = result.settings
    socialProofStore.syncMessage = `Importati ${result.imported} righe ordine; rimossi ${result.deletedStale} eventi fuori finestra.`
  } catch (e) {
    socialProofStore.error = errMessage(e)
    await fetchSocialProofSettings()
    throw e
  } finally {
    socialProofStore.isSyncing = false
  }
}
