import { beforeEach, describe, expect, it } from 'vitest'
import { readWithMigration, removeLegacyKeys } from './storage-migrate'

const storage = new Map<string, string>()

function createStorageMock(): Storage {
  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() {
      return storage.size
    },
  }
}

beforeEach(() => {
  storage.clear()
})

describe('readWithMigration', () => {
  it('restituisce il valore canonico se presente', () => {
    const mock = createStorageMock()
    mock.setItem('ideadiluce:theme', 'dark')

    expect(readWithMigration(mock, 'ideadiluce:theme', ['idl-theme'])).toBe('dark')
    expect(mock.getItem('idl-theme')).toBeNull()
  })

  it('migra dalla prima chiave legacy disponibile', () => {
    const mock = createStorageMock()
    mock.setItem('emil_cart_mirror_v1', '{"cartId":"abc"}')

    expect(readWithMigration(mock, 'ideadiluce:cart-mirror:v1', ['emil_cart_mirror_v1', 'emil_cart_v1'])).toBe(
      '{"cartId":"abc"}',
    )
    expect(mock.getItem('ideadiluce:cart-mirror:v1')).toBe('{"cartId":"abc"}')
    expect(mock.getItem('emil_cart_mirror_v1')).toBeNull()
  })

  it('restituisce null se nessuna chiave esiste', () => {
    const mock = createStorageMock()

    expect(readWithMigration(mock, 'ideadiluce:auth-session:v1', ['idl_auth_session_v1'])).toBeNull()
  })
})

describe('removeLegacyKeys', () => {
  it('rimuove tutte le chiavi legacy indicate', () => {
    const mock = createStorageMock()
    mock.setItem('emil_cart_v1', 'legacy')
    mock.setItem('emil_cart_mirror_v1', 'mirror')

    removeLegacyKeys(mock, ['emil_cart_mirror_v1', 'emil_cart_v1'])

    expect(mock.getItem('emil_cart_v1')).toBeNull()
    expect(mock.getItem('emil_cart_mirror_v1')).toBeNull()
  })
})
