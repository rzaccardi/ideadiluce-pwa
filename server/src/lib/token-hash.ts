import { createHash, randomBytes } from 'node:crypto'

export function hashSessionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex')
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}
