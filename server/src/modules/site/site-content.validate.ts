import { AppError } from '../../types/errors.js'
import type { SitePageKey } from './site.types.js'

const MAX_CONTENT_BYTES = 512_000

export function assertSitePageContent(pageKey: SitePageKey, content: unknown) {
  if (content === null || typeof content !== 'object' || Array.isArray(content)) {
    throw new AppError(
      'SITE_CONTENT_INVALID',
      'Site content must be a JSON object',
      'Il contenuto deve essere un oggetto JSON valido.',
      400,
      false,
      { pageKey },
    )
  }

  const serialized = JSON.stringify(content)
  if (serialized.length > MAX_CONTENT_BYTES) {
    throw new AppError(
      'SITE_CONTENT_TOO_LARGE',
      'Site content exceeds size limit',
      'Il contenuto supera la dimensione massima consentita.',
      400,
      false,
      { pageKey, bytes: serialized.length },
    )
  }
}
