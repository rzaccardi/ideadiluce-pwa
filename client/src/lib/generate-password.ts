/** Lettere senza caratteri ambigui (0/O, 1/l/I). */
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
/** Simboli URL/form-friendly. */
const SYMBOLS = '!@#$%&*-_'
const ALPHABET = UPPER + LOWER + DIGITS + SYMBOLS

function randomInt(max: number): number {
  if (max <= 0) return 0
  const bytes = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / max) * max
  let value: number
  do {
    crypto.getRandomValues(bytes)
    value = bytes[0]!
  } while (value >= limit)
  return value % max
}

function pick(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)]!
}

/** Fisher–Yates con crypto.getRandomValues. */
function shuffleInPlace(chars: string[]): void {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const tmp = chars[i]!
    chars[i] = chars[j]!
    chars[j] = tmp
  }
}

/**
 * Password casuale client-side (crypto.getRandomValues).
 * Default 12 caratteri; garantisce almeno una maiuscola, una minuscola,
 * una cifra e un simbolo.
 */
export function generateSecurePassword(length = 12): string {
  const minLen = 4
  const n = Math.max(length, minLen)
  const chars: string[] = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)]
  for (let i = chars.length; i < n; i++) {
    chars.push(pick(ALPHABET))
  }
  shuffleInPlace(chars)
  return chars.join('')
}
