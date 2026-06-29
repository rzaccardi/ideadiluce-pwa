import { getAlgoliaClientConfig } from '@/lib/algolia/config'

/**
 * Spike Fase 2: quando Algolia sarà abilitato, questo modulo ospiterà
 * il client InstantSearch autocomplete-only. Per ora la palette usa Arfly.
 */
export function isAlgoliaSearchEnabled(): boolean {
  return getAlgoliaClientConfig().enabled
}
