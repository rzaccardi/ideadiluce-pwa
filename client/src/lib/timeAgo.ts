const UNITS: { limit: number; divisor: number; word: (n: number) => string }[] = [
  { limit: 60, divisor: 1, word: (n) => (n === 1 ? 'poco fa' : `${n} min fa`) },
  { limit: 24, divisor: 60, word: (n) => (n === 1 ? '1 ora fa' : `${n} ore fa`) },
  { limit: 7, divisor: 24, word: (n) => (n === 1 ? 'ieri' : `${n} giorni fa`) },
  { limit: 30, divisor: 24 * 7, word: (n) => (n === 1 ? '1 settimana fa' : `${n} settimane fa`) },
]

/** Testo relativo in italiano per timestamp ISO. */
export function formatTimeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMin = Math.max(0, Math.floor((now - then) / 60_000))
  if (diffMin < 1) return 'poco fa'

  for (const { limit, divisor, word } of UNITS) {
    const value = Math.floor(diffMin / divisor)
    if (value < limit) return word(Math.max(1, value))
  }

  const days = Math.floor(diffMin / (60 * 24))
  return `${days} giorni fa`
}
