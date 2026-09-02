import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import { storefrontSettingsStore, type StorefrontSettings } from './storefront-settings.store'

function errMessage(e: unknown) {
  return String(e)
}

async function loadStorefrontSettings() {
  storefrontSettingsStore.isLoading = true
  storefrontSettingsStore.error = null
  try {
    storefrontSettingsStore.settings = await adminApi<StorefrontSettings>(
      '/admin/storefront-settings',
    )
  } catch (e) {
    storefrontSettingsStore.error = errMessage(e)
    storefrontSettingsStore.settings = null
  } finally {
    storefrontSettingsStore.isLoading = false
  }
}

export function fetchStorefrontSettings() {
  return dedupeAsync('admin:storefront-settings', loadStorefrontSettings)
}

export async function saveStorefrontSettings(patch: Partial<StorefrontSettings>) {
  if (!storefrontSettingsStore.settings) return
  storefrontSettingsStore.isSaving = true
  storefrontSettingsStore.error = null
  try {
    storefrontSettingsStore.settings = await adminApi<StorefrontSettings>(
      '/admin/storefront-settings',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    )
  } catch (e) {
    storefrontSettingsStore.error = errMessage(e)
    throw e
  } finally {
    storefrontSettingsStore.isSaving = false
  }
}
