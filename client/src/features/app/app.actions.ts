import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { appStore } from './app.store'

/** Legge i toggle globali del BO. In caso di errore: suoni on. */
export function fetchStorefrontSettings() {
  return dedupeAsync('app:storefront-settings', async () => {
    try {
      const data = await api.site.settings()
      appStore.soundsEnabled = data.soundsEnabled !== false
    } catch {
      appStore.soundsEnabled = true
    }
  })
}
