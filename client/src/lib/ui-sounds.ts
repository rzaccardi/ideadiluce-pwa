import { appStore } from '@/features/app/app.store'

/** Gate unico per tutti i rumori UI. Rispetta il toggle globale del backoffice. */
export function areUiSoundsEnabled() {
  return appStore.soundsEnabled !== false
}
