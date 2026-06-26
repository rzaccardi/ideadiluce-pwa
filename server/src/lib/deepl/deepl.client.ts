import { AppError } from '../../types/errors.js'
import { assertDeepLEnabled, deeplConfig } from './deepl.config.js'

const SITE_LOCALE_TO_DEEPL: Record<string, string> = {
  IT: 'IT',
  EN: 'EN',
  ES: 'ES',
  FR: 'FR',
  DE: 'DE',
}

const BATCH_SIZE = 40

type DeepLTranslateResponse = {
  translations: Array<{ text: string; detected_source_language?: string }>
}

export function toDeepLLang(locale: string) {
  const upper = locale.toUpperCase()
  return SITE_LOCALE_TO_DEEPL[upper] ?? upper
}

export async function translateTexts(
  texts: string[],
  targetLocale: string,
  sourceLocale = 'IT',
): Promise<string[]> {
  assertDeepLEnabled()
  if (texts.length === 0) return []

  const targetLang = toDeepLLang(targetLocale)
  const sourceLang = toDeepLLang(sourceLocale)
  const results: string[] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE)
    const body = new URLSearchParams()
    for (const text of chunk) {
      body.append('text', text)
    }
    body.set('target_lang', targetLang)
    body.set('source_lang', sourceLang)
    body.set('tag_handling', 'html')
    body.set('preserve_formatting', '1')

    const res = await fetch(deeplConfig.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplConfig.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new AppError(
        'DEEPL_TRANSLATE_FAILED',
        `DeepL HTTP ${res.status}`,
        `Traduzione DeepL fallita (${res.status}).${detail ? ` ${detail.slice(0, 200)}` : ''}`,
        502,
        false,
      )
    }

    const data = (await res.json()) as DeepLTranslateResponse
    if (!data.translations?.length) {
      throw new AppError(
        'DEEPL_TRANSLATE_EMPTY',
        'DeepL empty response',
        'DeepL non ha restituito traduzioni.',
        502,
        false,
      )
    }

    results.push(...data.translations.map((item) => item.text))
  }

  return results
}
