import { createHash } from 'node:crypto'

export function hashTaxIdentifier(value: string): string {
  return createHash('sha256').update(value.trim().toUpperCase(), 'utf8').digest('hex')
}
