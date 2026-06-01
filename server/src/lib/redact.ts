const SENSITIVE_KEYS = [
  'authorization',
  'password',
  'passwd',
  'api_key',
  'apikey',
  'apiKey',
  'token',
  'secret',
  'credit_card',
]

const REDACTED = '[redacted]'
const MAX_STRING = 500
const MAX_DEPTH = 10

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase()
  return SENSITIVE_KEYS.some((s) => k.includes(s))
}

/** Rimuove segreti e tronca stringhe lunghe per log / IntegrationLog. */
export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[max-depth]'
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((x) => redactForLog(x, depth + 1))
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isSensitiveKey(k) ? REDACTED : redactForLog(v, depth + 1)
    }
    return out
  }
  return String(value)
}
