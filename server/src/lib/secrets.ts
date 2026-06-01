import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { env } from '../config/env.js'

const ALGO = 'aes-256-gcm'

function keyBytes(): Buffer | null {
  const raw = env.SHIPPING_CREDENTIALS_KEY?.trim()
  if (!raw) return null
  return createHash('sha256').update(raw).digest()
}

export function encryptSecret(plain: string): string {
  const key = keyBytes()
  if (!key) return plain
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${enc.toString('base64url')}`
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null
  if (!stored.startsWith('v1:')) return stored
  const key = keyBytes()
  if (!key) return stored
  const [, ivB, tagB, dataB] = stored.split(':')
  if (!ivB || !tagB || !dataB) return null
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB, 'base64url'))
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB, 'base64url')), decipher.final()])
  return dec.toString('utf8')
}

export function redactSecret(value: string | null | undefined): string | null {
  if (!value) return null
  return '***'
}
