function readBool(value: string | undefined, fallback = false) {
  if (value === undefined || value === '') return fallback
  return value === '1' || value.toLowerCase() === 'true'
}

export const deeplConfig = {
  enabled: readBool(process.env.DEEPL_ENABLED, false),
  apiKey: process.env.DEEPL_API_KEY?.trim().replace(/^["']|["']$/g, '') ?? '',
  apiUrl:
    process.env.DEEPL_API_URL?.trim() ||
    (process.env.DEEPL_API_KEY?.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate'),
}

export function assertDeepLEnabled() {
  if (!deeplConfig.enabled) {
    throw new Error('DeepL disabilitato — imposta DEEPL_ENABLED=true.')
  }
  if (!deeplConfig.apiKey) {
    throw new Error('DeepL non configurato — imposta DEEPL_API_KEY.')
  }
}
