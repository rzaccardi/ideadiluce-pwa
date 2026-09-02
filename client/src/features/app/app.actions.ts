import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { appStore, DEFAULT_LEGACY_SITE_URL } from './app.store'

/** Legge i toggle globali del BO. In caso di errore resta il default (suoni attivi, avviso spento). */
export function fetchStorefrontSettings() {
  return dedupeAsync('app:storefront-settings', async () => {
    try {
      const data = await api.site.settings()
      appStore.soundsEnabled = data.soundsEnabled !== false
      appStore.legacySiteNoticeEnabled = data.legacySiteNoticeEnabled === true
      appStore.legacySiteUrl = data.legacySiteUrl?.trim() || DEFAULT_LEGACY_SITE_URL
    } catch {
      appStore.soundsEnabled = true
      appStore.legacySiteNoticeEnabled = false
      appStore.legacySiteUrl = DEFAULT_LEGACY_SITE_URL
    }
  })
}
