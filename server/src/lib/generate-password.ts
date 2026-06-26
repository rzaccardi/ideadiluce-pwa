import crypto from 'node:crypto'

/** Password casuale per account creati al checkout (12 caratteri, URL-safe). */
export function generateAccountPassword(length = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[crypto.randomInt(0, alphabet.length)]
  }
  return out
}
