import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { appStore, DEFAULT_LEGACY_SITE_URL } from './app.store'

/** Legge i toggle globali del BO. In caso di errore: suoni on, avviso sito precedente on (URL default). */
export function fetchStorefrontSettings() {
  return dedupeAsync('app:storefront-settings', async () => {
    try {
      const data = await api.site.settings()
      appStore.soundsEnabled = data.soundsEnabled !== false
      appStore.legacySiteNoticeEnabled = data.legacySiteNoticeEnabled !== false
      appStore.legacySiteUrl = data.legacySiteUrl?.trim() || DEFAULT_LEGACY_SITE_URL
    } catch {
      appStore.soundsEnabled = true
      appStore.legacySiteNoticeEnabled = true
      appStore.legacySiteUrl = DEFAULT_LEGACY_SITE_URL
    }
  })
}
