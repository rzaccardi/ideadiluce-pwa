import type { MessageKey } from '@/i18n/messages/keys'
import {
  CATALOG_SEARCH_RECENT_PREFIX,
  IDEADILUCE_AUTH_SESSION_KEY,
  IDEADILUCE_CART_MIRROR_KEY,
} from '@/lib/storage-keys'

export type FirstPartyLocalStorageEntry = {
  name: string
  durationKey: MessageKey
  purposeKey: MessageKey
  categoryKey: MessageKey
}

/** Chiavi localStorage di prima parte da mostrare in informativa (non pubblicitarie). */
export const FIRST_PARTY_LOCAL_STORAGE: FirstPartyLocalStorageEntry[] = [
  {
    name: IDEADILUCE_CART_MIRROR_KEY,
    durationKey: 'privacy.storage.duration.persistent',
    purposeKey: 'privacy.storage.cartMirror.purpose',
    categoryKey: 'privacy.storage.category.necessary',
  },
  {
    name: IDEADILUCE_AUTH_SESSION_KEY,
    durationKey: 'privacy.storage.duration.untilLogout',
    purposeKey: 'privacy.storage.authSession.purpose',
    categoryKey: 'privacy.storage.category.necessary',
  },
  {
    name: `${CATALOG_SEARCH_RECENT_PREFIX}<locale>`,
    durationKey: 'privacy.storage.duration.persistent',
    purposeKey: 'privacy.storage.searchRecent.purpose',
    categoryKey: 'privacy.storage.category.preferences',
  },
]
